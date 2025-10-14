
import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { ImageUploader } from './components/ImageUploader';
import { ControlPanel } from './components/ControlPanel';
import { ImageViewer } from './components/ImageViewer';
import { editImage } from './services/geminiService';
import { EditingTool } from './types';
import { TOOLS } from './constants';

const App: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<{ data: string; mimeType: string; } | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<EditingTool | null>(null);

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
  
  const handleApplyEdit = useCallback(async (tool: EditingTool, customPrompt?: string) => {
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

  const handleReset = () => {
    setEditedImage(null);
    setActiveTool(null);
    setError(null);
  };

  const handleNewImage = () => {
    setOriginalImage(null);
    setEditedImage(null);
    setActiveTool(null);
    setError(null);
  }

  return (
    <div className="bg-gray-900 text-gray-200 min-h-screen flex flex-col font-sans">
      <Header />
      <main className="flex-grow flex flex-col items-center justify-center p-4 md:p-8">
        {!originalImage ? (
          <ImageUploader onImageUpload={handleImageUpload} />
        ) : (
          <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4 xl:col-span-3">
              <ControlPanel 
                tools={TOOLS}
                onApplyEdit={handleApplyEdit}
                isLoading={isLoading}
                activeTool={activeTool}
                onNewImage={handleNewImage}
              />
            </div>
            <div className="lg:col-span-8 xl:col-span-9">
              <ImageViewer
                originalImage={originalImage.data}
                editedImage={editedImage}
                isLoading={isLoading}
                error={error}
                onReset={handleReset}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
