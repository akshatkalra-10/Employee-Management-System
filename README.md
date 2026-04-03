# Employee Management System

A modern, full-stack employee management application built with **React**, **Node.js/Express**, and **MongoDB**.

## Features

### Backend (Enhanced)
- ✅ User authentication with login credentials
- ✅ Complete CRUD operations for employees
- ✅ Advanced search and filtering
- ✅ Pagination support
- ✅ Sorting capabilities
- ✅ Employee statistics and analytics
- ✅ Department management
- ✅ Comprehensive error handling
- ✅ RESTful API endpoints

### Frontend (React)
- ✅ Modern, responsive UI with gradient design
- ✅ Authentication page with form validation
- ✅ Dashboard with statistics (total, active, inactive, avg salary)
- ✅ Employee directory with advanced filtering
- ✅ Search by name, email, or phone
- ✅ Filter by department and status
- ✅ Sort employees by name, salary, join date, or email
- ✅ Add new employees via modal form
- ✅ Edit existing employee information
- ✅ Delete employees with confirmation
- ✅ Real-time notifications for actions
- ✅ Department breakdown statistics
- ✅ Fully responsive design
- ✅ Smooth animations and transitions

## Employee Data Model

Each employee contains:
- Full Name
- Email (unique)
- Phone Number
- Department
- Position
- Salary
- Join Date
- Status (Active/Inactive)
- Address
- Timestamps (created/updated)

## API Endpoints

### Authentication
- `POST /login` - User login

### Employee Management
- `POST /addEmployee` - Add new employee
- `GET /employees` - Get employees (with filters, search, pagination, sorting)
- `GET /employees/:id` - Get single employee
- `PUT /updateEmployee/:id` - Update employee
- `DELETE /deleteEmployee/:id` - Delete employee

### Analytics
- `GET /statistics` - Get employee statistics
- `GET /departments` - Get all departments

## Query Parameters for GET /employees

- `page` (default: 1) - Page number for pagination
- `limit` (default: 10) - Items per page
- `search` - Search in name, email, phone
- `department` - Filter by department
- `status` - Filter by status (Active/Inactive)
- `sortBy` (default: name) - Sort field (name, salary, joinDate, email)
- `sortOrder` (default: asc) - Sort order (asc/desc)

## Setup Instructions

### Prerequisites
- Node.js (v14+)
- npm or yarn
- MongoDB Atlas account

### Installation

1. **Navigate to project directory**
   ```bash
   cd "c:\Users\kalra\OneDrive\Desktop\NOSQL_PROJECT"
   ```

2. **Dependencies are already installed** (if not, run):
   ```bash
   npm install
   ```

3. **Configure MongoDB connection**
   - Create a `.env` file in the project root
   - Add your Atlas URI:
   ```env
   MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/<database>?retryWrites=true&w=majority
   ```

## Running the Application

### Start Backend Server (Required)
In one terminal, run:
```bash
node "index (1).js"
```
Server will run on: `http://localhost:3001`

### Start React Development Server (In another terminal)
```bash
npm run dev
```
React app will run on: `http://localhost:3000`

### Build for Production
```bash
npm run build
```
Outputs to `dist/` folder

### Preview Production Build
```bash
npm run preview
```

## Login Credentials

Use these credentials to login:
- **Username:** `admin`
- **Password:** `admin123`

## Project Structure

```
NOSQL_PROJECT/
├── src/
│   ├── components/
│   │   ├── Login.jsx           # Login page component
│   │   ├── Dashboard.jsx       # Main dashboard
│   │   ├── EmployeeTable.jsx   # Employee table display
│   │   ├── EmployeeModal.jsx   # Add/Edit employee modal
│   │   └── Statistics.jsx      # Dashboard statistics
│   ├── api/
│   │   └── api.js              # API calls configuration
│   ├── styles/
│   │   ├── App.css             # Global styles
│   │   ├── Login.css           # Login page styles
│   │   ├── Dashboard.css       # Dashboard styles
│   │   ├── EmployeeTable.css   # Table styles
│   │   ├── EmployeeModal.css   # Modal styles
│   │   └── Statistics.css      # Statistics styles
│   ├── App.jsx                 # Main app component
│   └── main.jsx                # React entry point
├── models/
│   └── employee.js             # MongoDB schema
├── public/
│   ├── login.html              # Static login (legacy)
│   └── dashboard.html          # Static dashboard (legacy)
├── index (1).js                # Express backend server
├── index.html                  # React HTML template
├── vite.config.js              # Vite configuration
├── package.json                # Dependencies
└── README.md                   # This file
```

## Advanced Features

### Search and Filter
All in one interface:
- Real-time search across name, email, and phone
- Filter by department (dropdown with available departments)
- Filter by employee status (Active/Inactive)
- Sort by multiple fields with ascending/descending toggle

### Statistics Dashboard
Displays:
- Total employees count
- Active employees count with percentage
- Inactive employees count with percentage
- Average salary calculation
- Employee distribution by department

### Form Validation
- Required field validation
- Email format validation
- Salary numeric validation
- Real-time error messages
- Clear validation feedback

### Notifications
- Success notifications for add/update/delete
- Error notifications with messages
- Auto-dismiss after 3 seconds
- Positioned notifications

### Responsive Design
- Mobile-friendly layout
- Tablet optimization
- Desktop full experience
- Touch-friendly buttons
- Accessible form inputs

## Technologies Used

### Frontend
- **React 18** - UI library
- **Vite** - Build tool & dev server
- **Axios** - HTTP client (via fetch API in this version)
- **CSS3** - Styling with animations
- **JavaScript ES6+** - Modern JavaScript

### Backend
- **Node.js** - Runtime
- **Express.js** - Web framework
- **Mongoose** - MongoDB ODM
- **CORS** - Cross-origin resource sharing

### Database
- **MongoDB Atlas** - Cloud database
- **Mongoose Schema** - Data modeling

## Error Handling
- Backend validation for all inputs
- Proper HTTP status codes
- User-friendly error messages
- Network error handling
- Form validation before submission

## Performance Optimizations
- Pagination to handle large datasets
- Sorted results
- Filtered results
- Lazy loading with modal dialogs
- CSS transitions and animations
- React component optimization

## Browser Support
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Troubleshooting

### Port Already in Use
If `localhost:3001` or `localhost:3000` is already in use, modify:
- Backend: Change port in `index (1).js` (line: `app.listen(3001, ...)`)
- Frontend: Modify `vite.config.js` (change `port: 3000`)

### MongoDB Connection Error
- Verify internet connection
- Check if MongoDB Atlas connection string is valid
- IP whitelist the connecting machine in MongoDB Atlas

### React Dev Server Not Starting
```bash
npm run dev -- --port 3001
```

### Build Issues
```bash
rm -rf node_modules
npm install
npm run build
```

## Future Enhancements
- User role-based access control
- Employee profile pictures
- Salary history tracking
- Performance reviews
- Attendance tracking
- Export to CSV/PDF
- Email notifications
- Dark mode theme
- Advanced analytics charts
- Multi-language support

## License
MIT License

## Support
For issues or questions, refer to the project documentation.
