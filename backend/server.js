const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// To track users in rooms
const roomUsers = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join_room', ({ roomId, username }) => {
    socket.join(roomId);
    
    if (!roomUsers.has(roomId)) {
      roomUsers.set(roomId, new Map());
    }
    
    // Check if username is taken in the room
    const usersInRoom = roomUsers.get(roomId);
    let isDuplicate = false;
    for (let [, user] of usersInRoom) {
      if (user.username === username) {
        isDuplicate = true;
        break;
      }
    }

    if (isDuplicate) {
      socket.emit('join_error', { message: 'Username already taken in this room.' });
      return;
    }

    usersInRoom.set(socket.id, { username, id: socket.id });
    
    socket.emit('join_success', { roomId, username });
    socket.to(roomId).emit('user_joined', { username, id: socket.id });
    
    // Send list of users to the newly joined user
    socket.emit('room_users', Array.from(usersInRoom.values()));
    
    console.log(`User ${username} (${socket.id}) joined room ${roomId}`);
  });

  socket.on('send_message', (data) => {
    socket.to(data.roomId).emit('receive_message', data);
  });

  socket.on('typing', ({ roomId, username }) => {
    socket.to(roomId).emit('user_typing', { username });
  });

  socket.on('stop_typing', ({ roomId, username }) => {
    socket.to(roomId).emit('user_stop_typing', { username });
  });

  socket.on('disconnecting', () => {
    for (const roomId of socket.rooms) {
      if (roomId !== socket.id && roomUsers.has(roomId)) {
        const usersInRoom = roomUsers.get(roomId);
        const user = usersInRoom.get(socket.id);
        
        if (user) {
          socket.to(roomId).emit('user_left', { username: user.username, id: socket.id });
          usersInRoom.delete(socket.id);
          if (usersInRoom.size === 0) {
            roomUsers.delete(roomId);
          }
        }
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
