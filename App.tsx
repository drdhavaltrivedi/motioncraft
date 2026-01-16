
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppState } from './types';
import { generateTextImage, generateTextVideo, generateStyleSuggestion } from './services/geminiService';
import { getRandomStyle, fileToBase64, TYPOGRAPHY_SUGGESTIONS, createGifFromVideo } from './utils';
import { 
  Loader2, Paintbrush, Play, Type, Sparkles, Image as ImageIcon, X, Upload, 
  Download, FileType, Wand2, Volume2, VolumeX, ChevronLeft, ChevronRight, 
  ArrowLeft, Video as VideoIcon, Key, Sun, Moon
} from 'lucide-react';

interface Video {
  id: string;
  title: string;
  videoUrl: string;
  description: string;
}

const staticFilesUrl = 'https://www.gstatic.com/aistudio/starter-apps/type-motion/';

export const MOCK_VIDEOS: Video[] = [
  {
    id: '1',
    title: "Cloud Formations",
    videoUrl: staticFilesUrl + 'clouds_v2.mp4',
    description: "Text formed by fluffy white clouds in a deep blue summer sky.",
  },
  {
    id: '2',
    title: "Elemental Fire",
    videoUrl: staticFilesUrl + 'fire_v2.mp4',
    description: "Flames erupt into text in an arid dry environment.",
  },
  {
    id: '3',
    title: "Mystic Smoke",
    videoUrl: staticFilesUrl + 'smoke_v2.mp4',
    description: "A sudden wave of smoke swirling to reveal the text.",
  },
  {
    id: '4',
    title: "Water Blast",
    videoUrl: staticFilesUrl + 'water_v2.mp4',
    description: "A wall of water punching through text with power.",
  },
];

const ApiKeyDialog: React.FC<{ isOpen: boolean; onClose: () => void; onSelect: () => void }> = ({ isOpen, onClose, onSelect }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-stone-100 dark:border-zinc-800 animate-in zoom-in-95 duration-300">
        <div className="p-6">
          <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center mb-4">
            <Key className="text-amber-600 dark:text-amber-500" size={24} />
          </div>
          <h2 className="text-xl font-bold text-stone-900 dark:text-white mb-2">Paid API Key Required</h2>
          <p className="text-stone-500 dark:text-stone-400 text-sm leading-relaxed mb-6">
            To use cinematic video generation models (like Veo), you must select an API key from a Google Cloud project with 
            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-stone-900 dark:text-stone-100 underline decoration-stone-300 hover:decoration-stone-900 font-medium ml-1">billing enabled</a>. 
            Free-tier keys do not support these high-end features.
          </p>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 px-4 rounded-xl text-sm font-bold text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors">Cancel</button>
            <button onClick={onSelect} className="flex-1 py-3 px-4 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-xl text-sm font-bold shadow-lg shadow-stone-900/10 hover:bg-stone-800 dark:hover:bg-white transition-all">Select API Key</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const HeroCarousel: React.FC<{ forceMute: boolean }> = ({ forceMute }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const video = MOCK_VIDEOS[currentIndex];

  useEffect(() => {
    if (forceMute) setIsMuted(true);
  }, [forceMute]);

  const handleNext = useCallback(() => setCurrentIndex((prev) => (prev + 1) % MOCK_VIDEOS.length), []);
  const handlePrev = useCallback(() => setCurrentIndex((prev) => (prev - 1 + MOCK_VIDEOS.length) % MOCK_VIDEOS.length), []);

  return (
    <div className="absolute inset-0 bg-black group">
      <video key={video.id} src={video.videoUrl} className="w-full h-full object-cover" autoPlay muted={isMuted} playsInline onEnded={handleNext} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none transition-opacity duration-500" />
      <div className="absolute bottom-0 left-0 p-8 w-full md:w-3/4 text-white pointer-events-none">
        <div className="animate-in slide-in-from-bottom-2 fade-in duration-700">
          <h3 className="text-xl md:text-2xl font-bold mb-2 drop-shadow-lg">{video.title}</h3>
          <p className="text-xs md:text-sm text-stone-300 line-clamp-2 leading-relaxed drop-shadow-md opacity-90">{video.description}</p>
        </div>
      </div>
      <button onClick={() => setIsMuted(!isMuted)} className="absolute top-6 right-6 p-3 bg-black/40 backdrop-blur-md border border-white/10 rounded-full text-white hover:bg-black/60 transition-all z-20">
        {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
      </button>
      <div className="absolute inset-y-0 left-0 flex items-center px-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={handlePrev} className="p-2 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-white hover:text-black transition-all transform hover:scale-110"><ChevronLeft size={28} /></button>
      </div>
      <div className="absolute inset-y-0 right-0 flex items-center px-4 opacity-0 group-hover:opacity-100 transition-opacity">
         <button onClick={handleNext} className="p-2 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-white hover:text-black transition-all transform hover:scale-110"><ChevronRight size={28} /></button>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(AppState.IDLE);
  const [viewMode, setViewMode] = useState<'gallery' | 'create'>('gallery');
  const [showKeyDialog, setShowKeyDialog] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [inputText, setInputText] = useState<string>("");
  const [inputStyle, setInputStyle] = useState<string>("");
  const [typographyPrompt, setTypographyPrompt] = useState<string>("");
  const [referenceImage, setReferenceImage] = useState<string | null>(null);

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [isGifGenerating, setIsGifGenerating] = useState<boolean>(false);
  const [isSuggestingStyle, setIsSuggestingStyle] = useState<boolean>(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Apply theme immediately on mount and when it changes
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Apply initial theme on mount to prevent flash
  useEffect(() => {
    const saved = localStorage.getItem('theme');
    const shouldBeDark = saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (shouldBeDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  useEffect(() => {
    if (state === AppState.GENERATING_IMAGE || state === AppState.GENERATING_VIDEO || state === AppState.PLAYING) {
      setViewMode('create');
    }
  }, [state]);

  const handleSelectKey = async () => {
    setShowKeyDialog(false);
    if (window.aistudio?.openSelectKey) {
      await window.aistudio.openSelectKey();
      if (state === AppState.IDLE) setViewMode('create');
    } else {
      // Running locally - if API key is set in env, allow proceeding
      const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
      if (apiKey && apiKey !== 'undefined' && apiKey.trim().length > 0) {
        if (state === AppState.IDLE) setViewMode('create');
      } else {
        // No API key found - show instructions
        alert('Please set GEMINI_API_KEY in your .env.local file and restart the dev server.');
      }
    }
  };

  const startProcess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    // Check for API key: first try AI Studio, then fall back to environment variable for local development
    let keySelected = false;
    if (window.aistudio?.hasSelectedApiKey) {
      keySelected = await window.aistudio.hasSelectedApiKey();
    } else {
      // Running locally - check environment variable
      const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
      keySelected = !!(apiKey && apiKey !== 'undefined' && apiKey.trim().length > 0);
    }
    
    if (!keySelected) {
      setShowKeyDialog(true);
      return;
    }

    setState(AppState.GENERATING_IMAGE);
    setIsGifGenerating(false);
    if (videoSrc?.startsWith('blob:')) URL.revokeObjectURL(videoSrc);
    setVideoSrc(null);
    setImageSrc(null);
    
    const styleToUse = inputStyle.trim() || getRandomStyle();
    setStatusMessage(`Designing "${inputText}"...`);

    try {
      const { data: b64Image, mimeType } = await generateTextImage({
        text: inputText, 
        style: styleToUse,
        typographyPrompt: typographyPrompt,
        referenceImage: referenceImage || undefined
      });

      setImageSrc(`data:${mimeType};base64,${b64Image}`);
      setState(AppState.GENERATING_VIDEO);
      setStatusMessage("Animating...");
      
      const videoUrl = await generateTextVideo(inputText, b64Image, mimeType, styleToUse);
      setVideoSrc(videoUrl);
      setState(AppState.PLAYING);
    } catch (err: any) {
      console.error(err);
      if (err.message && err.message.includes("Requested entity was not found.")) {
        setShowKeyDialog(true);
      }
      setStatusMessage(err.message || "Failed to create art.");
      setState(AppState.ERROR);
    }
  };

  const handleDownloadGif = async () => {
    if (!videoSrc) return;
    setIsGifGenerating(true);
    try {
      const gifBlob = await createGifFromVideo(videoSrc);
      const url = URL.createObjectURL(gifBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `motion-art-${inputText.replace(/\s+/g, '-').toLowerCase()}.gif`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to generate GIF", err);
    } finally {
      setIsGifGenerating(false);
    }
  };

  const reset = () => {
    setState(AppState.IDLE);
    setVideoSrc(null);
    setImageSrc(null);
    setIsGifGenerating(false);
  };

  const renderAppContent = () => {
    if (state === AppState.ERROR) {
       return (
        <div className="flex flex-col items-center justify-center space-y-6 h-full p-8 text-center">
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-6 py-4 rounded-xl border border-red-100 dark:border-red-900/30 max-w-md">
            <p className="font-medium">Generation Failed</p>
            <p className="text-sm mt-1">{statusMessage}</p>
          </div>
          <button onClick={reset} className="px-8 py-3 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-medium rounded-full shadow-lg">Try Again</button>
        </div>
      );
    }

    if (state === AppState.GENERATING_IMAGE || state === AppState.GENERATING_VIDEO || state === AppState.PLAYING) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center p-4 md:p-8 bg-stone-50 dark:bg-zinc-950 overflow-y-auto custom-scrollbar">
          {!videoSrc && (
            <div className="flex items-center gap-3 px-5 py-2 rounded-full mb-6 bg-white dark:bg-zinc-900 shadow-sm border border-stone-100 dark:border-zinc-800">
               <Loader2 size={16} className="animate-spin text-stone-400 dark:text-stone-500" />
               <span className="text-sm font-medium text-stone-600 dark:text-stone-300 uppercase tracking-wide">{statusMessage}</span>
            </div>
          )}
          <div className="relative w-full max-w-6xl aspect-video bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl border border-stone-200 dark:border-zinc-800">
            {state === AppState.GENERATING_IMAGE && !imageSrc && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-stone-50 dark:bg-zinc-900 space-y-4">
                 <Loader2 size={40} className="animate-spin text-stone-300 dark:text-zinc-700" />
                 <p className="text-stone-400 dark:text-stone-500 font-medium animate-pulse text-sm">Crafting Typography...</p>
              </div>
            )}
            {imageSrc && !videoSrc && <img src={imageSrc} className="w-full h-full object-cover animate-in fade-in duration-1000" alt="Generated visual" />}
            {videoSrc && <video src={videoSrc} autoPlay loop playsInline controls className="w-full h-full object-cover animate-in fade-in duration-1000" />}
          </div>
          {state === AppState.PLAYING && (
            <div className="w-full max-w-6xl mt-6 space-y-4 animate-in slide-in-from-bottom-4 duration-700">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <button onClick={reset} className="flex items-center gap-2 px-6 py-3 text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white transition-all font-bold text-sm uppercase tracking-wide group">
                  <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> Create New
                </button>
                <div className="flex items-center gap-3">
                  <button onClick={handleDownloadGif} disabled={isGifGenerating} className="px-5 py-3 bg-white dark:bg-zinc-900 text-stone-900 dark:text-stone-200 border border-stone-200 dark:border-zinc-700 font-bold rounded-xl hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-2 text-sm shadow-sm">
                    {isGifGenerating ? <Loader2 size={16} className="animate-spin" /> : <FileType size={16} />} GIF
                  </button>
                  <button onClick={() => videoSrc && window.open(videoSrc)} className="px-6 py-3 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-bold rounded-xl hover:opacity-90 transition-all flex items-center gap-2 shadow-xl text-sm">
                    <Download size={16} /> Download
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="h-full overflow-y-auto custom-scrollbar p-6 md:p-8 bg-white dark:bg-zinc-950">
        <h2 className="text-2xl font-bold mb-6 text-stone-900 dark:text-white">Create New</h2>
        <form onSubmit={startProcess} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-5">
              <label className="text-xs font-bold text-stone-400 dark:text-zinc-500 uppercase tracking-wider block">Content</label>
              <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="What should it say?" maxLength={40} className="w-full bg-stone-50 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-lg font-medium focus:ring-2 focus:ring-stone-900 dark:focus:ring-stone-100 text-stone-900 dark:text-white outline-none transition-all" required />
              
              <div className="flex justify-between items-center"><label className="text-xs font-bold text-stone-400 dark:text-zinc-500 uppercase block">Style</label>
                <button type="button" onClick={async () => { setIsSuggestingStyle(true); setInputStyle(await generateStyleSuggestion(inputText)); setIsSuggestingStyle(false); }} className="text-[10px] font-bold uppercase tracking-widest text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 flex items-center gap-1 transition-colors">{isSuggestingStyle ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />} Suggest</button>
              </div>
              <textarea value={inputStyle} onChange={(e) => setInputStyle(e.target.value)} placeholder="Describe the environment..." className="w-full bg-stone-50 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl p-3 text-sm h-24 resize-none text-stone-900 dark:text-white outline-none" />
            </div>
            <div className="space-y-5">
              <label className="text-xs font-bold text-stone-400 dark:text-zinc-500 uppercase tracking-wider block">Typography</label>
              <textarea value={typographyPrompt} onChange={(e) => setTypographyPrompt(e.target.value)} placeholder="Font aesthetic..." className="w-full bg-stone-50 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl p-3 text-sm h-24 resize-none text-stone-900 dark:text-white outline-none" />
              <div className="flex flex-wrap gap-1.5">{TYPOGRAPHY_SUGGESTIONS.slice(0, 4).map(opt => <button key={opt.id} type="button" onClick={() => setTypographyPrompt(opt.prompt)} className="px-2 py-1 bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-stone-300 text-[10px] font-medium rounded border border-stone-200 dark:border-zinc-700 hover:bg-stone-200 dark:hover:bg-zinc-700 transition-colors">{opt.label}</button>)}</div>
              
              <label className="text-xs font-bold text-stone-400 dark:text-zinc-500 uppercase tracking-wider block">Reference Image (Optional)</label>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => fileInputRef.current?.click()} className="flex-1 border border-dashed border-stone-300 dark:border-zinc-700 rounded-xl h-10 flex items-center justify-center gap-2 text-stone-500 dark:text-zinc-400 text-xs hover:bg-stone-50 dark:hover:bg-zinc-800 transition-colors"><Upload size={14} /> Upload</button>
                <input type="file" ref={fileInputRef} onChange={async (e) => { const file = e.target.files?.[0]; if (file) setReferenceImage(await fileToBase64(file)); }} accept="image/*" className="sr-only" />
                {referenceImage && <div className="h-10 w-10 relative rounded overflow-hidden border border-stone-200 dark:border-zinc-700 group"><img src={referenceImage} className="w-full h-full object-cover" /><button type="button" onClick={() => setReferenceImage(null)} className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><X size={12} className="text-white" /></button></div>}
              </div>
            </div>
          </div>
          <button type="submit" disabled={!inputText.trim()} className="w-full py-4 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-bold rounded-xl hover:opacity-90 transition-all shadow-xl flex items-center justify-center gap-2"><Play size={18} fill="currentColor" /> GENERATE MOTION ART</button>
        </form>
      </div>
    );
  };

  const isFlip = viewMode === 'create';

  return (
    <div className="min-h-screen w-full flex flex-col bg-stone-50 dark:bg-zinc-950 text-stone-900 dark:text-stone-100 font-sans transition-colors duration-500 overflow-x-hidden selection:bg-stone-900 selection:text-white dark:selection:bg-white dark:selection:text-zinc-900">
      <ApiKeyDialog isOpen={showKeyDialog} onClose={() => setShowKeyDialog(false)} onSelect={handleSelectKey} />
      
      {/* Dynamic Header */}
      <nav className="fixed top-0 left-0 right-0 z-[60] px-6 py-4 flex items-center justify-between">
        <div className="font-bold text-lg tracking-tight flex items-center gap-2 cursor-pointer" onClick={reset}>
          <div className="w-8 h-8 bg-stone-900 dark:bg-white rounded-lg flex items-center justify-center shadow-lg"><span className="text-white dark:text-stone-900 text-xs font-serif italic">M</span></div>
          <span className="hidden sm:inline text-stone-900 dark:text-white">MotionCraft</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-3 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-stone-200/50 dark:border-zinc-800/50 rounded-full shadow-lg text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white transition-all transform active:scale-90" title={isDarkMode ? "Light Mode" : "Dark Mode"}>
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center p-4 lg:p-6 overflow-hidden">
        <div className={`transition-all duration-1000 ease-[cubic-bezier(0.25,0.8,0.25,1)] w-full flex flex-col lg:flex-row items-center justify-center ${isFlip ? 'max-w-6xl' : 'max-w-7xl gap-8 lg:gap-16'}`}>
          <div className={`flex flex-col justify-center space-y-6 lg:space-y-8 z-10 text-center lg:text-left transition-all duration-1000 overflow-hidden flex-shrink-0 ${isFlip ? 'max-h-0 opacity-0 -translate-y-24 lg:max-h-[900px] lg:w-0 lg:translate-y-0 lg:-translate-x-32' : 'max-h-[1000px] opacity-100 lg:w-5/12'}`}>
             <div className="min-w-[300px] lg:w-[480px]">
                <div className="space-y-4 lg:space-y-6">
                  <h1 className="text-4xl lg:text-5xl font-bold tracking-tight leading-tight text-stone-900 dark:text-white">Where Words <br/> <span className="text-stone-400 dark:text-zinc-600">Come to Life</span></h1>
                  <p className="text-lg text-stone-500 dark:text-stone-400 leading-relaxed max-w-md mx-auto lg:mx-0">Create stunning 3D text animations using generative AI. Turn simple phrases into cinematic masterpieces.</p>
               </div>
               <div className="pt-8 flex flex-col items-center lg:items-start">
                  <button onClick={() => setViewMode('create')} className="group px-8 py-4 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-lg font-bold rounded-xl hover:opacity-90 transition-all shadow-xl flex items-center gap-3">
                    <VideoIcon size={20} className="group-hover:text-yellow-200 dark:group-hover:text-amber-500 transition-colors" /> Make your own
                  </button>
               </div>
             </div>
          </div>
          <div className={`relative z-20 [perspective:2000px] transition-all duration-1000 ${isFlip ? 'w-full h-[80vh] md:h-[85vh]' : 'w-full lg:w-7/12 h-[500px] lg:h-[600px]'}`}>
             <div className={`relative w-full h-full transition-all duration-1000 [transform-style:preserve-3d] shadow-2xl rounded-3xl ${isFlip ? '[transform:rotateY(180deg)]' : ''}`}>
                <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] bg-black rounded-3xl overflow-hidden border border-stone-800 dark:border-zinc-800"><HeroCarousel forceMute={isFlip} /></div>
                <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] bg-white dark:bg-zinc-950 rounded-3xl overflow-hidden border border-stone-100 dark:border-zinc-800">
                   <button onClick={() => setViewMode('gallery')} className="absolute top-4 right-4 z-50 p-2 bg-stone-100 dark:bg-zinc-800 text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white rounded-full transition-colors"><X size={20} /></button>
                   {renderAppContent()}
                </div>
             </div>
          </div>
        </div>
      </div>
      <footer className="w-full py-6 text-center text-[10px] font-bold uppercase tracking-widest text-stone-400 dark:text-zinc-700 z-10">Created by Dhaval Trivedi</footer>
    </div>
  );
};

export default App;
