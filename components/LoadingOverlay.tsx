import React from 'react';
import { SparklesIcon } from './Icons';

interface LoadingOverlayProps {
  message?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ message = "Dreaming up your perfect trip..." }) => {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4">
      <div className="relative">
        <div className="absolute inset-0 bg-rose-200 rounded-full animate-ping opacity-75"></div>
        <div className="relative bg-white p-4 rounded-full shadow-xl border border-rose-100">
          <SparklesIcon className="w-8 h-8 text-rose-500 animate-pulse" />
        </div>
      </div>
      <h3 className="mt-6 text-xl font-serif font-medium text-slate-800 text-center animate-pulse">
        {message}
      </h3>
      <p className="mt-2 text-slate-500 text-sm">Powered by Gemini AI</p>
    </div>
  );
};

export default LoadingOverlay;