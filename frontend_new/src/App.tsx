import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthPage from './components/Auth/AuthPage';
import DashboardLayout from './components/Layout/DashboardLayout';
import DashboardHome from './components/Dashboard/DashboardHome';
import EmployeeDirectory from './components/Employees/EmployeeDirectory';
import AttendanceTracker from './components/Attendance/AttendanceTracker';
import LeaveManagement from './components/Leave/LeaveManagement';
import PayrollManagement from './components/Payroll/PayrollManagement';
import AnalyticsDashboard from './components/Analytics/AnalyticsDashboard';

function AppContent() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardHome />;
      case 'employees':
        return <EmployeeDirectory />;
      case 'attendance':
        return <AttendanceTracker />;
      case 'leaves':
        return <LeaveManagement />;
      case 'payroll':
        return <PayrollManagement />;
      case 'analytics':
        return <AnalyticsDashboard />;
      default:
        return <DashboardHome />;
    }
  };

  return (
    <DashboardLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </DashboardLayout>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
