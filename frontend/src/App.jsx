import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './toast.css';
import { DarkModeProvider, useDarkMode } from './contexts/DarkModeContext';
import LandingPage from './pages/LandingPage';
import SignUp from './pages/SignUp';

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
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/signin" element={<SignUp />} />
          <Route path="/dashboard" element={<div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Welcome to Dashboard!</h1>
              <p className="text-gray-600 dark:text-gray-300">Your dashboard is coming soon.</p>
            </div>
          </div>} />
        </Routes>
        <ToastWrapper />
      </Router>
    </DarkModeProvider>
  );
}

export default App;
