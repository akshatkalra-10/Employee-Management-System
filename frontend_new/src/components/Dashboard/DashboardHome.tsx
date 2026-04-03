import { useEffect, useState } from 'react';
import api from '../../lib/api';
import { Users, UserCheck, UserX, DollarSign, Calendar, TrendingUp, Clock } from 'lucide-react';

interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number;
  averageSalary: number;
  pendingLeaves: number;
  todayAttendance: number;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  color: string;
}

function MetricCard({ title, value, icon, trend, color }: MetricCardProps) {
  return (
    <div className="glass-panel p-6 hover:-translate-y-1 transition-transform duration-300">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-600/90 mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-gray-900 mb-2">{value}</h3>
          {trend && (
            <div className="flex items-center gap-1 text-sm font-medium text-green-600/90">
              <TrendingUp className="w-4 h-4" />
              <span>{trend}</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl backdrop-blur-sm border border-white/20 shadow-sm ${color}`}>{icon}</div>
      </div>
    </div>
  );
}

export default function DashboardHome() {
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    activeEmployees: 0,
    inactiveEmployees: 0,
    averageSalary: 0,
    pendingLeaves: 0,
    todayAttendance: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentEmployees, setRecentEmployees] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch statistics, employees, pending leaves, and today's attendance in parallel
      const today = new Date().toISOString().split('T')[0];
      const [statsRes, employeesRes, leavesRes, attendanceRes] = await Promise.all([
        api.get('/statistics'),
        api.get('/employees?limit=5&sortBy=createdAt&sortOrder=desc'),
        api.get('/leave?status=Pending'),
        api.get(`/attendance/date/${today}`),
      ]);

      if (statsRes.success && statsRes.data) {
        setStats({
          totalEmployees: statsRes.data.total || 0,
          activeEmployees: statsRes.data.active || 0,
          inactiveEmployees: statsRes.data.inactive || 0,
          averageSalary: Math.round(statsRes.data.avgSalary || 0),
          pendingLeaves: leavesRes.data?.length || 0,
          todayAttendance: attendanceRes.data?.length || 0,
        });
      }

      if (employeesRes.success && employeesRes.data) {
        setRecentEmployees(employeesRes.data);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700 mb-2">Dashboard</h1>
        <p className="text-gray-600/90 font-medium">Welcome back! Here's what's happening today.</p>
      </div>

      {error && (
        <div className="bg-red-50/80 backdrop-blur-md border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm shadow-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard
          title="Total Employees"
          value={stats.totalEmployees}
          icon={<Users className="w-6 h-6 text-blue-600" />}
          color="bg-blue-100/50"
        />
        <MetricCard
          title="Active Employees"
          value={stats.activeEmployees}
          icon={<UserCheck className="w-6 h-6 text-green-600" />}
          color="bg-green-100/50"
        />
        <MetricCard
          title="Inactive Employees"
          value={stats.inactiveEmployees}
          icon={<UserX className="w-6 h-6 text-red-600" />}
          color="bg-red-100/50"
        />
        <MetricCard
          title="Average Salary"
          value={`$${stats.averageSalary.toLocaleString()}`}
          icon={<DollarSign className="w-6 h-6 text-yellow-600" />}
          color="bg-yellow-100/50"
        />
        <MetricCard
          title="Pending Leaves"
          value={stats.pendingLeaves}
          icon={<Calendar className="w-6 h-6 text-purple-600" />}
          color="bg-purple-100/50"
        />
        <MetricCard
          title="Today's Attendance"
          value={stats.todayAttendance}
          icon={<Clock className="w-6 h-6 text-cyan-600" />}
          color="bg-cyan-100/50"
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="glass-panel p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Employees</h2>
          <div className="space-y-3">
            {recentEmployees.map((employee) => (
              <div
                key={employee._id}
                className="flex items-center gap-3 p-3 bg-white/30 border border-white/40 hover:bg-white/60 rounded-xl transition duration-300"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500/90 to-blue-600/90 backdrop-blur-sm rounded-full flex items-center justify-center text-white font-semibold shadow-sm border border-white/20">
                  {employee.name ? employee.name.charAt(0).toUpperCase() : '?'}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{employee.name}</p>
                  <p className="text-sm font-medium text-gray-500">{employee.position || employee.department}</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-lg text-xs font-bold border ${
                    employee.status === 'Active'
                      ? 'bg-green-100/50 text-green-700 border-green-200'
                      : 'bg-red-100/50 text-red-700 border-red-200'
                  }`}
                >
                  {employee.status}
                </span>
              </div>
            ))}
            {recentEmployees.length === 0 && (
              <p className="text-gray-500 font-medium text-sm">No employees found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
