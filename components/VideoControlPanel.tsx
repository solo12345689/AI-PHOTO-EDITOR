import React, { useState } from 'react';
import { ArrowLeftOnRectangleIcon, FilmIcon } from './IconComponents';

interface VideoControlPanelProps {
  onApplyRemix: (prompt: string, duration: number) => void;
  isLoading: boolean;
  onNewVideo: () => void;
}

export const VideoControlPanel: React.FC<VideoControlPanelProps> = ({ onApplyRemix, isLoading, onNewVideo }) => {
  const [prompt, setPrompt] = useState('');
  const [duration, setDuration] = useState(8);

  const handleRemixClick = () => {
    if (prompt.trim()) {
      onApplyRemix(prompt, duration);
    }
  };

  return (
    <div className="bg-gray-800/50 rounded-xl p-4 md:p-6 space-y-6 border border-gray-700 h-full flex flex-col">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-white">AI Video Remix</h2>
        <button
          onClick={onNewVideo}
          className="flex items-center space-x-2 px-3 py-1.5 bg-gray-700 text-white text-xs font-semibold rounded-md hover:bg-gray-600 transition-colors duration-200"
        >
          <ArrowLeftOnRectangleIcon className="w-4 h-4" />
          <span>New Video</span>
        </button>
      </div>
      
      <div className="flex-grow flex flex-col space-y-4">
        <div>
            <h3 className="text-md font-semibold text-gray-300">Describe your new video</h3>
            <p className="text-xs text-gray-400 mt-1">The AI will use the first frame of your video as a starting point.</p>
            <p className="text-xs text-gray-500 italic mt-1">Note: The remixed video will be generated without audio.</p>
        </div>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., 'Turn this into a vintage 8mm film' or 'A futuristic city with flying cars'"
          className="w-full flex-grow p-2 bg-gray-900 border border-gray-600 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors text-sm text-gray-200 resize-none"
          disabled={isLoading}
        />
         <div className="space-y-2">
            <label htmlFor="remix-duration-slider" className="block text-sm font-medium text-gray-300">
                Duration ({duration}s)
            </label>
            <input
                id="remix-duration-slider"
                type="range"
                min="4"
                max="60"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full h-2 bg-gray-900 rounded-lg appearance-none cursor-pointer accent-cyan-600"
                disabled={isLoading}
            />
            <p className="text-xs text-gray-500">The model's maximum duration is 60 seconds.</p>
        </div>
      </div>

      <button
        onClick={handleRemixClick}
        disabled={isLoading || !prompt.trim()}
        className="flex items-center justify-center space-x-2 w-full px-4 py-3 bg-cyan-600 text-white font-bold rounded-md hover:bg-cyan-700 transition-colors duration-200 disabled:bg-gray-600 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
        ) : <FilmIcon className="w-5 h-5" />}
        <span>Remix Video</span>
      </button>
    </div>
  );
};