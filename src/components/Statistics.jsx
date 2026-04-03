import { useState, useEffect } from 'react'
import '../styles/Statistics.css'

const API_BASE = 'http://localhost:3001'

export default function Statistics() {
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    avgSalary: 0,
    departments: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStatistics()
  }, [])

  const loadStatistics = async () => {
    try {
      const response = await fetch(`${API_BASE}/statistics`)
      const data = await response.json()

      if (data.success) {
        setStats(data.data)
      }
    } catch (error) {
      console.error('Failed to load statistics')
    } finally {
      setLoading(false)
    }
  }

  const formatSalary = (salary) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(salary)
  }

  if (loading) {
    return <div className="statistics loading">Loading...</div>
  }

  return (
    <div className="statistics">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon total">👥</div>
          <div className="stat-content">
            <h3>Total Employees</h3>
            <p className="stat-value">{stats.total}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon active">✅</div>
          <div className="stat-content">
            <h3>Active</h3>
            <p className="stat-value">{stats.active}</p>
            <span className="stat-percent">
              {stats.total ? ((stats.active / stats.total) * 100).toFixed(1) : 0}%
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon inactive">❌</div>
          <div className="stat-content">
            <h3>Inactive</h3>
            <p className="stat-value">{stats.inactive}</p>
            <span className="stat-percent">
              {stats.total ? ((stats.inactive / stats.total) * 100).toFixed(1) : 0}%
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon salary">💰</div>
          <div className="stat-content">
            <h3>Avg Salary</h3>
            <p className="stat-value">{formatSalary(stats.avgSalary)}</p>
          </div>
        </div>
      </div>

      {stats.departments && stats.departments.length > 0 && (
        <div className="departments-section">
          <h3>Employees by Department</h3>
          <div className="departments-grid">
            {stats.departments.map((dept, index) => (
              <div key={index} className="dept-badge">
                <span className="dept-name">{dept._id}</span>
                <span className="dept-count">{dept.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
