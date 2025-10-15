import { GoogleGenAI, Modality } from "@google/genai";
import { GEMINI_MODEL } from '../constants';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

/**
 * Extracts the first usable frame from a video file.
 * @param videoFile The video file to process.
 * @returns A promise that resolves with the base64 encoded frame data and its MIME type.
 */
const extractFrameFromVideo = (videoFile: File): Promise<{ base64Data: string; mimeType: 'image/jpeg' }> => {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        if (!context) {
            return reject(new Error('Could not get 2D context from canvas.'));
        }

        video.muted = true;
        video.playsInline = true;
        video.preload = 'auto';

        const videoUrl = URL.createObjectURL(videoFile);
        video.src = videoUrl;
        
        const cleanup = () => {
            URL.revokeObjectURL(videoUrl);
            video.remove();
            canvas.remove();
        };

        video.onloadeddata = () => {
            // Seek to a short time into the video to avoid potential black frames at the beginning
            video.currentTime = 0.1; 
        };

        video.onseeked = () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            const dataUrl = canvas.toDataURL('image/jpeg', 0.9); // 0.9 is quality
            const base64Data = dataUrl.split(',')[1];
            
            if (base64Data) {
                resolve({ base64Data, mimeType: 'image/jpeg' });
            } else {
                reject(new Error('Failed to extract frame from video canvas.'));
            }
            cleanup();
        };

        video.onerror = () => {
            reject(new Error('Failed to load video for frame extraction.'));
            cleanup();
        };
        
        // Start loading the video
        video.load();
        video.play().catch(error => {
            // Play may be interrupted by the quick processing, which is fine.
            // If it's a real error, onerror should catch it.
        });
    });
};


export const editImage = async (
  base64ImageData: string,
  mimeType: string,
  prompt: string
): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: {
        parts: [
          {
            inlineData: {
              data: base64ImageData,
              mimeType: mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    const firstPart = response.candidates?.[0]?.content?.parts?.[0];

    if (firstPart && firstPart.inlineData) {
      return firstPart.inlineData.data;
    } else {
      throw new Error("No image data received from the API. The model may have refused the request.");
    }
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        if(error.message.includes('429')) {
             throw new Error("API request limit reached. Please try again later.");
        }
         throw new Error(`Gemini API Error: ${error.message}`);
    }
    throw new Error("An unknown error occurred while processing the image.");
  }
};

export const generateImage = async (prompt: string): Promise<string> => {
    try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
              numberOfImages: 1,
              outputMimeType: 'image/jpeg',
              aspectRatio: '1:1',
            },
        });

        const image = response.generatedImages?.[0]?.image?.imageBytes;

        if (image) {
            return image;
        } else {
            throw new Error("No image data received from the API. The model may have refused the request.");
        }
    } catch (error) {
        console.error("Error calling Gemini API for image generation:", error);
        if (error instanceof Error) {
            if (error.message.includes('429')) {
                throw new Error("API request limit reached. Please try again later.");
            }
            throw new Error(`Gemini API Error: ${error.message}`);
        }
        throw new Error("An unknown error occurred while generating the image.");
    }
};

export const generateVideo = async (prompt: string, aspectRatio: string, durationSecs: number): Promise<string> => {
    try {
        let operation = await ai.models.generateVideos({
            model: 'veo-2.0-generate-001',
            prompt: prompt,
            config: {
                numberOfVideos: 1,
                aspectRatio: aspectRatio,
                durationSecs: durationSecs,
            }
        });

        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 10000));
            operation = await ai.operations.getVideosOperation({ operation: operation });
        }

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;

        if (!downloadLink) {
            throw new Error("Video generation completed, but no download link was provided.");
        }

        const videoResponse = await fetch(`${downloadLink}&key=${API_KEY}`);
        if (!videoResponse.ok) {
            throw new Error(`Failed to download video: ${videoResponse.statusText}`);
        }

        const videoBlob = await videoResponse.blob();
        return URL.createObjectURL(videoBlob);

    } catch (error) {
        console.error("Error calling Gemini API for video generation:", error);
        if (error instanceof Error) {
            if (error.message.includes('429')) {
                throw new Error("API request limit reached. Please try again later.");
            }
            throw new Error(`Gemini API Error: ${error.message}`);
        }
        throw new Error("An unknown error occurred while generating the video.");
    }
}

export const remixVideo = async (videoFile: File, prompt: string): Promise<string> => {
    try {
        const { base64Data, mimeType } = await extractFrameFromVideo(videoFile);
        
        let operation = await ai.models.generateVideos({
            model: 'veo-2.0-generate-001',
            prompt: prompt,
            image: {
                imageBytes: base64Data,
                mimeType: mimeType,
            },
            config: {
                numberOfVideos: 1,
                durationSecs: 8, // Using a default duration for remixes
            }
        });

        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 5000)); // Polling more frequently
            operation = await ai.operations.getVideosOperation({ operation: operation });
        }

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;

        if (!downloadLink) {
            throw new Error("Video remix completed, but no download link was provided.");
        }

        const videoResponse = await fetch(`${downloadLink}&key=${API_KEY}`);
        if (!videoResponse.ok) {
            throw new Error(`Failed to download video: ${videoResponse.statusText}`);
        }

        const videoBlob = await videoResponse.blob();
        return URL.createObjectURL(videoBlob);

    } catch (error) {
        console.error("Error calling Gemini API for video remix:", error);
        if (error instanceof Error) {
            if (error.message.includes('429')) {
                throw new Error("API request limit reached. Please try again later.");
            }
            throw new Error(`Gemini API Error: ${error.message}`);
        }
        throw new Error("An unknown error occurred while remixing the video.");
    }
};

export const generateSpeech = async (text: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: `Say with a professional and clear tone: ${text}` }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' },
                    },
                },
            },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

        if (base64Audio) {
            return base64Audio;
        } else {
            throw new Error("No audio data received from the API.");
        }
    } catch (error) {
        console.error("Error calling Gemini API for speech generation:", error);
        if (error instanceof Error) {
            if (error.message.includes('429')) {
                throw new Error("API request limit reached. Please try again later.");
            }
            throw new Error(`Gemini API Error: ${error.message}`);
        }
        throw new Error("An unknown error occurred while generating speech.");
    }
};