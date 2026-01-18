import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './toast.css';
import { DarkModeProvider, useDarkMode } from './contexts/DarkModeContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import LandingPage from './pages/LandingPage';
import SignUp from './pages/SignUp';
import SignIn from './pages/SignIn';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';

function ToastWrapper() {
  const { darkMode } = useDarkMode();
  return (
    <ToastContainer
      position="top-right"
      autoClose={5000}
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme={darkMode ? 'dark' : 'light'}
      className="toast-container"
    />
  );
}

function App() {
  return (
    <DarkModeProvider>
      <CurrencyProvider>
        <Router basename="/personal-dashboard">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route 
              path="/signup" 
              element={
                <PublicRoute>
                  <SignUp />
                </PublicRoute>
              } 
            />
            <Route 
              path="/signin" 
              element={
                <PublicRoute>
                  <SignIn />
                </PublicRoute>
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
          </Routes>
          <ToastWrapper />
        </Router>
      </CurrencyProvider>
    </DarkModeProvider>
  );
}

export default App;
