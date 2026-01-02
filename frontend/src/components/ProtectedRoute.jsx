import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children }) {
  // Check if user is logged in by checking both user and token
  const user = localStorage.getItem('user');
  const token = localStorage.getItem('token');
  
  if (!user || !token) {
    // Redirect to sign in if not authenticated
    return <Navigate to="/signin" replace />;
  }
  
  // User is authenticated, render the protected component
  return children;
}

export default ProtectedRoute;

