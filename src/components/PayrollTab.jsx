import React, { useState, useEffect } from 'react';
import '../styles/PayrollTab.css';

const API_BASE = 'http://localhost:3001';

export default function PayrollTab() {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState('');
  const [activeTab, setActiveTab] = useState('generate'); // generate, history

  const [formData, setFormData] = useState({
    month: '',
    bonus: 0,
    deductions: 0,
    taxDeduction: 0
  });

  // Fetch employees on component mount
  useEffect(() => {
    fetchEmployees();
    // Set default month to current month
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    setFormData(prev => ({ ...prev, month }));
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

  const fetchPayrolls = async (employeeId) => {
    if (!employeeId) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/payroll/${employeeId}`);
      const data = await response.json();
      if (data.success) {
        setPayrolls(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching payrolls:', error);
      showNotification('Error fetching payroll records', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePayroll = async (e) => {
    e.preventDefault();

    if (!selectedEmployee) {
      showNotification('Please select an employee', 'error');
      return;
    }

    if (!formData.month) {
      showNotification('Please select a month', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/payroll/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: selectedEmployee,
          month: formData.month,
          bonus: parseFloat(formData.bonus) || 0,
          deductions: parseFloat(formData.deductions) || 0,
          taxDeduction: parseFloat(formData.taxDeduction) || 0
        })
      });

      const data = await response.json();
      if (data.success) {
        showNotification('✓ Payroll generated successfully', 'success');
        setFormData(prev => ({ ...prev, bonus: 0, deductions: 0, taxDeduction: 0 }));
        fetchPayrolls(selectedEmployee);
      } else {
        showNotification(data.message || 'Error generating payroll', 'error');
      }
    } catch (error) {
      console.error('Error generating payroll:', error);
      showNotification('Error generating payroll', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async (payrollId) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/payroll/${payrollId}/mark-paid`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();
      if (data.success) {
        showNotification('✓ Payroll marked as paid', 'success');
        if (selectedEmployee) {
          fetchPayrolls(selectedEmployee);
        }
      } else {
        showNotification(data.message || 'Error updating payroll', 'error');
      }
    } catch (error) {
      console.error('Error marking payroll as paid:', error);
      showNotification('Error updating payroll status', 'error');
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
    if (e.target.value) {
      fetchPayrolls(e.target.value);
    }
  };

  const getEmployeeName = () => {
    const emp = employees.find(e => e._id === selectedEmployee);
    return emp ? emp.name : 'Unknown';
  };

  const getEmployeeBaseSalary = () => {
    const emp = employees.find(e => e._id === selectedEmployee);
    return emp ? emp.salary : 0;
  };

  const calculateNetSalary = () => {
    const baseSalary = getEmployeeBaseSalary();
    const bonus = parseFloat(formData.bonus) || 0;
    const deductions = parseFloat(formData.deductions) || 0;
    const taxDeduction = parseFloat(formData.taxDeduction) || 0;
    return baseSalary + bonus - deductions - taxDeduction;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const pendingPayrolls = payrolls.filter(p => p.status === 'Pending');
  const processedPayrolls = payrolls.filter(p => p.status === 'Processed');
  const paidPayrolls = payrolls.filter(p => p.status === 'Paid');

  return (
    <div className="payroll-tab">
      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}

      <div className="payroll-header">
        <h2>💰 Salary & Payroll Management</h2>
      </div>

      {/* Employee Selection */}
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
        <>
          {/* Tab Navigation */}
          <div className="tab-navigation">
            <button
              className={`tab-button ${activeTab === 'generate' ? 'active' : ''}`}
              onClick={() => setActiveTab('generate')}
            >
              ➕ Generate Payroll
            </button>
            <button
              className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('history');
                fetchPayrolls(selectedEmployee);
              }}
            >
              📊 History
            </button>
          </div>

          {/* Generate Payroll Tab */}
          {activeTab === 'generate' && (
            <div className="generate-payroll-section">
              <h3>Generate Payroll for {getEmployeeName()}</h3>

              <div className="employee-salary-info">
                <div className="info-card">
                  <h4>Base Salary</h4>
                  <p className="salary-value">{formatCurrency(getEmployeeBaseSalary())}</p>
                </div>
              </div>

              <form onSubmit={handleGeneratePayroll} className="payroll-form">
                <div className="form-group">
                  <label>Month:</label>
                  <input
                    type="month"
                    value={formData.month}
                    onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Bonus:</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.bonus}
                      onChange={(e) => setFormData({ ...formData, bonus: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="form-group">
                    <label>Deductions:</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.deductions}
                      onChange={(e) => setFormData({ ...formData, deductions: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Tax Deduction:</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.taxDeduction}
                      onChange={(e) => setFormData({ ...formData, taxDeduction: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Salary Calculation */}
                <div className="salary-calculation">
                  <div className="calc-row">
                    <span>Base Salary:</span>
                    <span>{formatCurrency(getEmployeeBaseSalary())}</span>
                  </div>
                  {formData.bonus > 0 && (
                    <div className="calc-row">
                      <span>+ Bonus:</span>
                      <span className="positive">{formatCurrency(formData.bonus)}</span>
                    </div>
                  )}
                  {formData.deductions > 0 && (
                    <div className="calc-row">
                      <span>- Deductions:</span>
                      <span className="negative">{formatCurrency(formData.deductions)}</span>
                    </div>
                  )}
                  {formData.taxDeduction > 0 && (
                    <div className="calc-row">
                      <span>- Tax Deduction:</span>
                      <span className="negative">{formatCurrency(formData.taxDeduction)}</span>
                    </div>
                  )}
                  <div className="calc-row total">
                    <span>Net Salary:</span>
                    <span>{formatCurrency(calculateNetSalary())}</span>
                  </div>
                </div>

                <button type="submit" className="btn-submit" disabled={loading}>
                  {loading ? '⏳ Generating...' : '✓ Generate Payroll'}
                </button>
              </form>
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="payroll-history-section">
              <h3>Payroll History for {getEmployeeName()}</h3>

              {loading ? (
                <p className="loading">⏳ Loading...</p>
              ) : (
                <>
                  {/* Pending Payrolls */}
                  {pendingPayrolls.length > 0 && (
                    <div className="payroll-section pending-section">
                      <h4>⏳ Pending ({pendingPayrolls.length})</h4>
                      <div className="payroll-grid">
                        {pendingPayrolls.map(payroll => (
                          <div key={payroll._id} className="payroll-card pending-card">
                            <div className="payroll-header-info">
                              <h5>{payroll.month}</h5>
                              <span className="status-badge pending">Pending</span>
                            </div>
                            <div className="payroll-details">
                              <p><strong>Base Salary:</strong> {formatCurrency(payroll.baseSalary)}</p>
                              {payroll.bonus > 0 && <p><strong>Bonus:</strong> {formatCurrency(payroll.bonus)}</p>}
                              {payroll.deductions > 0 && <p><strong>Deductions:</strong> {formatCurrency(payroll.deductions)}</p>}
                              {payroll.taxDeduction > 0 && <p><strong>Tax:</strong> {formatCurrency(payroll.taxDeduction)}</p>}
                              <div className="payroll-total">
                                <strong>Net Salary: {formatCurrency(payroll.netSalary)}</strong>
                              </div>
                            </div>
                            <button
                              className="btn-mark-paid"
                              onClick={() => handleMarkAsPaid(payroll._id)}
                              disabled={loading}
                            >
                              ✓ Mark as Paid
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Processed Payrolls */}
                  {processedPayrolls.length > 0 && (
                    <div className="payroll-section processed-section">
                      <h4>⚙️ Processed ({processedPayrolls.length})</h4>
                      <div className="payroll-grid">
                        {processedPayrolls.map(payroll => (
                          <div key={payroll._id} className="payroll-card processed-card">
                            <div className="payroll-header-info">
                              <h5>{payroll.month}</h5>
                              <span className="status-badge processed">Processed</span>
                            </div>
                            <div className="payroll-details">
                              <p><strong>Base Salary:</strong> {formatCurrency(payroll.baseSalary)}</p>
                              {payroll.bonus > 0 && <p><strong>Bonus:</strong> {formatCurrency(payroll.bonus)}</p>}
                              {payroll.deductions > 0 && <p><strong>Deductions:</strong> {formatCurrency(payroll.deductions)}</p>}
                              {payroll.taxDeduction > 0 && <p><strong>Tax:</strong> {formatCurrency(payroll.taxDeduction)}</p>}
                              <div className="payroll-total">
                                <strong>Net Salary: {formatCurrency(payroll.netSalary)}</strong>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Paid Payrolls */}
                  {paidPayrolls.length > 0 && (
                    <div className="payroll-section paid-section">
                      <h4>✓ Paid ({paidPayrolls.length})</h4>
                      <div className="payroll-grid">
                        {paidPayrolls.map(payroll => (
                          <div key={payroll._id} className="payroll-card paid-card">
                            <div className="payroll-header-info">
                              <h5>{payroll.month}</h5>
                              <span className="status-badge paid">Paid</span>
                            </div>
                            <div className="payroll-details">
                              <p><strong>Base Salary:</strong> {formatCurrency(payroll.baseSalary)}</p>
                              {payroll.bonus > 0 && <p><strong>Bonus:</strong> {formatCurrency(payroll.bonus)}</p>}
                              {payroll.deductions > 0 && <p><strong>Deductions:</strong> {formatCurrency(payroll.deductions)}</p>}
                              {payroll.taxDeduction > 0 && <p><strong>Tax:</strong> {formatCurrency(payroll.taxDeduction)}</p>}
                              <div className="payroll-total">
                                <strong>Net Salary: {formatCurrency(payroll.netSalary)}</strong>
                              </div>
                              {payroll.paymentDate && (
                                <p className="payment-date">
                                  <strong>Paid on:</strong> {new Date(payroll.paymentDate).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {payrolls.length === 0 && (
                    <p className="no-data">No payroll records found for this employee</p>
                  )}
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
