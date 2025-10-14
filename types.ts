
import React from 'react';

export interface EditingTool {
  id: string;
  name: string;
  description: string;
  prompt: string;
  icon: React.FC<{ className?: string }>;
  hasCustomPrompt?: boolean;
}
