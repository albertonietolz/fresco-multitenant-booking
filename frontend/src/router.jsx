import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import BookingPage from './pages/BookingPage';
import EmployeePage from './pages/EmployeePage';

function ProtectedRoute() {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return <Outlet />;
}

const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/login" replace /> },
  { path: '/login', element: <AuthPage /> },
  { path: '/booking/:slug', element: <BookingPage /> },
  { path: '/emp/:slug', element: <EmployeePage /> },
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/dashboard', element: <DashboardPage /> },
    ],
  },
]);

export default router;
