import React, { useState, useEffect } from 'react';
import api from '@/config/api';
import GalleryCard from '../components/gallery/GalleryCard';
import Loading from '../components/common/Loading';
import { Image as ImageIcon } from 'lucide-react';

const GalleryPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await api.get('/api/v1/events');
        setEvents(response.data);
      } catch (err) {
        console.error('Error fetching gallery events:', err);
        setError('Failed to load gallery events. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  if (loading) return <Loading />;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">School Gallery</h1>
          <p className="text-gray-600">Capturing precious moments at Green Park School</p>
        </div>
        <div className="flex items-center gap-2 text-primaryGreen font-semibold bg-lightGreen px-4 py-2 rounded-lg">
          <ImageIcon size={20} />
          <span>{events.length} Events</span>
        </div>
      </div>

      {error ? (
        <div className="bg-red-50 text-red-600 p-6 rounded-xl border border-red-100 text-center">
          {error}
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white rounded-xl p-16 text-center shadow-sm border border-gray-100">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <ImageIcon size={40} className="text-gray-300" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Gallery Events Yet</h3>
          <p className="text-gray-500">Check back later for photos and videos of school activities.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <GalleryCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
};

export default GalleryPage;
