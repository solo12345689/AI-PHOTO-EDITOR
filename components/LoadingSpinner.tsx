
import React from 'react';

export const LoadingSpinner: React.FC = () => {
  return (
    <div className="absolute inset-0 bg-gray-800/80 flex flex-col items-center justify-center space-y-3 z-10">
      <div className="w-12 h-12 border-4 border-t-transparent border-cyan-400 rounded-full animate-spin"></div>
      <p className="text-lg font-semibold text-gray-300">AI is thinking...</p>
    </div>
  );
};
