import { useState, useEffect } from 'react';
import { useDarkMode } from '../contexts/DarkModeContext';
import api from '../services/api';
import { toast } from 'react-toastify';

export default function Productivity() {
  const { darkMode } = useDarkMode();
  const [tasks, setTasks] = useState([]);
  const [yearlyPlans, setYearlyPlans] = useState([]);
  const [monthlyPlans, setMonthlyPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  const [newTask, setNewTask] = useState({ time: '09:00', title: '', recurrence: 'once' });
  const [newYearlyPlan, setNewYearlyPlan] = useState('');
  const [newMonthlyPlan, setNewMonthlyPlan] = useState('');
  const [weeklyData, setWeeklyData] = useState([45, 62, 55, 78, 68, 85, 70]);
  const [monthlyData, setMonthlyData] = useState([60, 65, 70, 72, 75, 78, 80, 82, 85, 87, 89, 91]);

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const today = new Date();
  const currentMonth = monthNames[today.getMonth()];
  const currentYear = today.getFullYear();
  const currentMonthNum = today.getMonth() + 1;

  const completedTasks = tasks.filter(t => t.completed).length;
  const totalTasks = tasks.length;
  const productivityPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Get user info
  const getUserId = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.id;
  };

  // Fetch all data on component mount
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchTasks(),
        fetchYearlyPlans(),
        fetchMonthlyPlans(),
        fetchStats()
      ]);
    } catch (error) {
      console.error('Error fetching productivity data:', error);
      toast.error('Failed to load productivity data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch tasks for today
  const fetchTasks = async () => {
    try {
      const userId = getUserId();
      const todayStr = today.toISOString().split('T')[0];
      const response = await api.get(`/api/productivity/tasks/?user_id=${userId}&date=${todayStr}`);
      
      const formattedTasks = response.data.map(task => ({
        id: task.id.toString(),
        time: task.scheduled_time.substring(0, 5), // HH:MM
        title: task.title,
        completed: task.completed,
        recurrence: task.recurrence || 'once'
      }));
      
      setTasks(formattedTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  // Fetch yearly plans
  const fetchYearlyPlans = async () => {
    try {
      const userId = getUserId();
      const response = await api.get(`/api/productivity/yearly-plans/?user_id=${userId}&year=${currentYear}`);
      setYearlyPlans(response.data.map(plan => plan.title));
    } catch (error) {
      console.error('Error fetching yearly plans:', error);
    }
  };

  // Fetch monthly plans
  const fetchMonthlyPlans = async () => {
    try {
      const userId = getUserId();
      const response = await api.get(`/api/productivity/monthly-plans/?user_id=${userId}&year=${currentYear}&month=${currentMonthNum}`);
      setMonthlyPlans(response.data.map(plan => plan.title));
    } catch (error) {
      console.error('Error fetching monthly plans:', error);
    }
  };

  // Fetch productivity stats
  const fetchStats = async () => {
    try {
      const userId = getUserId();
      const response = await api.get(`/api/productivity/stats/?user_id=${userId}&year=${currentYear}&month=${currentMonthNum}`);
      setWeeklyData(response.data.weekly_data || weeklyData);
      setMonthlyData(response.data.monthly_data || monthlyData);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const addTask = async () => {
    if (!newTask.title.trim()) {
      toast.error('Please enter a task title');
      return;
    }

    try {
      const userId = getUserId();
      const todayStr = today.toISOString().split('T')[0];
      
      const response = await api.post('/api/productivity/tasks/create/', {
        user_id: userId,
        title: newTask.title,
        scheduled_time: newTask.time,
        date: todayStr,
        completed: false,
        recurrence: newTask.recurrence
      });

      const formattedTask = {
        id: response.data.id.toString(),
        time: response.data.scheduled_time.substring(0, 5),
        title: response.data.title,
        completed: response.data.completed,
        recurrence: response.data.recurrence
      };

      setTasks([...tasks, formattedTask]);
      setNewTask({ time: '09:00', title: '', recurrence: 'once' });
      
      const recurrenceLabel = newTask.recurrence === 'once' ? '' : 
                             newTask.recurrence === 'daily' ? ' (Daily)' : ' (Weekdays)';
      toast.success(`Task added successfully${recurrenceLabel}`);
    } catch (error) {
      console.error('Error adding task:', error);
      toast.error('Failed to add task');
    }
  };

  const toggleTask = async (id) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    try {
      const userId = getUserId();
      await api.patch(`/api/productivity/tasks/${id}/`, {
        user_id: userId,
        completed: !task.completed
      });

      setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    } catch (error) {
      console.error('Error toggling task:', error);
      toast.error('Failed to update task');
    }
  };

  const deleteTask = async (id) => {
    const task = tasks.find(t => t.id === id);
    
    // Show confirmation for recurring tasks
    if (task && task.recurrence && task.recurrence !== 'once') {
      const confirmMsg = `This is a recurring task (${task.recurrence}). Deleting it will stop future occurrences. Continue?`;
      if (!window.confirm(confirmMsg)) {
        return;
      }
    }
    
    try {
      const userId = getUserId();
      await api.delete(`/api/productivity/tasks/${id}/delete/?user_id=${userId}`);
      setTasks(tasks.filter(t => t.id !== id));
      
      if (task && task.recurrence && task.recurrence !== 'once') {
        toast.success('Recurring task deleted - won\'t appear tomorrow');
      } else {
        toast.success('Task deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
    }
  };

  const addYearlyPlan = async () => {
    if (!newYearlyPlan.trim()) {
      toast.error('Please enter a plan');
      return;
    }

    try {
      const userId = getUserId();
      await api.post('/api/productivity/yearly-plans/create/', {
        user_id: userId,
        title: newYearlyPlan,
        year: currentYear,
        order: yearlyPlans.length
      });

      setYearlyPlans([...yearlyPlans, newYearlyPlan]);
      setNewYearlyPlan('');
      toast.success('Yearly plan added');
    } catch (error) {
      console.error('Error adding yearly plan:', error);
      toast.error('Failed to add plan');
    }
  };

  const addMonthlyPlan = async () => {
    if (!newMonthlyPlan.trim()) {
      toast.error('Please enter a plan');
      return;
    }

    try {
      const userId = getUserId();
      await api.post('/api/productivity/monthly-plans/create/', {
        user_id: userId,
        title: newMonthlyPlan,
        year: currentYear,
        month: currentMonthNum,
        order: monthlyPlans.length
      });

      setMonthlyPlans([...monthlyPlans, newMonthlyPlan]);
      setNewMonthlyPlan('');
      toast.success('Monthly plan added');
    } catch (error) {
      console.error('Error adding monthly plan:', error);
      toast.error('Failed to add plan');
    }
  };

  const deleteYearlyPlan = async (index) => {
    try {
      const userId = getUserId();
      const response = await api.get(`/api/productivity/yearly-plans/?user_id=${userId}&year=${currentYear}`);
      const planId = response.data[index]?.id;
      
      if (planId) {
        await api.delete(`/api/productivity/yearly-plans/${planId}/delete/?user_id=${userId}`);
        setYearlyPlans(yearlyPlans.filter((_, i) => i !== index));
        toast.success('Plan deleted');
      }
    } catch (error) {
      console.error('Error deleting yearly plan:', error);
      toast.error('Failed to delete plan');
    }
  };

  const deleteMonthlyPlan = async (index) => {
    try {
      const userId = getUserId();
      const response = await api.get(`/api/productivity/monthly-plans/?user_id=${userId}&year=${currentYear}&month=${currentMonthNum}`);
      const planId = response.data[index]?.id;
      
      if (planId) {
        await api.delete(`/api/productivity/monthly-plans/${planId}/delete/?user_id=${userId}`);
        setMonthlyPlans(monthlyPlans.filter((_, i) => i !== index));
        toast.success('Plan deleted');
      }
    } catch (error) {
      console.error('Error deleting monthly plan:', error);
      toast.error('Failed to delete plan');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
          <p className={`mt-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading productivity data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Productivity</h1>
        <div className={`text-2xl font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{currentMonth}</div>
      </div>

      <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
        {/* Today's Tasks */}
        <div className={`md:col-span-2 lg:col-span-2 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl p-6 border shadow-sm transition-colors duration-300`}>
          <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>Today's Tasks</h2>

          <div className="space-y-3 mb-4">
            {tasks.map(task => (
              <div key={task.id} className={`flex items-center space-x-3 p-3 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100'} rounded-lg transition`}>
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => toggleTask(task.id)}
                  className="w-5 h-5 cursor-pointer accent-blue-500"
                />
                <div className="flex-1 flex items-center space-x-2">
                  <p className={`text-sm font-medium ${task.completed ? `line-through ${darkMode ? 'text-gray-500' : 'text-gray-500'}` : `${darkMode ? 'text-white' : 'text-gray-900'}`}`}>
                    {task.title}
                  </p>
                  {task.recurrence && task.recurrence !== 'once' && (
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      task.recurrence === 'daily' 
                        ? darkMode ? 'bg-purple-900 text-purple-300' : 'bg-purple-100 text-purple-700'
                        : darkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-700'
                    }`}>
                      {task.recurrence === 'daily' ? '🔄 Daily' : '📅 Weekdays'}
                    </span>
                  )}
                </div>
                <span className={`text-xs font-semibold ${darkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700'} px-2 py-1 rounded`}>{task.time}</span>
                <button onClick={() => deleteTask(task.id)} className={`${darkMode ? 'text-red-400 hover:text-red-300' : 'text-red-500 hover:text-red-700'} text-sm font-bold`}>✕</button>
              </div>
            ))}
          </div>

          <div className={`space-y-2 pt-4 border-t ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
            <div className="flex space-x-2">
              <input
                type="time"
                value={newTask.time}
                onChange={(e) => setNewTask({ ...newTask, time: e.target.value })}
                className={`px-3 py-2 border rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}
              />
              <input
                type="text"
                placeholder="Add task..."
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                onKeyPress={(e) => e.key === 'Enter' && addTask()}
                className={`flex-1 px-3 py-2 border rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-300'}`}
              />
            </div>
            <select
              value={newTask.recurrence}
              onChange={(e) => setNewTask({ ...newTask, recurrence: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}
            >
              <option value="once">One-time (Today only)</option>
              <option value="daily">Daily (Every day)</option>
              <option value="weekdays">Weekdays (Mon-Fri)</option>
            </select>
            <button
              onClick={addTask}
              className="w-full px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm font-medium"
            >
              Add Task
            </button>
          </div>
        </div>

        {/* Productivity Pie Chart */}
        <div className={`md:col-span-1 lg:col-span-1 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl p-6 border shadow-sm flex flex-col items-center justify-center transition-colors duration-300`}>
          <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4 w-full`}>Today's Progress</h3>
          <div className="relative w-32 h-32 mb-4">
            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
              <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" strokeWidth="10" />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="10"
                strokeDasharray={`${productivityPercent * 2.83} 283`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{productivityPercent}%</p>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{completedTasks}/{totalTasks}</p>
              </div>
            </div>
          </div>
          <div className="text-sm text-center">
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} font-medium`}>{completedTasks} of {totalTasks} completed</p>
          </div>
        </div>

        {/* Plans Side */}
        <div className="md:col-span-1 lg:col-span-1 space-y-4">
          {/* Yearly Plans */}
          <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl p-5 border shadow-sm transition-colors duration-300`}>
            <h3 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-3`}>Yearly Plans</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto mb-2">
              {yearlyPlans.map((plan, i) => (
                <div key={i} className={`flex justify-between items-start p-2 ${darkMode ? 'bg-amber-900/30' : 'bg-amber-50'} rounded text-xs`}>
                  <span className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} flex-1 break-words`}>{plan}</span>
                  <button onClick={() => deleteYearlyPlan(i)} className={`${darkMode ? 'text-red-400 hover:text-red-300' : 'text-red-500 hover:text-red-700'} ml-2 font-bold`}>✕</button>
                </div>
              ))}
            </div>
            <div className="flex space-x-1">
              <input
                type="text"
                placeholder="Add plan..."
                value={newYearlyPlan}
                onChange={(e) => setNewYearlyPlan(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addYearlyPlan()}
                className={`flex-1 px-2 py-1 border rounded text-xs focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-300'}`}
              />
              <button onClick={addYearlyPlan} className="px-2 py-1 bg-amber-500 text-white rounded text-xs font-medium hover:bg-amber-600">+</button>
            </div>
          </div>

          {/* Monthly Plans */}
          <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl p-5 border shadow-sm transition-colors duration-300`}>
            <h3 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-3`}>Monthly Plans</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto mb-2">
              {monthlyPlans.map((plan, i) => (
                <div key={i} className={`flex justify-between items-start p-2 ${darkMode ? 'bg-green-900/30' : 'bg-green-50'} rounded text-xs`}>
                  <span className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} flex-1 break-words`}>{plan}</span>
                  <button onClick={() => deleteMonthlyPlan(i)} className={`${darkMode ? 'text-red-400 hover:text-red-300' : 'text-red-500 hover:text-red-700'} ml-2 font-bold`}>✕</button>
                </div>
              ))}
            </div>
            <div className="flex space-x-1">
              <input
                type="text"
                placeholder="Add plan..."
                value={newMonthlyPlan}
                onChange={(e) => setNewMonthlyPlan(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addMonthlyPlan()}
                className={`flex-1 px-2 py-1 border rounded text-xs focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-300'}`}
              />
              <button onClick={addMonthlyPlan} className="px-2 py-1 bg-green-500 text-white rounded text-xs font-medium hover:bg-green-600">+</button>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly and Monthly Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Weekly Productivity */}
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl p-6 border shadow-sm transition-colors duration-300`}>
          <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>Weekly Productivity</h3>
          <div className="flex gap-2">
            {/* Y-axis */}
            <div className="flex flex-col justify-between h-40 text-xs text-right pr-2">
              <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>100%</span>
              <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>75%</span>
              <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>50%</span>
              <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>25%</span>
              <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>0%</span>
            </div>
            {/* Chart */}
            <div className="flex-1 flex items-end justify-between h-40 gap-2">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
                <div key={day} className="flex flex-col items-center flex-1">
                  <div className="relative w-full flex flex-col items-center">
                    <span className={`text-xs font-semibold mb-1 ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                      {weeklyData[i]}%
                    </span>
                    <div className="w-full bg-gradient-to-b from-blue-400 to-blue-500 rounded-t" style={{ height: `${(weeklyData[i] / 100) * 120}px` }}></div>
                  </div>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-2 font-medium`}>{day}</p>
                </div>
              ))}
            </div>
          </div>
          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-4 text-center`}>Average: {Math.round(weeklyData.reduce((a, b) => a + b) / weeklyData.length)}%</p>
        </div>

        {/* Monthly Productivity */}
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl p-6 border shadow-sm transition-colors duration-300`}>
          <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>Monthly Productivity Trend</h3>
          <div className="flex gap-2">
            {/* Y-axis */}
            <div className="flex flex-col justify-between h-40 text-xs text-right pr-2">
              <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>100%</span>
              <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>75%</span>
              <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>50%</span>
              <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>25%</span>
              <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>0%</span>
            </div>
            {/* Chart */}
            <div className="flex-1 flex items-end justify-between h-40 gap-1">
              {monthlyData.map((value, i) => (
                <div key={i} className="flex-1 relative group">
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className={`text-xs font-semibold ${darkMode ? 'text-emerald-300' : 'text-emerald-700'} whitespace-nowrap`}>
                      {value}%
                    </span>
                  </div>
                  <div className="w-full bg-gradient-to-b from-emerald-400 to-emerald-500 rounded-t hover:opacity-80 transition" style={{ height: `${(value / 100) * 120}px` }}></div>
                </div>
              ))}
            </div>
          </div>
          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-4 text-center`}>Trend: Improving productivity throughout the month (Hover to see values)</p>
        </div>
      </div>
    </div>
  );
}
