import { Navigate } from 'react-router-dom';

function PublicRoute({ children }) {
  // Check if user is already logged in (both user and token required)
  const user = localStorage.getItem('user');
  const token = localStorage.getItem('token');
  
  if (user && token) {
    // Redirect to dashboard if already authenticated
    return <Navigate to="/dashboard" replace />;
  }
  
  // User is not logged in, render the public component (signin/signup)
  return children;
}

export default PublicRoute;

