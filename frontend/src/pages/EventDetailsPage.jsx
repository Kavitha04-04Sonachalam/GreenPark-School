import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import MediaGrid from '../components/gallery/MediaGrid';
import Loading from '../components/common/Loading';
import { ArrowLeft, Calendar, Info } from 'lucide-react';

const EventDetailsPage = () => {
  const { event_id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/v1/events/${event_id}`);
        setEvent(response.data);
      } catch (err) {
        console.error('Error fetching event details:', err);
        setError('Failed to load event details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchEventDetails();
  }, [event_id]);

  if (loading) return <Loading />;
  if (error) return (
    <div className="p-8 text-center bg-red-50 text-red-600 rounded-xl border border-red-100">
      <p>{error}</p>
      <button 
        onClick={() => navigate('/gallery')}
        className="mt-4 px-6 py-2 bg-white rounded-lg shadow-sm font-medium hover:bg-gray-50 transition"
      >
        Back to Gallery
      </button>
    </div>
  );

  const date = new Date(event.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <button 
        onClick={() => navigate('/gallery')}
        className="flex items-center gap-2 text-gray-500 hover:text-primaryGreen font-medium transition"
      >
        <ArrowLeft size={20} />
        Back to Gallery
      </button>

      <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-1/3 h-64 md:h-auto rounded-xl overflow-hidden shadow-inner">
            <img 
              src={event.thumbnail_url || 'https://via.placeholder.com/600x400?text=Green+Park+School'} 
              alt={event.name} 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-2 text-primaryGreen bg-lightGreen w-fit px-3 py-1 rounded-full text-sm font-bold">
              <Calendar size={16} />
              {date}
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">{event.name}</h1>
            <p className="text-gray-600 leading-relaxed text-lg italic">
              {event.description || 'No description provided for this event.'}
            </p>
            <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-xl text-gray-500 text-sm">
              <Info size={18} className="text-accentYellow" />
              <span>Click on any image or video below to view it in full screen.</span>
            </div>
          </div>
        </div>
      </div>

      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Event Media</h2>
          <span className="text-gray-500 font-medium">{event.media.length} items</span>
        </div>
        
        {event.media.length === 0 ? (
          <div className="bg-gray-50 rounded-xl p-12 text-center border-2 border-dashed border-gray-200">
            <p className="text-gray-400 font-medium">No media uploaded for this event yet.</p>
          </div>
        ) : (
          <MediaGrid mediaItems={event.media} />
        )}
      </section>
    </div>
  );
};

export default EventDetailsPage;
