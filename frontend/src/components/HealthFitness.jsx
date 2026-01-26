import { useEffect, useMemo, useState } from 'react';
import { Apple, Dumbbell, Flame, Zap, Trash2 } from 'lucide-react';
import api from '../services/api';
import { toast } from 'react-toastify';
import { LineChart } from '@mui/x-charts/LineChart';

export default function HealthFitness({ darkMode }) {
  const [activeTab, setActiveTab] = useState('fitness'); // 'fitness' | 'nutrition'

  const getUserId = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.id;
  };

  const workouts = useMemo(
    () => [
      { id: '1', date: '2026-01-21', type: 'Gym', duration: 60, notes: 'Upper body strength' },
      { id: '2', date: '2026-01-20', type: 'Running', duration: 45, notes: 'Cardio at park' },
      { id: '3', date: '2026-01-19', type: 'Yoga', duration: 30, notes: 'Flexibility session' },
    ],
    []
  );

  const meals = useMemo(() => [], []);

  const streak = 5;
  const weeklyCount = 3;
  const totalHours = (workouts.reduce((acc, w) => acc + w.duration, 0) / 60).toFixed(1);
  const avgDuration = weeklyCount > 0 ? Math.round(workouts.reduce((acc, w) => acc + w.duration, 0) / weeklyCount) : 0;

  const [profileDraft, setProfileDraft] = useState({
    sex: 'male',
    birth_date: '',
    age_years: 25,
    height_cm: 175,
    weight_kg: 75,
    activity_level: 'moderate',
    activity_multiplier: 1.55,
  });

  const [goalDraft, setGoalDraft] = useState({
    goal_type: 'maintenance',
    calorie_adjustment_percent: 0,
    protein_g_per_kg: 1.8,
    fat_g_per_kg: 0.8,
  });

  const [targetsResp, setTargetsResp] = useState(null);
  const [nutritionLoading, setNutritionLoading] = useState(false);
  const [showNutritionSettings, setShowNutritionSettings] = useState(true);
  const [foods, setFoods] = useState([]);
  const [dayLog, setDayLog] = useState({ date: null, entries: [], totals: { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 } });
  const [foodLogLoading, setFoodLogLoading] = useState(false);
  const [selectedFoodId, setSelectedFoodId] = useState('');
  const [servingsDraft, setServingsDraft] = useState(1);
  const [showFoodCreate, setShowFoodCreate] = useState(false);
  const [foodDraft, setFoodDraft] = useState({
    name: '',
    calories_kcal: '',
    protein_g: '',
    carbs_g: '',
    fat_g: '',
  });
  const [checkins, setCheckins] = useState([]);
  const [checkinDraft, setCheckinDraft] = useState({ weight_kg: '' });
  const [checkinLoading, setCheckinLoading] = useState(false);
  const [hoveredCheckinId, setHoveredCheckinId] = useState(null);

  const applyGoalDefaults = (goalType) => {
    const defaults = {
      fat_loss: { calorie_adjustment_percent: -20, protein_g_per_kg: 2.2, fat_g_per_kg: 0.8 },
      maintenance: { calorie_adjustment_percent: 0, protein_g_per_kg: 1.8, fat_g_per_kg: 0.8 },
      recomp: { calorie_adjustment_percent: -10, protein_g_per_kg: 2.0, fat_g_per_kg: 0.8 },
      lean_bulk: { calorie_adjustment_percent: 10, protein_g_per_kg: 1.8, fat_g_per_kg: 0.8 },
      bulk: { calorie_adjustment_percent: 15, protein_g_per_kg: 1.6, fat_g_per_kg: 0.9 },
    };
    return defaults[goalType] || defaults.maintenance;
  };

  const loadNutrition = async () => {
    const userId = getUserId();
    if (!userId) return;

    setNutritionLoading(true);
    try {
      const [profileRes, goalRes] = await Promise.all([
        api.get(`/api/nutrition/profile/?user_id=${userId}`),
        api.get(`/api/nutrition/goal/?user_id=${userId}`),
      ]);

      const p = profileRes.data || {};
      const g = goalRes.data || {};

      setProfileDraft({
        sex: p.sex || 'male',
        birth_date: p.birth_date || '',
        age_years: p.age_years ?? 25,
        height_cm: Number(p.height_cm ?? 175),
        weight_kg: Number(p.weight_kg ?? 75),
        activity_level: p.activity_level || 'moderate',
        activity_multiplier: Number(p.activity_multiplier ?? 1.55),
      });

      setGoalDraft({
        goal_type: g.goal_type || 'maintenance',
        calorie_adjustment_percent: Number(g.calorie_adjustment_percent ?? 0),
        protein_g_per_kg: Number(g.protein_g_per_kg ?? 1.8),
        fat_g_per_kg: Number(g.fat_g_per_kg ?? 0.8),
      });

      const targets = await api.get(`/api/nutrition/targets/?user_id=${userId}`);
      setTargetsResp(targets.data);
      // Auto-hide settings once targets exist (user can reopen via "Edit settings")
      if (targets.data?.targets?.calories) {
        setShowNutritionSettings(false);
      }

      const [foodsRes, logRes] = await Promise.all([
        api.get(`/api/nutrition/foods/?user_id=${userId}`),
        api.get(`/api/nutrition/log/?user_id=${userId}`),
      ]);
      const foodsList = Array.isArray(foodsRes.data) ? foodsRes.data : [];
      setFoods(foodsList);
      setDayLog(logRes.data || { date: null, entries: [], totals: { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 } });
      if (!selectedFoodId && foodsList.length > 0) {
        setSelectedFoodId(String(foodsList[0].id));
      }

      const checkinsRes = await api.get(`/api/nutrition/checkins/?user_id=${userId}&limit=20`);
      setCheckins(Array.isArray(checkinsRes.data) ? checkinsRes.data : []);
    } catch (e) {
      // It's okay if not set yet; the user will fill it in.
      console.error(e);
      setShowNutritionSettings(true);
    } finally {
      setNutritionLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'nutrition') {
      loadNutrition();
    }
  }, [activeTab]);

  const saveAndCalculate = async () => {
    const userId = getUserId();
    if (!userId) {
      toast.error('User not found. Please sign in again.');
      return;
    }

    setNutritionLoading(true);
    try {
      const profilePayload = {
        user_id: userId,
        sex: profileDraft.sex,
        birth_date: profileDraft.birth_date || null,
        age_years: profileDraft.birth_date ? null : Number(profileDraft.age_years),
        height_cm: Number(profileDraft.height_cm),
        weight_kg: Number(profileDraft.weight_kg),
        activity_level: profileDraft.activity_level,
        activity_multiplier: profileDraft.activity_level === 'custom' ? Number(profileDraft.activity_multiplier) : null,
      };

      const goalPayload = {
        user_id: userId,
        goal_type: goalDraft.goal_type,
        calorie_adjustment_percent: Number(goalDraft.calorie_adjustment_percent),
        protein_g_per_kg: Number(goalDraft.protein_g_per_kg),
        fat_g_per_kg: Number(goalDraft.fat_g_per_kg),
      };

      await Promise.all([
        api.patch(`/api/nutrition/profile/?user_id=${userId}`, profilePayload),
        api.patch(`/api/nutrition/goal/?user_id=${userId}`, goalPayload),
      ]);

      const targets = await api.get(`/api/nutrition/targets/?user_id=${userId}`);
      setTargetsResp(targets.data);
      toast.success('Nutrition targets updated');
      setShowNutritionSettings(false);
    } catch (e) {
      const msg = e?.response?.data?.error || 'Failed to calculate targets';
      toast.error(msg);
    } finally {
      setNutritionLoading(false);
    }
  };

  const cardBase = `${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl p-6 border transition-colors duration-300`;
  const mutedText = darkMode ? 'text-gray-400' : 'text-gray-600';
  const formatDateLabel = (iso) => {
    if (!iso) return '';
    // Add time to avoid timezone shifting the date
    const d = new Date(`${iso}T00:00:00`);
    if (Number.isNaN(d.getTime())) return String(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const targets = targetsResp?.targets || null;
  const totals = dayLog?.totals || { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 };
  const targetCalories = Number(targets?.calories || 0);
  const eatenCalories = Number(totals?.calories || 0);
  const targetProtein = Number(targets?.protein_g || 0);
  const eatenProtein = Number(totals?.protein_g || 0);
  const targetCarbs = Number(targets?.carbs_g || 0);
  const eatenCarbs = Number(totals?.carbs_g || 0);
  const targetFat = Number(targets?.fat_g || 0);
  const eatenFat = Number(totals?.fat_g || 0);

  const pct = (eaten, target) => (target > 0 ? Math.min(100, (Number(eaten) / Number(target)) * 100) : 0);

  const checkinSeries = useMemo(() => {
    if (!Array.isArray(checkins) || checkins.length === 0) return [];
    return [...checkins]
      .map((c) => ({ ...c, _weight: Number(c.weight_kg) }))
      .filter((c) => Number.isFinite(c._weight) && c._weight > 0 && c.date)
      .sort((a, b) => String(a.date).localeCompare(String(b.date)));
  }, [checkins]);

  // Prepare data for MUI X Charts - 21 day window centered on today
  const chartData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayIso = today.toISOString().slice(0, 10);
    
    // Create 21-day window: 10 days before, today, 10 days after
    const allDates = [];
    for (let i = -10; i <= 10; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      allDates.push(d.toISOString().slice(0, 10));
    }
    
    // Create a map of existing check-ins
    const checkinMap = new Map();
    checkinSeries.forEach((c) => {
      checkinMap.set(c.date, { weight: c._weight, id: c.id });
    });
    
    // Fill in all dates (null for missing dates)
    const xAxis = allDates.map((d) => new Date(`${d}T00:00:00`));
    const series = allDates.map((d) => {
      const checkin = checkinMap.get(d);
      return checkin ? checkin.weight : null;
    });
    const ids = allDates.map((d) => {
      const checkin = checkinMap.get(d);
      return checkin ? checkin.id : null;
    });
    
    // Group dates by month for top labels
    const monthGroups = [];
    let currentMonth = null;
    let monthStart = 0;
    xAxis.forEach((date, idx) => {
      const month = date.toLocaleDateString('en-US', { month: 'long' });
      if (month !== currentMonth) {
        if (currentMonth !== null) {
          monthGroups.push({ month: currentMonth, start: monthStart, end: idx - 1 });
        }
        currentMonth = month;
        monthStart = idx;
      }
    });
    if (currentMonth !== null) {
      monthGroups.push({ month: currentMonth, start: monthStart, end: xAxis.length - 1 });
    }
    
    return { xAxis, series, ids, todayDate: new Date(`${todayIso}T00:00:00`), monthGroups };
  }, [checkinSeries]);

  const addFoodToToday = async () => {
    const userId = getUserId();
    if (!userId) {
      toast.error('User not found. Please sign in again.');
      return;
    }
    if (!selectedFoodId) {
      toast.error('Please select a food first.');
      return;
    }
    if (!servingsDraft || Number(servingsDraft) <= 0) {
      toast.error('Servings must be greater than 0.');
      return;
    }
    setFoodLogLoading(true);
    try {
      const res = await api.post(`/api/nutrition/log/?user_id=${userId}`, {
        user_id: userId,
        food_id: Number(selectedFoodId),
        servings: Number(servingsDraft),
      });
      setDayLog(res.data);
      setServingsDraft(1);
      toast.success('Added to today');
    } catch (e) {
      const msg = e?.response?.data?.error || 'Failed to add food';
      toast.error(msg);
    } finally {
      setFoodLogLoading(false);
    }
  };

  const deleteFoodEntry = async (entryId) => {
    const userId = getUserId();
    if (!userId) return;
    setFoodLogLoading(true);
    try {
      const res = await api.delete(`/api/nutrition/log/${entryId}/delete/?user_id=${userId}`);
      setDayLog(res.data);
    } catch (e) {
      const msg = e?.response?.data?.error || 'Failed to delete entry';
      toast.error(msg);
    } finally {
      setFoodLogLoading(false);
    }
  };

  const createFood = async () => {
    const userId = getUserId();
    if (!userId) {
      toast.error('User not found. Please sign in again.');
      return;
    }
    if (!foodDraft.name.trim()) {
      toast.error('Food name is required.');
      return;
    }
    if (!foodDraft.calories_kcal || Number(foodDraft.calories_kcal) <= 0) {
      toast.error('Calories is required.');
      return;
    }
    setFoodLogLoading(true);
    try {
      const payload = {
        user_id: userId,
        name: foodDraft.name.trim(),
        calories_kcal: Number(foodDraft.calories_kcal),
        protein_g: Number(foodDraft.protein_g || 0),
        carbs_g: Number(foodDraft.carbs_g || 0),
        fat_g: Number(foodDraft.fat_g || 0),
      };
      const res = await api.post(`/api/nutrition/foods/?user_id=${userId}`, payload);
      const next = [...foods, res.data].sort((a, b) => String(a.name).localeCompare(String(b.name)));
      setFoods(next);
      setSelectedFoodId(String(res.data.id));
      setFoodDraft({ name: '', calories_kcal: '', protein_g: '', carbs_g: '', fat_g: '' });
      setShowFoodCreate(false);
      toast.success('Food added');
    } catch (e) {
      const msg = e?.response?.data?.error || 'Failed to add food';
      toast.error(msg);
    } finally {
      setFoodLogLoading(false);
    }
  };

  const saveCheckin = async () => {
    const userId = getUserId();
    if (!userId) {
      toast.error('User not found. Please sign in again.');
      return;
    }
    if (!checkinDraft.weight_kg || Number(checkinDraft.weight_kg) <= 0) {
      toast.error('Weight is required.');
      return;
    }
    setCheckinLoading(true);
    try {
      const todayIso = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
      await api.post(`/api/nutrition/checkins/?user_id=${userId}`, {
        user_id: userId,
        date: todayIso,
        weight_kg: Number(checkinDraft.weight_kg),
      });
      const checkinsRes = await api.get(`/api/nutrition/checkins/?user_id=${userId}&limit=20`);
      setCheckins(Array.isArray(checkinsRes.data) ? checkinsRes.data : []);
      setCheckinDraft({ weight_kg: '' });
      toast.success('Check-in saved');
    } catch (e) {
      const msg = e?.response?.data?.error || 'Failed to save check-in';
      toast.error(msg);
    } finally {
      setCheckinLoading(false);
    }
  };

  const deleteCheckin = async (id) => {
    const userId = getUserId();
    if (!userId) return;
    setCheckinLoading(true);
    try {
      await api.delete(`/api/nutrition/checkins/${id}/delete/?user_id=${userId}`);
      const checkinsRes = await api.get(`/api/nutrition/checkins/?user_id=${userId}&limit=20`);
      setCheckins(Array.isArray(checkinsRes.data) ? checkinsRes.data : []);
      toast.success('Check-in deleted');
    } catch (e) {
      const msg = e?.response?.data?.error || 'Failed to delete check-in';
      toast.error(msg);
    } finally {
      setCheckinLoading(false);
    }
  };

  const autoAdjustCalories = async () => {
    const userId = getUserId();
    if (!userId) return;
    setCheckinLoading(true);
    try {
      const res = await api.post(`/api/nutrition/auto-adjust/?user_id=${userId}`, { user_id: userId, apply: true });
      const delta = res.data?.recommended_delta_percent;
      const reason = res.data?.reason || 'Auto-adjusted';
      if (!delta || Number(delta) === 0) {
        toast.info(reason);
      } else {
        toast.success(`${reason} (${delta > 0 ? '+' : ''}${delta}%)`);
      }
      // Refresh targets + goal view and keep UI consistent
      const targets = await api.get(`/api/nutrition/targets/?user_id=${userId}`);
      setTargetsResp(targets.data);
      const goalRes = await api.get(`/api/nutrition/goal/?user_id=${userId}`);
      const g = goalRes.data || {};
      setGoalDraft({
        goal_type: g.goal_type || 'maintenance',
        calorie_adjustment_percent: Number(g.calorie_adjustment_percent ?? 0),
        protein_g_per_kg: Number(g.protein_g_per_kg ?? 1.8),
        fat_g_per_kg: Number(g.fat_g_per_kg ?? 0.8),
      });
    } catch (e) {
      const msg = e?.response?.data?.error || 'Failed to auto-adjust';
      toast.error(msg);
    } finally {
      setCheckinLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Health & Fitness</h1>

      {/* Tabs (UI only) */}
      <div className={`flex gap-2 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} overflow-x-auto`}>
        <button
          type="button"
          onClick={() => setActiveTab('fitness')}
          className={`flex items-center gap-2 px-4 py-3 font-medium transition whitespace-nowrap ${
            activeTab === 'fitness'
              ? `${darkMode ? 'border-b-2 border-emerald-400 text-emerald-300' : 'border-b-2 border-emerald-500 text-emerald-600'}`
              : `${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`
          }`}
        >
          <Dumbbell className="w-5 h-5" />
          Workouts & Fitness
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('nutrition')}
          className={`flex items-center gap-2 px-4 py-3 font-medium transition whitespace-nowrap ${
            activeTab === 'nutrition'
              ? `${darkMode ? 'border-b-2 border-emerald-400 text-emerald-300' : 'border-b-2 border-emerald-500 text-emerald-600'}`
              : `${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`
          }`}
        >
          <Apple className="w-5 h-5" />
          Nutrition & Calories
        </button>
      </div>

      {activeTab === 'fitness' ? (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className={`${darkMode ? 'bg-emerald-900/30 border-emerald-700' : 'bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200'} rounded-xl p-6 border transition-colors duration-300`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Workout Streak</h3>
                <Zap className={`w-5 h-5 ${darkMode ? 'text-amber-300' : 'text-amber-500'}`} />
              </div>
              <div className={`text-4xl font-bold ${darkMode ? 'text-emerald-300' : 'text-emerald-600'} mb-2`}>{streak}</div>
              <p className={`text-sm ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Days in a row</p>
              <div className={`mt-4 pt-4 border-t ${darkMode ? 'border-emerald-800/60 text-gray-200' : 'border-emerald-200 text-gray-700'} space-y-1 text-xs`}>
                <p>Weekly: {weeklyCount} workouts</p>
                <p>Monthly: {totalHours} hours</p>
              </div>
            </div>

            <div className={`${darkMode ? 'bg-blue-900/30 border-blue-700' : 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200'} rounded-xl p-6 border transition-colors duration-300`}>
              <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>Today's Workout</h3>
              <button
                type="button"
                disabled
                className={`w-full py-3 rounded-lg font-semibold transition ${
                  darkMode ? 'bg-gray-700 text-gray-300 cursor-not-allowed' : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                }`}
                title="UI only (no functionality yet)"
              >
                I went to the gym today
              </button>
              <p className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-700'} mt-3`}>Keeps your streak going! (UI only)</p>
            </div>

            <div className={`${darkMode ? 'bg-purple-900/30 border-purple-700' : 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200'} rounded-xl p-6 border transition-colors duration-300`}>
              <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>Weekly Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className={`text-sm ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Workouts</span>
                  <span className={`text-2xl font-bold ${darkMode ? 'text-purple-300' : 'text-purple-600'}`}>{weeklyCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`text-sm ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Avg Duration</span>
                  <span className={`text-lg font-bold ${darkMode ? 'text-purple-300' : 'text-purple-600'}`}>{avgDuration} min</span>
                </div>
              </div>
            </div>
          </div>

          {/* Log workout (UI only) */}
          <div className={cardBase}>
            <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>Log a Workout</h3>
            <div className="grid md:grid-cols-4 gap-3">
              <select
                disabled
                defaultValue="Gym"
                className={`px-3 py-2 rounded-lg border outline-none ${
                  darkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300 text-gray-900'
                }`}
                title="UI only (no functionality yet)"
              >
                <option>Gym</option>
                <option>Running</option>
                <option>Cycling</option>
                <option>Yoga</option>
                <option>Swimming</option>
                <option>Sports</option>
                <option>Walking</option>
              </select>
              <input
                disabled
                type="number"
                min="1"
                placeholder="Duration (min)"
                className={`px-3 py-2 rounded-lg border outline-none ${
                  darkMode ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900'
                }`}
                title="UI only (no functionality yet)"
              />
              <input
                disabled
                type="text"
                placeholder="Notes..."
                className={`px-3 py-2 rounded-lg border outline-none ${
                  darkMode ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900'
                }`}
                title="UI only (no functionality yet)"
              />
              <button
                type="button"
                disabled
                className={`px-4 py-2 rounded-lg font-medium ${
                  darkMode ? 'bg-gray-700 text-gray-300 cursor-not-allowed' : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                }`}
                title="UI only (no functionality yet)"
              >
                Add Workout
              </button>
            </div>
          </div>

          {/* Workout History (UI only) */}
          <div className={cardBase}>
            <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>Workout History</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[640px]">
                <thead className={darkMode ? 'border-b border-gray-700' : 'border-b border-gray-200'}>
                  <tr className={`${darkMode ? 'text-gray-200' : 'text-gray-700'} font-semibold`}>
                    <th className="text-left py-2 px-3">Date</th>
                    <th className="text-left py-2 px-3">Type</th>
                    <th className="text-left py-2 px-3">Duration</th>
                    <th className="text-left py-2 px-3">Notes</th>
                    <th className="text-left py-2 px-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {workouts.map((workout) => (
                    <tr key={workout.id} className={darkMode ? 'border-b border-gray-700/60 hover:bg-gray-700/40' : 'border-b border-gray-100 hover:bg-gray-50'}>
                      <td className={`py-3 px-3 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                        {new Date(workout.date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          darkMode ? 'bg-emerald-900/40 text-emerald-200' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {workout.type}
                        </span>
                      </td>
                      <td className={`py-3 px-3 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{workout.duration} min</td>
                      <td className={`py-3 px-3 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{workout.notes}</td>
                      <td className="py-3 px-3">
                        <button
                          type="button"
                          disabled
                          className={`${darkMode ? 'text-gray-500' : 'text-gray-400'} text-sm font-medium cursor-not-allowed`}
                          title="UI only (no functionality yet)"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className={`text-xs mt-3 ${mutedText}`}>UI only for now (no logging/deleting yet).</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Quick actions */}
          {!showNutritionSettings && (
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => setShowNutritionSettings(true)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  darkMode ? 'bg-gray-800 border border-gray-700 text-gray-200 hover:bg-gray-700' : 'bg-white border border-gray-200 text-gray-800 hover:bg-gray-50'
                }`}
              >
                Edit settings
              </button>
            </div>
          )}

          {/* Settings */}
          {showNutritionSettings && (
            <div className={cardBase}>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Your parameters</h3>
                  <p className={`text-xs ${mutedText} mt-1`}>Set your body stats + goal. We’ll calculate your daily targets.</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowNutritionSettings(false)}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                    }`}
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={saveAndCalculate}
                    disabled={nutritionLoading}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      nutritionLoading
                        ? (darkMode ? 'bg-gray-700 text-gray-300 cursor-not-allowed' : 'bg-gray-200 text-gray-600 cursor-not-allowed')
                        : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                    }`}
                  >
                    {nutritionLoading ? 'Calculating…' : 'Save & Calculate'}
                  </button>
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-6 mt-6">
                <div className={`rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-900/10' : 'border-gray-200 bg-gray-50/50'} p-4`}>
                  <h4 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-3`}>Body</h4>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${mutedText}`}>Sex</label>
                      <select
                        value={profileDraft.sex}
                        onChange={(e) => setProfileDraft((p) => ({ ...p, sex: e.target.value }))}
                        className={`w-full px-3 py-2 rounded-lg border text-sm outline-none ${
                          darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                    </div>

                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${mutedText}`}>Birth date (recommended)</label>
                    <input
                      type="date"
                      value={profileDraft.birth_date || ''}
                      onChange={(e) => setProfileDraft((p) => ({ ...p, birth_date: e.target.value }))}
                      className={`w-full px-3 py-2 rounded-lg border text-sm outline-none ${
                        darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                    <p className={`text-[11px] mt-1 ${mutedText}`}>If you don’t set birth date, we’ll use age.</p>
                  </div>

                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${mutedText}`}>Age (years)</label>
                    <input
                      type="number"
                      min="10"
                      max="120"
                      value={profileDraft.age_years}
                      onChange={(e) => setProfileDraft((p) => ({ ...p, age_years: Number(e.target.value) }))}
                      disabled={!!profileDraft.birth_date}
                      className={`w-full px-3 py-2 rounded-lg border text-sm outline-none ${
                        darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                      } ${profileDraft.birth_date ? 'opacity-60 cursor-not-allowed' : ''}`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${mutedText}`}>Height (cm)</label>
                    <input
                      type="number"
                      min="120"
                      max="250"
                      value={profileDraft.height_cm}
                      onChange={(e) => setProfileDraft((p) => ({ ...p, height_cm: Number(e.target.value) }))}
                      className={`w-full px-3 py-2 rounded-lg border text-sm outline-none ${
                        darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${mutedText}`}>Weight (kg)</label>
                    <input
                      type="number"
                      min="30"
                      max="250"
                      step="0.1"
                      value={profileDraft.weight_kg}
                      onChange={(e) => setProfileDraft((p) => ({ ...p, weight_kg: Number(e.target.value) }))}
                      className={`w-full px-3 py-2 rounded-lg border text-sm outline-none ${
                        darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${mutedText}`}>Activity</label>
                    <select
                      value={profileDraft.activity_level}
                      onChange={(e) => {
                        const level = e.target.value;
                        setProfileDraft((p) => ({
                          ...p,
                          activity_level: level,
                          activity_multiplier: level === 'custom' ? p.activity_multiplier : p.activity_multiplier,
                        }));
                      }}
                      className={`w-full px-3 py-2 rounded-lg border text-sm outline-none ${
                        darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="sedentary">Sedentary</option>
                      <option value="light">Light</option>
                      <option value="moderate">Moderate</option>
                      <option value="active">Active</option>
                      <option value="athlete">Athlete</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>

                  {profileDraft.activity_level === 'custom' && (
                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${mutedText}`}>Activity multiplier</label>
                      <input
                        type="number"
                        min="1.1"
                        max="2.5"
                        step="0.01"
                        value={profileDraft.activity_multiplier}
                        onChange={(e) => setProfileDraft((p) => ({ ...p, activity_multiplier: Number(e.target.value) }))}
                        className={`w-full px-3 py-2 rounded-lg border text-sm outline-none ${
                          darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className={`rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-900/10' : 'border-gray-200 bg-gray-50/50'} p-4`}>
                <h4 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-3`}>Goal</h4>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${mutedText}`}>Purpose</label>
                    <select
                      value={goalDraft.goal_type}
                      onChange={(e) => {
                        const nextType = e.target.value;
                        const d = applyGoalDefaults(nextType);
                        setGoalDraft((g) => ({
                          ...g,
                          goal_type: nextType,
                          calorie_adjustment_percent: d.calorie_adjustment_percent,
                          protein_g_per_kg: d.protein_g_per_kg,
                          fat_g_per_kg: d.fat_g_per_kg,
                        }));
                      }}
                      className={`w-full px-3 py-2 rounded-lg border text-sm outline-none ${
                        darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="fat_loss">Fat loss</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="recomp">Recomposition</option>
                      <option value="lean_bulk">Lean bulk</option>
                      <option value="bulk">Bulk</option>
                    </select>
                  </div>

                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${mutedText}`}>Calorie adjustment (%)</label>
                    <input
                      type="number"
                      min="-40"
                      max="40"
                      step="1"
                      value={goalDraft.calorie_adjustment_percent}
                      onChange={(e) => setGoalDraft((g) => ({ ...g, calorie_adjustment_percent: Number(e.target.value) }))}
                      className={`w-full px-3 py-2 rounded-lg border text-sm outline-none ${
                        darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                    <p className={`text-[11px] mt-1 ${mutedText}`}>Negative = deficit, positive = surplus.</p>
                  </div>

                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${mutedText}`}>Protein (g/kg)</label>
                    <input
                      type="number"
                      min="0.8"
                      max="3.0"
                      step="0.05"
                      value={goalDraft.protein_g_per_kg}
                      onChange={(e) => setGoalDraft((g) => ({ ...g, protein_g_per_kg: Number(e.target.value) }))}
                      className={`w-full px-3 py-2 rounded-lg border text-sm outline-none ${
                        darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${mutedText}`}>Fat (g/kg)</label>
                    <input
                      type="number"
                      min="0.3"
                      max="2.0"
                      step="0.05"
                      value={goalDraft.fat_g_per_kg}
                      onChange={(e) => setGoalDraft((g) => ({ ...g, fat_g_per_kg: Number(e.target.value) }))}
                      className={`w-full px-3 py-2 rounded-lg border text-sm outline-none ${
                        darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                </div>
                </div>
              </div>
            </div>
          )}

          {/* Daily Goals and Macro Summary */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className={cardBase}>
              <h3 className={`font-bold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                <Flame className="w-5 h-5 text-red-500" />
                Daily Calorie Goal
              </h3>
              <div className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-1`}>
                {targets ? `${eatenCalories} / ${targetCalories}` : '—'}
              </div>
              <p className={`text-sm ${mutedText} mb-4`}>kcal eaten today</p>

              <div className={`w-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-3 mb-3`}>
                <div
                  className="bg-gradient-to-r from-red-400 to-red-500 h-3 rounded-full transition-all"
                  style={{
                    width: `${pct(eatenCalories, targetCalories)}%`,
                  }}
                />
              </div>

              <div className={`text-sm font-semibold ${mutedText}`}>
                Target:{' '}
                <span className={darkMode ? 'text-white' : 'text-gray-900'}>{targets?.calories ?? '—'}</span> · Remaining:{' '}
                <span className={darkMode ? 'text-white' : 'text-gray-900'}>
                  {targets ? Math.max(0, targetCalories - eatenCalories) : '—'}
                </span>
                <span className="block mt-1">
                  BMR: <span className={darkMode ? 'text-white' : 'text-gray-900'}>{targets?.bmr ?? '—'}</span> · TDEE:{' '}
                  <span className={darkMode ? 'text-white' : 'text-gray-900'}>{targets?.tdee ?? '—'}</span>{' '}
                  <span className="ml-2">({targetsResp?.calculation?.calorie_adjustment_percent ?? '—'}%)</span>
                </span>
              </div>
            </div>

            <div className={cardBase}>
              <h3 className={`font-bold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                <Dumbbell className="w-5 h-5 text-emerald-500" />
                Protein
              </h3>
              <div className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-1`}>
                {targets ? `${eatenProtein} / ${targetProtein}g` : '—'}
              </div>
              <p className={`text-sm ${mutedText} mb-4`}>protein eaten today</p>

              <div className={`w-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-3 mb-3`}>
                <div
                  className="bg-emerald-500 h-3 rounded-full transition-all"
                  style={{
                    width: `${pct(eatenProtein, targetProtein)}%`,
                  }}
                />
              </div>
              <div className={`text-sm font-semibold ${mutedText}`}>
                Target: <span className={darkMode ? 'text-white' : 'text-gray-900'}>{targets?.protein_g ?? '—'}g</span>
              </div>
            </div>

            <div className={cardBase}>
              <h3 className={`font-bold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                <Apple className="w-5 h-5 text-amber-500" />
                Carbs & Fat
              </h3>
              <div className="space-y-3">
                <div>
                  <div className={`flex justify-between text-sm mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    <span>Carbs</span>
                    <span className="font-semibold">{targets ? `${eatenCarbs} / ${targetCarbs}g` : '—'}</span>
                  </div>
                  <div className={`w-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-2`}>
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{
                        width: `${pct(eatenCarbs, targetCarbs)}%`,
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className={`flex justify-between text-sm mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    <span>Fat</span>
                    <span className="font-semibold">{targets ? `${eatenFat} / ${targetFat}g` : '—'}</span>
                  </div>
                  <div className={`w-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-2`}>
                    <div
                      className="bg-yellow-500 h-2 rounded-full transition-all"
                      style={{
                        width: `${pct(eatenFat, targetFat)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Food logging */}
          <div className={cardBase}>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Today&apos;s food</h3>
                <p className={`text-xs ${mutedText} mt-1`}>Create foods once, then select and add what you ate today.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowFoodCreate((v) => !v)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                }`}
              >
                {showFoodCreate ? 'Close' : 'Add food to list'}
              </button>
            </div>

            <div className="mt-5 grid gap-4">
              <div className="flex flex-col md:flex-row gap-3">
                <select
                  value={selectedFoodId}
                  onChange={(e) => setSelectedFoodId(e.target.value)}
                  className={`w-full md:flex-1 px-3 py-2 rounded-lg border text-sm outline-none ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  {foods.length === 0 ? (
                    <option value="">No foods yet — add one</option>
                  ) : (
                    <>
                      <option value="">Select food…</option>
                      {foods.map((f) => (
                        <option key={f.id} value={String(f.id)}>
                          {f.name}
                        </option>
                      ))}
                    </>
                  )}
                </select>

                <input
                  type="number"
                  min="0.1"
                  max="50"
                  step="0.25"
                  value={servingsDraft}
                  onChange={(e) => setServingsDraft(Number(e.target.value))}
                  className={`w-full md:w-40 px-3 py-2 rounded-lg border text-sm outline-none ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder="Servings"
                />

                <button
                  type="button"
                  onClick={addFoodToToday}
                  disabled={foodLogLoading || foods.length === 0}
                  className={`w-full md:w-auto px-4 py-2 rounded-lg font-medium transition ${
                    foodLogLoading || foods.length === 0
                      ? (darkMode ? 'bg-gray-700 text-gray-300 cursor-not-allowed' : 'bg-gray-200 text-gray-600 cursor-not-allowed')
                      : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                  }`}
                >
                  {foodLogLoading ? 'Adding…' : 'Add'}
                </button>
              </div>

              {showFoodCreate && (
                <div className={`rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-900/10' : 'border-gray-200 bg-gray-50/50'} p-4`}>
                  <h4 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-3`}>Add new food (per serving)</h4>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    <input
                      value={foodDraft.name}
                      onChange={(e) => setFoodDraft((d) => ({ ...d, name: e.target.value }))}
                      placeholder="Name"
                      className={`w-full px-3 py-2 rounded-lg border text-sm outline-none ${
                        darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                    <input
                      value={foodDraft.calories_kcal}
                      onChange={(e) => setFoodDraft((d) => ({ ...d, calories_kcal: e.target.value }))}
                      placeholder="Calories"
                      type="number"
                      min="0"
                      step="1"
                      className={`w-full px-3 py-2 rounded-lg border text-sm outline-none ${
                        darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                    <input
                      value={foodDraft.protein_g}
                      onChange={(e) => setFoodDraft((d) => ({ ...d, protein_g: e.target.value }))}
                      placeholder="Protein (g)"
                      type="number"
                      min="0"
                      step="0.1"
                      className={`w-full px-3 py-2 rounded-lg border text-sm outline-none ${
                        darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                    <input
                      value={foodDraft.carbs_g}
                      onChange={(e) => setFoodDraft((d) => ({ ...d, carbs_g: e.target.value }))}
                      placeholder="Carbs (g)"
                      type="number"
                      min="0"
                      step="0.1"
                      className={`w-full px-3 py-2 rounded-lg border text-sm outline-none ${
                        darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                    <input
                      value={foodDraft.fat_g}
                      onChange={(e) => setFoodDraft((d) => ({ ...d, fat_g: e.target.value }))}
                      placeholder="Fat (g)"
                      type="number"
                      min="0"
                      step="0.1"
                      className={`w-full px-3 py-2 rounded-lg border text-sm outline-none ${
                        darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={createFood}
                      disabled={foodLogLoading}
                      className={`px-4 py-2 rounded-lg font-medium transition ${
                        foodLogLoading
                          ? (darkMode ? 'bg-gray-700 text-gray-300 cursor-not-allowed' : 'bg-gray-200 text-gray-600 cursor-not-allowed')
                          : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                      }`}
                    >
                      {foodLogLoading ? 'Saving…' : 'Save food'}
                    </button>
                  </div>
                </div>
              )}

              <div>
                <h4 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>Today&apos;s list</h4>
                {dayLog?.entries?.length ? (
                  <div className="space-y-2">
                    {dayLog.entries.map((e) => {
                      const s = Number(e.servings || 1);
                      const cals = Math.round(Number(e.food?.calories_kcal || 0) * s);
                      const p = (Number(e.food?.protein_g || 0) * s).toFixed(1);
                      const c = (Number(e.food?.carbs_g || 0) * s).toFixed(1);
                      const f = (Number(e.food?.fat_g || 0) * s).toFixed(1);
                      return (
                        <div
                          key={e.id}
                          className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 ${
                            darkMode ? 'border-gray-700 bg-gray-900/10' : 'border-gray-200 bg-gray-50/50'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} truncate`}>
                              {e.food?.name || 'Food'} <span className={mutedText}>× {s}</span>
                            </div>
                            <div className={`text-xs ${mutedText}`}>
                              {cals} kcal · P {p}g · C {c}g · F {f}g
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => deleteFoodEntry(e.id)}
                            disabled={foodLogLoading}
                            className={`${darkMode ? 'text-red-300 hover:text-red-200' : 'text-red-600 hover:text-red-700'} text-sm font-medium`}
                          >
                            Delete
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className={`text-sm ${mutedText}`}>Nothing logged yet today.</p>
                )}
              </div>
            </div>
          </div>

          {/* Weekly check-in */}
          <div className={cardBase}>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Weekly check-in</h3>
                <p className={`text-xs ${mutedText} mt-1`}>Log your weight. Then use auto-adjust if progress stalls.</p>
              </div>
              <button
                type="button"
                onClick={autoAdjustCalories}
                disabled={checkinLoading}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  checkinLoading
                    ? (darkMode ? 'bg-gray-700 text-gray-300 cursor-not-allowed' : 'bg-gray-200 text-gray-600 cursor-not-allowed')
                    : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                }`}
              >
                {checkinLoading ? 'Working…' : 'Auto-adjust calories'}
              </button>
            </div>

            <div className="mt-4">
              <div className={`relative ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-4`}>
                {/* Month labels at top */}
                {chartData.monthGroups && chartData.monthGroups.length > 0 && (
                  <div className="absolute top-4 left-[50px] right-[20px] z-10 pointer-events-none">
                    {chartData.monthGroups.map((group, i) => {
                      const totalDays = chartData.xAxis.length;
                      const startPercent = (group.start / (totalDays - 1)) * 100;
                      const endPercent = (group.end / (totalDays - 1)) * 100;
                      const centerPercent = (startPercent + endPercent) / 2;
                      return (
                        <span
                          key={i}
                          className={`absolute text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
                          style={{ left: `${centerPercent}%`, transform: 'translateX(-50%)' }}
                        >
                          {group.month}
                        </span>
                      );
                    })}
                  </div>
                )}
                <LineChart
                  xAxis={[
                    {
                      data: chartData.xAxis,
                      scaleType: 'time',
                      valueFormatter: (v) => {
                        const d = new Date(v);
                        return String(d.getDate());
                      },
                      tickLabelStyle: { fill: darkMode ? '#6B7280' : '#6B7280', fontSize: 12 },
                      tickNumber: 6,
                      disableLine: true,
                      disableTicks: true,
                    },
                  ]}
                  yAxis={[
                    {
                      tickLabelStyle: { fill: darkMode ? '#6B7280' : '#6B7280', fontSize: 12 },
                      disableLine: true,
                      disableTicks: true,
                    },
                  ]}
                  series={[
                    {
                      data: chartData.series,
                      curve: 'catmullRom',
                      color: '#3B82F6',
                      showMark: true,
                      valueFormatter: (v) => (v != null ? `${v?.toFixed(1)}` : ''),
                      area: true,
                    },
                  ]}
                  height={320}
                  margin={{ left: 50, right: 20, top: 50, bottom: 50 }}
                  onItemClick={(event, item) => {
                    if (item && chartData.ids[item.dataIndex] != null) {
                      setHoveredCheckinId(chartData.ids[item.dataIndex]);
                    }
                  }}
                  sx={{
                    '& .MuiAreaElement-root': {
                      fill: 'rgba(59,130,246,0.15)',
                    },
                    '& .MuiLineElement-root': {
                      strokeWidth: 2.5,
                      stroke: '#3B82F6',
                    },
                    '& .MuiMarkElement-root': {
                      fill: '#3B82F6',
                      stroke: '#3B82F6',
                      strokeWidth: 2,
                      scale: '1.1',
                      cursor: 'pointer',
                    },
                    '& .MuiChartsAxis-line': {
                      stroke: 'none',
                    },
                    '& .MuiChartsAxis-tick': {
                      stroke: 'none',
                    },
                    '& .MuiChartsGrid-line': {
                      stroke: '#E5E7EB',
                      strokeDasharray: '3 3',
                      strokeWidth: 1,
                    },
                    backgroundColor: 'transparent',
                  }}
                  grid={{ horizontal: true }}
                  slotProps={{
                    popper: {
                      sx: {
                        '& .MuiChartsTooltip-root': {
                          backgroundColor: '#111827',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                          padding: '8px 12px',
                        },
                        '& .MuiChartsTooltip-cell': {
                          color: '#FFFFFF',
                          fontSize: '14px',
                          fontWeight: '600',
                        },
                      },
                    },
                  }}
                />
                {/* Goal indicator */}
                {(() => {
                  // Show goal weight if available (could be calculated from goal type)
                  const targetWeight = goalDraft.goal_type === 'fat_loss' && profileDraft.weight_kg 
                    ? (profileDraft.weight_kg * 0.9).toFixed(1) 
                    : null;
                  return targetWeight ? (
                    <div className="absolute bottom-4 right-4 text-sm">
                      <span className="text-gray-700">
                        ↓ Goal: <span className="font-semibold">{targetWeight} kg</span>
                      </span>
                    </div>
                  ) : null;
                })()}
                {/* Delete button when point is clicked */}
                {hoveredCheckinId && (
                  <div className="absolute bottom-4 left-[50px]">
                    <button
                      type="button"
                      onClick={() => {
                        deleteCheckin(hoveredCheckinId);
                        setHoveredCheckinId(null);
                      }}
                      disabled={checkinLoading}
                      className="px-3 py-1.5 text-xs rounded-lg transition bg-red-50 hover:bg-red-100 text-red-600"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 grid md:grid-cols-2 gap-3">
              <input
                type="number"
                min="20"
                max="300"
                step="0.1"
                value={checkinDraft.weight_kg}
                onChange={(e) => setCheckinDraft((d) => ({ ...d, weight_kg: e.target.value }))}
                placeholder="Weight (kg)"
                className={`w-full px-3 py-2 rounded-lg border text-sm outline-none ${
                  darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
              <button
                type="button"
                onClick={saveCheckin}
                disabled={checkinLoading}
                className={`w-full px-4 py-2 rounded-lg font-medium transition ${
                  checkinLoading
                    ? (darkMode ? 'bg-gray-700 text-gray-300 cursor-not-allowed' : 'bg-gray-200 text-gray-600 cursor-not-allowed')
                    : (darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-800')
                }`}
              >
                {checkinLoading ? 'Saving…' : 'Save check-in'}
              </button>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

