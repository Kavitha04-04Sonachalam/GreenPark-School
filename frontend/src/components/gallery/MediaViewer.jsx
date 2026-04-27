import React from 'react';
import { X, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';

const MediaViewer = ({ isOpen, media, onClose, onNext, onPrev }) => {
  if (!isOpen || !media) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm animate-in fade-in duration-300">
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 p-2 text-white hover:bg-white/10 rounded-full transition z-[60]"
      >
        <X size={32} />
      </button>

      <div className="relative w-full h-full flex items-center justify-center p-4 md:p-12">
        {/* Navigation */}
        <button 
          onClick={onPrev}
          className="absolute left-4 md:left-10 p-3 text-white hover:bg-white/10 rounded-full transition z-[60]"
        >
          <ChevronLeft size={48} />
        </button>
        
        <button 
          onClick={onNext}
          className="absolute right-4 md:right-10 p-3 text-white hover:bg-white/10 rounded-full transition z-[60]"
        >
          <ChevronRight size={48} />
        </button>

        {/* Media Content */}
        <div className="max-w-5xl max-h-full flex items-center justify-center animate-in zoom-in-95 duration-300">
          {media.media_type === 'video' ? (
            <video 
              src={media.media_url} 
              controls 
              autoPlay 
              className="max-w-full max-h-[80vh] rounded-lg shadow-2xl"
            />
          ) : (
            <img 
              src={media.media_url} 
              alt="Gallery item" 
              className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
            />
          )}
        </div>

        {/* Caption/Info */}
        <div className="absolute bottom-10 left-0 right-0 text-center">
          <p className="text-white/70 text-sm font-medium">
            Media Item - {new Date(media.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default MediaViewer;
