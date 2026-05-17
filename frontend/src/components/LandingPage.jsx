import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateSecretKey } from '../utils/crypto';
import { Shield, Heart, Lock, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const LandingPage = () => {
  const [username, setUsername] = useState('');
  const navigate = useNavigate();

  const handleCreateRoom = (e) => {
    e.preventDefault();
    if (!username.trim()) return;
    
    // Generate a random room ID and secret key
    const roomId = Math.random().toString(36).substring(2, 12);
    const secretKey = generateSecretKey();
    
    // Navigate to chat room, passing the secret key in the URL hash fragment
    // This keeps the key out of server logs
    navigate(`/chat/${roomId}#${secretKey}`, { state: { username } });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pastelPink to-softLavender p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="glass rounded-3xl p-10 max-w-md w-full shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-[-50px] right-[-50px] w-32 h-32 bg-white opacity-20 rounded-full blur-2xl"></div>
        <div className="absolute bottom-[-50px] left-[-50px] w-32 h-32 bg-pastelPink opacity-40 rounded-full blur-2xl"></div>
        
        <div className="text-center mb-8 relative z-10">
          <div className="flex justify-center mb-4">
            <div className="bg-white p-4 rounded-full shadow-sm text-blushPink">
              <MessageCircle size={40} />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2 font-sans tracking-tight">PinkTalk</h1>
          <p className="text-gray-600 text-sm">Your safe, calm, and private space for meaningful conversations.</p>
        </div>

        <div className="space-y-4 mb-8 text-sm text-gray-600 relative z-10">
          <div className="flex items-center gap-3">
            <Lock className="text-blushPink" size={18} />
            <span>End-to-end encrypted messaging</span>
          </div>
          <div className="flex items-center gap-3">
            <Shield className="text-blushPink" size={18} />
            <span>No data stored on our servers</span>
          </div>
          <div className="flex items-center gap-3">
            <Heart className="text-blushPink" size={18} />
            <span>Ephemeral rooms, beautiful design</span>
          </div>
        </div>

        <form onSubmit={handleCreateRoom} className="space-y-5 relative z-10">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
            <input 
              type="text" 
              required
              placeholder="e.g. Alice"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blushPink focus:border-transparent outline-none transition-all bg-white/80"
            />
          </div>
          
          <button 
            type="submit" 
            className="w-full bg-blushPink hover:bg-pink-400 text-white font-medium py-3 px-4 rounded-xl transition-all shadow-md hover:shadow-lg flex justify-center items-center gap-2"
          >
            Create Private Room
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default LandingPage;
