import React, { useState, useEffect } from 'react';
import '../styles/LeaveTab.css';

const API_BASE = 'http://localhost:3001';

export default function LeaveTab() {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState('');
  const [activeTab, setActiveTab] = useState('apply'); // apply, requests, manage
  const [currentAdmin, setCurrentAdmin] = useState('');

  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    leaveType: 'Casual',
    reason: ''
  });

  const [approvalData, setApprovalData] = useState({
    leaveId: '',
    approvalNotes: ''
  });

  const leaveTypes = ['Sick', 'Casual', 'Personal', 'Maternity', 'Paternity'];

  // Fetch employees on component mount
  useEffect(() => {
    fetchEmployees();
    const adminId = localStorage.getItem('adminId') || 'admin';
    setCurrentAdmin(adminId);
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await fetch(`${API_BASE}/employees`);
      const data = await response.json();
      if (data.success) {
        setEmployees(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      showNotification('Error fetching employees', 'error');
    }
  };

  const fetchLeaves = async (employeeId = '') => {
    setLoading(true);
    try {
      const url = employeeId
        ? `${API_BASE}/leave?employeeId=${employeeId}`
        : `${API_BASE}/leave`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.success) {
        setLeaves(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching leaves:', error);
      showNotification('Error fetching leave requests', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyLeave = async (e) => {
    e.preventDefault();

    if (!selectedEmployee) {
      showNotification('Please select an employee', 'error');
      return;
    }

    if (!formData.startDate || !formData.endDate) {
      showNotification('Please select start and end dates', 'error');
      return;
    }

    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      showNotification('End date must be after start date', 'error');
      return;
    }

    if (!formData.reason.trim()) {
      showNotification('Please provide a reason for leave', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/leave/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: selectedEmployee,
          startDate: formData.startDate,
          endDate: formData.endDate,
          leaveType: formData.leaveType,
          reason: formData.reason
        })
      });

      const data = await response.json();
      if (data.success) {
        showNotification('✓ Leave request submitted successfully', 'success');
        setFormData({ startDate: '', endDate: '', leaveType: 'Casual', reason: '' });
        setSelectedEmployee('');
        fetchLeaves();
      } else {
        showNotification(data.message || 'Error submitting leave request', 'error');
      }
    } catch (error) {
      console.error('Error applying leave:', error);
      showNotification('Error submitting leave request', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveLeave = async (leaveId) => {
    if (!approvalData.approvalNotes.trim()) {
      showNotification('Please add approval notes', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/leave/${leaveId}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approvedBy: currentAdmin,
          approvalNotes: approvalData.approvalNotes
        })
      });

      const data = await response.json();
      if (data.success) {
        showNotification('✓ Leave approved successfully', 'success');
        setApprovalData({ leaveId: '', approvalNotes: '' });
        fetchLeaves();
      } else {
        showNotification(data.message || 'Error approving leave', 'error');
      }
    } catch (error) {
      console.error('Error approving leave:', error);
      showNotification('Error approving leave', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectLeave = async (leaveId) => {
    if (!approvalData.approvalNotes.trim()) {
      showNotification('Please add rejection notes', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/leave/${leaveId}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approvedBy: currentAdmin,
          approvalNotes: approvalData.approvalNotes
        })
      });

      const data = await response.json();
      if (data.success) {
        showNotification('✓ Leave rejected successfully', 'success');
        setApprovalData({ leaveId: '', approvalNotes: '' });
        fetchLeaves();
      } else {
        showNotification(data.message || 'Error rejecting leave', 'error');
      }
    } catch (error) {
      console.error('Error rejecting leave:', error);
      showNotification('Error rejecting leave', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(''), 3000);
  };

  const getEmployeeName = (empId) => {
    const emp = employees.find(e => e._id === empId);
    return emp ? emp.name : 'Unknown';
  };

  const calculateLeaveDays = (startDate, endDate) => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
  };

  const pendingLeaves = leaves.filter(l => l.status === 'Pending');
  const approvedLeaves = leaves.filter(l => l.status === 'Approved');
  const rejectedLeaves = leaves.filter(l => l.status === 'Rejected');

  return (
    <div className="leave-tab">
      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}

      <div className="leave-header">
        <h2>🏖️ Leave Management</h2>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          className={`tab-button ${activeTab === 'apply' ? 'active' : ''}`}
          onClick={() => setActiveTab('apply')}
        >
          ✏️ Apply Leave
        </button>
        <button
          className={`tab-button ${activeTab === 'requests' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('requests');
            fetchLeaves();
          }}
        >
          📋 View Requests ({leaves.length})
        </button>
        <button
          className={`tab-button ${activeTab === 'manage' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('manage');
            fetchLeaves();
          }}
        >
          ⚙️ Manage ({pendingLeaves.length})
        </button>
      </div>

      {/* Apply Leave Tab */}
      {activeTab === 'apply' && (
        <div className="apply-leave-section">
          <h3>Submit Leave Request</h3>
          <form onSubmit={handleApplyLeave} className="leave-form">
            <div className="form-group">
              <label>Employee Name:</label>
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                required
              >
                <option value="">-- Select Employee --</option>
                {employees.map(emp => (
                  <option key={emp._id} value={emp._id}>
                    {emp.name} ({emp.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Leave Type:</label>
                <select
                  value={formData.leaveType}
                  onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}
                  required
                >
                  {leaveTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Start Date:</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>End Date:</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  required
                />
              </div>
            </div>

            {formData.startDate && formData.endDate && (
              <div className="leave-days-info">
                <strong>Leave Duration: {calculateLeaveDays(formData.startDate, formData.endDate)} day(s)</strong>
              </div>
            )}

            <div className="form-group">
              <label>Reason for Leave:</label>
              <textarea
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Please provide a reason for your leave request..."
                rows="4"
                required
              ></textarea>
            </div>

            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? '⏳ Submitting...' : '✓ Submit Leave Request'}
            </button>
          </form>
        </div>
      )}

      {/* View Requests Tab */}
      {activeTab === 'requests' && (
        <div className="requests-section">
          <h3>All Leave Requests</h3>
          {loading ? (
            <p className="loading">⏳ Loading...</p>
          ) : leaves.length > 0 ? (
            <div className="leaves-grid">
              {leaves.map(leave => (
                <div key={leave._id} className={`leave-card status-${leave.status.toLowerCase()}`}>
                  <div className="leave-card-header">
                    <h4>{getEmployeeName(leave.employeeId)}</h4>
                    <span className={`status-badge status-${leave.status.toLowerCase()}`}>
                      {leave.status}
                    </span>
                  </div>
                  <div className="leave-card-body">
                    <p><strong>Type:</strong> {leave.leaveType}</p>
                    <p><strong>Duration:</strong> {calculateLeaveDays(leave.startDate, leave.endDate)} days</p>
                    <p><strong>From:</strong> {new Date(leave.startDate).toLocaleDateString()}</p>
                    <p><strong>To:</strong> {new Date(leave.endDate).toLocaleDateString()}</p>
                    <p><strong>Reason:</strong> {leave.reason}</p>
                    {leave.approvalNotes && (
                      <p><strong>Notes:</strong> {leave.approvalNotes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-data">No leave requests found</p>
          )}
        </div>
      )}

      {/* Manage Requests Tab */}
      {activeTab === 'manage' && (
        <div className="manage-section">
          <h3>Approve/Reject Leave Requests</h3>

          {/* Pending Requests */}
          {pendingLeaves.length > 0 && (
            <div className="pending-section">
              <h4>⏳ Pending Requests ({pendingLeaves.length})</h4>
              <div className="leaves-grid">
                {pendingLeaves.map(leave => (
                  <div key={leave._id} className="leave-card pending-card">
                    <h4>{getEmployeeName(leave.employeeId)}</h4>
                    <p><strong>Type:</strong> {leave.leaveType}</p>
                    <p><strong>From:</strong> {new Date(leave.startDate).toLocaleDateString()} to {new Date(leave.endDate).toLocaleDateString()}</p>
                    <p><strong>Reason:</strong> {leave.reason}</p>

                    <div className="approval-form">
                      <textarea
                        placeholder="Add approval/rejection notes..."
                        rows="3"
                        value={approvalData.leaveId === leave._id ? approvalData.approvalNotes : ''}
                        onChange={(e) => setApprovalData({
                          leaveId: leave._id,
                          approvalNotes: e.target.value
                        })}
                      ></textarea>

                      <div className="action-buttons">
                        <button
                          className="btn-approve"
                          onClick={() => handleApproveLeave(leave._id)}
                          disabled={loading || approvalData.leaveId !== leave._id || !approvalData.approvalNotes.trim()}
                        >
                          ✓ Approve
                        </button>
                        <button
                          className="btn-reject"
                          onClick={() => handleRejectLeave(leave._id)}
                          disabled={loading || approvalData.leaveId !== leave._id || !approvalData.approvalNotes.trim()}
                        >
                          ✗ Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Approved Requests */}
          {approvedLeaves.length > 0 && (
            <div className="approved-section">
              <h4>✓ Approved Requests ({approvedLeaves.length})</h4>
              <div className="leaves-grid">
                {approvedLeaves.map(leave => (
                  <div key={leave._id} className="leave-card approved-card">
                    <h4>{getEmployeeName(leave.employeeId)}</h4>
                    <p><strong>Type:</strong> {leave.leaveType}</p>
                    <p><strong>Duration:</strong> {new Date(leave.startDate).toLocaleDateString()} to {new Date(leave.endDate).toLocaleDateString()}</p>
                    <p><strong>Approved By:</strong> {leave.approvedBy || 'N/A'}</p>
                    {leave.approvalDate && (
                      <p><strong>Approved On:</strong> {new Date(leave.approvalDate).toLocaleDateString()}</p>
                    )}
                    {leave.approvalNotes && (
                      <p><strong>Notes:</strong> {leave.approvalNotes}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rejected Requests */}
          {rejectedLeaves.length > 0 && (
            <div className="rejected-section">
              <h4>✗ Rejected Requests ({rejectedLeaves.length})</h4>
              <div className="leaves-grid">
                {rejectedLeaves.map(leave => (
                  <div key={leave._id} className="leave-card rejected-card">
                    <h4>{getEmployeeName(leave.employeeId)}</h4>
                    <p><strong>Type:</strong> {leave.leaveType}</p>
                    <p><strong>Requested:</strong> {new Date(leave.startDate).toLocaleDateString()} to {new Date(leave.endDate).toLocaleDateString()}</p>
                    {leave.approvalNotes && (
                      <p><strong>Reason:</strong> {leave.approvalNotes}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {pendingLeaves.length === 0 && approvedLeaves.length === 0 && rejectedLeaves.length === 0 && (
            <p className="no-data">No leave requests to manage</p>
          )}
        </div>
      )}
    </div>
  );
}
