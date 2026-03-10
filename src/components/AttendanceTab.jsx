import React, { useState, useEffect } from 'react';
import '../styles/AttendanceTab.css';

const API_BASE = 'http://localhost:3001';

export default function AttendanceTab() {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [attendanceReport, setAttendanceReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('record'); // record, history, report
  const [notification, setNotification] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Fetch employees on component mount
  useEffect(() => {
    fetchEmployees();
  }, []);

  // Fetch employees list
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

  // Handle check-in
  const handleCheckIn = async () => {
    if (!selectedEmployee) {
      showNotification('Please select an employee', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/attendance/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: selectedEmployee,
          date: selectedDate,
          checkIn: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
        })
      });

      const data = await response.json();
      if (data.success) {
        showNotification('✓ Check-in recorded successfully', 'success');
        fetchAttendanceRecords();
      } else {
        showNotification(data.message || 'Check-in failed', 'error');
      }
    } catch (error) {
      console.error('Error during check-in:', error);
      showNotification('Error recording check-in', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle check-out
  const handleCheckOut = async () => {
    if (!selectedEmployee) {
      showNotification('Please select an employee', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/attendance/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: selectedEmployee,
          date: selectedDate,
          checkOut: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
        })
      });

      const data = await response.json();
      if (data.success) {
        showNotification('✓ Check-out recorded successfully', 'success');
        fetchAttendanceRecords();
      } else {
        showNotification(data.message || 'Check-out failed', 'error');
      }
    } catch (error) {
      console.error('Error during check-out:', error);
      showNotification('Error recording check-out', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch attendance records
  const fetchAttendanceRecords = async () => {
    if (!selectedEmployee) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/attendance/${selectedEmployee}`);
      const data = await response.json();
      if (data.success) {
        setAttendanceRecords(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
      showNotification('Error fetching attendance records', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch attendance report
  const fetchAttendanceReport = async () => {
    if (!selectedEmployee) {
      showNotification('Please select an employee', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/attendance/report/${selectedEmployee}`);
      const data = await response.json();
      if (data.success) {
        setAttendanceReport(data.data || {});
        setAttendanceRecords(data.attendance || []);
      } else {
        showNotification(data.message || 'Error fetching report', 'error');
      }
    } catch (error) {
      console.error('Error fetching attendance report:', error);
      showNotification('Error fetching attendance report', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(''), 3000);
  };

  const handleEmployeeChange = (e) => {
    setSelectedEmployee(e.target.value);
    setAttendanceRecords([]);
  };

  const getEmployeeName = () => {
    const emp = employees.find(e => e._id === selectedEmployee);
    return emp ? emp.name : 'Unknown';
  };

  return (
    <div className="attendance-tab">
      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}

      {/* Employee Selection */}
      <div className="attendance-header">
        <h2>📋 Attendance Management</h2>
        <div className="employee-selector">
          <label>Select Employee:</label>
          <select value={selectedEmployee} onChange={handleEmployeeChange}>
            <option value="">-- Choose Employee --</option>
            {employees.map(emp => (
              <option key={emp._id} value={emp._id}>
                {emp.name} ({emp.email})
              </option>
            ))}
          </select>
        </div>

        {selectedEmployee && (
          <div className="date-selector">
            <label>Date:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
        )}
      </div>

      {selectedEmployee && (
        <>
          {/* Tab Navigation */}
          <div className="tab-navigation">
            <button
              className={`tab-button ${activeTab === 'record' ? 'active' : ''}`}
              onClick={() => setActiveTab('record')}
            >
              🔘 Record Attendance
            </button>
            <button
              className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('history');
                fetchAttendanceRecords();
              }}
            >
              📅 History
            </button>
            <button
              className={`tab-button ${activeTab === 'report' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('report');
                fetchAttendanceReport();
              }}
            >
              📊 Report
            </button>
          </div>

          {/* Record Attendance Tab */}
          {activeTab === 'record' && (
            <div className="attendance-record-section">
              <div className="employee-info">
                <h3>{getEmployeeName()}</h3>
                <p>Current Date: {new Date(selectedDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</p>
              </div>

              <div className="check-buttons">
                <button
                  className="btn-checkin"
                  onClick={handleCheckIn}
                  disabled={loading}
                >
                  {loading ? '⏳ Processing...' : '✓ Check In'}
                </button>
                <button
                  className="btn-checkout"
                  onClick={handleCheckOut}
                  disabled={loading}
                >
                  {loading ? '⏳ Processing...' : '✓ Check Out'}
                </button>
              </div>

              <div className="info-box">
                <p>💡 Click "Check In" when starting work and "Check Out" when leaving.</p>
                <p>Times are automatically recorded from your system clock.</p>
              </div>
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="attendance-history-section">
              <h3>Recent Attendance Records</h3>
              {loading ? (
                <p className="loading">⏳ Loading...</p>
              ) : attendanceRecords.length > 0 ? (
                <div className="attendance-table-container">
                  <table className="attendance-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Check In</th>
                        <th>Check Out</th>
                        <th>Status</th>
                        <th>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceRecords.map((record) => (
                        <tr key={record._id}>
                          <td>{new Date(record.date).toLocaleDateString()}</td>
                          <td>{record.checkIn || '-'}</td>
                          <td>{record.checkOut || '-'}</td>
                          <td>
                            <span className={`status-badge status-${record.status.toLowerCase()}`}>
                              {record.status}
                            </span>
                          </td>
                          <td>{record.notes || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="no-data">No attendance records found</p>
              )}
            </div>
          )}

          {/* Report Tab */}
          {activeTab === 'report' && (
            <div className="attendance-report-section">
              <h3>Attendance Report</h3>
              {loading ? (
                <p className="loading">⏳ Loading report...</p>
              ) : attendanceReport ? (
                <div className="report-container">
                  <div className="report-stats">
                    <div className="stat-card">
                      <h4>Total Days</h4>
                      <p className="stat-value">{attendanceReport.total || 0}</p>
                    </div>
                    <div className="stat-card">
                      <h4>Present</h4>
                      <p className="stat-value present">{attendanceReport.present || 0}</p>
                    </div>
                    <div className="stat-card">
                      <h4>Absent</h4>
                      <p className="stat-value absent">{attendanceReport.absent || 0}</p>
                    </div>
                    <div className="stat-card">
                      <h4>Late</h4>
                      <p className="stat-value late">{attendanceReport.late || 0}</p>
                    </div>
                    <div className="stat-card">
                      <h4>Attendance %</h4>
                      <p className="stat-value percentage">{attendanceReport.percentage || 0}%</p>
                    </div>
                  </div>

                  {attendanceRecords.length > 0 && (
                    <div className="detailed-records">
                      <h4>Detailed Records</h4>
                      <div className="attendance-table-container">
                        <table className="attendance-table">
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th>Check In</th>
                              <th>Check Out</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {attendanceRecords.map((record) => (
                              <tr key={record._id}>
                                <td>{new Date(record.date).toLocaleDateString()}</td>
                                <td>{record.checkIn || '-'}</td>
                                <td>{record.checkOut || '-'}</td>
                                <td>
                                  <span className={`status-badge status-${record.status.toLowerCase()}`}>
                                    {record.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="no-data">No report data available</p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
