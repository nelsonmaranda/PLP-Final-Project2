import { useState, useEffect } from 'react'
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search, 
  Building2,
  Gavel,
  Shield,
  Crown,
  RefreshCw,
  UserCheck,
  UserX,
  Plus,
  Pencil
} from 'lucide-react'
import apiService from '../services/api'
import { useTranslation } from '../hooks/useTranslation'

interface User {
  _id: string
  email: string
  displayName: string
  role: string
  requestedRole?: string
  status: 'active' | 'pending' | 'suspended' | 'rejected'
  organization?: string
  createdAt: string
  approvedBy?: string
  approvedAt?: string
  rejectionReason?: string
}

export default function UserManagement() {
  const { t } = useTranslation()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [roleFilter, setRoleFilter] = useState('all')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState({ displayName: '', email: '', password: '', role: 'user', organization: '' })
  const [editUserId, setEditUserId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ displayName: '', email: '', role: 'user', status: 'active', organization: '' })

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      // Use real API call
      const response = await fetch('https://us-central1-smart-matwana-ke.cloudfunctions.net/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error(t('userManagement.messages.fetchError'))
      }
      
      const data = await response.json()
      if (data.success) {
        setUsers(data.data)
      } else {
        throw new Error(data.message || t('userManagement.messages.loadError'))
      }
    } catch (error) {
      console.error('Error loading users:', error)
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (userId: string) => {
    try {
      setActionLoading(userId)
      
      const response = await fetch(`https://us-central1-smart-matwana-ke.cloudfunctions.net/api/admin/users/${userId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error(t('userManagement.messages.approveError'))
      }
      
      const data = await response.json()
      if (data.success) {
        // Update the user in the local state
        setUsers(prev => prev.map(user => 
          user._id === userId 
            ? { 
                ...user, 
                role: user.requestedRole || user.role,
                status: 'active' as const,
                requestedRole: undefined,
                approvedAt: new Date().toISOString()
              }
            : user
        ))
      } else {
        throw new Error(data.message || t('userManagement.messages.approveError'))
      }
    } catch (error) {
      console.error('Error approving user:', error)
      alert(t('userManagement.messages.approveError'))
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (userId: string, reason: string) => {
    try {
      setActionLoading(userId)
      
      const response = await fetch(`https://us-central1-smart-matwana-ke.cloudfunctions.net/api/admin/users/${userId}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      })
      
      if (!response.ok) {
        throw new Error(t('userManagement.messages.rejectError'))
      }
      
      const data = await response.json()
      if (data.success) {
        // Update the user in the local state
        setUsers(prev => prev.map(user => 
          user._id === userId 
            ? { 
                ...user, 
                status: 'rejected' as const,
                rejectionReason: reason,
                requestedRole: undefined
              }
            : user
        ))
      } else {
        throw new Error(data.message || t('userManagement.messages.rejectError'))
      }
    } catch (error) {
      console.error('Error rejecting user:', error)
      alert(t('userManagement.messages.rejectError'))
    } finally {
      setActionLoading(null)
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="w-4 h-4" />
      case 'sacco': return <Building2 className="w-4 h-4" />
      case 'authority': return <Gavel className="w-4 h-4" />
      case 'moderator': return <Shield className="w-4 h-4" />
      default: return <Users className="w-4 h-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100'
      case 'pending': return 'text-yellow-600 bg-yellow-100'
      case 'suspended': return 'text-red-600 bg-red-100'
      case 'rejected': return 'text-gray-600 bg-gray-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />
      case 'pending': return <Clock className="w-4 h-4" />
      case 'suspended': return <XCircle className="w-4 h-4" />
      case 'rejected': return <XCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const translateStatus = (status: string) => {
    switch (status) {
      case 'active': return t('userManagement.status.active')
      case 'pending': return t('userManagement.status.pending')
      case 'suspended': return t('userManagement.status.suspended')
      case 'rejected': return t('userManagement.status.rejected')
      default: return status
    }
  }

  const translateRole = (role: string) => {
    switch (role) {
      case 'admin': return t('userManagement.roles.admin')
      case 'moderator': return t('userManagement.roles.moderator')
      case 'sacco': return t('userManagement.roles.sacco')
      case 'authority': return t('userManagement.roles.authority')
      case 'user': return t('userManagement.roles.user')
      default: return role
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.organization?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter
    const matchesRole = roleFilter === 'all' || user.role === roleFilter || user.requestedRole === roleFilter
    return matchesSearch && matchesStatus && matchesRole
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">{t('userManagement.loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{t('userManagement.title')}</h1>
              <p className="text-gray-600 mt-1">{t('userManagement.subtitle')}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
              onClick={loadUsers}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <RefreshCw className="w-4 h-4" />
              <span>{t('userManagement.refresh')}</span>
            </button>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              <Plus className="w-4 h-4" />
              <span>{t('userManagement.addUser')}</span>
            </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('userManagement.search')}</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t('userManagement.searchPlaceholder')}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('userManagement.status')}</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">{t('userManagement.filters.allStatus')}</option>
                <option value="active">{t('userManagement.status.active')}</option>
                <option value="pending">{t('userManagement.status.pending')}</option>
                <option value="suspended">{t('userManagement.status.suspended')}</option>
                <option value="rejected">{t('userManagement.status.rejected')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('userManagement.role')}</label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">{t('userManagement.filters.allRoles')}</option>
                <option value="user">{t('userManagement.roles.user')}</option>
                <option value="sacco">{t('userManagement.roles.sacco')}</option>
                <option value="authority">{t('userManagement.roles.authority')}</option>
                <option value="moderator">{t('userManagement.roles.moderator')}</option>
                <option value="admin">{t('userManagement.roles.admin')}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('userManagement.table.displayName')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('userManagement.table.role')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('userManagement.requestedRole')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('userManagement.table.status')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('userManagement.organization')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('userManagement.created')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('userManagement.table.actions')}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.displayName}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getRoleIcon(user.role)}
                        <span className="ml-2 text-sm text-gray-900">{translateRole(user.role)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.requestedRole ? (
                        <div className="flex items-center">
                          {getRoleIcon(user.requestedRole)}
                          <span className="ml-2 text-sm text-gray-900">{translateRole(user.requestedRole)}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                        {getStatusIcon(user.status)}
                        <span className="ml-1">{translateStatus(user.status)}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.organization || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {user.status === 'pending' && user.requestedRole && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleApprove(user._id)}
                            disabled={actionLoading === user._id}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                          >
                            {actionLoading === user._id ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <UserCheck className="w-3 h-3" />
                            )}
                            <span className="ml-1">{t('userManagement.actions.approve')}</span>
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt(t('userManagement.rejectionReason'))
                              if (reason) handleReject(user._id, reason)
                            }}
                            disabled={actionLoading === user._id}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                          >
                            <UserX className="w-3 h-3" />
                            <span className="ml-1">{t('userManagement.actions.reject')}</span>
                          </button>
                        </div>
                      )}
                      <button
                        onClick={() => {
                          setEditUserId(user._id)
                          setEditForm({ displayName: user.displayName, email: user.email, role: user.role, status: user.status, organization: user.organization || '' })
                        }}
                        className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 ml-2"
                      >
                        <Pencil className="w-3 h-3 mr-1" /> {t('userManagement.actions.edit')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">{t('userManagement.noUsers')}</h3>
            <p className="text-gray-500">{t('userManagement.noUsersMessage')}</p>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">{t('userManagement.modals.addUser.title')}</h3>
            <div className="space-y-3">
              <input className="form-input w-full" placeholder={t('userManagement.modals.addUser.fullName')} value={createForm.displayName} onChange={(e)=>setCreateForm({...createForm, displayName: e.target.value})} />
              <input className="form-input w-full" placeholder={t('userManagement.modals.addUser.email')} value={createForm.email} onChange={(e)=>setCreateForm({...createForm, email: e.target.value})} />
              <input className="form-input w-full" placeholder={t('userManagement.modals.addUser.password')} type="password" value={createForm.password} onChange={(e)=>setCreateForm({...createForm, password: e.target.value})} />
              <select className="form-select w-full" value={createForm.role} onChange={(e)=>setCreateForm({...createForm, role: e.target.value})}>
                <option value="user">{t('userManagement.roles.user')}</option>
                <option value="sacco">{t('userManagement.roles.sacco')}</option>
                <option value="authority">{t('userManagement.roles.authority')}</option>
                <option value="moderator">{t('userManagement.roles.moderator')}</option>
                <option value="admin">{t('userManagement.roles.admin')}</option>
              </select>
              <input className="form-input w-full" placeholder={t('userManagement.modals.addUser.organization')} value={createForm.organization} onChange={(e)=>setCreateForm({...createForm, organization: e.target.value})} />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button className="btn btn-outline" onClick={()=>setShowCreate(false)}>{t('userManagement.modals.addUser.cancel')}</button>
              <button className="btn btn-primary" onClick={async ()=>{
                try {
                  const resp = await apiService.adminCreateUser(createForm as any)
                  if (resp.success) { setShowCreate(false); setCreateForm({ displayName:'', email:'', password:'', role:'user', organization:'' }); loadUsers() }
                } catch (e) { alert(t('userManagement.messages.createError')) }
              }}>{t('userManagement.modals.addUser.create')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editUserId && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">{t('userManagement.modals.editUser.title')}</h3>
            <div className="space-y-3">
              <input className="form-input w-full" placeholder={t('userManagement.modals.editUser.fullName')} value={editForm.displayName} onChange={(e)=>setEditForm({...editForm, displayName: e.target.value})} />
              <input className="form-input w-full" placeholder={t('userManagement.modals.editUser.email')} value={editForm.email} onChange={(e)=>setEditForm({...editForm, email: e.target.value})} />
              <select className="form-select w-full" value={editForm.role} onChange={(e)=>setEditForm({...editForm, role: e.target.value})}>
                <option value="user">{t('userManagement.roles.user')}</option>
                <option value="sacco">{t('userManagement.roles.sacco')}</option>
                <option value="authority">{t('userManagement.roles.authority')}</option>
                <option value="moderator">{t('userManagement.roles.moderator')}</option>
                <option value="admin">{t('userManagement.roles.admin')}</option>
              </select>
              <select className="form-select w-full" value={editForm.status} onChange={(e)=>setEditForm({...editForm, status: e.target.value})}>
                <option value="active">{t('userManagement.status.active')}</option>
                <option value="pending">{t('userManagement.status.pending')}</option>
                <option value="suspended">{t('userManagement.status.suspended')}</option>
                <option value="rejected">{t('userManagement.status.rejected')}</option>
              </select>
              <input className="form-input w-full" placeholder={t('userManagement.modals.editUser.organization')} value={editForm.organization} onChange={(e)=>setEditForm({...editForm, organization: e.target.value})} />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button className="btn btn-outline" onClick={()=>setEditUserId(null)}>{t('userManagement.modals.editUser.cancel')}</button>
              <button className="btn btn-primary" onClick={async ()=>{
                try {
                  const resp = await apiService.adminUpdateUser(editUserId!, editForm as any)
                  if (resp.success) { setEditUserId(null); loadUsers() }
                } catch (e) { alert(t('userManagement.messages.updateError')) }
              }}>{t('userManagement.modals.editUser.save')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
