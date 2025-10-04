import { Building2, Gavel, User } from 'lucide-react'

interface RoleSelectorProps {
  selectedRole: string
  onRoleChange: (role: string) => void
  language: 'en' | 'sw'
}

export default function RoleSelector({ selectedRole, onRoleChange, language }: RoleSelectorProps) {
  const roles = [
    {
      id: 'user',
      name: language === 'sw' ? 'Mtumiaji wa Kawaida' : 'Regular User',
      description: language === 'sw' 
        ? 'Pata taarifa za matatu na uwasilie ripoti' 
        : 'Get matatu information and submit reports',
      icon: User,
      color: 'bg-gray-100 text-gray-800 border-gray-300',
      selectedColor: 'bg-gray-200 text-gray-900 border-gray-400'
    },
    {
      id: 'sacco',
      name: language === 'sw' ? 'Meneja wa SACCO' : 'SACCO Manager',
      description: language === 'sw' 
        ? 'Dhibiti gari na madereva wa SACCO yako' 
        : 'Manage your SACCO vehicles and drivers',
      icon: Building2,
      color: 'bg-blue-100 text-blue-800 border-blue-300',
      selectedColor: 'bg-blue-200 text-blue-900 border-blue-400'
    },
    {
      id: 'authority',
      name: language === 'sw' ? 'Mamlaka ya Usafiri' : 'Transport Authority',
      description: language === 'sw' 
        ? 'Fuatilia uzingo na usalama wa usafiri' 
        : 'Monitor compliance and transport safety',
      icon: Gavel,
      color: 'bg-red-100 text-red-800 border-red-300',
      selectedColor: 'bg-red-200 text-red-900 border-red-400'
    }
  ]

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {language === 'sw' ? 'Chagua Aina ya Mtumiaji' : 'Select User Type'}
        </label>
        <p className="text-sm text-gray-500 mb-4">
          {language === 'sw' 
            ? 'Chagua aina ya mtumiaji kulingana na jukumu lako' 
            : 'Choose user type based on your role'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {roles.map((role) => {
          const Icon = role.icon
          const isSelected = selectedRole === role.id
          
          return (
            <button
              key={role.id}
              type="button"
              onClick={() => onRoleChange(role.id)}
              className={`p-4 rounded-lg border-2 text-left transition-all duration-200 hover:shadow-md ${
                isSelected 
                  ? `${role.selectedColor} shadow-md` 
                  : `${role.color} hover:shadow-sm`
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-lg ${
                  isSelected ? 'bg-white' : 'bg-white/50'
                }`}>
                  <Icon className={`w-6 h-6 ${
                    isSelected ? 'text-gray-700' : 'text-gray-500'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold">
                    {role.name}
                  </h3>
                  <p className="text-xs mt-1 opacity-80">
                    {role.description}
                  </p>
                </div>
                {isSelected && (
                  <div className="flex-shrink-0">
                    <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {selectedRole && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>
              {language === 'sw' ? 'Umechagua:' : 'Selected:'} 
            </strong>{' '}
            {roles.find(r => r.id === selectedRole)?.name}
          </p>
          <p className="text-xs text-blue-600 mt-1">
            {language === 'sw' 
              ? 'Utapata ufikiaji wa dashboards na huduma za maalum kulingana na jukumu lako'
              : 'You will have access to specific dashboards and services based on your role'
            }
          </p>
        </div>
      )}
    </div>
  )
}
