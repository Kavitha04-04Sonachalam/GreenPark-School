import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import { ArrowLeft, Upload, Calendar, Type, AlignLeft, CheckCircle2 } from 'lucide-react';

const AdminCreateEventPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [thumbnail, setThumbnail] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setThumbnail(file);
      setThumbnailPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const data = new FormData();
    data.append('name', formData.name);
    data.append('description', formData.description);
    data.append('date', formData.date);
    if (thumbnail) {
      data.append('thumbnail', thumbnail);
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE_URL}/api/v1/admin/events`, data, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      setSuccess(true);
      setTimeout(() => navigate('/admin/gallery'), 1500);
    } catch (err) {
      console.error('Error creating event:', err);
      alert('Failed to create event. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <button 
        onClick={() => navigate('/admin/gallery')}
        className="flex items-center gap-2 text-gray-500 hover:text-schoolGreen font-medium transition"
      >
        <ArrowLeft size={20} />
        Back to Gallery Management
      </button>

      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="bg-schoolGreen p-8 text-white">
          <h1 className="text-3xl font-bold">Create New Event</h1>
          <p className="opacity-90 mt-1">Set up a new gallery for school activities or celebrations.</p>
        </div>

        {success ? (
          <div className="p-12 text-center space-y-4">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 size={40} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Event Created!</h2>
            <p className="text-gray-500">Redirecting you to the gallery list...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="space-y-4">
              <label className="block">
                <span className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                  <Type size={16} className="text-accentYellow" /> Event Name
                </span>
                <input 
                  type="text"
                  required
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-schoolGreen/20 focus:border-schoolGreen outline-none transition font-medium"
                  placeholder="e.g. Annual Sports Day 2024"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </label>

              <label className="block">
                <span className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                  <AlignLeft size={16} className="text-accentYellow" /> Description
                </span>
                <textarea 
                  rows="4"
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-schoolGreen/20 focus:border-schoolGreen outline-none transition font-medium"
                  placeholder="Tell us more about this event..."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <label className="block">
                  <span className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                    <Calendar size={16} className="text-accentYellow" /> Event Date
                  </span>
                  <input 
                    type="date"
                    required
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-schoolGreen/20 focus:border-schoolGreen outline-none transition font-medium"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                  />
                </label>

                <div className="block">
                  <span className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                    <Upload size={16} className="text-accentYellow" /> Event Thumbnail
                  </span>
                  <div className="relative group">
                    <input 
                      type="file"
                      accept="image/*"
                      onChange={handleThumbnailChange}
                      className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    />
                    <div className="w-full h-14 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center gap-2 text-gray-400 group-hover:border-schoolGreen group-hover:text-schoolGreen transition font-medium">
                      {thumbnail ? thumbnail.name : 'Choose an image...'}
                    </div>
                  </div>
                  {thumbnailPreview && (
                    <div className="mt-4 h-32 w-full rounded-xl overflow-hidden border border-gray-100 shadow-inner">
                      <img src={thumbnailPreview} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100 flex gap-4">
              <button 
                type="button"
                onClick={() => navigate('/admin/gallery')}
                className="flex-1 px-8 py-4 border border-gray-200 text-gray-500 font-bold rounded-xl hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={loading}
                className="flex-[2] px-8 py-4 bg-schoolGreen text-white font-bold rounded-xl hover:bg-green-700 transition shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? 'Creating...' : 'Create Event Gallery'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AdminCreateEventPage;
