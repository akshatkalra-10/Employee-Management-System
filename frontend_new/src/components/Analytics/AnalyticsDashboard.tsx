import { useEffect, useState } from 'react';
import api from '../../lib/api';
import { TrendingUp, Users, DollarSign, Calendar } from 'lucide-react';

interface AnalyticsData {
  departmentStats: { name: string; count: number; avgSalary: number }[];
  leaveStats: { type: string; count: number }[];
  salaryDistribution: { range: string; count: number }[];
}

export default function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData>({
    departmentStats: [],
    leaveStats: [],
    salaryDistribution: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const [statsRes, employeesRes, leavesRes] = await Promise.all([
        api.get('/statistics'),
        api.get('/employees?limit=1000'),
        api.get('/leave'),
      ]);

      // Department stats from /statistics endpoint
      if (statsRes.success && statsRes.data?.departments) {
        const departments = statsRes.data.departments as { _id: string; count: number }[];

        // Calculate avg salary per department from employees data
        const deptSalaries = new Map<string, { total: number; count: number }>();
        if (employeesRes.success && employeesRes.data) {
          employeesRes.data.forEach((emp: any) => {
            if (emp.status === 'Active') {
              const existing = deptSalaries.get(emp.department) || { total: 0, count: 0 };
              existing.total += Number(emp.salary);
              existing.count++;
              deptSalaries.set(emp.department, existing);
            }
          });
        }

        const departmentStats = departments.map((d) => {
          const salaryData = deptSalaries.get(d._id);
          return {
            name: d._id,
            count: d.count,
            avgSalary: salaryData ? Math.round(salaryData.total / salaryData.count) : 0,
          };
        });

        // Salary distribution
        const salaryRanges = [
          { range: '<$50k', min: 0, max: 50000 },
          { range: '$50k-$70k', min: 50000, max: 70000 },
          { range: '$70k-$90k', min: 70000, max: 90000 },
          { range: '>$90k', min: 90000, max: Infinity },
        ];

        const salaryDistribution = salaryRanges.map((range) => ({
          range: range.range,
          count: employeesRes.data
            ? employeesRes.data.filter(
                (emp: any) =>
                  emp.status === 'Active' &&
                  emp.salary >= range.min &&
                  emp.salary < range.max
              ).length
            : 0,
        }));

        setData((prev) => ({ ...prev, departmentStats, salaryDistribution }));
      }

      // Leave stats
      if (leavesRes.success && leavesRes.data) {
        const leaveTypes = new Map<string, number>();
        leavesRes.data.forEach((leave: any) => {
          const type = leave.leaveType || 'Other';
          leaveTypes.set(type, (leaveTypes.get(type) || 0) + 1);
        });

        const leaveStats = Array.from(leaveTypes.entries()).map(([type, count]) => ({
          type,
          count,
        }));

        setData((prev) => ({ ...prev, leaveStats }));
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to load analytics data');
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

  const maxDeptCount = Math.max(...data.departmentStats.map((d) => d.count), 1);
  const maxLeaveCount = Math.max(...data.leaveStats.map((l) => l.count), 1);
  const maxSalaryCount = Math.max(...data.salaryDistribution.map((s) => s.count), 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700 mb-2">Analytics Dashboard</h1>
        <p className="font-medium text-gray-600/90">Visualize key metrics and trends</p>
      </div>

      {error && (
        <div className="bg-red-50/80 backdrop-blur-md border border-red-200/50 text-red-700 px-4 py-3 rounded-xl text-sm shadow-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100/50 rounded-xl backdrop-blur-sm border border-blue-200/50">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Employees by Department</h2>
          </div>
          <div className="space-y-4">
            {data.departmentStats.map((dept) => (
              <div key={dept.name}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-700">{dept.name}</span>
                  <div className="text-right">
                    <span className="text-sm font-bold text-gray-900">{dept.count}</span>
                    <span className="text-xs font-medium text-gray-500 ml-2">
                      (${dept.avgSalary.toLocaleString()} avg)
                    </span>
                  </div>
                </div>
                <div className="w-full bg-white/40 shadow-inner rounded-full h-3 overflow-hidden border border-white/20">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500 shadow-sm"
                    style={{ width: `${(dept.count / maxDeptCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            {data.departmentStats.length === 0 && (
              <p className="text-gray-500 text-sm font-medium">No department data available.</p>
            )}
          </div>
        </div>

        <div className="glass-panel p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-100/50 rounded-xl backdrop-blur-sm border border-purple-200/50">
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Leave Requests by Type</h2>
          </div>
          <div className="space-y-4">
            {data.leaveStats.map((leave) => {
              const colors: Record<string, { bg: string; text: string }> = {
                Sick: { bg: 'from-red-500 to-red-600', text: 'text-red-700' },
                Casual: { bg: 'from-blue-500 to-blue-600', text: 'text-blue-700' },
                Personal: { bg: 'from-green-500 to-green-600', text: 'text-green-700' },
                Maternity: { bg: 'from-purple-500 to-purple-600', text: 'text-purple-700' },
                Paternity: { bg: 'from-indigo-500 to-indigo-600', text: 'text-indigo-700' },
              };
              const color = colors[leave.type] || { bg: 'from-gray-500 to-gray-600', text: 'text-gray-700' };

              return (
                <div key={leave.type}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700">{leave.type} Leave</span>
                    <span className={`text-sm font-bold ${color.text}`}>{leave.count}</span>
                  </div>
                  <div className="w-full bg-white/40 shadow-inner rounded-full h-3 overflow-hidden border border-white/20">
                    <div
                      className={`bg-gradient-to-r ${color.bg} h-3 rounded-full transition-all duration-500 shadow-sm`}
                      style={{ width: `${(leave.count / maxLeaveCount) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {data.leaveStats.length === 0 && (
              <p className="text-gray-500 text-sm font-medium">No leave data available.</p>
            )}
          </div>
        </div>

        <div className="glass-panel p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-100/50 rounded-xl backdrop-blur-sm border border-green-200/50">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Salary Distribution</h2>
          </div>
          <div className="space-y-4">
            {data.salaryDistribution.map((salary) => (
              <div key={salary.range}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-700">{salary.range}</span>
                  <span className="text-sm font-bold text-gray-900">
                    {salary.count} employee{salary.count !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="w-full bg-white/40 shadow-inner rounded-full h-3 overflow-hidden border border-white/20">
                  <div
                    className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500 shadow-sm"
                    style={{ width: `${(salary.count / maxSalaryCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-yellow-100/50 rounded-xl backdrop-blur-sm border border-yellow-200/50">
              <TrendingUp className="w-5 h-5 text-yellow-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Key Insights</h2>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50/50 backdrop-blur-sm rounded-xl border border-blue-200/50 shadow-sm">
              <p className="text-sm font-bold text-blue-900 uppercase tracking-wider mb-1">Most Common Department</p>
              <p className="text-xl font-bold text-blue-700">
                {[...data.departmentStats].sort((a, b) => b.count - a.count)[0]?.name || 'N/A'}
              </p>
            </div>
            <div className="p-4 bg-purple-50/50 backdrop-blur-sm rounded-xl border border-purple-200/50 shadow-sm">
              <p className="text-sm font-bold text-purple-900 uppercase tracking-wider mb-1">Most Requested Leave Type</p>
              <p className="text-xl font-bold text-purple-700">
                {[...data.leaveStats].sort((a, b) => b.count - a.count)[0]?.type || 'N/A'}
              </p>
            </div>
            <div className="p-4 bg-green-50/50 backdrop-blur-sm rounded-xl border border-green-200/50 shadow-sm">
              <p className="text-sm font-bold text-green-900 uppercase tracking-wider mb-1">Highest Paying Department</p>
              <p className="text-xl font-bold text-green-700">
                {[...data.departmentStats].sort((a, b) => b.avgSalary - a.avgSalary)[0]?.name || 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
