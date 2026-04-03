import { useEffect, useState } from 'react';
import api from '../../lib/api';
import { DollarSign, Calendar, TrendingUp, Download, Plus, X } from 'lucide-react';

interface PayrollRecord {
  _id: string;
  employeeId: {
    _id: string;
    name: string;
    email: string;
  } | string;
  month: string; // Format: "2024-03"
  baseSalary: number;
  bonus: number;
  deductions: number;
  taxDeduction: number;
  netSalary: number;
  paymentDate: string | null;
  status: string;
}

interface Employee {
  _id: string;
  name: string;
  department: string;
  salary: number;
}

export default function PayrollManagement() {
  const [payroll, setPayroll] = useState<PayrollRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [statusFilter, setStatusFilter] = useState('all');
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [error, setError] = useState('');

  // Generate payroll form
  const [genForm, setGenForm] = useState({
    employeeId: '',
    bonus: '0',
    deductions: '0',
    taxDeduction: '0',
  });
  const [genLoading, setGenLoading] = useState(false);
  const [genError, setGenError] = useState('');

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (employees.length > 0) {
      fetchPayroll();
    }
  }, [selectedMonth, selectedYear, employees]);

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

  const fetchPayroll = async () => {
    try {
      setError('');
      setLoading(true);
      const monthStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;

      // Fetch payroll for all employees and filter by month
      const allPayroll: PayrollRecord[] = [];
      const promises = employees.map(async (emp) => {
        try {
          const res = await api.get(`/payroll/${emp._id}`);
          if (res.success && res.data) {
            const filtered = res.data.filter((p: any) => p.month === monthStr);
            // Attach employee info for display
            filtered.forEach((p: any) => {
              if (!p.employeeId || typeof p.employeeId === 'string') {
                p.employeeId = { _id: emp._id, name: emp.name, email: '' };
              }
            });
            allPayroll.push(...filtered);
          }
        } catch {
          // Skip employees with no payroll
        }
      });

      await Promise.all(promises);
      setPayroll(allPayroll);
    } catch (err) {
      console.error('Error fetching payroll:', err);
      setError('Failed to load payroll data');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkPaid = async (id: string) => {
    try {
      const res = await api.put(`/payroll/${id}/mark-paid`, {});
      if (res.success) {
        fetchPayroll();
      }
    } catch (err) {
      console.error('Error marking as paid:', err);
      alert('Failed to update payroll status');
    }
  };

  const handleGeneratePayroll = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenLoading(true);
    setGenError('');

    try {
      const monthStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
      const res = await api.post('/payroll/generate', {
        employeeId: genForm.employeeId,
        month: monthStr,
        bonus: Number(genForm.bonus) || 0,
        deductions: Number(genForm.deductions) || 0,
        taxDeduction: Number(genForm.taxDeduction) || 0,
      });

      if (res.success) {
        setShowGenerateModal(false);
        setGenForm({ employeeId: '', bonus: '0', deductions: '0', taxDeduction: '0' });
        fetchPayroll();
      } else {
        throw new Error(res.message || 'Failed to generate payroll');
      }
    } catch (err) {
      setGenError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setGenLoading(false);
    }
  };

  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    try {
      const ext = format === 'excel' ? 'xlsx' : format;
      await api.download(`/export/employees/${format}`, `employees.${ext}`);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to export data');
    }
  };

  const getEmployeeName = (record: PayrollRecord): string => {
    if (typeof record.employeeId === 'object' && record.employeeId !== null) {
      return record.employeeId.name || 'Unknown';
    }
    const emp = employees.find(e => e._id === record.employeeId);
    return emp?.name || 'Unknown';
  };

  const getEmployeeDept = (record: PayrollRecord): string => {
    if (typeof record.employeeId === 'object' && record.employeeId !== null) {
      const empId = record.employeeId._id;
      const emp = employees.find(e => e._id === empId);
      return emp?.department || '';
    }
    const emp = employees.find(e => e._id === record.employeeId);
    return emp?.department || '';
  };

  const filteredPayroll =
    statusFilter === 'all' ? payroll : payroll.filter((p) => p.status === statusFilter);

  const stats = {
    totalPayroll: filteredPayroll.reduce((sum, p) => sum + Number(p.netSalary || 0), 0),
    pending: payroll.filter((p) => p.status === 'Pending').length,
    processed: payroll.filter((p) => p.status === 'Processed').length,
    paid: payroll.filter((p) => p.status === 'Paid').length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'Processed':
        return 'bg-blue-100 text-blue-700';
      case 'Paid':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

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
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700 mb-2">Payroll Management</h1>
          <p className="font-medium text-gray-600/90">Manage employee salaries and payments</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowGenerateModal(true)}
            className="glass-button-primary text-sm"
          >
            <Plus className="w-5 h-5" />
            Generate Payroll
          </button>
          <div className="relative group">
            <button className="glass-button bg-white/50 text-sm">
              <Download className="w-5 h-5" />
              Export
            </button>
            <div className="absolute right-0 mt-1 w-40 bg-white/60 backdrop-blur-md rounded-xl shadow-glass border border-white/40 hidden group-hover:block z-10 overflow-hidden">
              <button onClick={() => handleExport('csv')} className="w-full px-4 py-2.5 text-left text-sm font-medium text-gray-700 hover:bg-white/50 transition-colors">
                Export CSV
              </button>
              <button onClick={() => handleExport('excel')} className="w-full px-4 py-2.5 text-left text-sm font-medium text-gray-700 hover:bg-white/50 transition-colors">
                Export Excel
              </button>
              <button onClick={() => handleExport('pdf')} className="w-full px-4 py-2.5 text-left text-sm font-medium text-gray-700 hover:bg-white/50 transition-colors">
                Export PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50/80 backdrop-blur-md border border-red-200/50 text-red-700 px-4 py-3 rounded-xl text-sm shadow-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-panel p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-gray-600/90">Total Payroll</p>
            <div className="p-2 bg-green-100/50 rounded-lg backdrop-blur-sm border border-green-200/50">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">${stats.totalPayroll.toLocaleString()}</p>
        </div>
        <div className="glass-panel p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-gray-600/90">Pending</p>
            <div className="p-2 bg-yellow-100/50 rounded-lg backdrop-blur-sm border border-yellow-200/50">
              <Calendar className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.pending}</p>
        </div>
        <div className="glass-panel p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-gray-600/90">Processed</p>
            <div className="p-2 bg-blue-100/50 rounded-lg backdrop-blur-sm border border-blue-200/50">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.processed}</p>
        </div>
        <div className="glass-panel p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-gray-600/90">Paid</p>
            <div className="p-2 bg-green-100/50 rounded-lg backdrop-blur-sm border border-green-200/50">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.paid}</p>
        </div>
      </div>

      <div className="glass-panel p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700/90 mb-2 ml-1">Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="w-full glass-input"
            >
              {monthNames.map((month, index) => (
                <option key={month} value={index + 1}>
                  {month}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700/90 mb-2 ml-1">Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full glass-input"
            >
              {[2024, 2025, 2026, 2027].map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700/90 mb-2 ml-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full glass-input"
            >
              <option value="all">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Processed">Processed</option>
              <option value="Paid">Paid</option>
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
                  Base Salary
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Bonus
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Deductions
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Net Salary
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/20">
              {filteredPayroll.map((record) => (
                <tr key={record._id} className="hover:bg-white/40 transition-colors duration-200">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-semibold text-gray-900">{getEmployeeName(record)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-600/90">
                    {getEmployeeDept(record)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                    ${Number(record.baseSalary).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                    +${Number(record.bonus || 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                    -${Number((record.deductions || 0) + (record.taxDeduction || 0)).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                    ${Number(record.netSalary).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm border border-white/50 backdrop-blur-sm ${getStatusColor(record.status)}`}
                    >
                      {record.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                    {record.status === 'Pending' && (
                      <button
                        onClick={() => handleMarkPaid(record._id)}
                        className="text-green-600 hover:text-green-700 transition-colors"
                      >
                        Mark Paid
                      </button>
                    )}
                    {record.status === 'Processed' && (
                      <button
                        onClick={() => handleMarkPaid(record._id)}
                        className="text-green-600 hover:text-green-700 transition-colors"
                      >
                        Mark Paid
                      </button>
                    )}
                    {record.status === 'Paid' && (
                      <span className="text-gray-500 font-medium">
                        {record.paymentDate
                          ? new Date(record.paymentDate).toLocaleDateString()
                          : 'Completed'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredPayroll.length === 0 && (
          <div className="text-center py-12">
            <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">
              No payroll records found for {monthNames[selectedMonth - 1]} {selectedYear}.
            </p>
          </div>
        )}
      </div>

      {/* Generate Payroll Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity">
          <div className="glass-panel w-full max-w-md bg-white/60">
            <div className="border-b border-white/40 px-6 py-5 flex items-center justify-between">
              <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700">
                Generate Payroll — {monthNames[selectedMonth - 1]} {selectedYear}
              </h2>
              <button
                onClick={() => setShowGenerateModal(false)}
                className="p-2 hover:bg-white/50 rounded-xl transition"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <form onSubmit={handleGeneratePayroll} className="p-6 space-y-5">
              {genError && (
                <div className="bg-red-50/80 backdrop-blur-sm border border-red-200/50 text-red-700 px-4 py-3 rounded-xl text-sm shadow-sm">
                  {genError}
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">Employee *</label>
                <select
                  value={genForm.employeeId}
                  onChange={(e) => setGenForm({ ...genForm, employeeId: e.target.value })}
                  required
                  className="w-full glass-input"
                >
                  <option value="">Select Employee</option>
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.name} — ${emp.salary.toLocaleString()}/yr
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">Bonus</label>
                <input
                  type="number"
                  value={genForm.bonus}
                  onChange={(e) => setGenForm({ ...genForm, bonus: e.target.value })}
                  min="0"
                  className="w-full glass-input"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">Deductions</label>
                <input
                  type="number"
                  value={genForm.deductions}
                  onChange={(e) => setGenForm({ ...genForm, deductions: e.target.value })}
                  min="0"
                  className="w-full glass-input"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">Tax Deduction</label>
                <input
                  type="number"
                  value={genForm.taxDeduction}
                  onChange={(e) => setGenForm({ ...genForm, taxDeduction: e.target.value })}
                  min="0"
                  className="w-full glass-input"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="flex-1 glass-button bg-white/50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={genLoading}
                  className="flex-1 glass-button-primary disabled:opacity-50"
                >
                  {genLoading ? 'Generating...' : 'Generate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
