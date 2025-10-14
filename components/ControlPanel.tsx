
import React, { useState } from 'react';
import { EditingTool } from '../types';
import { ToolButton } from './ToolButton';
import { ArrowLeftOnRectangleIcon } from './IconComponents';

interface ControlPanelProps {
  tools: EditingTool[];
  onApplyEdit: (tool: EditingTool, customPrompt?: string) => void;
  isLoading: boolean;
  activeTool: EditingTool | null;
  onNewImage: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ tools, onApplyEdit, isLoading, activeTool, onNewImage }) => {
  const [customPrompt, setCustomPrompt] = useState('');

  const handleToolClick = (tool: EditingTool) => {
    if (tool.hasCustomPrompt) {
        if(customPrompt.trim()){
             onApplyEdit(tool, tool.prompt + customPrompt);
        }
    } else {
      onApplyEdit(tool);
    }
  };

  return (
    <div className="bg-gray-800/50 rounded-xl p-4 md:p-6 space-y-6 border border-gray-700 h-full flex flex-col">
       <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-white">AI Editing Tools</h2>
         <button
          onClick={onNewImage}
          className="flex items-center space-x-2 px-3 py-1.5 bg-gray-700 text-white text-xs font-semibold rounded-md hover:bg-gray-600 transition-colors duration-200"
        >
          <ArrowLeftOnRectangleIcon className="w-4 h-4" />
          <span>New Image</span>
        </button>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-3">
        {tools.filter(t => !t.hasCustomPrompt).map((tool) => (
          <ToolButton
            key={tool.id}
            tool={tool}
            onClick={() => handleToolClick(tool)}
            isActive={activeTool?.id === tool.id}
            isLoading={isLoading && activeTool?.id === tool.id}
          />
        ))}
      </div>

      <div className="space-y-4 pt-4 border-t border-gray-700">
         <h3 className="text-md font-semibold text-gray-300">Prompt-Based Editing</h3>
         <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="e.g., 'Add a sunset background' or 'make the cat wear a tiny hat'"
            className="w-full h-24 p-2 bg-gray-900 border border-gray-600 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors text-sm text-gray-200"
            disabled={isLoading}
         />
         <div className="grid grid-cols-2 gap-3">
             {tools.filter(t => t.hasCustomPrompt).map((tool) => (
              <button
                key={tool.id}
                onClick={() => handleToolClick(tool)}
                disabled={isLoading || !customPrompt.trim()}
                className="flex items-center justify-center space-x-2 w-full px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 transition-colors duration-200 disabled:bg-gray-600 disabled:cursor-not-allowed"
              >
                  {isLoading && activeTool?.id === tool.id ? (
                     <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                  ) : <tool.icon className="w-5 h-5" />}
                  <span>{tool.name}</span>
              </button>
            ))}
         </div>
      </div>
    </div>
  );
};
