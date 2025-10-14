
import { EditingTool } from './types';
import { SparklesIcon, ScissorsIcon, PaintBrushIcon, UserCircleIcon, TrashIcon, CameraIcon, GlobeAltIcon, PuzzlePieceIcon, DocumentTextIcon, SunIcon } from './components/IconComponents';

export const GEMINI_MODEL = 'gemini-2.5-flash-image';

export const TOOLS: EditingTool[] = [
  {
    id: 'auto-enhance',
    name: 'Auto Enhance',
    description: 'One-click enhancement for color, sharpness, and clarity.',
    prompt: 'Enhance this photo automatically. Adjust brightness, contrast, and saturation for a vibrant, professional look. Apply subtle noise reduction and sharpness enhancement.',
    icon: SparklesIcon,
  },
  {
    id: 'face-retouch',
    name: 'Face Retouch',
    description: 'Smooth skin and brighten eyes for perfect portraits.',
    prompt: 'Perform a subtle, professional face retouch on any people in this photo. Smooth skin texture naturally, brighten eyes, and reduce minor blemishes without making it look artificial.',
    icon: UserCircleIcon,
  },
  {
    id: 'remove-bg',
    name: 'Remove Background',
    description: 'Erase the background, leaving only the main subject.',
    prompt: 'Isolate the main subject and completely remove the background, making it transparent. If transparency is not possible, use a solid white background.',
    icon: TrashIcon,
  },
  {
    id: 'replace-bg',
    name: 'Replace Background',
    description: 'Use text to describe a new background.',
    prompt: 'Replace the background of this image with: ',
    icon: GlobeAltIcon,
    hasCustomPrompt: true,
  },
  {
    id: 'object-removal',
    name: 'Object Removal',
    description: 'Describe an object to remove it seamlessly.',
    prompt: 'Seamlessly remove the following object from the image: ',
    icon: PuzzlePieceIcon,
    hasCustomPrompt: true,
  },
  {
    id: 'smart-crop',
    name: 'Smart Crop',
    description: 'AI automatically finds the best composition.',
    prompt: 'Analyze the main subject of this image and intelligently crop it to improve the composition. Use a standard 4:3 aspect ratio.',
    icon: ScissorsIcon,
  },
  {
    id: 'cartoon-filter',
    name: 'Cartoon Style',
    description: 'Turn your photo into a colorful cartoon.',
    prompt: 'Transform this photo into a vibrant, stylized cartoon.',
    icon: PaintBrushIcon,
  },
  {
    id: 'sketch-filter',
    name: 'Sketch Style',
    description: 'Convert your photo into a pencil sketch.',
    prompt: 'Convert this photo into a detailed, monochrome pencil sketch.',
    icon: DocumentTextIcon,
  },
  {
    id: 'stylized-filter',
    name: 'Stylized Edit',
    description: 'Give your photo a unique, artistic look.',
    prompt: 'Reimagine this photo with a dramatic and stylized artistic edit. Think cinematic lighting and rich colors.',
    icon: CameraIcon,
  },
  {
    id: 'text-to-image',
    name: 'Prompt-Based Edit',
    description: 'Describe any change you want to make.',
    prompt: '',
    icon: SunIcon,
    hasCustomPrompt: true,
  },
];
