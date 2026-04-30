import React from 'react';
import { Calendar, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const GalleryCard = ({ event, isAdmin = false, onDelete, onEdit }) => {
  const navigate = useNavigate();
  const date = new Date(event.date).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-300">
      <div className="relative h-48 overflow-hidden">
        {event.thumbnail_url ? (
          <img 
            src={event.thumbnail_url} 
            alt={event.name} 
            className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-lightGreen flex items-center justify-center text-primaryGreen font-semibold">
            {event.name}
          </div>
        )}
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-primaryGreen flex items-center gap-1">
          <Calendar size={12} />
          {date}
        </div>
      </div>
      
      <div className="p-5">
        <h3 className="text-lg font-bold text-gray-900 mb-2 truncate">{event.name}</h3>
        <p className="text-gray-600 text-sm line-clamp-2 mb-4 h-10">
          {event.description || 'No description provided.'}
        </p>
        
        <div className="flex items-center justify-between mt-auto">
          {isAdmin ? (
            <div className="flex gap-2 w-full">
              <button 
                onClick={() => navigate(`/admin/gallery/${event.id}`)}
                className="flex-1 px-3 py-2 bg-lightGreen text-primaryGreen rounded-lg text-sm font-medium hover:bg-green-100 transition"
              >
                View
              </button>
              <button 
                onClick={() => navigate(`/admin/gallery/${event.id}/upload`)}
                className="flex-1 px-3 py-2 bg-primaryGreen text-white rounded-lg text-sm font-medium hover:bg-green-700 transition"
              >
                Upload
              </button>
              <button 
                onClick={() => onDelete(event.id)}
                className="px-3 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition"
              >
                Delete
              </button>
            </div>
          ) : (
            <button 
              onClick={() => navigate(`/gallery/${event.id}`)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-lightGreen text-primaryGreen rounded-lg text-sm font-bold hover:bg-green-100 transition"
            >
              View Gallery <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default GalleryCard;
