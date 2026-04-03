# Advanced HR Features Documentation

## Overview
Your Employee Management System has been enhanced with 6 advanced HR modules that make it a complete enterprise-level HR system.

---

## 1️⃣ Employee Profile Image Upload

### Purpose
Upload and store employee profile photos for identification and HR records.

### API Endpoint
```
POST /uploadProfile/:id
Content-Type: multipart/form-data
```

### Request Parameters
- **id**: Employee ID (in URL path)
- **profileImage**: Image file (in form data)

### Example Request
```bash
curl -X POST http://localhost:3001/uploadProfile/employee123 \
  -F "profileImage=@photo.jpg"
```

### Response
```json
{
  "success": true,
  "message": "Profile image uploaded successfully",
  "data": {
    "_id": "employee123",
    "name": "John Doe",
    "profileImage": "/uploads/1234567890.jpg"
  }
}
```

### Features
✅ Stores images in `/uploads` folder  
✅ Auto-generates unique filename  
✅ Updates employee schema with image path  
✅ Supports JPG, PNG, GIF formats

---

## 2️⃣ Attendance Management System

### Purpose
Track daily employee attendance with check-in/check-out times and generate reports.

### API Endpoints

#### Check-In
```
POST /attendance/checkin
```
**Request Body**
```json
{
  "employeeId": "employee123",
  "date": "2024-03-10",
  "checkIn": "09:30 AM"  // optional, auto-generated if not provided
}
```

#### Check-Out
```
POST /attendance/checkout
```
**Request Body**
```json
{
  "employeeId": "employee123",
  "date": "2024-03-10",
  "checkOut": "05:30 PM"  // optional, auto-generated if not provided
}
```

#### Get Attendance Records
```
GET /attendance/:employeeId?startDate=2024-03-01&endDate=2024-03-31
```

#### Get Attendance Report
```
GET /attendance/report/:employeeId
```

### Response Example (Report)
```json
{
  "success": true,
  "data": {
    "total": 20,
    "present": 18,
    "absent": 1,
    "late": 1,
    "percentage": 90.00
  },
  "attendance": [
    {
      "_id": "...",
      "employeeId": "employee123",
      "date": "2024-03-10",
      "checkIn": "09:30 AM",
      "checkOut": "05:30 PM",
      "status": "Present"
    }
  ]
}
```

### Status Options
- **Present** - Marked present
- **Absent** - Did not check in
- **Late** - Checked in after designated time
- **Leave** - On approved leave

### Key Features
✅ Daily check-in/check-out tracking  
✅ Automatic time recording  
✅ Attendance percentage calculation  
✅ Date range filtering  
✅ Monthly/yearly reports

---

## 3️⃣ Leave Management System

### Purpose
Request, approve, and track employee leave applications.

### API Endpoints

#### Apply for Leave
```
POST /leave/apply
```
**Request Body**
```json
{
  "employeeId": "employee123",
  "startDate": "2024-03-15",
  "endDate": "2024-03-20",
  "leaveType": "Casual",
  "reason": "Family vacation"
}
```

#### Get All Leave Requests
```
GET /leave?employeeId=employee123&status=Pending
```

#### Approve Leave
```
PUT /leave/:leaveId/approve
```
**Request Body**
```json
{
  "approvedBy": "admin123",
  "approvalNotes": "Approved"
}
```

#### Reject Leave
```
PUT /leave/:leaveId/reject
```
**Request Body**
```json
{
  "approvedBy": "admin123",
  "approvalNotes": "Already approved leave for same period"
}
```

### Leave Types
- **Sick** - Medical leave
- **Casual** - General purpose
- **Personal** - Personal reasons
- **Maternity** - Maternity leave
- **Paternity** - Paternity leave

### Status Flow
1. **Pending** - Initial state when applied
2. **Approved** - Manager approved
3. **Rejected** - Manager rejected

### Features
✅ Multiple leave types  
✅ Auto-calculation of leave duration  
✅ Approval workflow  
✅ Leave balance tracking  
✅ Notification system ready

---

## 4️⃣ Salary & Payroll Module

### Purpose
Generate and manage employee salaries and payroll records.

### API Endpoints

#### Generate Payroll
```
POST /payroll/generate
```
**Request Body**
```json
{
  "employeeId": "employee123",
  "month": "2024-03",
  "bonus": 5000,
  "deductions": 2000,
  "taxDeduction": 3000
}
```

**Formula**
```
Net Salary = Base Salary + Bonus - Deductions - Tax Deduction
```

#### Get Payroll Records
```
GET /payroll/:employeeId
```

#### Mark Payroll as Paid
```
PUT /payroll/:payrollId/mark-paid
```

### Response Example
```json
{
  "success": true,
  "data": [
    {
      "_id": "payroll123",
      "employeeId": "employee123",
      "month": "2024-03",
      "baseSalary": 50000,
      "bonus": 5000,
      "deductions": 2000,
      "taxDeduction": 3000,
      "netSalary": 50000,
      "status": "Pending",
      "paymentDate": null
    }
  ]
}
```

### Payroll Status
- **Pending** - Generated, not yet paid
- **Processed** - Approved for payment
- **Paid** - Payment processed

### Features
✅ Monthly salary generation  
✅ Bonus and deductions tracking  
✅ Tax calculation  
✅ Payment status management  
✅ Historical records  
✅ Salary slip generation ready

---

## 5️⃣ Export Data to CSV/PDF/Excel

### Purpose
Download employee records in multiple formats for reports and analysis.

### API Endpoints

#### Export to CSV
```
GET /export/employees/csv
```
Downloads: `employees.csv`

#### Export to Excel
```
GET /export/employees/excel
```
Downloads: `employees.xlsx`

**Features**
- Formatted headers with colors
- Proper column widths
- Professional styling
- All employee fields included

#### Export to PDF
```
GET /export/employees/pdf
```
Downloads: `employees.pdf`

**Features**
- Professional layout
- Employee details formatted
- Generated timestamp
- Numbered list

### Usage Example
```bash
# Download CSV
curl http://localhost:3001/export/employees/csv > employees.csv

# Download Excel
curl http://localhost:3001/export/employees/excel > employees.xlsx

# Download PDF
curl http://localhost:3001/export/employees/pdf > employees.pdf
```

### Included Fields
- Employee ID
- Name
- Email
- Phone
- Department
- Position
- Salary
- Join Date
- Status
- Address

### Excel Features
✅ Formatted headers  
✅ Auto-width columns  
✅ Color-coded  
✅ Professional appearance  
✅ Easy to read and print

### PDF Features
✅ Professional layout  
✅ Address/contact info  
✅ Generation timestamp  
✅ Print-ready format  
✅ Numbered entries

---

## Database Schemas

### Attendance Schema
```javascript
{
  employeeId: ObjectId (ref: Employee),
  date: Date,
  checkIn: String,
  checkOut: String,
  status: String (enum: Present, Absent, Late, Leave),
  notes: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Leave Schema
```javascript
{
  employeeId: ObjectId (ref: Employee),
  startDate: Date,
  endDate: Date,
  leaveType: String (enum: Sick, Casual, Personal, Maternity, Paternity),
  reason: String,
  status: String (enum: Pending, Approved, Rejected),
  approvedBy: ObjectId (ref: Employee),
  approvalDate: Date,
  approvalNotes: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Payroll Schema
```javascript
{
  employeeId: ObjectId (ref: Employee),
  month: String (YYYY-MM),
  baseSalary: Number,
  bonus: Number,
  deductions: Number,
  taxDeduction: Number,
  netSalary: Number,
  paymentDate: Date,
  status: String (enum: Pending, Processed, Paid),
  bankDetails: String,
  notes: String,
  createdAt: Date,
  updatedAt: Date
}
```

---

## Project Structure
```
NOSQL_PROJECT/
├── models/
│   ├── employee.js          # Updated with profileImage field
│   ├── attendance.js        # NEW - Attendance tracking
│   ├── leave.js             # NEW - Leave management
│   └── payroll.js           # NEW - Salary/payroll
├── uploads/                 # NEW - Profile images storage
├── index (1).js             # Updated backend with all new APIs
├── package.json             # Updated with new dependencies
└── src/                     # React frontend (unchanged)
```

---

## Next Steps for Frontend Integration

To fully utilize these features, you can add React components for:

1. **Profile Image Upload**
   - Image upload form
   - Image preview
   - Edit profile modal

2. **Attendance Dashboard**
   - Daily check-in/check-out buttons
   - Attendance calendar
   - Monthly/weekly reports

3. **Leave Management**
   - Leave application form
   - Leave calendar
   - Approval management interface

4. **Payroll Dashboard**
   - Payroll slip viewing
   - Salary history
   - Payment tracking

5. **Export Section**
   - Export buttons for CSV/PDF/Excel
   - Report generation interface
   - Schedule automatic exports

---

## Testing with cURL

```bash
# Check-in
curl -X POST http://localhost:3001/attendance/checkin \
  -H "Content-Type: application/json" \
  -d '{"employeeId":"emp123","date":"2024-03-10"}'

# Apply for leave
curl -X POST http://localhost:3001/leave/apply \
  -H "Content-Type: application/json" \
  -d '{
    "employeeId":"emp123",
    "startDate":"2024-03-15",
    "endDate":"2024-03-20",
    "leaveType":"Casual",
    "reason":"Vacation"
  }'

# Generate payroll
curl -X POST http://localhost:3001/payroll/generate \
  -H "Content-Type: application/json" \
  -d '{
    "employeeId":"emp123",
    "month":"2024-03",
    "bonus":5000
  }'

# Export CSV
curl http://localhost:3001/export/employees/csv -o employees.csv
```

---

## Features Summary

| Feature | Status | Key Endpoints | Benefits |
|---------|--------|---------------|----------|
| Profile Images | ✅ Complete | POST /uploadProfile | Professional appearance |
| Attendance | ✅ Complete | /attendance/* | Track work hours |
| Leave Management | ✅ Complete | /leave/* | HR compliance |
| Payroll | ✅ Complete | /payroll/* | Salary management |
| Export | ✅ Complete | /export/* | Reporting tools |

---

Your HR system is now **enterprise-grade**! 🚀
