import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import { ArrowLeft, Upload, X, CheckCircle2, Play, Image as ImageIcon, Loader2 } from 'lucide-react';

const AdminUploadMediaPage = () => {
  const { event_id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_BASE_URL}/api/v1/events/${event_id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setEvent(response.data);
      } catch (err) {
        console.error('Error fetching event:', err);
      }
    };
    fetchEvent();
  }, [event_id]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(prev => [...prev, ...files]);
    
    const newPreviews = files.map(file => ({
      url: URL.createObjectURL(file),
      type: file.type.startsWith('video/') ? 'video' : 'image',
      name: file.name
    }));
    setPreviews(prev => [...prev, ...newPreviews]);
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    setUploading(true);
    setProgress(10);

    const data = new FormData();
    selectedFiles.forEach(file => {
      data.append('files', file);
    });

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE_URL}/api/v1/admin/events/${event_id}/media`, data, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setProgress(percentCompleted);
        }
      });
      setSuccess(true);
      setTimeout(() => navigate('/admin/gallery'), 2000);
    } catch (err) {
      console.error('Error uploading media:', err);
      alert('Failed to upload media. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  if (!event) return <div className="flex items-center justify-center p-20"><Loader2 className="animate-spin text-schoolGreen" size={48} /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <button 
        onClick={() => navigate('/admin/gallery')}
        className="flex items-center gap-2 text-gray-500 hover:text-schoolGreen font-medium transition"
      >
        <ArrowLeft size={20} />
        Back to Gallery Management
      </button>

      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="bg-schoolGreen p-8 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Upload Media</h1>
            <p className="opacity-90 mt-1">Event: <span className="font-bold underline">{event.name}</span></p>
          </div>
          <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-lg text-sm font-medium">
            {selectedFiles.length} files selected
          </div>
        </div>

        <div className="p-8">
          {success ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 size={40} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Upload Complete!</h2>
              <p className="text-gray-500">All media items have been successfully added to the gallery.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Dropzone/Upload Button */}
              <div className="relative border-4 border-dashed border-gray-100 rounded-3xl p-12 text-center hover:border-schoolGreen/30 hover:bg-gray-50 transition-all group">
                <input 
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                />
                <div className="space-y-4">
                  <div className="w-20 h-20 bg-lightGreen text-schoolGreen rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                    <Upload size={32} />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-gray-900">Click or drag images & videos here</p>
                    <p className="text-gray-500 mt-1">Upload multiple files for the {event.name} gallery</p>
                  </div>
                  <button className="px-6 py-2 bg-schoolGreen text-white rounded-lg font-bold shadow-sm">
                    Select Files
                  </button>
                </div>
              </div>

              {/* Previews */}
              {previews.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    Media Previews <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-md text-xs">{previews.length}</span>
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {previews.map((preview, index) => (
                      <div key={index} className="relative group aspect-square bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
                        {preview.type === 'video' ? (
                          <div className="w-full h-full flex items-center justify-center bg-gray-900">
                            <Play className="text-white opacity-50" size={32} />
                          </div>
                        ) : (
                          <img src={preview.url} alt="Preview" className="w-full h-full object-cover" />
                        )}
                        <button 
                          onClick={() => removeFile(index)}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition shadow-md hover:bg-red-600"
                        >
                          <X size={14} />
                        </button>
                        <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-1 text-[10px] text-white truncate px-2">
                          {preview.name}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-6 border-t border-gray-100 flex flex-col gap-4">
                {uploading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm font-bold">
                      <span className="text-schoolGreen">Uploading files...</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-schoolGreen transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}
                
                <div className="flex gap-4">
                  <button 
                    onClick={() => navigate('/admin/gallery')}
                    className="flex-1 px-8 py-4 border border-gray-200 text-gray-500 font-bold rounded-xl hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleUpload}
                    disabled={uploading || selectedFiles.length === 0}
                    className="flex-[2] px-8 py-4 bg-schoolGreen text-white font-bold rounded-xl hover:bg-green-700 transition shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        Uploading {selectedFiles.length} Items...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={20} />
                        Start Upload
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminUploadMediaPage;
