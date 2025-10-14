
import React from 'react';
import { CameraIcon } from './IconComponents';

export const Header: React.FC = () => {
  return (
    <header className="w-full bg-gray-900/80 backdrop-blur-sm border-b border-gray-700 p-4 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto flex items-center space-x-3">
        <CameraIcon className="w-8 h-8 text-cyan-400" />
        <div>
          <h1 className="text-xl font-bold text-white tracking-wide">AI Photo Studio</h1>
          <p className="text-xs text-gray-400">Powered by Gemini</p>
        </div>
      </div>
    </header>
  );
};
