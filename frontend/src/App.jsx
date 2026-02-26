import { useState, useEffect } from 'react';
import Header from './components/Header';
import NightScene from './components/NightScene';
import TimeFilter from './components/TimeFilter';
import TaskSection from './components/TaskSection';
import Footer from './components/Footer';
import PickNewOneSheet from './components/PickNewOneSheet';
import { createInitialTasks } from './data/tasks';

function App() {
  const [tasksByDay, setTasksByDay] = useState(() => ({ 0: createInitialTasks() }));
  const [selectedDay, setSelectedDay] = useState(0);
  const [pickNewOneOpen, setPickNewOneOpen] = useState(false);

  useEffect(() => {
    if (tasksByDay[selectedDay] === undefined) {
      setTasksByDay((prev) => ({ ...prev, [selectedDay]: createInitialTasks() }));
    }
  }, [selectedDay]);

  const getDayStats = (dayKey) => {
    const tasks = tasksByDay[dayKey] ?? [];
    const total = tasks.length;
    const completed = tasks.filter((t) => t.done).length;
    return { total, completed };
  };

  const setTasksForDay = (dayKey, updater) => {
    setTasksByDay((prev) => ({
      ...prev,
      [dayKey]: updater(prev[dayKey] ?? []),
    }));
  };

  const tasks = tasksByDay[selectedDay] ?? [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header
        selectedDay={selectedDay}
        onSelectDay={setSelectedDay}
        getDayStats={getDayStats}
      />
      <div style={{ paddingTop: '165px' }} />
      <NightScene />
      <div style={{ backgroundColor: '#2e2e2e', flex: 1, display: 'flex', flexDirection: 'column', paddingBottom: '70px' }}>
        <TimeFilter />
        <TaskSection
          tasks={tasks}
          setTasks={(updater) => setTasksForDay(selectedDay, updater)}
        />
      </div>
      <Footer onPlusClick={() => setPickNewOneOpen(true)} />
      <PickNewOneSheet open={pickNewOneOpen} onClose={() => setPickNewOneOpen(false)} />
    </div>
  );
}

export default App;
