import React, { useState, useEffect } from 'react';
import api from '@/config/api';
import GalleryCard from '../../components/gallery/GalleryCard';
import Loading from '../../components/common/Loading';
import { Plus, RefreshCw, Image as ImageIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminGalleryPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/v1/events');
      setEvents(response.data);
    } catch (err) {
      console.error('Error fetching admin gallery events:', err);
      setError('Failed to load gallery events.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleDeleteEvent = async (id) => {
    if (!window.confirm('Are you sure you want to delete this event and all its media?')) return;
    
    try {
      await api.delete(`/api/v1/admin/events/${id}`);
      setEvents(events.filter(e => e.id !== id));
    } catch (err) {
      alert('Failed to delete event');
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-schoolGreen mb-2">Gallery Management</h1>
          <p className="text-gray-600">Create events and manage school media gallery</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={fetchEvents}
            className="p-3 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition text-gray-500 shadow-sm"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
          <button 
            onClick={() => navigate('/admin/gallery/create')}
            className="px-6 py-3 bg-schoolGreen text-white rounded-xl font-bold hover:bg-green-700 transition shadow-sm flex items-center gap-2"
          >
            <Plus size={20} />
            Create Event
          </button>
        </div>
      </div>

      {error ? (
        <div className="bg-red-50 text-red-600 p-6 rounded-xl border border-red-100 text-center">
          {error}
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white rounded-xl p-16 text-center shadow-xl border border-gray-100">
          <div className="w-20 h-20 bg-lightGreen rounded-full flex items-center justify-center mx-auto mb-4">
            <ImageIcon size={40} className="text-primaryGreen" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Events Created</h3>
          <p className="text-gray-500 mb-8">Start by creating your first school event gallery.</p>
          <button 
            onClick={() => navigate('/admin/gallery/create')}
            className="px-8 py-3 bg-schoolGreen text-white rounded-xl font-bold hover:bg-green-700 transition shadow-lg"
          >
            Create New Event
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {events.map((event) => (
            <GalleryCard 
              key={event.id} 
              event={event} 
              isAdmin={true} 
              onDelete={handleDeleteEvent}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminGalleryPage;
