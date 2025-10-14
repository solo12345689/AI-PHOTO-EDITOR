
import React, { useCallback, useState } from 'react';
import { UploadIcon } from './IconComponents';

interface ImageUploaderProps {
  onImageUpload: (file: File) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload }) => {
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file (e.g., PNG, JPG).');
        return;
      }
      setError(null);
      onImageUpload(file);
    }
  };

  const onDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const file = event.dataTransfer.files?.[0];
     if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file (e.g., PNG, JPG).');
        return;
      }
      setError(null);
      onImageUpload(file);
    }
  }, [onImageUpload]);

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
        onClick={() => document.getElementById('file-upload')?.click()}
      >
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="bg-gray-700 p-4 rounded-full">
            <UploadIcon className="w-12 h-12 text-cyan-400" />
          </div>
          <p className="text-lg font-semibold text-white">Drag & drop an image here</p>
          <p className="text-gray-400">or</p>
          <label
            htmlFor="file-upload"
            className="px-6 py-2 bg-cyan-600 text-white font-semibold rounded-lg shadow-md hover:bg-cyan-700 transition-all cursor-pointer"
          >
            Browse Files
          </label>
          <input
            id="file-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>
      {error && <p className="mt-4 text-red-500">{error}</p>}
    </div>
  );
};
