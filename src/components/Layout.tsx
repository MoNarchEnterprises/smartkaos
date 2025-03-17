import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Phone, Mic2, Settings, BarChart2, LogOut, Users, SwitchCamera as UserSwitch } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const Layout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user, setDemoUser } = useAuthStore();
  const isAdmin = user?.email === 'demo@example.com';

  const navigation = [
    { name: 'Dashboard', path: '/', icon: BarChart2 },
    { name: 'Voice Agents', path: '/voices', icon: Mic2 },
    { name: 'Call Center', path: '/calls', icon: Phone },
    { name: 'Settings', path: '/settings', icon: Settings },
    ...(isAdmin ? [{ name: 'Admin', path: '/admin', icon: Users }] : [])
  ];

  const toggleDemoUser = () => {
    setDemoUser(isAdmin ? 'customer' : 'admin');
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 p-4">
        <div className="flex items-center space-x-2 mb-8">
          <Phone className="w-8 h-8 text-indigo-600" />
          <span className="text-xl font-bold">SmartKaos.AI</span>
        </div>
        
        <div className="space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                  location.pathname === item.path
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>

        <div className="absolute bottom-20 left-4 right-4">
          <button
            onClick={toggleDemoUser}
            className="w-full flex items-center space-x-2 px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg"
          >
            <UserSwitch className="w-5 h-5" />
            <span>Switch to {isAdmin ? 'Customer' : 'Admin'}</span>
          </button>
        </div>

        <button
          onClick={handleLogout}
          className="absolute bottom-4 left-4 flex items-center space-x-2 px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </nav>

      <main className="ml-64 p-8">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;