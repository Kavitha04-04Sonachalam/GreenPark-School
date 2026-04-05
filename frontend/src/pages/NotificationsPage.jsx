import { useEffect } from 'react'
import { useSelectedChild } from '../context/SelectedChildContext'
import { useData } from '../context/DataContext'
import Card from '../components/common/Card'
import { LoadingSpinner } from '../components/common/Loading'
import { Bell, Calendar, Users, Layers } from 'lucide-react'

export default function NotificationsPage() {
  const { selectedChild } = useSelectedChild()
  const { data, loading, fetchNotifications } = useData()

  useEffect(() => {
    if (selectedChild) {
      fetchNotifications(selectedChild.class)
    }
  }, [selectedChild])

  if (loading && data.notifications.length === 0) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-schoolGreen">Notifications</h1>
          <p className="text-gray-600">Important updates for you and your child</p>
        </div>
        <div className="bg-schoolYellow/20 px-4 py-2 rounded-lg border border-schoolYellow/30">
          <p className="text-sm font-bold text-schoolGreen">
            Targeting: {selectedChild ? `Class ${selectedChild.class}` : 'General'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {data.notifications.length === 0 ? (
          <Card className="text-center py-20 text-gray-400">
            <Bell className="mx-auto mb-4 opacity-20" size={48} />
            <p className="text-lg font-medium">No notifications available at this time.</p>
          </Card>
        ) : (
          data.notifications.map(notif => (
            <Card key={notif.id} highlight className="group hover:shadow-lg transition">
              <div className="flex items-start gap-5">
                <div className={`p-3 rounded-2xl shrink-0 ${notif.target_type === 'all' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                  {notif.target_type === 'all' ? <Users size={28} /> : <Layers size={28} />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tight ${notif.target_type === 'all' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                      {notif.target_type === 'all' ? 'School-wide Notice' : `Class ${notif.class_name} Update`}
                    </span>
                    <span className="text-sm text-gray-400 flex items-center gap-1.5 font-medium">
                      <Calendar size={14} className="opacity-60" /> 
                      {new Date(notif.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-900 text-xl mb-2 group-hover:text-schoolGreen transition">{notif.title}</h3>
                  <p className="text-gray-600 leading-relaxed text-base">{notif.message}</p>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
