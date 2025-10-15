import React, { useState, useRef, useEffect, useCallback } from 'react';
import { generateVideo, generateSpeech, remixVideo } from '../services/geminiService';
import { DownloadIcon, ArrowPathIcon, VideoCameraIcon, UploadIcon, TrashIcon } from './IconComponents';

const aspectRatios = ['16:9', '9:16', '1:1'];

// --- Audio Helper Functions ---

// Decodes base64 string to Uint8Array
const decode = (base64: string) => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

// Decodes raw PCM audio data into an AudioBuffer
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
): Promise<AudioBuffer> {
  const sampleRate = 24000; // Gemini TTS sample rate
  const numChannels = 1;
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < frameCount; i++) {
    channelData[i] = dataInt16[i] / 32768.0;
  }
  return buffer;
}

// Encodes an AudioBuffer into a WAV file blob
const encodeWAV = (buffer: AudioBuffer): Blob => {
    const numOfChan = buffer.numberOfChannels;
    const length = buffer.length * numOfChan * 2 + 44;
    const bufferArr = new ArrayBuffer(length);
    const view = new DataView(bufferArr);
    const channels = [];
    let i, sample;
    let offset = 0;
    let pos = 0;

    const setUint16 = (data: number) => {
        view.setUint16(pos, data, true);
        pos += 2;
    }
    const setUint32 = (data: number) => {
        view.setUint32(pos, data, true);
        pos += 4;
    }

    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8); // file length - 8
    setUint32(0x45564157); // "WAVE"

    setUint32(0x20746d66); // "fmt " chunk
    setUint32(16); // length = 16
    setUint16(1); // PCM (uncompressed)
    setUint16(numOfChan);
    setUint32(buffer.sampleRate);
    setUint32(buffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
    setUint16(numOfChan * 2); // block-align
    setUint16(16); // 16-bit

    setUint32(0x61746164); // "data" - chunk
    setUint32(length - pos - 4); // chunk length

    for (i = 0; i < buffer.numberOfChannels; i++) {
        channels.push(buffer.getChannelData(i));
    }

    while (pos < length) {
        for (i = 0; i < numOfChan; i++) {
            sample = Math.max(-1, Math.min(1, channels[i][offset]));
            sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
            view.setInt16(pos, sample, true);
            pos += 2;
        }
        offset++
    }
    return new Blob([view], { type: 'audio/wav' });
};


export const VideoGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [voiceOverText, setVoiceOverText] = useState('');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [sourceVideo, setSourceVideo] = useState<{ file: File; url: string } | null>(null);

  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [generatedAudioBuffer, setGeneratedAudioBuffer] = useState<AudioBuffer | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement || !generatedAudioBuffer) return;

    const audioContext = audioContextRef.current ?? new (window.AudioContext || (window as any).webkitAudioContext)();
    audioContextRef.current = audioContext;
    
    const playAudio = () => {
        if(audioSourceRef.current) {
            audioSourceRef.current.stop();
        }
        const source = audioContext.createBufferSource();
        source.buffer = generatedAudioBuffer;
        source.connect(audioContext.destination);
        source.start(0, videoElement.currentTime);
        audioSourceRef.current = source;
    };

    const pauseAudio = () => {
        if(audioSourceRef.current) {
            audioSourceRef.current.stop();
            audioSourceRef.current = null;
        }
    };

    videoElement.addEventListener('play', playAudio);
    videoElement.addEventListener('pause', pauseAudio);
    videoElement.addEventListener('seeking', pauseAudio);
    videoElement.addEventListener('seeked', playAudio);
    videoElement.addEventListener('ended', pauseAudio);

    return () => {
        videoElement.removeEventListener('play', playAudio);
        videoElement.removeEventListener('pause', pauseAudio);
        videoElement.removeEventListener('seeking', pauseAudio);
        videoElement.removeEventListener('seeked', playAudio);
        videoElement.removeEventListener('ended', pauseAudio);
        pauseAudio();
    };
  }, [generatedAudioBuffer]);
  
  const processVideoFile = (file: File) => {
    if (!file.type.startsWith('video/')) {
        setError('Please select a valid video file (e.g., MP4, MOV).');
        return;
    }
    setError(null);
    setSourceVideo({ file, url: URL.createObjectURL(file) });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) processVideoFile(file);
  };
  
  const onDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const file = event.dataTransfer.files?.[0];
    if (file) processVideoFile(file);
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsLoading(true);
    setError(null);
    setGeneratedVideoUrl(null);
    setGeneratedAudioBuffer(null);

    try {
      const videoPromise = sourceVideo 
        ? remixVideo(sourceVideo.file, prompt)
        : generateVideo(prompt, aspectRatio);

      const audioPromise = voiceOverText.trim() && !sourceVideo
        ? generateSpeech(voiceOverText)
        : Promise.resolve(null);
      
      const [videoUrl, audioBase64] = await Promise.all([videoPromise, audioPromise]);

      setGeneratedVideoUrl(videoUrl);

      if (audioBase64) {
          const audioContext = audioContextRef.current ?? new (window.AudioContext || (window as any).webkitAudioContext)();
          audioContextRef.current = audioContext;
          const decodedData = decode(audioBase64);
          const buffer = await decodeAudioData(decodedData, audioContext);
          setGeneratedAudioBuffer(buffer);
      }

    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadVideo = () => {
    if (!generatedVideoUrl) return;
    const link = document.createElement('a');
    link.href = generatedVideoUrl;
    link.download = 'generated-video.mp4';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadAudio = () => {
      if(!generatedAudioBuffer) return;
      const wavBlob = encodeWAV(generatedAudioBuffer);
      const url = URL.createObjectURL(wavBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'generated-audio.wav';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
  }

  const handleDownloadCombined = async () => {
    if (!generatedVideoUrl || !generatedAudioBuffer) return;

    setIsMerging(true);
    setError(null);

    try {
        const video = document.createElement('video');
        video.crossOrigin = 'anonymous';
        video.muted = true;
        video.src = generatedVideoUrl;

        await new Promise<void>((resolve, reject) => {
            video.onloadedmetadata = () => resolve();
            video.onerror = () => reject('Failed to load video metadata for merging.');
        });

        const videoStream = (video as any).captureStream();
        const videoTrack = videoStream.getVideoTracks()[0];

        const audioContext = audioContextRef.current || new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioContext;
        
        const source = audioContext.createBufferSource();
        source.buffer = generatedAudioBuffer;

        const destination = audioContext.createMediaStreamDestination();
        source.connect(destination);
        const audioTrack = destination.stream.getAudioTracks()[0];
        
        const combinedStream = new MediaStream([videoTrack, audioTrack]);

        const recorder = new MediaRecorder(combinedStream, { mimeType: 'video/webm' });
        
        const chunks: Blob[] = [];
        recorder.ondataavailable = (event) => {
            if (event.data.size > 0) chunks.push(event.data);
        };

        recorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = 'generated-video-with-audio.webm';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            setIsMerging(false);
            videoTrack.stop();
            audioTrack.stop();
        };

        recorder.start();
        source.start();
        await video.play();

        video.onended = () => {
            if(recorder.state === 'recording') recorder.stop();
            source.stop();
        };

    } catch (e) {
        console.error("Failed to merge video and audio", e);
        const message = e instanceof Error ? e.message : 'An unknown error occurred.';
        setError(`Failed to combine: ${message}. Please download them separately.`);
        setIsMerging(false);
    }
  };
  
  const handleReset = () => {
      if(generatedVideoUrl) {
          URL.revokeObjectURL(generatedVideoUrl);
      }
      if(sourceVideo) {
          URL.revokeObjectURL(sourceVideo.url);
      }
      setPrompt('');
      setVoiceOverText('');
      setSourceVideo(null);
      setGeneratedVideoUrl(null);
      setGeneratedAudioBuffer(null);
      setError(null);
      setIsLoading(false);
  }

  if (isLoading) {
    return (
       <div className="w-full max-w-2xl text-center bg-gray-800 border-2 border-dashed border-gray-600 rounded-xl p-12 flex flex-col items-center justify-center min-h-[384px]">
            <div className="w-12 h-12 border-4 border-t-transparent border-cyan-400 rounded-full animate-spin"></div>
            <p className="mt-4 text-lg font-semibold text-gray-300">{sourceVideo ? 'Remixing your video...' : 'Generating your video...'}</p>
            <p className="mt-2 text-sm text-gray-400">This may take a few minutes. Please don't close this tab.</p>
       </div>
    );
  }

  if (error) {
     return (
        <div className="w-full max-w-2xl text-center bg-gray-800 border border-red-500/50 rounded-xl p-12 flex flex-col items-center justify-center min-h-[384px]">
            <div className="flex flex-col items-center justify-center space-y-4">
                <p className="text-lg font-semibold text-red-400">Process Failed</p>
                <p className="text-sm text-gray-400 max-w-md">{error}</p>
                <button onClick={handleReset} className="mt-4 px-6 py-2 bg-cyan-600 text-white font-semibold rounded-lg shadow-md hover:bg-cyan-700 transition-all">
                    Try Again
                </button>
            </div>
        </div>
     )
  }
  
  if (generatedVideoUrl) {
      return (
        <div className="w-full max-w-2xl text-center space-y-4">
             <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                <video ref={videoRef} src={generatedVideoUrl} controls autoPlay loop className="w-full h-auto object-contain" />
             </div>
              <p className="text-xs text-gray-500">You can download files separately, or as a combined video.</p>
             <div className="flex flex-wrap items-center justify-center gap-4">
                <button onClick={handleReset} className="flex items-center space-x-2 px-4 py-2 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors">
                    <ArrowPathIcon className="w-5 h-5" />
                    <span>Generate Another</span>
                </button>

                {generatedAudioBuffer && (
                    <button onClick={handleDownloadCombined} disabled={isMerging} className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed">
                        {isMerging ? (
                            <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                        ) : <DownloadIcon className="w-5 h-5" />}
                        <span>Download Combined</span>
                    </button>
                )}

                <button onClick={handleDownloadVideo} className="flex items-center space-x-2 px-4 py-2 bg-cyan-600 text-white font-semibold rounded-lg hover:bg-cyan-700 transition-colors">
                    <DownloadIcon className="w-5 h-5" />
                    <span>Video Only</span>
                </button>
                 {generatedAudioBuffer && (
                     <button onClick={handleDownloadAudio} className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors">
                        <DownloadIcon className="w-5 h-5" />
                        <span>Audio Only</span>
                    </button>
                 )}
             </div>
        </div>
      )
  }

  return (
    <div className="w-full max-w-2xl text-center">
      <div className="bg-gray-800 border-2 border-dashed border-gray-600 rounded-xl p-8 md:p-12 space-y-6 hover:border-cyan-500 transition-colors duration-300">
        <div className="flex flex-col items-center justify-center space-y-4">
            <div className="bg-gray-700 p-4 rounded-full">
                <VideoCameraIcon className="w-12 h-12 text-cyan-400" />
            </div>
            <p className="text-lg font-semibold text-white">Describe the video you want to create or remix</p>
        </div>
        
        {sourceVideo ? (
             <div className="relative w-full aspect-video bg-gray-900 rounded-lg overflow-hidden border border-gray-600">
                <video src={sourceVideo.url} muted loop autoPlay className="w-full h-full object-contain" />
                <button
                    onClick={() => {
                        URL.revokeObjectURL(sourceVideo.url);
                        setSourceVideo(null);
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/80 transition-colors"
                    aria-label="Remove video"
                >
                    <TrashIcon className="w-5 h-5" />
                </button>
             </div>
        ) : (
             <div 
                className="bg-gray-900/50 border-2 border-dashed border-gray-700 rounded-lg p-6 hover:border-cyan-600 transition-colors duration-300 cursor-pointer"
                onDrop={onDrop}
                onDragOver={(e) => {e.preventDefault(); e.stopPropagation();}}
                onClick={() => document.getElementById('video-remix-upload')?.click()}
             >
                <div className="flex flex-col items-center justify-center space-y-2 text-gray-400">
                    <UploadIcon className="w-8 h-8"/>
                    <p className="text-sm font-semibold">Start with a video to remix (Optional)</p>
                    <p className="text-xs">Drag & drop or click to browse</p>
                </div>
                 <input id="video-remix-upload" type="file" accept="video/*" className="hidden" onChange={handleFileChange} />
             </div>
        )}
        
        <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={sourceVideo ? "e.g., 'Make this a vintage 8mm film'" : "e.g., 'A neon hologram of a cat driving'"}
            className="w-full h-24 p-3 bg-gray-900 border border-gray-600 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors text-sm text-gray-200 resize-none"
        />
        
        {!sourceVideo && (
            <>
                <div>
                    <label className="block text-sm font-medium text-gray-400 text-left mb-2">Voice Over (Optional)</label>
                    <textarea
                        value={voiceOverText}
                        onChange={(e) => setVoiceOverText(e.target.value)}
                        placeholder="e.g., In a world of chrome and circuits..."
                        className="w-full h-20 p-3 bg-gray-900 border border-gray-600 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors text-sm text-gray-200 resize-none"
                    />
                </div>
                <div className="space-y-2 text-left">
                    <label className="block text-sm font-medium text-gray-400">Aspect Ratio</label>
                    <div className="grid grid-cols-3 gap-2">
                        {aspectRatios.map((ratio) => (
                            <label
                                key={ratio}
                                htmlFor={`ratio-${ratio}`}
                                className={`relative flex items-center justify-center p-3 rounded-lg border cursor-pointer transition-colors duration-200 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-gray-800 focus-within:ring-cyan-500 ${
                                    aspectRatio === ratio
                                        ? 'bg-cyan-600/20 border-cyan-500 text-cyan-300'
                                        : 'bg-gray-900 border-gray-600 hover:bg-gray-800 text-gray-300'
                                }`}
                            >
                                <input
                                    type="radio"
                                    id={`ratio-${ratio}`}
                                    name="aspectRatio"
                                    value={ratio}
                                    checked={aspectRatio === ratio}
                                    onChange={() => setAspectRatio(ratio)}
                                    className="sr-only"
                                />
                                <span className="text-sm font-semibold">{ratio}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </>
        )}

        <button
            onClick={handleGenerate}
            disabled={!prompt.trim()}
            className="w-full px-6 py-3 bg-cyan-600 text-white font-bold rounded-lg shadow-md hover:bg-cyan-700 transition-all disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
            <VideoCameraIcon className="w-5 h-5" />
            <span>{sourceVideo ? 'Remix Video' : 'Generate Video'}</span>
        </button>
      </div>
    </div>
  );
};