
import React from 'react';
import { EditingTool } from '../types';

interface ToolButtonProps {
  tool: EditingTool;
  onClick: () => void;
  isActive: boolean;
  isLoading: boolean;
}

export const ToolButton: React.FC<ToolButtonProps> = ({ tool, onClick, isActive, isLoading }) => {
  const baseClasses = "flex flex-col items-center justify-center space-y-2 p-3 rounded-lg border transition-all duration-200 text-center";
  const stateClasses = isActive
    ? "bg-cyan-600/20 border-cyan-500 text-cyan-300"
    : "bg-gray-700/50 border-gray-600 hover:bg-gray-700 hover:border-gray-500 text-gray-300";

  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className={`${baseClasses} ${stateClasses}`}
      title={tool.description}
    >
      {isLoading ? (
        <div className="w-6 h-6 border-2 border-t-transparent border-cyan-400 rounded-full animate-spin"></div>
      ) : (
        <tool.icon className="w-6 h-6" />
      )}
      <span className="text-xs font-medium">{tool.name}</span>
    </button>
  );
};
