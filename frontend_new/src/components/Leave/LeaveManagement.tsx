import { useEffect, useState } from 'react';
import api from '../../lib/api';
import { Calendar, Clock, Check, X, AlertCircle, Plus } from 'lucide-react';

interface LeaveRequest {
  _id: string;
  employeeId: {
    _id: string;
    name: string;
    email: string;
  } | string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: string;
  approvalNotes: string;
  approvalDate: string | null;
  createdAt: string;
}

interface Employee {
  _id: string;
  name: string;
  department: string;
}

export default function LeaveManagement() {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [error, setError] = useState('');

  // Apply leave form
  const [applyForm, setApplyForm] = useState({
    employeeId: '',
    leaveType: 'Sick',
    startDate: '',
    endDate: '',
    reason: '',
  });
  const [applyLoading, setApplyLoading] = useState(false);
  const [applyError, setApplyError] = useState('');

  useEffect(() => {
    fetchLeaves();
    fetchEmployees();
  }, []);

  const fetchLeaves = async () => {
    try {
      setError('');
      const res = await api.get('/leave');
      if (res.success) {
        setLeaves(res.data || []);
      }
    } catch (err) {
      console.error('Error fetching leaves:', err);
      setError('Failed to load leave requests');
    } finally {
      setLoading(false);
    }
  };

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

  const handleApprove = async (id: string) => {
    try {
      const res = await api.put(`/leave/${id}/approve`, { approvalNotes: '' });
      if (res.success) {
        fetchLeaves();
      }
    } catch (err) {
      console.error('Error approving leave:', err);
      alert('Failed to approve leave request');
    }
  };

  const handleReject = async (id: string) => {
    try {
      const res = await api.put(`/leave/${id}/reject`, { approvalNotes: '' });
      if (res.success) {
        fetchLeaves();
      }
    } catch (err) {
      console.error('Error rejecting leave:', err);
      alert('Failed to reject leave request');
    }
  };

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    setApplyLoading(true);
    setApplyError('');

    try {
      const res = await api.post('/leave/apply', applyForm);
      if (res.success) {
        setShowApplyModal(false);
        setApplyForm({ employeeId: '', leaveType: 'Sick', startDate: '', endDate: '', reason: '' });
        fetchLeaves();
      } else {
        throw new Error(res.message || 'Failed to apply for leave');
      }
    } catch (err) {
      setApplyError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setApplyLoading(false);
    }
  };

  const getEmployeeName = (leave: LeaveRequest): string => {
    if (typeof leave.employeeId === 'object' && leave.employeeId !== null) {
      return leave.employeeId.name || 'Unknown';
    }
    // If not populated, find from employees list
    const emp = employees.find(e => e._id === leave.employeeId);
    return emp?.name || 'Unknown';
  };

  const getEmployeeDept = (leave: LeaveRequest): string => {
    if (typeof leave.employeeId === 'object' && leave.employeeId !== null) {
      const empId = leave.employeeId._id;
      const emp = employees.find(e => e._id === empId);
      return emp?.department || '';
    }
    const emp = employees.find(e => e._id === leave.employeeId);
    return emp?.department || '';
  };

  const computeDays = (startDate: string, endDate: string): number => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 1;
  };

  const filteredLeaves = leaves.filter((leave) => {
    if (statusFilter !== 'all' && leave.status !== statusFilter) return false;
    if (typeFilter !== 'all' && leave.leaveType !== typeFilter) return false;
    return true;
  });

  const stats = {
    pending: leaves.filter((l) => l.status === 'Pending').length,
    approved: leaves.filter((l) => l.status === 'Approved').length,
    rejected: leaves.filter((l) => l.status === 'Rejected').length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'Approved':
        return 'bg-green-100 text-green-700';
      case 'Rejected':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Sick':
        return 'bg-red-100 text-red-700';
      case 'Casual':
        return 'bg-blue-100 text-blue-700';
      case 'Personal':
        return 'bg-green-100 text-green-700';
      case 'Maternity':
        return 'bg-purple-100 text-purple-700';
      case 'Paternity':
        return 'bg-indigo-100 text-indigo-700';
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
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700 mb-2">Leave Management</h1>
          <p className="font-medium text-gray-600/90">Review and approve employee leave requests</p>
        </div>
        <button
          onClick={() => setShowApplyModal(true)}
          className="glass-button-primary text-sm"
        >
          <Plus className="w-5 h-5" />
          Apply Leave
        </button>
      </div>

      {error && (
        <div className="bg-red-50/80 backdrop-blur-md border border-red-200/50 text-red-700 px-4 py-3 rounded-xl text-sm shadow-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-gray-600/90">Pending</p>
            <div className="p-2 bg-yellow-100/50 rounded-lg backdrop-blur-sm border border-yellow-200/50">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.pending}</p>
        </div>
        <div className="glass-panel p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-gray-600/90">Approved</p>
            <div className="p-2 bg-green-100/50 rounded-lg backdrop-blur-sm border border-green-200/50">
              <Check className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.approved}</p>
        </div>
        <div className="glass-panel p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-gray-600/90">Rejected</p>
            <div className="p-2 bg-red-100/50 rounded-lg backdrop-blur-sm border border-red-200/50">
              <X className="w-5 h-5 text-red-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.rejected}</p>
        </div>
      </div>

      <div className="glass-panel p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700/90 mb-2 ml-1">Filter by Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full glass-input"
            >
              <option value="all">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700/90 mb-2 ml-1">Filter by Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full glass-input"
            >
              <option value="all">All Types</option>
              <option value="Sick">Sick Leave</option>
              <option value="Casual">Casual Leave</option>
              <option value="Personal">Personal Leave</option>
              <option value="Maternity">Maternity Leave</option>
              <option value="Paternity">Paternity Leave</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredLeaves.map((leave) => (
          <div
            key={leave._id}
            className="glass-card p-6 flex flex-col h-full bg-white/40"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500/90 to-blue-600/90 backdrop-blur-sm shadow border border-white/30 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {getEmployeeName(leave).charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 leading-tight">{getEmployeeName(leave)}</h3>
                  <p className="text-sm font-medium text-gray-500">{getEmployeeDept(leave)}</p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-lg text-xs font-bold border shadow-sm backdrop-blur-sm ${getStatusColor(leave.status).replace('bg-', 'bg-').replace('text-', 'text-').concat(' border-opacity-50 border-current')}`}>
                {leave.status}
              </span>
            </div>

            <div className="space-y-3 mb-4 flex-1">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold border border-current shadow-sm ${getTypeColor(leave.leaveType)}`}>
                  {leave.leaveType}
                </span>
                <span className="text-sm font-medium text-gray-600">
                  {computeDays(leave.startDate, leave.endDate)} day{computeDays(leave.startDate, leave.endDate) !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm font-medium text-gray-600/90">
                <Calendar className="w-4 h-4 text-gray-400" />
                {new Date(leave.startDate).toLocaleDateString()} -{' '}
                {new Date(leave.endDate).toLocaleDateString()}
              </div>
              <div className="bg-white/30 backdrop-blur-sm border border-white/40 rounded-xl p-3 shadow-sm">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Reason</p>
                <p className="text-sm font-medium text-gray-900">{leave.reason}</p>
              </div>
            </div>

            {leave.status === 'Pending' && (
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => handleApprove(leave._id)}
                  className="flex-1 px-3 py-2 bg-green-50/50 text-green-700 font-semibold border border-green-200/50 hover:bg-green-100/50 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm"
                >
                  <Check className="w-4 h-4" />
                  Approve
                </button>
                <button
                  onClick={() => handleReject(leave._id)}
                  className="flex-1 px-3 py-2 bg-red-50/50 text-red-700 font-semibold border border-red-200/50 hover:bg-red-100/50 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm"
                >
                  <X className="w-4 h-4" />
                  Reject
                </button>
              </div>
            )}

            {leave.status !== 'Pending' && (
              <div className="text-xs font-medium text-gray-500 pt-2 border-t border-white/30 truncate">
                {leave.status === 'Approved' ? 'Approved' : 'Rejected'} on{' '}
                <span className="text-gray-900">{leave.approvalDate ? new Date(leave.approvalDate).toLocaleDateString() : new Date(leave.createdAt).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredLeaves.length === 0 && (
        <div className="text-center py-12 glass-panel">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">No leave requests found matching your criteria.</p>
        </div>
      )}

      {/* Apply Leave Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity">
          <div className="glass-panel w-full max-w-md bg-white/60">
            <div className="border-b border-white/40 px-6 py-5 flex items-center justify-between">
              <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700">Apply for Leave</h2>
              <button
                onClick={() => setShowApplyModal(false)}
                className="p-2 hover:bg-white/50 rounded-xl transition"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <form onSubmit={handleApplyLeave} className="p-6 space-y-4">
              {applyError && (
                <div className="bg-red-50/80 backdrop-blur-sm border border-red-200/50 text-red-700 px-4 py-3 rounded-xl text-sm shadow-sm">
                  {applyError}
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">Employee *</label>
                <select
                  value={applyForm.employeeId}
                  onChange={(e) => setApplyForm({ ...applyForm, employeeId: e.target.value })}
                  required
                  className="w-full glass-input"
                >
                  <option value="">Select Employee</option>
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">Leave Type *</label>
                <select
                  value={applyForm.leaveType}
                  onChange={(e) => setApplyForm({ ...applyForm, leaveType: e.target.value })}
                  required
                  className="w-full glass-input"
                >
                  <option value="Sick">Sick Leave</option>
                  <option value="Casual">Casual Leave</option>
                  <option value="Personal">Personal Leave</option>
                  <option value="Maternity">Maternity Leave</option>
                  <option value="Paternity">Paternity Leave</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">Start Date *</label>
                  <input
                    type="date"
                    value={applyForm.startDate}
                    onChange={(e) => setApplyForm({ ...applyForm, startDate: e.target.value })}
                    required
                    className="w-full glass-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">End Date *</label>
                  <input
                    type="date"
                    value={applyForm.endDate}
                    onChange={(e) => setApplyForm({ ...applyForm, endDate: e.target.value })}
                    required
                    className="w-full glass-input"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">Reason *</label>
                <textarea
                  value={applyForm.reason}
                  onChange={(e) => setApplyForm({ ...applyForm, reason: e.target.value })}
                  required
                  rows={3}
                  className="w-full glass-input"
                  placeholder="Describe the reason for your leave..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="flex-1 glass-button bg-white/50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={applyLoading}
                  className="flex-1 glass-button-primary disabled:opacity-50"
                >
                  {applyLoading ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
