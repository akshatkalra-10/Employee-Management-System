import { useState, useEffect } from 'react'
import Statistics from './Statistics'
import EmployeeTable from './EmployeeTable'
import EmployeeModal from './EmployeeModal'
import AttendanceTab from './AttendanceTab'
import LeaveTab from './LeaveTab'
import PayrollTab from './PayrollTab'
import '../styles/Dashboard.css'

const API_BASE = 'http://localhost:3001'

export default function Dashboard({ onLogout }) {
  const [employees, setEmployees] = useState([])
  const [departments, setDepartments] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [activeTab, setActiveTab] = useState('employees')
  
  // Filters and pagination
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [search, setSearch] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [sortOrder, setSortOrder] = useState('asc')

  useEffect(() => {
    loadEmployees()
    loadDepartments()
  }, [page, limit, search, departmentFilter, statusFilter, sortBy, sortOrder])

  const loadEmployees = async () => {
    setLoading(true)
    try {
      const response = await fetch(
        `${API_BASE}/employees?page=${page}&limit=${limit}&search=${search}&department=${departmentFilter}&status=${statusFilter}&sortBy=${sortBy}&sortOrder=${sortOrder}`
      )
      const data = await response.json()
      if (data.success) {
        setEmployees(data.data)
      }
    } catch (error) {
      showNotification('Failed to load employees', 'error')
    } finally {
      setLoading(false)
    }
  }

  const loadDepartments = async () => {
    try {
      const response = await fetch(`${API_BASE}/departments`)
      const data = await response.json()
      if (data.success) {
        setDepartments(data.data)
      }
    } catch (error) {
      console.error('Failed to load departments')
    }
  }

  const handleAddEmployee = () => {
    setEditingEmployee(null)
    setShowModal(true)
  }

  const handleEditEmployee = (employee) => {
    setEditingEmployee(employee)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingEmployee(null)
  }

  const handleSaveEmployee = async (formData) => {
    try {
      const url = editingEmployee ? `${API_BASE}/updateEmployee/${editingEmployee._id}` : `${API_BASE}/addEmployee`
      const method = editingEmployee ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (data.success) {
        showNotification(
          editingEmployee ? 'Employee updated successfully' : 'Employee added successfully',
          'success'
        )
        handleCloseModal()
        loadEmployees()
      } else {
        console.error('Backend error:', data.message)
        showNotification(data.message || 'Failed to save employee', 'error')
      }
    } catch (error) {
      console.error('Request error:', error)
      showNotification('Error saving employee: ' + error.message, 'error')
    }
  }

  const handleDeleteEmployee = async (id) => {
    if (confirm('Are you sure you want to delete this employee?')) {
      try {
        const response = await fetch(`${API_BASE}/deleteEmployee/${id}`, { method: 'DELETE' })
        const data = await response.json()

        if (data.success) {
          showNotification('Employee deleted successfully', 'success')
          loadEmployees()
        } else {
          showNotification(data.message || 'Failed to delete employee', 'error')
        }
      } catch (error) {
        showNotification('Error deleting employee', 'error')
      }
    }
  }

  const showNotification = (msg, type) => {
    setMessage({ text: msg, type })
    setTimeout(() => setMessage(''), 3000)
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Employee Management System</h1>
          <button onClick={onLogout} className="btn-logout">Logout</button>
        </div>
      </header>

      {message && (
        <div className={`notification notification-${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="tab-navbar">
        <button 
          className={`nav-tab ${activeTab === 'employees' ? 'active' : ''}`}
          onClick={() => setActiveTab('employees')}
        >
          👥 Employees
        </button>
        <button 
          className={`nav-tab ${activeTab === 'attendance' ? 'active' : ''}`}
          onClick={() => setActiveTab('attendance')}
        >
          📋 Attendance
        </button>
        <button 
          className={`nav-tab ${activeTab === 'leave' ? 'active' : ''}`}
          onClick={() => setActiveTab('leave')}
        >
          🏖️ Leave
        </button>
        <button 
          className={`nav-tab ${activeTab === 'payroll' ? 'active' : ''}`}
          onClick={() => setActiveTab('payroll')}
        >
          💰 Payroll
        </button>
      </div>

      {activeTab === 'employees' && (
        <>
          <Statistics />

          <div className="dashboard-content">
            <div className="section-header">
              <h2>Employee Directory</h2>
              <button onClick={handleAddEmployee} className="btn-primary">
                + Add Employee
              </button>
            </div>

        <div className="filter-section">
          <div className="filter-group">
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="search-input"
            />
          </div>

          <div className="filter-group">
            <select
              value={departmentFilter}
              onChange={(e) => {
                setDepartmentFilter(e.target.value)
                setPage(1)
              }}
              className="filter-select"
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPage(1)
              }}
              className="filter-select"
            >
              <option value="">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div className="filter-group">
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value)
                setPage(1)
              }}
              className="filter-select"
            >
              <option value="name">Sort by Name</option>
              <option value="salary">Sort by Salary</option>
              <option value="joinDate">Sort by Join Date</option>
              <option value="email">Sort by Email</option>
            </select>
          </div>

          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="btn-sort"
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>

        {loading ? (
          <div className="loading">Loading employees...</div>
        ) : (
          <EmployeeTable
            employees={employees}
            onEdit={handleEditEmployee}
            onDelete={handleDeleteEmployee}
          />
        )}
      </div>
      </>
      )}

      {activeTab === 'attendance' && (
        <AttendanceTab />
      )}

      {activeTab === 'leave' && (
        <LeaveTab />
      )}

      {activeTab === 'payroll' && (
        <PayrollTab />
      )}

      {showModal && (
        <EmployeeModal
          employee={editingEmployee}
          departments={departments}
          onSave={handleSaveEmployee}
          onClose={handleCloseModal}
        />
      )}
    </div>
  )
}
