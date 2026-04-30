import React, { useState } from 'react';
import { Play } from 'lucide-react';
import MediaViewer from './MediaViewer';

const MediaGrid = ({ mediaItems }) => {
  const [selectedIndex, setSelectedIndex] = useState(null);

  const openViewer = (index) => setSelectedIndex(index);
  const closeViewer = () => setSelectedIndex(null);
  
  const showNext = () => {
    setSelectedIndex((prev) => (prev + 1) % mediaItems.length);
  };
  
  const showPrev = () => {
    setSelectedIndex((prev) => (prev - 1 + mediaItems.length) % mediaItems.length);
  };

  const getYoutubeVideoId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {mediaItems.map((item, index) => (
          <div 
            key={item.id} 
            onClick={() => openViewer(index)}
            className="group relative aspect-square bg-gray-100 rounded-xl overflow-hidden cursor-pointer hover:ring-4 hover:ring-primaryGreen/20 transition-all duration-300"
          >
            {item.media_type === 'video' ? (
              <div className="w-full h-full relative">
                <video src={item.media_url} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                  <div className="w-12 h-12 bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center text-white">
                    <Play fill="white" size={20} />
                  </div>
                </div>
              </div>
            ) : item.media_type === 'youtube' || item.media_url.includes('youtube') || item.media_url.includes('youtu.be') ? (
              <div className="w-full h-full relative">
                <img 
                  src={`https://img.youtube.com/vi/${getYoutubeVideoId(item.media_url)}/0.jpg`} 
                  alt="YouTube Video" 
                  className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                  <div className="w-12 h-12 bg-red-600/90 backdrop-blur-md rounded-full flex items-center justify-center text-white shadow-lg">
                    <Play fill="white" size={20} />
                  </div>
                </div>
              </div>
            ) : (
              <img 
                src={item.media_url} 
                alt="Gallery item" 
                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        ))}
      </div>

      <MediaViewer 
        isOpen={selectedIndex !== null}
        media={mediaItems[selectedIndex]}
        onClose={closeViewer}
        onNext={showNext}
        onPrev={showPrev}
      />
    </>
  );
};

export default MediaGrid;
