import { useEffect } from 'react'
import { useData } from '../context/DataContext'
import Card from '../components/common/Card'
import { Calendar, MapPin, Zap } from 'lucide-react'
import Loading from '../components/common/Loading'

export default function EventsPage() {
  const { data, loading, fetchEvents } = useData()

  useEffect(() => {
    fetchEvents()
  }, [])

  if (loading && data.events.length === 0) return <Loading />

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-schoolGreen mb-2">School Activities & events</h1>
        <p className="text-gray-600">Stay updated with the latest happenings at Green Park School</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {data.events.length === 0 ? (
          <div className="col-span-full py-20 text-center text-gray-500 flex flex-col items-center gap-4">
            <Zap size={48} className="text-gray-300" />
            <p>No upcoming events at the moment. Check back later!</p>
          </div>
        ) : (
          data.events.map((event) => (
            <Card key={event.id} highlight className="p-0 overflow-hidden group flex flex-col h-full hover:shadow-xl transition-all duration-300">
              <div className="h-56 overflow-hidden relative">
                {event.image_url ? (
                  <img 
                    src={event.image_url} 
                    alt={event.title} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-schoolGreen/10 to-schoolYellow/20 flex items-center justify-center text-schoolGreen italic font-bold">
                    Green Park Events
                  </div>
                )}
                <div className="absolute bottom-4 left-4">
                  <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-schoolGreen font-bold text-xs rounded-full shadow-sm">
                    {new Date(event.event_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>
              
              <div className="p-6 flex-1 flex flex-col">
                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-schoolGreen transition">
                  {event.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-6 flex-1">
                  {event.description}
                </p>
                
                <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400 font-medium font-bold uppercase tracking-wider">
                  <div className="flex items-center gap-1">
                    <Calendar size={14} className="text-schoolYellow" />
                    <span>{new Date(event.event_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin size={14} className="text-schoolGreen" />
                    <span>Campus</span>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
