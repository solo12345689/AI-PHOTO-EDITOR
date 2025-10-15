import React from 'react';
import { DownloadIcon, ArrowPathIcon } from './IconComponents';

interface VideoViewerProps {
  originalVideoUrl: string;
  remixedVideoUrl: string | null;
  isLoading: boolean;
  error: string | null;
  onReset: () => void;
}

const VideoLoadingSpinner: React.FC = () => (
    <div className="absolute inset-0 bg-gray-800/80 flex flex-col items-center justify-center space-y-3 z-10 text-center p-4">
      <div className="w-12 h-12 border-4 border-t-transparent border-cyan-400 rounded-full animate-spin"></div>
      <p className="text-lg font-semibold text-gray-300">AI is creating your video...</p>
      <p className="text-sm text-gray-400">This can take a few minutes. Feel free to grab a coffee!</p>
    </div>
);


const VideoContainer: React.FC<{ title: string; videoUrl: string | null; children?: React.ReactNode, hasAction?: boolean }> = ({ title, videoUrl, children, hasAction }) => (
  <div className="relative w-full bg-gray-800 rounded-xl border border-gray-700 overflow-hidden flex flex-col">
    <div className={`p-3 bg-gray-900/50 border-b border-gray-700 flex ${hasAction ? 'justify-between' : 'justify-center'} items-center`}>
      <h3 className="font-semibold text-sm tracking-wider uppercase text-gray-400">{title}</h3>
      {children}
    </div>
    <div className="flex-grow flex items-center justify-center p-2 aspect-video">
      {videoUrl && <video src={videoUrl} controls loop className="object-contain max-w-full max-h-full rounded-md" />}
    </div>
  </div>
);

export const VideoViewer: React.FC<VideoViewerProps> = ({ originalVideoUrl, remixedVideoUrl, isLoading, error, onReset }) => {
  const handleDownload = () => {
    if (!remixedVideoUrl) return;
    const link = document.createElement('a');
    link.href = remixedVideoUrl;
    link.download = 'remixed-video.mp4';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
        <VideoContainer title="Original" videoUrl={originalVideoUrl} />
        <div className="relative w-full bg-gray-800 rounded-xl border border-gray-700 overflow-hidden flex flex-col">
            <div className="p-3 bg-gray-900/50 border-b border-gray-700 flex justify-between items-center">
                <h3 className="font-semibold text-sm tracking-wider uppercase text-gray-400">Remixed</h3>
                {remixedVideoUrl && !isLoading && (
                    <div className="flex items-center space-x-2">
                         <button onClick={onReset} className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors" aria-label="Remix again">
                            <ArrowPathIcon className="w-5 h-5"/>
                        </button>
                        <button onClick={handleDownload} className="flex items-center space-x-2 px-3 py-1.5 bg-cyan-600 text-white text-xs font-semibold rounded-md hover:bg-cyan-700 transition-colors duration-200">
                            <DownloadIcon className="w-4 h-4" />
                            <span>Download</span>
                        </button>
                    </div>
                )}
            </div>
            <div className="flex-grow flex items-center justify-center p-2 aspect-video relative">
                {isLoading && <VideoLoadingSpinner />}
                {!isLoading && error && (
                <div className="p-4 text-center text-red-400">
                    <p className="font-semibold">Error</p>
                    <p className="text-sm">{error}</p>
                    <button onClick={onReset} className="mt-4 text-sm text-cyan-400 hover:underline">Try again</button>
                </div>
                )}
                {!isLoading && !error && remixedVideoUrl && (
                    <video src={remixedVideoUrl} controls autoPlay loop className="object-contain max-w-full max-h-full rounded-md" />
                )}
                 {!isLoading && !error && !remixedVideoUrl && (
                    <div className="text-center text-gray-500">
                        <p>Your remixed video will appear here.</p>
                    </div>
                 )}
            </div>
        </div>
      </div>
    </div>
  );
};