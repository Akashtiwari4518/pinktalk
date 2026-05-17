import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { encryptMessage, decryptMessage } from '../utils/crypto';
import { Copy, Share2, Shield, Send, ArrowLeft, Users, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Replace with your backend URL when deploying
const SOCKET_SERVER_URL = 'https://pinktalk-backend.onrender.com';

const ChatRoom = () => {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [username, setUsername] = useState(location.state?.username || '');
  const [secretKey, setSecretKey] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const [usersCount, setUsersCount] = useState(1);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [copied, setCopied] = useState(false);
  
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Initialization & Secret Key verification
  useEffect(() => {
    // Extract secret key from URL hash
    const hash = window.location.hash;
    if (hash && hash.length > 1) {
      setSecretKey(hash.substring(1));
    } else {
      // No secret key, redirect to error
      navigate('/error');
    }
  }, [navigate]);

  // Socket Connection & Event Listeners
  useEffect(() => {
    if (!isJoined || !username || !secretKey) return;

    const newSocket = io(SOCKET_SERVER_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      newSocket.emit('join_room', { roomId, username });
    });

    newSocket.on('join_success', (data) => {
      console.log('Joined room successfully');
    });

    newSocket.on('join_error', (data) => {
      alert(data.message);
      newSocket.disconnect();
      setIsJoined(false);
      setUsername(''); // Reset to let them choose another name
    });

    newSocket.on('user_joined', (data) => {
      setMessages((prev) => [
        ...prev, 
        { type: 'system', text: `${data.username} joined the chat`, id: Date.now() }
      ]);
      setUsersCount((prev) => prev + 1);
    });

    newSocket.on('room_users', (users) => {
      setUsersCount(users.length);
    });

    newSocket.on('user_left', (data) => {
      setMessages((prev) => [
        ...prev, 
        { type: 'system', text: `${data.username} left the chat`, id: Date.now() }
      ]);
      setUsersCount((prev) => Math.max(1, prev - 1));
    });

    newSocket.on('receive_message', (data) => {
      // Decrypt message
      const decryptedText = decryptMessage(data.encryptedMessage, secretKey);
      if (decryptedText) {
        setMessages((prev) => [
          ...prev,
          {
            type: 'user',
            sender: data.sender,
            text: decryptedText,
            timestamp: data.timestamp,
            id: data.id,
            isMe: false
          }
        ]);
      }
    });

    newSocket.on('user_typing', ({ username: typingUsername }) => {
      setTypingUsers((prev) => {
        const newSet = new Set(prev);
        newSet.add(typingUsername);
        return newSet;
      });
    });

    newSocket.on('user_stop_typing', ({ username: typingUsername }) => {
      setTypingUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(typingUsername);
        return newSet;
      });
    });

    return () => {
      newSocket.disconnect();
    };
  }, [isJoined, roomId, username, secretKey]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  const handleJoin = (e) => {
    e.preventDefault();
    if (username.trim()) {
      setIsJoined(true);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputValue.trim() || !socket || !secretKey) return;

    const messageData = {
      id: Date.now().toString(),
      roomId,
      sender: username,
      encryptedMessage: encryptMessage(inputValue, secretKey),
      timestamp: new Date().toISOString()
    };

    socket.emit('send_message', messageData);

    // Add locally
    setMessages((prev) => [
      ...prev,
      {
        type: 'user',
        sender: username,
        text: inputValue,
        timestamp: messageData.timestamp,
        id: messageData.id,
        isMe: true
      }
    ]);

    setInputValue('');
    socket.emit('stop_typing', { roomId, username });
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    
    if (socket && isJoined) {
      socket.emit('typing', { roomId, username });
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('stop_typing', { roomId, username });
      }, 2000);
    }
  };

  const copyInviteLink = () => {
    const link = window.location.href;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // If the user hasn't joined yet (came via link)
  if (!isJoined && secretKey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pastelPink to-softLavender p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass rounded-3xl p-10 max-w-md w-full shadow-2xl relative overflow-hidden text-center"
        >
          <div className="mb-6 flex justify-center">
            <div className="bg-white p-4 rounded-full shadow-sm text-blushPink">
              <ShieldCheck size={40} />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Join Private Room</h2>
          <p className="text-gray-600 text-sm mb-8">Enter your name to join this end-to-end encrypted chat.</p>
          
          <form onSubmit={handleJoin} className="space-y-4">
            <input 
              type="text" 
              required
              placeholder="Your Name"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blushPink focus:border-transparent outline-none transition-all bg-white/80"
            />
            <button 
              type="submit" 
              className="w-full bg-blushPink hover:bg-pink-400 text-white font-medium py-3 px-4 rounded-xl transition-all shadow-md hover:shadow-lg"
            >
              Join Room
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  // Main Chat Interface
  return (
    <div className="h-screen bg-[#fdf8fa] flex flex-col md:p-4">
      <div className="flex-1 bg-white md:rounded-3xl shadow-xl overflow-hidden flex flex-col max-w-5xl w-full mx-auto border border-gray-100">
        
        {/* Header */}
        <header className="bg-white px-6 py-4 border-b border-gray-100 flex items-center justify-between z-10 shadow-sm relative">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="text-gray-400 hover:text-gray-600 transition-colors">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 className="font-bold text-gray-800 flex items-center gap-2">
                Secure Room
                <Shield size={16} className="text-green-500" />
              </h2>
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <Users size={12} /> {usersCount} {usersCount === 1 ? 'person' : 'people'} here
              </div>
            </div>
          </div>

          <button 
            onClick={copyInviteLink}
            className="flex items-center gap-2 text-sm font-medium text-blushPink bg-pink-50 hover:bg-pink-100 px-4 py-2 rounded-full transition-colors"
          >
            {copied ? <span className="flex items-center gap-1"><Copy size={16}/> Copied!</span> : <span className="flex items-center gap-1"><Share2 size={16}/> Invite</span>}
          </button>
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-gradient-to-b from-[#fdf8fa]/50 to-white relative">
          
          {/* Empty State */}
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-70">
              <div className="bg-pink-50 p-6 rounded-full mb-4">
                <Shield size={48} className="text-blushPink" />
              </div>
              <h3 className="text-lg font-medium text-gray-700 mb-1">Messages are end-to-end encrypted</h3>
              <p className="text-sm text-gray-500 max-w-xs">No one outside of this chat, not even the server, can read them.</p>
            </div>
          )}

          {/* Messages */}
          <div className="space-y-4">
            {messages.map((msg, index) => {
              if (msg.type === 'system') {
                return (
                  <div key={msg.id} className="flex justify-center my-4">
                    <span className="bg-gray-100/80 text-gray-500 text-xs py-1 px-3 rounded-full backdrop-blur-sm">
                      {msg.text}
                    </span>
                  </div>
                );
              }

              return (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={msg.id} 
                  className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}
                >
                  {!msg.isMe && (
                    <span className="text-xs text-gray-400 ml-1 mb-1 font-medium">{msg.sender}</span>
                  )}
                  <div 
                    className={`max-w-[75%] px-4 py-2.5 rounded-2xl shadow-sm ${
                      msg.isMe 
                        ? 'bg-blushPink text-white rounded-br-sm' 
                        : 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm'
                    }`}
                  >
                    <p className="text-[15px] leading-relaxed break-words">{msg.text}</p>
                    <div className={`text-[10px] mt-1 text-right ${msg.isMe ? 'text-white/80' : 'text-gray-400'}`}>
                      {formatTime(msg.timestamp)}
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {/* Typing Indicator */}
            {typingUsers.size > 0 && (
              <div className="flex items-center gap-2 text-gray-400 text-sm italic ml-2">
                <div className="flex gap-1 bg-white p-2.5 rounded-2xl rounded-bl-sm border border-gray-100 shadow-sm w-fit">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
                <span className="text-xs">{Array.from(typingUsers).join(', ')} typing...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <footer className="bg-white p-4 border-t border-gray-100">
          <form onSubmit={handleSendMessage} className="flex gap-2 items-end max-w-4xl mx-auto">
            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-3xl overflow-hidden focus-within:ring-2 focus-within:ring-blushPink focus-within:border-transparent transition-all flex items-center min-h-[52px] px-4">
              <input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                placeholder="Type a message..."
                className="w-full bg-transparent outline-none py-3 text-gray-700 text-[15px]"
                autoComplete="off"
              />
            </div>
            <button 
              type="submit" 
              disabled={!inputValue.trim()}
              className="bg-blushPink hover:bg-pink-400 disabled:bg-gray-300 disabled:cursor-not-allowed text-white p-3.5 rounded-full transition-colors flex-shrink-0 shadow-sm"
            >
              <Send size={20} className="ml-1" />
            </button>
          </form>
        </footer>
      </div>
    </div>
  );
};

export default ChatRoom;
