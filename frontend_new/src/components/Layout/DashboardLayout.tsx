import { useState, ReactNode } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  Calendar,
  DollarSign,
  BarChart3,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: ReactNode;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { id: 'employees', label: 'Employees', icon: <Users className="w-5 h-5" /> },
  { id: 'attendance', label: 'Attendance', icon: <ClipboardCheck className="w-5 h-5" /> },
  { id: 'leaves', label: 'Leave Management', icon: <Calendar className="w-5 h-5" /> },
  { id: 'payroll', label: 'Payroll', icon: <DollarSign className="w-5 h-5" /> },
  { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-5 h-5" /> },
];

interface DashboardLayoutProps {
  children: ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function DashboardLayout({ children, activeTab, onTabChange }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { signOut, user } = useAuth();

  const handleSignOut = () => {
    try {
      signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex">
      {/* Decorative gradient orbs in background */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-400/20 mix-blend-multiply filter blur-[100px] -z-10 pointer-events-none"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-400/20 mix-blend-multiply filter blur-[100px] -z-10 pointer-events-none"></div>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-2 left-2 right-2 glass-panel z-30 px-4 py-3 rounded-2xl">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">EMS</h1>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-white/50 rounded-xl transition-colors"
          >
            {sidebarOpen ? <X className="w-6 h-6 text-gray-700" /> : <Menu className="w-6 h-6 text-gray-700" />}
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed top-4 left-4 bottom-4 w-64 glass-panel z-40 transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-[120%]'
        } lg:translate-x-0 flex flex-col`}
      >
        <div className="p-6 border-b border-white/30 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500/90 to-purple-600/90 rounded-2xl flex items-center justify-center shadow-lg border border-white/20">
              <Users className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700">EMS</h1>
              <p className="text-xs font-medium text-gray-500">Workspace</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-white/60 shadow-sm border border-white/50 text-blue-700 font-semibold'
                    : 'text-gray-600 hover:bg-white/30 hover:text-gray-900 font-medium'
                }`}
              >
                <div className={`${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                  {item.icon}
                </div>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/30 backdrop-blur-sm">
          <div className="mb-3 px-4 py-3 bg-white/30 border border-white/40 rounded-xl">
            <p className="text-xs font-semibold text-gray-500 mb-0.5">Signed in as</p>
            <p className="text-sm font-bold text-gray-800 truncate">{user?.username || 'Admin'}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50/50 rounded-xl transition-all font-medium group"
          >
            <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-30 lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 lg:ml-72 p-4 lg:p-4 pt-20 lg:pt-4 min-h-screen">
        <div className="h-full rounded-2xl">
          {children}
        </div>
      </main>
    </div>
  );
}
