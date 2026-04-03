import { useEffect, useState } from 'react';
import api from '../../lib/api';
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, X, Plus } from 'lucide-react';

interface AttendanceRecord {
  _id: string;
  employeeId: {
    _id: string;
    name: string;
    email: string;
    department: string;
    position: string;
  } | string;
  date: string;
  checkIn: string;
  checkOut: string;
  status: string;
  notes: string;
}

interface Employee {
  _id: string;
  name: string;
  department: string;
}

export default function AttendanceTracker() {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showMarkModal, setShowMarkModal] = useState(false);
  const [error, setError] = useState('');

  // Mark attendance form state
  const [markForm, setMarkForm] = useState({
    employeeId: '',
    action: 'checkin' as 'checkin' | 'checkout',
    time: '',
  });
  const [markLoading, setMarkLoading] = useState(false);
  const [markError, setMarkError] = useState('');

  useEffect(() => {
    fetchAttendance();
  }, [selectedDate]);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/employees?limit=1000');
      if (res.success) {
        setEmployees(res.data || []);
      }
    } catch (err) {
      console.error('Error fetching employees:', err);
    }
  };

  const fetchAttendance = async () => {
    try {
      setError('');
      setLoading(true);
      const res = await api.get(`/attendance/date/${selectedDate}`);
      if (res.success) {
        setAttendance(res.data || []);
      }
    } catch (err) {
      console.error('Error fetching attendance:', err);
      setError('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    setMarkLoading(true);
    setMarkError('');

    try {
      const endpoint = markForm.action === 'checkin' ? '/attendance/checkin' : '/attendance/checkout';
      const body: any = {
        employeeId: markForm.employeeId,
        date: selectedDate,
      };

      if (markForm.action === 'checkin') {
        body.checkIn = markForm.time || new Date().toLocaleTimeString();
      } else {
        body.checkOut = markForm.time || new Date().toLocaleTimeString();
      }

      const res = await api.post(endpoint, body);
      if (res.success) {
        setShowMarkModal(false);
        setMarkForm({ employeeId: '', action: 'checkin', time: '' });
        fetchAttendance();
      } else {
        throw new Error(res.message || 'Failed to mark attendance');
      }
    } catch (err) {
      setMarkError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setMarkLoading(false);
    }
  };

  const getEmployeeName = (record: AttendanceRecord): string => {
    if (typeof record.employeeId === 'object' && record.employeeId !== null) {
      return record.employeeId.name || 'Unknown';
    }
    return 'Unknown';
  };

  const getEmployeeDept = (record: AttendanceRecord): string => {
    if (typeof record.employeeId === 'object' && record.employeeId !== null) {
      return record.employeeId.department || '';
    }
    return '';
  };

  const filteredAttendance =
    statusFilter === 'all'
      ? attendance
      : attendance.filter((record) => record.status === statusFilter);

  const stats = {
    present: attendance.filter((r) => r.status === 'Present').length,
    absent: attendance.filter((r) => r.status === 'Absent').length,
    late: attendance.filter((r) => r.status === 'Late').length,
    leave: attendance.filter((r) => r.status === 'Leave').length,
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Present':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'Absent':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'Late':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'Leave':
        return <Clock className="w-5 h-5 text-blue-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Present':
        return 'bg-green-100 text-green-700';
      case 'Absent':
        return 'bg-red-100 text-red-700';
      case 'Late':
        return 'bg-yellow-100 text-yellow-700';
      case 'Leave':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700 mb-2">Attendance Tracking</h1>
          <p className="font-medium text-gray-600/90">Monitor and manage employee attendance</p>
        </div>
        <button
          onClick={() => setShowMarkModal(true)}
          className="glass-button-primary text-sm"
        >
          <Plus className="w-5 h-5" />
          Mark Attendance
        </button>
      </div>

      {error && (
        <div className="bg-red-50/80 backdrop-blur-md border border-red-200/50 text-red-700 px-4 py-3 rounded-xl text-sm shadow-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-panel p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-gray-600/90">Present</p>
            <div className="p-2 bg-green-100/50 rounded-lg backdrop-blur-sm border border-green-200/50">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.present}</p>
        </div>
        <div className="glass-panel p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-gray-600/90">Absent</p>
            <div className="p-2 bg-red-100/50 rounded-lg backdrop-blur-sm border border-red-200/50">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.absent}</p>
        </div>
        <div className="glass-panel p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-gray-600/90">Late</p>
            <div className="p-2 bg-yellow-100/50 rounded-lg backdrop-blur-sm border border-yellow-200/50">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.late}</p>
        </div>
        <div className="glass-panel p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-gray-600/90">On Leave</p>
            <div className="p-2 bg-blue-100/50 rounded-lg backdrop-blur-sm border border-blue-200/50">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.leave}</p>
        </div>
      </div>

      <div className="glass-panel p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700/90 mb-2 ml-1">Select Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full glass-input"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700/90 mb-2 ml-1">Filter Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full glass-input"
            >
              <option value="all">All Status</option>
              <option value="Present">Present</option>
              <option value="Absent">Absent</option>
              <option value="Late">Late</option>
              <option value="Leave">On Leave</option>
            </select>
          </div>
        </div>
      </div>

      <div className="glass-panel overflow-hidden border-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/30 backdrop-blur-md border-b border-white/40">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Check In
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Check Out
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/20">
              {filteredAttendance.map((record) => (
                <tr key={record._id} className="hover:bg-white/40 transition-colors duration-200">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-semibold text-gray-900">{getEmployeeName(record)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-600/90">
                    {getEmployeeDept(record)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                    {record.checkIn || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                    {record.checkOut || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm border border-white/50 backdrop-blur-sm ${getStatusColor(
                        record.status
                      )}`}
                    >
                      {getStatusIcon(record.status)}
                      {record.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-600">
                    {record.notes || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredAttendance.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">No attendance records found for this date.</p>
          </div>
        )}
      </div>

      {/* Mark Attendance Modal */}
      {showMarkModal && (
        <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity">
          <div className="glass-panel w-full max-w-md bg-white/60">
            <div className="border-b border-white/40 px-6 py-5 flex items-center justify-between">
              <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700">Mark Attendance</h2>
              <button
                onClick={() => setShowMarkModal(false)}
                className="p-2 hover:bg-white/50 rounded-xl transition"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <form onSubmit={handleMarkAttendance} className="p-6 space-y-5">
              {markError && (
                <div className="bg-red-50/80 backdrop-blur-sm border border-red-200/50 text-red-700 px-4 py-3 rounded-xl text-sm shadow-sm">
                  {markError}
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">Employee *</label>
                <select
                  value={markForm.employeeId}
                  onChange={(e) => setMarkForm({ ...markForm, employeeId: e.target.value })}
                  required
                  className="w-full glass-input"
                >
                  <option value="">Select Employee</option>
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.name} ({emp.department})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">Action *</label>
                <select
                  value={markForm.action}
                  onChange={(e) => setMarkForm({ ...markForm, action: e.target.value as 'checkin' | 'checkout' })}
                  className="w-full glass-input"
                >
                  <option value="checkin">Check In</option>
                  <option value="checkout">Check Out</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">Time (optional)</label>
                <input
                  type="time"
                  value={markForm.time}
                  onChange={(e) => setMarkForm({ ...markForm, time: e.target.value })}
                  className="w-full glass-input"
                />
                <p className="text-xs font-medium text-gray-500 mt-2 ml-1">Leave empty to use current time</p>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowMarkModal(false)}
                  className="flex-1 glass-button bg-white/50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={markLoading}
                  className="flex-1 glass-button-primary disabled:opacity-50"
                >
                  {markLoading ? 'Saving...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
