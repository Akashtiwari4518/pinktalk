import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

const ErrorPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pastelPink to-softLavender p-4">
      <div className="glass rounded-3xl p-10 max-w-md w-full shadow-2xl text-center">
        <h1 className="text-6xl font-bold text-blushPink mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">Room not found</h2>
        <p className="text-gray-600 mb-8">
          The private room you are looking for doesn't exist or the link is invalid. 
          Make sure you have the full link including the encryption key.
        </p>
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 bg-blushPink hover:bg-pink-400 text-white font-medium py-3 px-6 rounded-xl transition-all shadow-md hover:shadow-lg"
        >
          <Home size={18} />
          Go Home
        </Link>
      </div>
    </div>
  );
};

export default ErrorPage;
