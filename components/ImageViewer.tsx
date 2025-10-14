
import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { DownloadIcon, ArrowPathIcon } from './IconComponents';

interface ImageViewerProps {
  originalImage: string;
  editedImage: string | null;
  isLoading: boolean;
  error: string | null;
  onReset: () => void;
}

const ImageContainer: React.FC<{ title: string; imageUrl: string | null; children?: React.ReactNode, hasAction?: boolean }> = ({ title, imageUrl, children, hasAction }) => (
  <div className="relative w-full bg-gray-800 rounded-xl border border-gray-700 overflow-hidden flex flex-col">
    <div className={`p-3 bg-gray-900/50 border-b border-gray-700 flex ${hasAction ? 'justify-between' : 'justify-center'} items-center`}>
      <h3 className="font-semibold text-sm tracking-wider uppercase text-gray-400">{title}</h3>
      {children}
    </div>
    <div className="flex-grow flex items-center justify-center p-2 aspect-w-1 aspect-h-1">
      {imageUrl && <img src={imageUrl} alt={title} className="object-contain max-w-full max-h-full rounded-md" />}
    </div>
  </div>
);

export const ImageViewer: React.FC<ImageViewerProps> = ({ originalImage, editedImage, isLoading, error, onReset }) => {
  const handleDownload = () => {
    if (!editedImage) return;
    const link = document.createElement('a');
    link.href = editedImage;
    link.download = 'edited-photo.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
        <ImageContainer title="Original" imageUrl={originalImage} />
        <div className="relative w-full bg-gray-800 rounded-xl border border-gray-700 overflow-hidden flex flex-col">
            <div className="p-3 bg-gray-900/50 border-b border-gray-700 flex justify-between items-center">
                <h3 className="font-semibold text-sm tracking-wider uppercase text-gray-400">Edited</h3>
                {editedImage && !isLoading && (
                    <div className="flex items-center space-x-2">
                         <button onClick={onReset} className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors">
                            <ArrowPathIcon className="w-5 h-5"/>
                        </button>
                        <button onClick={handleDownload} className="flex items-center space-x-2 px-3 py-1.5 bg-cyan-600 text-white text-xs font-semibold rounded-md hover:bg-cyan-700 transition-colors duration-200">
                            <DownloadIcon className="w-4 h-4" />
                            <span>Download</span>
                        </button>
                    </div>
                )}
            </div>
            <div className="flex-grow flex items-center justify-center p-2 aspect-w-1 aspect-h-1 relative">
                {isLoading && <LoadingSpinner />}
                {!isLoading && error && (
                <div className="p-4 text-center text-red-400">
                    <p className="font-semibold">Error</p>
                    <p className="text-sm">{error}</p>
                </div>
                )}
                {!isLoading && !error && editedImage && (
                    <img src={editedImage} alt="Edited" className="object-contain max-w-full max-h-full rounded-md" />
                )}
                 {!isLoading && !error && !editedImage && (
                    <div className="text-center text-gray-500">
                        <p>Your edited image will appear here.</p>
                    </div>
                 )}
            </div>
        </div>
      </div>
    </div>
  );
};
