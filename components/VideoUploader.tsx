import React, { useCallback, useState } from 'react';
import { FilmIcon } from './IconComponents';

interface VideoUploaderProps {
  onVideoUpload: (file: File) => void;
}

export const VideoUploader: React.FC<VideoUploaderProps> = ({ onVideoUpload }) => {
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('video/')) {
        setError('Please select a valid video file (e.g., MP4, MOV).');
        return;
      }
      setError(null);
      onVideoUpload(file);
    }
  };

  const onDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const file = event.dataTransfer.files?.[0];
     if (file) {
      if (!file.type.startsWith('video/')) {
        setError('Please select a valid video file.');
        return;
      }
      setError(null);
      onVideoUpload(file);
    }
  }, [onVideoUpload]);

  const onDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  }

  return (
    <div className="w-full max-w-2xl text-center">
      <div 
        className="bg-gray-800 border-2 border-dashed border-gray-600 rounded-xl p-12 hover:border-cyan-500 transition-colors duration-300 cursor-pointer"
        onDrop={onDrop}
        onDragOver={onDragOver}
        onClick={() => document.getElementById('video-file-upload')?.click()}
      >
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="bg-gray-700 p-4 rounded-full">
            <FilmIcon className="w-12 h-12 text-cyan-400" />
          </div>
          <p className="text-lg font-semibold text-white">Drag & drop a video here</p>
          <p className="text-gray-400">or</p>
          <label
            htmlFor="video-file-upload"
            className="px-6 py-2 bg-cyan-600 text-white font-semibold rounded-lg shadow-md hover:bg-cyan-700 transition-all cursor-pointer"
          >
            Browse Files
          </label>
          <input
            id="video-file-upload"
            type="file"
            accept="video/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>
      {error && <p className="mt-4 text-red-500">{error}</p>}
    </div>
  );
};