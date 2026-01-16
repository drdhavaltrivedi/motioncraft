/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

// @ts-ignore
import { GIFEncoder, quantize, applyPalette } from 'gifenc';

export const getRandomStyle = (): string => {
  const styles = [
    "formed by fluffy white clouds in a deep blue summer sky",
    "written in glowing constellations against a dark nebula galaxy",
    "arranged using colorful autumn leaves on wet green grass",
    "reflected in cyberpunk neon puddles on a rainy street",
    "drawn with latte art foam in a ceramic coffee cup",
    "glowing as ancient magical runes carved into a dark cave wall",
    "displayed on a futuristic translucent holographic interface",
    "sculpted from melting surrealist gold in a desert landscape",
    "arranged with intricate mechanical gears and steampunk machinery",
    "formed by bioluminescent jellyfish in the deep ocean",
    "composed of vibrant colorful smoke swirling in a dark room",
    "carved into the bark of an ancient mossy oak tree",
    "made of sparkling diamonds scattered on black velvet"
  ];
  return styles[Math.floor(Math.random() * styles.length)];
};

export const cleanBase64 = (data: string): string => {
  // Remove data URL prefix if present to get raw base64
  // Handles generic data:application/octet-stream;base64, patterns too
  return data.replace(/^data:.*,/, '');
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

export const createGifFromVideo = async (videoUrl: string): Promise<Blob> => {
  // Runtime check just in case, though standard imports should throw earlier if failed
  if (typeof GIFEncoder !== 'function') {
    throw new Error("GIF library failed to load correctly. Please refresh the page.");
  }

  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.crossOrigin = "anonymous";
    video.src = videoUrl;
    video.muted = true;
    
    video.onloadedmetadata = async () => {
      try {
        const duration = video.duration || 5; 
        const width = 400; // Downscale for speed
        // Ensure even dimensions
        let height = Math.floor((video.videoHeight / video.videoWidth) * width);
        if (height % 2 !== 0) height -= 1;

        const fps = 10;
        const totalFrames = Math.floor(duration * fps);
        
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
        if (!ctx) throw new Error("Could not get canvas context");

        // Initialize encoder
        const gif = GIFEncoder();
        
        for (let i = 0; i < totalFrames; i++) {
          // Yield to main thread to prevent UI freeze
          await new Promise(r => setTimeout(r, 0));

          const time = i / fps;
          video.currentTime = time;
          
          // Wait for seek with timeout
          await new Promise<void>((r, rej) => {
             const timeout = setTimeout(() => {
                video.removeEventListener('seeked', seekHandler);
                // Proceed anyway if seek takes too long, though frame might be dupe
                r();
             }, 1000);

             const seekHandler = () => {
               clearTimeout(timeout);
               video.removeEventListener('seeked', seekHandler);
               r();
             };
             video.addEventListener('seeked', seekHandler);
          });
          
          ctx.drawImage(video, 0, 0, width, height);
          const imageData = ctx.getImageData(0, 0, width, height);
          const { data } = imageData;
          
          // Quantize
          const palette = quantize(data, 256);
          const index = applyPalette(data, palette);
          
          gif.writeFrame(index, width, height, { palette, delay: 1000 / fps });
        }
        
        gif.finish();
        const buffer = gif.bytes();
        resolve(new Blob([buffer], { type: 'image/gif' }));
      } catch (e) {
        console.error("GIF Generation Error:", e);
        reject(e);
      }
    };
    
    video.onerror = (e) => reject(new Error("Video load failed"));
    video.load(); 
  });
};

export const TYPOGRAPHY_SUGGESTIONS = [
  { id: 'cinematic-3d', label: 'Cinematic 3D', prompt: 'Bold, dimensional 3D text with realistic lighting and shadows' },
  { id: 'neon-cyber', label: 'Neon Cyber', prompt: 'Glowing neon tube typography, cyberpunk aesthetic, vibrant bloom' },
  { id: 'elegant-serif', label: 'Elegant Serif', prompt: 'Refined, high-contrast serif typography, luxury editorial look' },
  { id: 'bold-sans', label: 'Bold Sans', prompt: 'Massive, heavy sans-serif typography, geometric and impactful' },
  { id: 'handwritten', label: 'Handwritten', prompt: 'Organic, flowing handwritten brush script, artistic and personal' },
  { id: 'retro-80s', label: 'Retro 80s', prompt: 'Chrome-plated, synthwave style typography with horizon lines and sparkles' },
  { id: 'liquid-metal', label: 'Liquid Metal', prompt: 'Fluid, melting chrome typography, surreal and reflective' },
  { id: 'botanical', label: 'Botanical', prompt: 'Typography intertwined with vines, flowers, and organic nature elements' },
];

// History Management
const HISTORY_STORAGE_KEY = 'motioncraft_history';
const MAX_HISTORY_ITEMS = 20;

export interface HistoryItem {
  id: string;
  text: string;
  style: string;
  typographyPrompt: string;
  imageSrc: string; // Base64 data URL
  videoUrl: string; // Blob URL (temporary, cleared on reload)
  timestamp: number;
  mimeType: string;
}

export const saveToHistory = (item: Omit<HistoryItem, 'id' | 'timestamp'>): void => {
  try {
    const history = getHistory();
    const newItem: HistoryItem = {
      ...item,
      id: `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };
    
    // Add to beginning and limit to MAX_HISTORY_ITEMS
    const updatedHistory = [newItem, ...history].slice(0, MAX_HISTORY_ITEMS);
    
    // Store only essential data (image as base64, but not video blob URLs)
    const storageData = updatedHistory.map(({ videoUrl, ...rest }) => ({
      ...rest,
      // Don't store blob URLs as they won't work after reload
      videoUrl: videoUrl.startsWith('blob:') ? '' : videoUrl,
    }));
    
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(storageData));
  } catch (error) {
    console.error('Failed to save to history:', error);
    // If storage is full, try to clear old items
    try {
      const history = getHistory();
      const trimmed = history.slice(0, Math.floor(MAX_HISTORY_ITEMS / 2));
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(trimmed));
    } catch (e) {
      console.error('Failed to trim history:', e);
    }
  }
};

export const getHistory = (): HistoryItem[] => {
  try {
    const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return parsed.map((item: any) => ({
      ...item,
      // Restore empty videoUrl for blob URLs that were cleared
      videoUrl: item.videoUrl || '',
    }));
  } catch (error) {
    console.error('Failed to read history:', error);
    return [];
  }
};

export const clearHistory = (): void => {
  try {
    localStorage.removeItem(HISTORY_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear history:', error);
  }
};

export const removeHistoryItem = (id: string): void => {
  try {
    const history = getHistory();
    const filtered = history.filter(item => item.id !== id);
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to remove history item:', error);
  }
};

export const formatHistoryDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};