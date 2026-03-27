import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import { Trash2, Edit2, Plus } from 'lucide-react'

export default function AdminUsers() {
  const users = [
    { id: 1, name: 'Rajesh Kumar', email: 'rajesh@example.com', children: 2, status: 'Active' },
    { id: 2, name: 'Priya Singh', email: 'priya@example.com', children: 1, status: 'Active' },
    { id: 3, name: 'Amit Patel', email: 'amit@example.com', children: 2, status: 'Inactive' }
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-schoolGreen mb-2">User Management</h1>
          <p className="text-gray-600">Manage parents and student accounts</p>
        </div>
        <Button variant="primary" className="flex items-center gap-2">
          <Plus size={20} />
          Add Parent
        </Button>
      </div>

      {/* Users Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-300">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">Children</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">Status</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{user.name}</td>
                  <td className="py-3 px-4">{user.email}</td>
                  <td className="py-3 px-4 text-center">{user.children}</td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        user.status === 'Active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center flex items-center justify-center gap-2">
                    <button className="p-2 hover:bg-gray-200 rounded">
                      <Edit2 size={16} className="text-schoolGreen" />
                    </button>
                    <button className="p-2 hover:bg-gray-200 rounded">
                      <Trash2 size={16} className="text-red-500" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
