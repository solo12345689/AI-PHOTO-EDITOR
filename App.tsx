import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { ImageUploader } from './components/ImageUploader';
import { ImageGenerator } from './components/ImageGenerator';
import { VideoGenerator } from './components/VideoGenerator';
import { ControlPanel } from './components/ControlPanel';
import { ImageViewer } from './components/ImageViewer';
import { editImage } from './services/geminiService';
import { EditingTool } from './types';
import { TOOLS } from './constants';
import { PencilSquareIcon, SparklesIcon, VideoCameraIcon } from './components/IconComponents';

const TabButton = ({ isActive, onClick, children }: React.PropsWithChildren<{ isActive: boolean, onClick: () => void }>) => (
  <button
    onClick={onClick}
    className={`flex-1 sm:flex-none flex items-center justify-center space-x-2 px-6 py-3 font-semibold border-b-2 transition-colors duration-200 focus:outline-none ${
      isActive
        ? 'text-cyan-400 border-cyan-400'
        : 'text-gray-400 border-transparent hover:text-white'
    }`}
    aria-selected={isActive}
  >
    {children}
  </button>
);

type Mode = 'edit-photo' | 'generate-image' | 'generate-video';

const App: React.FC = () => {
  // Image state
  const [originalImage, setOriginalImage] = useState<{ data: string; mimeType: string; } | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  
  // Common state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<EditingTool | null>(null);
  const [mode, setMode] = useState<Mode>('edit-photo');

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setOriginalImage({ data: reader.result as string, mimeType: file.type });
      setEditedImage(null);
      setError(null);
      setActiveTool(null);
    };
    reader.onerror = () => {
      setError("Failed to read the image file.");
    };
    reader.readAsDataURL(file);
  };
  
  const handleApplyImageEdit = useCallback(async (tool: EditingTool, customPrompt?: string) => {
    if (!originalImage) return;

    setActiveTool(tool);
    setIsLoading(true);
    setError(null);
    setEditedImage(null);

    try {
      const base64Data = originalImage.data.split(',')[1];
      const prompt = customPrompt || tool.prompt;
      
      const resultBase64 = await editImage(base64Data, originalImage.mimeType, prompt);
      
      setEditedImage(`data:${originalImage.mimeType};base64,${resultBase64}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unknown error occurred.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [originalImage]);

  const handleResetImage = () => {
    setEditedImage(null);
    setActiveTool(null);
    setError(null);
  };

  const handleNewContent = () => {
    setOriginalImage(null);
    setEditedImage(null);
    setActiveTool(null);
    setError(null);
  };

  const renderInitialView = () => (
    <div className="w-full max-w-2xl">
      <div className="flex flex-wrap justify-center border-b border-gray-700">
          <TabButton isActive={mode === 'edit-photo'} onClick={() => setMode('edit-photo')}>
            <PencilSquareIcon className="w-5 h-5" />
            <span>Edit Photo</span>
          </TabButton>
          <TabButton isActive={mode === 'generate-image'} onClick={() => setMode('generate-image')}>
            <SparklesIcon className="w-5 h-5" />
            <span>Generate Image</span>
          </TabButton>
          <TabButton isActive={mode === 'generate-video'} onClick={() => setMode('generate-video')}>
            <VideoCameraIcon className="w-5 h-5" />
            <span>Generate Video</span>
          </TabButton>
      </div>
      <div className="pt-8">
        {mode === 'edit-photo' && <ImageUploader onImageUpload={handleImageUpload} />}
        {mode === 'generate-image' && <ImageGenerator />}
        {mode === 'generate-video' && <VideoGenerator />}
      </div>
    </div>
  );

  const renderImageEditor = () => (
    <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-4 xl:col-span-3">
        <ControlPanel 
          tools={TOOLS}
          onApplyEdit={handleApplyImageEdit}
          isLoading={isLoading}
          activeTool={activeTool}
          onNewImage={handleNewContent}
        />
      </div>
      <div className="lg:col-span-8 xl:col-span-9">
        <ImageViewer
          originalImage={originalImage!.data}
          editedImage={editedImage}
          isLoading={isLoading}
          error={error}
          onReset={handleResetImage}
        />
      </div>
    </div>
  );

  return (
    <div className="bg-gray-900 text-gray-200 min-h-screen flex flex-col font-sans">
      <Header />
      <main className="flex-grow flex flex-col items-center justify-center p-4 md:p-8">
        { !originalImage ? renderInitialView() : renderImageEditor() }
      </main>
    </div>
  );
};

export default App;