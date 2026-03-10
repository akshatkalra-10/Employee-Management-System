import '../styles/EmployeeTable.css'

export default function EmployeeTable({ employees, onEdit, onDelete }) {
  const formatSalary = (salary) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(salary)
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (employees.length === 0) {
    return (
      <div className="no-data">
        <p>No employees found. Add your first employee to get started.</p>
      </div>
    )
  }

  return (
    <div className="table-container">
      <table className="employee-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Department</th>
            <th>Position</th>
            <th>Salary</th>
            <th>Join Date</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {employees.map(employee => (
            <tr key={employee._id} className={`status-${employee.status.toLowerCase()}`}>
              <td className="name-cell">{employee.name}</td>
              <td className="email-cell">{employee.email}</td>
              <td>{employee.phone || '-'}</td>
              <td><span className="badge badge-dept">{employee.department}</span></td>
              <td>{employee.position || '-'}</td>
              <td className="salary-cell">{formatSalary(employee.salary)}</td>
              <td>{formatDate(employee.joinDate)}</td>
              <td>
                <span className={`badge badge-${employee.status.toLowerCase()}`}>
                  {employee.status}
                </span>
              </td>
              <td className="actions-cell">
                <button
                  onClick={() => onEdit(employee)}
                  className="btn-action btn-edit"
                  title="Edit employee"
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={() => onDelete(employee._id)}
                  className="btn-action btn-delete"
                  title="Delete employee"
                >
                  🗑️ Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
