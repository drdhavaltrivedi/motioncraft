
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI } from "@google/genai";
import { cleanBase64, getRandomStyle } from "../utils";

// Helper to ensure we always get a fresh instance with the latest key
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Robust retry wrapper to handle transient 503 Service Unavailable and Deadline Expired errors.
 */
const withRetry = async <T>(fn: () => Promise<T>, retries = 3, baseDelay = 3000): Promise<T> => {
  try {
    return await fn();
  } catch (error: any) {
    const errorMsg = error?.message || "";
    const isRetryable = errorMsg.includes("503") || 
                        errorMsg.includes("Deadline expired") || 
                        errorMsg.includes("UNAVAILABLE") ||
                        errorMsg.includes("429"); // Rate limit

    if (retries > 0 && isRetryable) {
      console.warn(`Gemini API busy (Retries left: ${retries}). Error: ${errorMsg}. Retrying in ${baseDelay}ms...`);
      await sleep(baseDelay);
      return withRetry(fn, retries - 1, baseDelay * 2);
    }
    throw error;
  }
};

// Helper to create a blank black image for the video start frame
const createBlankImage = (width: number, height: number): string => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);
  }
  const dataUrl = canvas.toDataURL('image/png');
  return cleanBase64(dataUrl);
};

// Fast style suggestion with simplified prompt and reduced retries
export const generateStyleSuggestion = async (text: string): Promise<string> => {
  // Use a faster, simpler approach with minimal retries for speed
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Cinematic style for "${text}" in 10 words: material, lighting, environment. Output description only.`,
      config: {
        temperature: 0.9,
        maxOutputTokens: 50, // Limit output for speed
      }
    });
    return response.text?.trim() || getRandomStyle();
  } catch (error: any) {
    // Fallback to random style if AI fails (fast fallback)
    console.warn('Style suggestion failed, using random style:', error);
    return getRandomStyle();
  }
};

interface TextImageOptions {
  text: string;
  style: string;
  typographyPrompt?: string;
  referenceImage?: string; // Full Data URL
}

export const generateTextImage = async ({ text, style, typographyPrompt, referenceImage }: TextImageOptions): Promise<{ data: string, mimeType: string }> => {
  return withRetry(async () => {
    const ai = getAI();
    const parts: any[] = [];
    
    const typoInstruction = typographyPrompt && typographyPrompt.trim().length > 0 
      ? typographyPrompt 
      : "High-quality, creative typography that perfectly matches the visual environment. Legible and artistic.";

    if (referenceImage) {
      const [mimeTypePart, data] = referenceImage.split(';base64,');
      parts.push({
        inlineData: {
          data: data,
          mimeType: mimeTypePart.replace('data:', '')
        }
      });
      
      parts.push({ 
        text: `Analyze the visual style, color palette, lighting, and textures of this reference image. 
        Create a NEW high-resolution cinematic image featuring the text "${text}" written in the center. 
        Typography Instruction: ${typoInstruction}.
        The text should look like it perfectly belongs in the world of the reference image.
        Additional style instructions: ${style}.` 
      });
    } else {
      parts.push({ 
        text: `A hyper-realistic, cinematic, high-resolution image featuring the text "${text}". 
        Typography Instruction: ${typoInstruction}. 
        Visual Style: ${style}. 
        The typography must be legible, artistic, and centered. Lighting should be dramatic and atmospheric. 8k resolution, detailed texture.` 
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts },
      config: {
        imageConfig: {
          aspectRatio: "16:9",
          imageSize: "1K"
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return { 
          data: part.inlineData.data, 
          mimeType: part.inlineData.mimeType || 'image/png' 
        };
      }
    }
    throw new Error("No image generated");
  });
};

const pollForVideo = async (operation: any) => {
  const ai = getAI();
  let op = operation;
  const startTime = Date.now();
  const MAX_WAIT_TIME = 300000; // 5 minutes

  while (!op.done) {
    if (Date.now() - startTime > MAX_WAIT_TIME) {
      throw new Error("Video generation timed out. Please try again.");
    }
    
    await sleep(10000); // Polling every 10 seconds is safer for high-load operations
    
    try {
      op = await ai.operations.getVideosOperation({ operation: op });
    } catch (e: any) {
      const msg = e?.message || "";
      // If the polling request itself fails with a 503, don't abort, just wait and retry checking
      if (msg.includes("503") || msg.includes("Deadline expired") || msg.includes("UNAVAILABLE")) {
        console.warn("Polling status failed temporarily, retrying status check...");
        continue;
      }
      throw e;
    }
  }
  return op;
};

const fetchVideoBlob = async (uri: string) => {
  return withRetry(async () => {
    const url = new URL(uri);
    url.searchParams.append('key', process.env.API_KEY || '');
    
    const videoResponse = await fetch(url.toString());
    if (!videoResponse.ok) {
      throw new Error(`Failed to fetch video content: ${videoResponse.statusText}`);
    }
    const blob = await videoResponse.blob();
    return URL.createObjectURL(blob);
  }, 2, 2000);
};

export const generateTextVideo = async (text: string, imageBase64: string, imageMimeType: string, promptStyle: string): Promise<string> => {
  const ai = getAI();

  if (!imageBase64) throw new Error("Image generation failed, cannot generate video.");

  const cleanImageBase64 = cleanBase64(imageBase64);
  const startImage = createBlankImage(1280, 720);
  const revealPrompt = `Cinematic transition. The text "${text}" gradually forms and materializes from darkness. ${promptStyle}. High quality, 8k, smooth motion.`;

  // Use retry for the initial operation creation
  const operation = await withRetry(async () => {
    return await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: revealPrompt,
      image: {
        imageBytes: startImage,
        mimeType: 'image/png'
      },
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '16:9',
        lastFrame: {
          imageBytes: cleanImageBase64,
          mimeType: imageMimeType
        }
      }
    });
  });

  const op = await pollForVideo(operation);

  if (!op.error && op.response?.generatedVideos?.[0]?.video?.uri) {
    return await fetchVideoBlob(op.response.generatedVideos[0].video.uri);
  }
  
  if (op.error) {
    throw new Error(op.error.message || "The video generation service encountered an internal error.");
  }

  throw new Error("Unable to generate video.");
};
