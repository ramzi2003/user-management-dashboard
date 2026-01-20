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

  const [editingTaskId, setEditingTaskId] = useState(null);
  const [taskDraft, setTaskDraft] = useState({ title: '', time: '09:00', recurrence: 'once' });

  const [newTask, setNewTask] = useState({ time: '09:00', title: '', recurrence: 'once' });
  const [newYearlyPlan, setNewYearlyPlan] = useState('');
  const [newMonthlyPlan, setNewMonthlyPlan] = useState('');
  const [weeklyData, setWeeklyData] = useState([45, 62, 55, 78, 68, 85, 70]);
  const [weeklyLabels, setWeeklyLabels] = useState(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
  const [monthlyData, setMonthlyData] = useState([60, 65, 70, 72, 75, 78, 80, 82, 85, 87, 89, 91]);
  const [monthlyLabels, setMonthlyLabels] = useState(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']);

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const BISHKEK_TZ = 'Asia/Bishkek';
  const now = new Date();

  const getYmdInTz = (dateObj) => {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: BISHKEK_TZ,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(dateObj);
    const map = Object.fromEntries(parts.filter(p => p.type !== 'literal').map(p => [p.type, p.value]));
    return `${map.year}-${map.month}-${map.day}`;
  };

  const getMonthYearInTz = (dateObj) => {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: BISHKEK_TZ,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(dateObj);
    const map = Object.fromEntries(parts.filter(p => p.type !== 'literal').map(p => [p.type, p.value]));
    return { year: Number(map.year), monthNum: Number(map.month) };
  };

  const sortTasksByTime = (arr) => {
    // Times first (ascending), then unspecified
    return [...arr].sort((a, b) => {
      const aHasTime = !!a.time;
      const bHasTime = !!b.time;
      if (aHasTime && bHasTime) return a.time.localeCompare(b.time); // 'HH:MM' compares correctly
      if (aHasTime && !bHasTime) return -1;
      if (!aHasTime && bHasTime) return 1;
      return 0;
    });
  };

  const { year: currentYear, monthNum: currentMonthNum } = getMonthYearInTz(now);
  const currentMonth = monthNames[currentMonthNum - 1];
  const bishkekTodayStr = getYmdInTz(now);

  const todayTasks = tasks.filter(t => t.date === bishkekTodayStr);
  const otherTasks = tasks.filter(t => t.date !== bishkekTodayStr);

  const completedTasks = todayTasks.filter(t => t.completed).length;
  const totalTasks = todayTasks.length;
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
      // Fetch all tasks so we can split "Today" vs "Other days" in the UI.
      const response = await api.get(`/api/productivity/tasks/?user_id=${userId}`);
      
      const formattedTasks = response.data.map(task => ({
        id: task.id.toString(),
        date: task.date, // YYYY-MM-DD
        time: task.scheduled_time ? task.scheduled_time.substring(0, 5) : '', // HH:MM or unspecified
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
      const response = await api.get(`/api/productivity/stats/?user_id=${userId}&year=${currentYear}`);

      if (Array.isArray(response.data.weekly_data)) {
        setWeeklyData(response.data.weekly_data);
      }
      if (Array.isArray(response.data.weekly_dates)) {
        const labels = response.data.weekly_dates.map((ymd) => {
          // Parse ISO date as UTC midnight then format in Bishkek
          const d = new Date(`${ymd}T00:00:00Z`);
          return new Intl.DateTimeFormat('en-US', { timeZone: BISHKEK_TZ, weekday: 'short' }).format(d);
        });
        setWeeklyLabels(labels);
      }

      if (Array.isArray(response.data.monthly_data)) {
        setMonthlyData(response.data.monthly_data);
      }
      if (Array.isArray(response.data.monthly_labels) && response.data.monthly_labels.length) {
        setMonthlyLabels(response.data.monthly_labels);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const updateTodayWeeklyPercent = (todayTasks) => {
    const total = todayTasks.length;
    const completed = todayTasks.filter(t => t.completed).length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    setWeeklyData((prev) => {
      if (!Array.isArray(prev) || prev.length === 0) return [percent];
      const next = [...prev];
      next[next.length - 1] = percent;
      return next;
    });
  };

  const addTask = async () => {
    if (!newTask.title.trim()) {
      toast.error('Please enter a task title');
      return;
    }

    try {
      const userId = getUserId();
      
      const response = await api.post('/api/productivity/tasks/create/', {
        user_id: userId,
        title: newTask.title,
        scheduled_time: newTask.time || null,
        date: bishkekTodayStr,
        completed: false,
        recurrence: newTask.recurrence
      });

      const formattedTask = {
        id: response.data.id.toString(),
        date: response.data.date,
        time: response.data.scheduled_time ? response.data.scheduled_time.substring(0, 5) : '',
        title: response.data.title,
        completed: response.data.completed,
        recurrence: response.data.recurrence
      };

      setTasks((prev) => {
        const next = [...prev, formattedTask];
        updateTodayWeeklyPercent(next.filter(t => t.date === bishkekTodayStr));
        return next;
      });
      setNewTask({ time: '09:00', title: '', recurrence: 'once' });
      fetchStats();
      
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

      const newCompleted = !task.completed;
      setTasks((prev) => {
        const next = prev.map(t => (t.id === id ? { ...t, completed: newCompleted } : t));
        updateTodayWeeklyPercent(next.filter(t => t.date === bishkekTodayStr));
        return next;
      });
      fetchStats();
    } catch (error) {
      console.error('Error toggling task:', error);
      toast.error('Failed to update task');
    }
  };

  const startEditTask = (task) => {
    setEditingTaskId(task.id);
    setTaskDraft({
      title: task.title,
      time: task.time,
      recurrence: task.recurrence || 'once',
    });
  };

  const cancelEditTask = () => {
    setEditingTaskId(null);
    setTaskDraft({ title: '', time: '09:00', recurrence: 'once' });
  };

  const saveEditTask = async (id) => {
    if (!taskDraft.title.trim()) {
      toast.error('Task title cannot be empty');
      return;
    }

    try {
      const userId = getUserId();
      const response = await api.patch(`/api/productivity/tasks/${id}/`, {
        user_id: userId,
        title: taskDraft.title.trim(),
        scheduled_time: taskDraft.time || null,
        recurrence: taskDraft.recurrence,
      });

      setTasks((prev) =>
        prev.map(t => (
          t.id === id
            ? {
                ...t,
                title: response.data.title,
                time: response.data.scheduled_time ? response.data.scheduled_time.substring(0, 5) : '',
                recurrence: response.data.recurrence || 'once',
              }
            : t
        ))
      );

      cancelEditTask();
      fetchStats();
      toast.success('Task updated');
    } catch (error) {
      console.error('Error updating task:', error);
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
      setTasks((prev) => {
        const next = prev.filter(t => t.id !== id);
        updateTodayWeeklyPercent(next.filter(t => t.date === bishkekTodayStr));
        return next;
      });
      fetchStats();
      
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

  const formatDayHeader = (ymd) => {
    const d = new Date(`${ymd}T00:00:00Z`);
    return new Intl.DateTimeFormat('en-US', {
      timeZone: BISHKEK_TZ,
      weekday: 'short',
      month: 'short',
      day: '2-digit',
    }).format(d);
  };

  const otherTasksSorted = [...otherTasks].sort((a, b) => {
    // Newer dates first
    if (a.date !== b.date) return b.date.localeCompare(a.date);
    // Then time (ascending), unspecified last
    const aHasTime = !!a.time;
    const bHasTime = !!b.time;
    if (aHasTime && bHasTime) return a.time.localeCompare(b.time);
    if (aHasTime && !bHasTime) return -1;
    if (!aHasTime && bHasTime) return 1;
    return 0;
  });

  const todayTasksSorted = sortTasksByTime(todayTasks);

  const otherTasksByDate = otherTasksSorted.reduce((acc, task) => {
    const key = task.date || 'Unknown';
    if (!acc[key]) acc[key] = [];
    acc[key].push(task);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Productivity</h1>
        <div className={`text-2xl font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{currentMonth}</div>
      </div>

      <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
        {/* Today's Tasks */}
        <div className={`md:col-span-2 lg:col-span-2 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl p-6 border shadow-sm transition-colors duration-300`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Daily Tasks</h2>
            <span className={`text-xs font-semibold px-2 py-1 rounded ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
              Today: {completedTasks}/{totalTasks}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Today */}
            <div className={`rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-900/10' : 'border-gray-200 bg-gray-50/50'} p-4`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Today</h3>
                <span className={`text-[11px] ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{bishkekTodayStr}</span>
              </div>

              <div className="space-y-3 mb-4">
                {todayTasksSorted.length === 0 ? (
                  <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} py-6 text-center`}>
                    No tasks for today yet.
                  </div>
                ) : (
                  todayTasksSorted.map(task => (
                    <div key={task.id} className={`flex items-center space-x-3 p-3 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:bg-gray-100'} rounded-lg transition`}>
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => toggleTask(task.id)}
                        className="w-5 h-5 cursor-pointer accent-blue-500"
                      />
                      {editingTaskId === task.id ? (
                        <>
                          <div className="flex-1 space-y-2">
                            <input
                              value={taskDraft.title}
                              onChange={(e) => setTaskDraft({ ...taskDraft, title: e.target.value })}
                              className={`w-full px-3 py-2 rounded border text-sm outline-none ${
                                darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                              }`}
                            />
                            <div className="flex gap-2">
                              <input
                                type="time"
                                value={taskDraft.time || ''}
                                onChange={(e) => setTaskDraft({ ...taskDraft, time: e.target.value })}
                                disabled={!taskDraft.time}
                                className={`px-3 py-2 rounded border text-sm outline-none ${
                                  darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                                }`}
                              />
                              <label className={`flex items-center gap-2 px-2 text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                <input
                                  type="checkbox"
                                  checked={!taskDraft.time}
                                  onChange={(e) => setTaskDraft({ ...taskDraft, time: e.target.checked ? '' : '09:00' })}
                                  className="w-4 h-4 cursor-pointer accent-blue-500"
                                />
                                Unspecified
                              </label>
                              <select
                                value={taskDraft.recurrence}
                                onChange={(e) => setTaskDraft({ ...taskDraft, recurrence: e.target.value })}
                                className={`flex-1 px-3 py-2 rounded border text-sm outline-none ${
                                  darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                                }`}
                              >
                                <option value="once">Today only</option>
                                <option value="daily">Daily</option>
                                <option value="weekdays">Weekdays</option>
                              </select>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2">
                            <button
                              type="button"
                              onClick={() => saveEditTask(task.id)}
                              className="px-3 py-2 text-xs font-semibold rounded bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={cancelEditTask}
                              className={`px-3 py-2 text-xs font-semibold rounded ${
                                darkMode ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                              }`}
                            >
                              Cancel
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => startEditTask(task)}
                            className={`flex-1 text-left text-sm font-medium ${
                              task.completed ? `line-through ${darkMode ? 'text-gray-500' : 'text-gray-500'}` : `${darkMode ? 'text-white' : 'text-gray-900'}`
                            }`}
                            title="Click to edit"
                          >
                            {task.title}
                          </button>

                          <button
                            type="button"
                            onClick={() => startEditTask(task)}
                            className={`text-xs font-semibold px-2 py-1 rounded ${
                              darkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700'
                            }`}
                            title="Click to edit time"
                          >
                            {task.time || 'Unspecified'}
                          </button>

                          <button
                            type="button"
                            onClick={() => startEditTask(task)}
                            className={`text-xs px-2 py-1 rounded ${
                              task.recurrence === 'daily'
                                ? darkMode ? 'bg-purple-900 text-purple-300' : 'bg-purple-100 text-purple-700'
                                : task.recurrence === 'weekdays'
                                  ? darkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-700'
                                  : darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-200 text-gray-700'
                            }`}
                            title="Click to edit recurrence"
                          >
                            {task.recurrence === 'daily'
                              ? 'Daily'
                              : task.recurrence === 'weekdays'
                                ? 'Weekdays'
                                : 'Today'}
                          </button>

                          <button onClick={() => deleteTask(task.id)} className={`${darkMode ? 'text-red-400 hover:text-red-300' : 'text-red-500 hover:text-red-700'} text-sm font-bold`}>✕</button>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className={`space-y-2 pt-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex space-x-2">
                  <input
                    type="time"
                    value={newTask.time || ''}
                    onChange={(e) => setNewTask({ ...newTask, time: e.target.value })}
                    disabled={!newTask.time}
                    className={`px-3 py-2 border rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                  />
                  <label className={`flex items-center gap-2 px-2 text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <input
                      type="checkbox"
                      checked={!newTask.time}
                      onChange={(e) => setNewTask({ ...newTask, time: e.target.checked ? '' : '09:00' })}
                      className="w-4 h-4 cursor-pointer accent-blue-500"
                    />
                    Unspecified
                  </label>
                  <input
                    type="text"
                    placeholder="Add task..."
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    onKeyPress={(e) => e.key === 'Enter' && addTask()}
                    className={`flex-1 px-3 py-2 border rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300'}`}
                  />
                </div>
                <select
                  value={newTask.recurrence}
                  onChange={(e) => setNewTask({ ...newTask, recurrence: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
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

            {/* Other days */}
            <div className={`rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-900/10' : 'border-gray-200 bg-gray-50/50'} p-4`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Other days</h3>
                <span className={`text-[11px] ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{otherTasks.length} tasks</span>
              </div>

              <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
                {otherTasksSorted.length === 0 ? (
                  <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} py-6 text-center`}>
                    Nothing outside today yet.
                  </div>
                ) : (
                  Object.entries(otherTasksByDate).map(([dateKey, dateTasks]) => (
                    <div key={dateKey} className="space-y-2">
                      <div className={`text-xs font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} sticky top-0 ${darkMode ? 'bg-gray-800' : 'bg-white'} py-1`}>
                        {dateKey === 'Unknown' ? 'Unknown date' : formatDayHeader(dateKey)} <span className={`${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>({dateKey})</span>
                      </div>
                      {dateTasks.map((task) => (
                        <div key={task.id} className={`flex items-center space-x-3 p-3 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:bg-gray-100'} rounded-lg transition`}>
                          <input
                            type="checkbox"
                            checked={task.completed}
                            onChange={() => toggleTask(task.id)}
                            className="w-5 h-5 cursor-pointer accent-blue-500"
                          />
                          {editingTaskId === task.id ? (
                            <>
                              <div className="flex-1 space-y-2">
                                <input
                                  value={taskDraft.title}
                                  onChange={(e) => setTaskDraft({ ...taskDraft, title: e.target.value })}
                                  className={`w-full px-3 py-2 rounded border text-sm outline-none ${
                                    darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                                  }`}
                                />
                                <div className="flex gap-2">
                                  <input
                                    type="time"
                                    value={taskDraft.time || ''}
                                    onChange={(e) => setTaskDraft({ ...taskDraft, time: e.target.value })}
                                    disabled={!taskDraft.time}
                                    className={`px-3 py-2 rounded border text-sm outline-none ${
                                      darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                                    }`}
                                  />
                                  <label className={`flex items-center gap-2 px-2 text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    <input
                                      type="checkbox"
                                      checked={!taskDraft.time}
                                      onChange={(e) => setTaskDraft({ ...taskDraft, time: e.target.checked ? '' : '09:00' })}
                                      className="w-4 h-4 cursor-pointer accent-blue-500"
                                    />
                                    Unspecified
                                  </label>
                                  <select
                                    value={taskDraft.recurrence}
                                    onChange={(e) => setTaskDraft({ ...taskDraft, recurrence: e.target.value })}
                                    className={`flex-1 px-3 py-2 rounded border text-sm outline-none ${
                                      darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                                    }`}
                                  >
                                    <option value="once">One-time</option>
                                    <option value="daily">Daily</option>
                                    <option value="weekdays">Weekdays</option>
                                  </select>
                                </div>
                              </div>

                              <div className="flex flex-col gap-2">
                                <button
                                  type="button"
                                  onClick={() => saveEditTask(task.id)}
                                  className="px-3 py-2 text-xs font-semibold rounded bg-emerald-600 hover:bg-emerald-700 text-white"
                                >
                                  Save
                                </button>
                                <button
                                  type="button"
                                  onClick={cancelEditTask}
                                  className={`px-3 py-2 text-xs font-semibold rounded ${
                                    darkMode ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                                  }`}
                                >
                                  Cancel
                                </button>
                              </div>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => startEditTask(task)}
                                className={`flex-1 text-left text-sm font-medium ${
                                  task.completed ? `line-through ${darkMode ? 'text-gray-500' : 'text-gray-500'}` : `${darkMode ? 'text-white' : 'text-gray-900'}`
                                }`}
                                title="Click to edit"
                              >
                                {task.title}
                              </button>

                              <button
                                type="button"
                                onClick={() => startEditTask(task)}
                                className={`text-xs font-semibold px-2 py-1 rounded ${
                                  darkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700'
                                }`}
                                title="Click to edit time"
                              >
                                {task.time || 'Unspecified'}
                              </button>

                              <button
                                type="button"
                                onClick={() => startEditTask(task)}
                                className={`text-xs px-2 py-1 rounded ${
                                  task.recurrence === 'daily'
                                    ? darkMode ? 'bg-purple-900 text-purple-300' : 'bg-purple-100 text-purple-700'
                                    : task.recurrence === 'weekdays'
                                      ? darkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-700'
                                      : darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-200 text-gray-700'
                                }`}
                                title="Click to edit recurrence"
                              >
                                {task.recurrence === 'daily'
                                  ? 'Daily'
                                  : task.recurrence === 'weekdays'
                                    ? 'Weekdays'
                                    : 'Once'}
                              </button>

                              <button onClick={() => deleteTask(task.id)} className={`${darkMode ? 'text-red-400 hover:text-red-300' : 'text-red-500 hover:text-red-700'} text-sm font-bold`}>✕</button>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  ))
                )}
              </div>
            </div>
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
          <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>Last 7 Days Productivity</h3>
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
              {(weeklyLabels || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']).map((dayLabel, i) => (
                <div key={`${dayLabel}-${i}`} className="flex flex-col items-center flex-1">
                  <div className="relative w-full flex flex-col items-center">
                    <span className={`text-xs font-semibold mb-1 ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                      {weeklyData[i]}%
                    </span>
                    <div className="w-full bg-gradient-to-b from-blue-400 to-blue-500 rounded-t" style={{ height: `${(weeklyData[i] / 100) * 120}px` }}></div>
                  </div>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-2 font-medium`}>{dayLabel}</p>
                </div>
              ))}
            </div>
          </div>
          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-4 text-center`}>Average: {Math.round(weeklyData.reduce((a, b) => a + b) / weeklyData.length)}%</p>
        </div>

        {/* Monthly Productivity */}
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl p-6 border shadow-sm transition-colors duration-300`}>
          <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>{currentYear} Productivity by Month</h3>
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
            <div className="flex-1">
              <div className="flex items-end justify-between h-40 gap-1">
              {monthlyData.map((value, i) => (
                <div key={i} className="flex-1 relative group">
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className={`text-xs font-semibold ${darkMode ? 'text-emerald-300' : 'text-emerald-700'} whitespace-nowrap`}>
                      {(monthlyLabels[i] || `M${i + 1}`)}: {value}%
                    </span>
                  </div>
                  <div className="w-full bg-gradient-to-b from-emerald-400 to-emerald-500 rounded-t hover:opacity-80 transition" style={{ height: `${(value / 100) * 120}px` }}></div>
                </div>
              ))}
              </div>
              <div className="flex justify-between gap-1 mt-2">
                {monthlyData.map((_, i) => (
                  <div key={`label-${i}`} className={`flex-1 text-center text-[10px] ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {monthlyLabels[i] || `M${i + 1}`}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-4 text-center`}>Hover a bar to see the exact percent.</p>
        </div>
      </div>
    </div>
  );
}
