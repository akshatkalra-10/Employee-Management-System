import { useEffect, useState, useMemo } from 'react';
import api from '../../lib/api';
import { Search, Filter, Plus, CreditCard as Edit2, Trash2, Mail, Phone, Calendar, DollarSign, ChevronDown } from 'lucide-react';
import EmployeeModal from './EmployeeModal';

interface Employee {
  _id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  joinDate: string;
  salary: number;
  status: string;
  address: string;
  profileImage?: string;
}

export default function EmployeeDirectory() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'department' | 'salary' | 'joinDate'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showModal, setShowModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setError('');
      const res = await api.get('/employees?limit=1000');
      if (res.success) {
        setEmployees(res.data || []);
      }
    } catch (err) {
      console.error('Error fetching employees:', err);
      setError('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const departments = useMemo(() => {
    const depts = new Set(employees.map((e) => e.department));
    return Array.from(depts);
  }, [employees]);

  const filteredAndSortedEmployees = useMemo(() => {
    let result = [...employees];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (emp) =>
          emp.name.toLowerCase().includes(term) ||
          emp.email.toLowerCase().includes(term) ||
          (emp.phone && emp.phone.toLowerCase().includes(term)) ||
          (emp.position && emp.position.toLowerCase().includes(term))
      );
    }

    if (departmentFilter !== 'all') {
      result = result.filter((emp) => emp.department === departmentFilter);
    }

    if (statusFilter !== 'all') {
      result = result.filter((emp) => emp.status === statusFilter);
    }

    result.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'department':
          aValue = a.department;
          bValue = b.department;
          break;
        case 'salary':
          aValue = a.salary;
          bValue = b.salary;
          break;
        case 'joinDate':
          aValue = new Date(a.joinDate);
          bValue = new Date(b.joinDate);
          break;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return result;
  }, [employees, searchTerm, departmentFilter, statusFilter, sortBy, sortOrder]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this employee?')) return;

    try {
      const res = await api.delete(`/deleteEmployee/${id}`);
      if (res.success) {
        fetchEmployees();
      }
    } catch (err) {
      console.error('Error deleting employee:', err);
      alert('Failed to delete employee');
    }
  };

  const handleEdit = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowModal(true);
  };

  const handleAdd = () => {
    setSelectedEmployee(null);
    setShowModal(true);
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
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700 mb-2">Employee Directory</h1>
          <p className="font-medium text-gray-600/90">
            Manage your team of {employees.length} employee{employees.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="glass-button-primary text-sm"
        >
          <Plus className="w-5 h-5" />
          Add Employee
        </button>
      </div>

      {error && (
        <div className="bg-red-50/80 backdrop-blur-md border border-red-200/50 text-red-700 px-4 py-3 rounded-xl text-sm shadow-sm">
          {error}
        </div>
      )}

      <div className="glass-panel p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, email, position..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 glass-input"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 bg-white/30 backdrop-blur-sm border border-white/50 rounded-xl hover:bg-white/50 flex items-center gap-2 transition-all font-medium text-gray-700 shadow-sm"
          >
            <Filter className="w-5 h-5" />
            Filters
            <ChevronDown
              className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`}
            />
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-white/30 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Department</label>
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="w-full px-3 py-2 glass-input"
              >
                <option value="all">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 glass-input"
              >
                <option value="all">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Sort By</label>
              <div className="flex gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="flex-1 px-3 py-2 glass-input"
                >
                  <option value="name">Name</option>
                  <option value="department">Department</option>
                  <option value="salary">Salary</option>
                  <option value="joinDate">Join Date</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-3 py-2 bg-white/30 backdrop-blur-sm border border-white/50 rounded-xl hover:bg-white/50 shadow-sm font-medium text-gray-700"
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAndSortedEmployees.map((employee) => (
          <div
            key={employee._id}
            className="glass-card p-6 flex flex-col h-full bg-white/40"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500/90 to-blue-600/90 backdrop-blur-sm shadow border border-white/30 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {employee.name ? employee.name.charAt(0).toUpperCase() : '?'}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 leading-tight">{employee.name}</h3>
                  <p className="text-sm font-medium text-gray-500">{employee.email}</p>
                </div>
              </div>
              <span
                className={`px-2 py-1 rounded-lg text-xs font-bold border ${
                  employee.status === 'Active'
                    ? 'bg-green-100/50 text-green-700 border-green-200'
                    : 'bg-red-100/50 text-red-700 border-red-200'
                }`}
              >
                {employee.status}
              </span>
            </div>

            <div className="space-y-2.5 mb-4 flex-1">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-600/90">
                <Mail className="w-4 h-4 text-gray-400" />
                {employee.email}
              </div>
              {employee.phone && (
                <div className="flex items-center gap-2 text-sm font-medium text-gray-600/90">
                  <Phone className="w-4 h-4 text-gray-400" />
                  {employee.phone}
                </div>
              )}
              <div className="flex items-center gap-2 text-sm font-medium text-gray-600/90">
                <Calendar className="w-4 h-4 text-gray-400" />
                Joined {new Date(employee.joinDate).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-2 text-sm font-medium text-gray-600/90">
                <DollarSign className="w-4 h-4 text-gray-400" />
                ${employee.salary.toLocaleString()}/year
              </div>
            </div>

            <div className="pt-4 border-t border-white/30">
              <div className="mb-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Department</span>
                <p className="text-sm font-semibold text-gray-900">{employee.department}</p>
              </div>
              {employee.position && (
                <div>
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Position</span>
                  <p className="text-sm font-semibold text-gray-900">{employee.position}</p>
                </div>
              )}
            </div>

            <div className="mt-5 flex gap-2">
              <button
                onClick={() => handleEdit(employee)}
                className="flex-1 px-3 py-2 bg-blue-50/50 text-blue-700 font-semibold border border-blue-200/50 hover:bg-blue-100/50 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={() => handleDelete(employee._id)}
                className="flex-1 px-3 py-2 bg-red-50/50 text-red-700 font-semibold border border-red-200/50 hover:bg-red-100/50 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredAndSortedEmployees.length === 0 && (
        <div className="text-center py-12 glass-panel">
          <p className="text-gray-500 font-medium">No employees found matching your criteria.</p>
        </div>
      )}

      {showModal && (
        <EmployeeModal
          employee={selectedEmployee}
          onClose={() => {
            setShowModal(false);
            setSelectedEmployee(null);
          }}
          onSuccess={() => {
            fetchEmployees();
            setShowModal(false);
            setSelectedEmployee(null);
          }}
        />
      )}
    </div>
  );
}
