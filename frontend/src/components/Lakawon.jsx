import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  ChevronLeft,
  ChevronRight,
  Trash2,
  Edit,
  X,
  AlertCircle
} from 'lucide-react';
import { useDarkMode } from '../contexts/DarkModeContext';
import { useCurrency } from '../contexts/CurrencyContext';
import api from '../services/api';

export default function Lakawon({ darkMode }) {
  const { formatCurrency } = useCurrency();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [classes, setClasses] = useState([]);
  const [deductions, setDeductions] = useState([]);
  const [salarySummary, setSalarySummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showDeleteDeductionModal, setShowDeleteDeductionModal] = useState(false);
  const [deductionToDelete, setDeductionToDelete] = useState(null);
  const [showDeleteClassModal, setShowDeleteClassModal] = useState(false);
  const [classToDelete, setClassToDelete] = useState(null);
  const [showAllDeductions, setShowAllDeductions] = useState(false);
  const [classToCancel, setClassToCancel] = useState(null);
  const [cancelFormData, setCancelFormData] = useState({
    student_name: '',
    reason: ''
  });
  
  const getCurrentHour = () => {
    const now = new Date();
    return String(now.getHours()).padStart(2, '0');
  };

  const [formData, setFormData] = useState(() => {
    const now = new Date();
    const hour = String(now.getHours()).padStart(2, '0');
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return {
      date: `${year}-${month}-${day}`,
      time: `${hour}:00`,
      class_type: 'regular'
    };
  });
  const [editingClass, setEditingClass] = useState(null);
  

  // Get user ID from localStorage
  const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = userInfo.id;

  // Load classes, deductions, and salary summary
  useEffect(() => {
    if (userId) {
      loadClasses();
      loadDeductions();
      loadSalarySummary();
    }
  }, [userId, currentDate]);

  const loadClasses = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const response = await api.get(`/api/lakawon/classes/?user_id=${userId}&month=${year}-${String(month).padStart(2, '0')}`);
      setClasses(response.data || []);
    } catch (error) {
      console.error('Error loading classes:', error);
      toast.error('Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  const loadDeductions = async () => {
    if (!userId) return;
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const response = await api.get(`/api/lakawon/deductions/?user_id=${userId}&month=${year}-${String(month).padStart(2, '0')}`);
      setDeductions(response.data || []);
    } catch (error) {
      console.error('Error loading deductions:', error);
      toast.error('Failed to load deductions');
    }
  };

  const loadSalarySummary = async () => {
    if (!userId) return;
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const response = await api.get(`/api/lakawon/salary-summary/?user_id=${userId}&year=${year}&month=${month}`);
      setSalarySummary(response.data);
    } catch (error) {
      console.error('Error loading salary summary:', error);
      toast.error('Failed to load salary summary');
    }
  };
  

  const handleAddClass = async (e) => {
    e.preventDefault();
    if (!userId) {
      toast.error('User not found');
      return;
    }

    try {
      const response = await api.post('/api/lakawon/classes/create/', {
        user_id: userId,
        ...formData
      });
      toast.success('Class added successfully');
      setShowAddForm(false);
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      setFormData({
        date: `${year}-${month}-${day}`,
        time: `${getCurrentHour()}:00`,
        class_type: 'regular'
      });
      loadClasses();
      loadSalarySummary();
    } catch (error) {
      console.error('Error adding class:', error);
      toast.error(error.response?.data?.error || 'Failed to add class');
    }
  };

  const openDeleteClassModal = (classItem) => {
    setClassToDelete(classItem);
    setShowDeleteClassModal(true);
  };

  const handleDeleteClass = async () => {
    if (!userId || !classToDelete) return;

    try {
      const deletedClassDate = classToDelete.date;
      await api.delete(`/api/lakawon/classes/${classToDelete.id}/delete/?user_id=${userId}`);
      toast.success('Class deleted successfully');
      setShowDeleteClassModal(false);
      setClassToDelete(null);
      
      // Reload all data
      await Promise.all([
        loadClasses(),
        loadDeductions(),
        loadSalarySummary()
      ]);
      
      // Clear selected date if the deleted class was on that date
      if (selectedDate) {
        const dateStr = formatDateLocal(selectedDate);
        if (deletedClassDate === dateStr) {
          // Check if any classes remain for this date after deletion
          setTimeout(async () => {
            try {
              const year = currentDate.getFullYear();
              const month = currentDate.getMonth() + 1;
              const response = await api.get(`/api/lakawon/classes/?user_id=${userId}&month=${year}-${String(month).padStart(2, '0')}`);
              const remainingClasses = response.data || [];
              const dayClasses = remainingClasses.filter(c => c.date === dateStr);
              if (dayClasses.length === 0) {
                setSelectedDate(null);
              }
            } catch (error) {
              console.error('Error checking remaining classes:', error);
            }
          }, 200);
        }
      }
    } catch (error) {
      console.error('Error deleting class:', error);
      toast.error('Failed to delete class');
    }
  };

  const handleUpdateClass = async (e) => {
    e.preventDefault();
    if (!userId || !editingClass) return;

    try {
      await api.put(`/api/lakawon/classes/${editingClass.id}/`, {
        user_id: userId,
        ...formData
      });
      toast.success('Class updated successfully');
      setEditingClass(null);
      setShowAddForm(false);
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      setFormData({
        date: `${year}-${month}-${day}`,
        time: `${getCurrentHour()}:00`,
        class_type: 'regular'
      });
      loadClasses();
      loadSalarySummary();
    } catch (error) {
      console.error('Error updating class:', error);
      toast.error(error.response?.data?.error || 'Failed to update class');
    }
  };

  const startEdit = (classItem) => {
    setEditingClass(classItem);
    const hour = classItem.time.split(':')[0].padStart(2, '0');
    setFormData({
      date: classItem.date,
      time: `${hour}:00`,
      class_type: classItem.class_type
    });
    setShowAddForm(true);
  };

  const cancelEdit = () => {
    setEditingClass(null);
    setShowAddForm(false);
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    setFormData({
      date: `${year}-${month}-${day}`,
      time: `${getCurrentHour()}:00`,
      class_type: 'regular'
    });
  };

  // Cancel class function
  const handleCancelClass = async () => {
    if (!userId || !classToCancel) return;
    if (!cancelFormData.student_name) {
      toast.error('Student name is required');
      return;
    }

    try {
      const response = await api.post(`/api/lakawon/classes/${classToCancel.id}/cancel/`, {
        user_id: userId,
        student_name: cancelFormData.student_name,
        reason: cancelFormData.reason || 'Class cancelled'
      });
      
      toast.success('Class cancelled and deduction created');
      setShowCancelModal(false);
      setClassToCancel(null);
      setCancelFormData({ student_name: '', reason: '' });
      loadClasses();
      loadDeductions();
      loadSalarySummary();
    } catch (error) {
      console.error('Error cancelling class:', error);
      toast.error(error.response?.data?.error || 'Failed to cancel class');
    }
  };

  const openCancelModal = (classItem) => {
    setClassToCancel(classItem);
    setCancelFormData({ student_name: '', reason: '' });
    setShowCancelModal(true);
  };

  // Deduction handlers
  const openDeleteDeductionModal = (deduction) => {
    setDeductionToDelete(deduction);
    setShowDeleteDeductionModal(true);
  };

  const handleDeleteDeduction = async () => {
    if (!userId || !deductionToDelete) return;

    try {
      await api.delete(`/api/lakawon/deductions/${deductionToDelete.id}/delete/?user_id=${userId}`);
      toast.success('Deduction and class deleted successfully');
      setShowDeleteDeductionModal(false);
      setDeductionToDelete(null);
      
      // Reload all data to reflect the deletion
      await Promise.all([
        loadClasses(),
        loadDeductions(),
        loadSalarySummary()
      ]);
      
      // Clear selected date if no classes remain
      if (selectedDate) {
        const dateStr = formatDateLocal(selectedDate);
        if (deductionToDelete.date === dateStr) {
          setTimeout(async () => {
            try {
              const year = currentDate.getFullYear();
              const month = currentDate.getMonth() + 1;
              const response = await api.get(`/api/lakawon/classes/?user_id=${userId}&month=${year}-${String(month).padStart(2, '0')}`);
              const remainingClasses = response.data || [];
              const dayClasses = remainingClasses.filter(c => c.date === dateStr);
              if (dayClasses.length === 0) {
                setSelectedDate(null);
              }
            } catch (error) {
              console.error('Error checking remaining classes:', error);
            }
          }, 200);
        }
      }
    } catch (error) {
      console.error('Error deleting deduction:', error);
      toast.error('Failed to delete deduction');
    }
  };

  // Calendar helpers
  const formatDateLocal = (date) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    return days;
  };

  const getClassesForDate = (date) => {
    if (!date) return [];
    const dateStr = formatDateLocal(date);
    return classes.filter(c => c.date === dateStr);
  };
  
  const getActiveClassesForDate = (date) => {
    if (!date) return [];
    const dateStr = formatDateLocal(date);
    return classes.filter(c => c.date === dateStr && !c.cancelled);
  };

  const navigateMonth = (direction) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1));
    setSelectedDate(null);
  };

  const handleDateClick = (date) => {
    if (!date) return;
    setSelectedDate(date);
    setShowAddForm(false);
  };

  const days = getDaysInMonth(currentDate);
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const selectedDateClasses = selectedDate ? getClassesForDate(selectedDate) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-6">
        <img 
          src="/lakawon-icon.jpg" 
          alt="Lakawon" 
          className="w-16 h-16 rounded-full object-cover"
        />
        <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Lakawon</h1>
      </div>

      {/* Salary Overview Cards */}
      {salarySummary && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Period 1 (1-15) */}
          <div className={`${darkMode ? 'bg-blue-900/30 border-blue-700' : 'bg-blue-50 border-blue-200'} rounded-xl p-6 border transition-colors duration-300`}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className={`${darkMode ? 'text-blue-300' : 'text-blue-700'} text-sm font-medium mb-1`}>Period 1 (1-15)</p>
                <p className={`${darkMode ? 'text-white' : 'text-gray-900'} text-2xl font-bold`}>
                  {formatCurrency(salarySummary.period1.total, true).display}
                </p>
              </div>
              <div className={`${darkMode ? 'bg-blue-800' : 'bg-blue-100'} px-3 py-1 rounded-full`}>
                <p className={`${darkMode ? 'text-blue-200' : 'text-blue-700'} text-xs font-medium`}>
                  Paid on 18th
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className={darkMode ? 'text-blue-200' : 'text-blue-600'}>Regular: {salarySummary.period1.regular_count}</span>
                <span className={darkMode ? 'text-white' : 'text-gray-900'}>{formatCurrency(salarySummary.period1.regular_total, true).display}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className={darkMode ? 'text-blue-200' : 'text-blue-600'}>Demo: {salarySummary.period1.demo_count}</span>
                <span className={darkMode ? 'text-white' : 'text-gray-900'}>{formatCurrency(salarySummary.period1.demo_total, true).display}</span>
              </div>
              {salarySummary.period1.deduction_total > 0 && (
                <div className="flex justify-between text-sm">
                  <span className={darkMode ? 'text-red-300' : 'text-red-600'}>Deduction: {salarySummary.period1.deduction_count}</span>
                  <span className={`${darkMode ? 'text-red-300' : 'text-red-600'} font-medium`}>
                    -{formatCurrency(salarySummary.period1.deduction_total, true).display}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm font-medium pt-2 border-t border-blue-300 dark:border-blue-700">
                <span className={darkMode ? 'text-blue-200' : 'text-blue-600'}>Total Classes: {salarySummary.period1.total_count}</span>
              </div>
            </div>
          </div>

          {/* Period 2 (16-End) */}
          <div className={`${darkMode ? 'bg-green-900/30 border-green-700' : 'bg-green-50 border-green-200'} rounded-xl p-6 border transition-colors duration-300`}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className={`${darkMode ? 'text-green-300' : 'text-green-700'} text-sm font-medium mb-1`}>
                  Period 2 (16-{new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()})
                </p>
                <p className={`${darkMode ? 'text-white' : 'text-gray-900'} text-2xl font-bold`}>
                  {formatCurrency(salarySummary.period2.total, true).display}
                </p>
              </div>
              <div className={`${darkMode ? 'bg-green-800' : 'bg-green-100'} px-3 py-1 rounded-full`}>
                <p className={`${darkMode ? 'text-green-200' : 'text-green-700'} text-xs font-medium`}>
                  Paid on 3rd
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className={darkMode ? 'text-green-200' : 'text-green-600'}>Regular: {salarySummary.period2.regular_count}</span>
                <span className={darkMode ? 'text-white' : 'text-gray-900'}>{formatCurrency(salarySummary.period2.regular_total, true).display}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className={darkMode ? 'text-green-200' : 'text-green-600'}>Demo: {salarySummary.period2.demo_count}</span>
                <span className={darkMode ? 'text-white' : 'text-gray-900'}>{formatCurrency(salarySummary.period2.demo_total, true).display}</span>
              </div>
              {salarySummary.period2.deduction_total > 0 && (
                <div className="flex justify-between text-sm">
                  <span className={darkMode ? 'text-red-300' : 'text-red-600'}>Deduction: {salarySummary.period2.deduction_count}</span>
                  <span className={`${darkMode ? 'text-red-300' : 'text-red-600'} font-medium`}>
                    -{formatCurrency(salarySummary.period2.deduction_total, true).display}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm font-medium pt-2 border-t border-green-300 dark:border-green-700">
                <span className={darkMode ? 'text-green-200' : 'text-green-600'}>Total Classes: {salarySummary.period2.total_count}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content - Calendar and Sidebar */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar View - Left Side (2/3) */}
        <div className={`lg:col-span-2 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl p-6 border transition-colors duration-300`}>
          {/* Calendar Header */}
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={() => navigateMonth(-1)}
              className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <button
              onClick={() => navigateMonth(1)}
              className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Day Headers */}
            {dayNames.map(day => (
              <div key={day} className={`text-center text-sm font-medium py-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {day}
              </div>
            ))}

            {/* Calendar Days */}
            {days.map((date, idx) => {
              if (!date) {
                return <div key={`empty-${idx}`} className="h-16" />;
              }

              const dateStr = formatDateLocal(date);
              const dayClasses = getClassesForDate(date);
              const isToday = date.toDateString() === today.toDateString();
              const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
              const isPeriod1 = date.getDate() <= 15;
              
              return (
                <div
                  key={dateStr}
                  onClick={() => handleDateClick(date)}
                  className={`h-16 p-1 rounded-lg cursor-pointer transition-all ${
                    isSelected
                      ? darkMode ? 'bg-indigo-600 border-2 border-indigo-400' : 'bg-indigo-100 border-2 border-indigo-500'
                      : isToday
                      ? darkMode ? 'bg-gray-700 border-2 border-indigo-500' : 'bg-gray-50 border-2 border-indigo-300'
                      : darkMode ? 'hover:bg-gray-700 border border-gray-600' : 'hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  <div className={`text-xs font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {date.getDate()}
                  </div>
                  <div className="flex flex-wrap gap-0.5">
                    {dayClasses.map((classItem, i) => (
                      <div
                        key={i}
                        className={`w-2 h-2 rounded-full ${
                          classItem.cancelled 
                            ? 'bg-orange-500'
                            : 'bg-emerald-500'
                        }`}
                        title={`${classItem.time} - ${classItem.cancelled ? 'Cancelled' : classItem.class_type === 'regular' ? 'Regular ($5)' : 'Demo ($3)'}`}
                      />
                    ))}
                  </div>
                  {/* Period indicator */}
                  <div className={`text-[8px] mt-0.5 ${isPeriod1 ? 'text-blue-500' : 'text-green-500'}`}>
                    {isPeriod1 ? 'P1' : 'P2'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Sidebar (1/3) */}
        <div className="space-y-4">
          {/* Quick Add Form */}
          {showAddForm && (
            <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl p-6 border transition-colors duration-300`}>
              <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {editingClass ? 'Edit Class' : 'Add New Class'}
              </h3>
              <form onSubmit={editingClass ? handleUpdateClass : handleAddClass} className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Date
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                    className={`w-full px-3 py-2 rounded-lg border ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Time
                  </label>
                  <select
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    required
                    className={`w-full px-3 py-2 rounded-lg border ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                  >
                    {Array.from({ length: 24 }, (_, i) => {
                      const hour = String(i).padStart(2, '0');
                      return (
                        <option key={i} value={`${hour}:00`}>
                          {hour}:00
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Type
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, class_type: 'regular' })}
                      className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                        formData.class_type === 'regular'
                          ? darkMode ? 'bg-emerald-600 text-white' : 'bg-emerald-500 text-white'
                          : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      Regular ($5)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, class_type: 'demo' })}
                      className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                        formData.class_type === 'demo'
                          ? darkMode ? 'bg-amber-600 text-white' : 'bg-amber-500 text-white'
                          : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      Demo ($3)
                    </button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors font-medium"
                  >
                    {editingClass ? 'Update' : 'Add'} Class
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Day Details Panel */}
          {selectedDate && !showAddForm && (
            <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl p-6 border transition-colors duration-300`}>
              <div className="flex justify-between items-center mb-4">
                <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </h3>
                <button
                  onClick={() => {
                    const selectedDateStr = formatDateLocal(selectedDate);
                    setSelectedDate(null);
                    setShowAddForm(true);
                    setFormData({
                      date: selectedDateStr,
                      time: `${getCurrentHour()}:00`,
                      class_type: 'regular'
                    });
                  }}
                  className={`px-3 py-1 text-sm rounded-lg font-medium transition-colors ${
                    darkMode ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-indigo-500 text-white hover:bg-indigo-600'
                  }`}
                >
                  Add Class
                </button>
              </div>
              
              {selectedDateClasses.length > 0 ? (
                <div className="space-y-3">
                  {selectedDateClasses.map((classItem) => (
                    <div
                      key={classItem.id}
                      className={`p-3 rounded-lg border ${
                        classItem.cancelled
                          ? darkMode ? 'bg-gray-800/50 border-gray-600 opacity-60' : 'bg-gray-100 border-gray-300 opacity-60'
                          : classItem.class_type === 'regular'
                          ? darkMode ? 'bg-emerald-900/30 border-emerald-700' : 'bg-emerald-50 border-emerald-200'
                          : darkMode ? 'bg-amber-900/30 border-amber-700' : 'bg-amber-50 border-amber-200'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              {classItem.time}
                            </p>
                            {classItem.cancelled && (
                              <span className={`text-xs px-2 py-0.5 rounded ${darkMode ? 'bg-red-900/50 text-red-300' : 'bg-red-100 text-red-700'}`}>
                                Cancelled
                              </span>
                            )}
                          </div>
                          <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            {classItem.class_type === 'regular' ? 'Regular' : 'Demo'} - {formatCurrency(parseFloat(classItem.amount), true).display}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {!classItem.cancelled && (
                            <>
                              <button
                                onClick={() => openCancelModal(classItem)}
                                className={`p-1.5 rounded hover:bg-orange-500/20 transition-colors ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}
                                title="Cancel Class"
                              >
                                <X className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => startEdit(classItem)}
                                className={`p-1.5 rounded hover:bg-black/20 transition-colors ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => openDeleteClassModal(classItem)}
                                className={`p-1.5 rounded hover:bg-red-500/20 transition-colors ${darkMode ? 'text-red-400' : 'text-red-600'}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={`text-center py-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  No classes scheduled for this day
                </p>
              )}
            </div>
          )}

          {/* Quick Add Button (when no form or details shown) */}
          {!showAddForm && !selectedDate && (
            <button
              onClick={() => setShowAddForm(true)}
              className={`w-full px-4 py-3 rounded-lg font-medium transition-colors ${
                darkMode ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-indigo-500 text-white hover:bg-indigo-600'
              }`}
            >
              Add New Class
            </button>
          )}
        </div>
      </div>
      
      {/* Delete Class Confirmation Modal */}
      {showDeleteClassModal && classToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 w-full max-w-md mx-4`}>
            <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Delete Class
            </h3>
            <div className="space-y-4">
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Are you sure you want to delete this class?
              </p>
              <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {classToDelete.time}
                </p>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {classToDelete.date}
                </p>
                <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {classToDelete.class_type === 'regular' ? 'Regular' : 'Demo'} - {formatCurrency(parseFloat(classToDelete.amount), true).display}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleDeleteClass}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
                >
                  Delete
                </button>
                <button
                  onClick={() => {
                    setShowDeleteClassModal(false);
                    setClassToDelete(null);
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Deduction Confirmation Modal */}
      {showDeleteDeductionModal && deductionToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 w-full max-w-md mx-4`}>
            <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Delete Deduction
            </h3>
            <div className="space-y-4">
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Are you sure you want to delete this deduction?
              </p>
              <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {deductionToDelete.student_name}
                </p>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {deductionToDelete.date} {deductionToDelete.time}
                </p>
                <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {deductionToDelete.reason}
                </p>
                <p className={`text-sm mt-2 font-medium ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
                  -{formatCurrency(parseFloat(deductionToDelete.amount), true).display}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleDeleteDeduction}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
                >
                  Delete
                </button>
                <button
                  onClick={() => {
                    setShowDeleteDeductionModal(false);
                    setDeductionToDelete(null);
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Class Modal */}
      {showCancelModal && classToCancel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 w-full max-w-md mx-4`}>
            <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Cancel Class
            </h3>
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Student Name *
                </label>
                <input
                  type="text"
                  value={cancelFormData.student_name}
                  onChange={(e) => setCancelFormData({ ...cancelFormData, student_name: e.target.value })}
                  required
                  className={`w-full px-3 py-2 rounded-lg border ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                  placeholder="Enter student name"
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Reason
                </label>
                <textarea
                  value={cancelFormData.reason}
                  onChange={(e) => setCancelFormData({ ...cancelFormData, reason: e.target.value })}
                  rows={3}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                  placeholder="Enter reason (optional)"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCancelClass}
                  className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
                >
                  Cancel Class
                </button>
                <button
                  onClick={() => {
                    setShowCancelModal(false);
                    setClassToCancel(null);
                    setCancelFormData({ student_name: '', reason: '' });
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Deductions Section */}
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl p-6 border transition-colors duration-300`}>
        <h2 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Deductions
        </h2>
        
        {/* Deductions List */}
        {deductions.length > 0 ? (
          <>
            <div className="space-y-3">
              {(showAllDeductions ? deductions : deductions.slice(0, 5)).map((deduction) => (
                <div
                  key={deduction.id}
                  className={`p-3 rounded-lg border ${darkMode ? 'bg-red-900/20 border-red-700' : 'bg-red-50 border-red-200'}`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {deduction.student_name}
                        </p>
                        <span className={`text-xs px-2 py-0.5 rounded ${darkMode ? 'bg-red-800 text-red-200' : 'bg-red-100 text-red-700'}`}>
                          -{formatCurrency(parseFloat(deduction.amount), true).display}
                        </span>
                      </div>
                      <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        {deduction.date} {deduction.time}
                      </p>
                      <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {deduction.reason}
                      </p>
                    </div>
                    <button
                      onClick={() => openDeleteDeductionModal(deduction)}
                      className={`p-1.5 rounded hover:bg-red-500/20 transition-colors ${darkMode ? 'text-red-400' : 'text-red-600'}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {deductions.length > 5 && (
              <button
                onClick={() => setShowAllDeductions(!showAllDeductions)}
                className={`w-full mt-4 px-4 py-2 rounded-lg font-medium transition-colors ${
                  darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {showAllDeductions ? 'Show Less' : `Show More (${deductions.length - 5} more)`}
              </button>
            )}
          </>
        ) : (
          <p className={`text-center py-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            No deductions for this month
          </p>
        )}
      </div>
    </div>
  );
}

