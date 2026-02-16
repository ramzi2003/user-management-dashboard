const tasks = [
  { id: 1, title: 'Buy groceries', category: 'Personal', done: false },
  { id: 2, title: 'Finish project report', category: 'Work', done: true },
  { id: 3, title: 'Call the dentist', category: 'Health', done: false },
  { id: 4, title: 'Read 20 pages', category: 'Personal', done: false },
  { id: 5, title: 'Update portfolio site', category: 'Work', done: true },
  { id: 6, title: 'Go for a run', category: 'Health', done: false },
  { id: 7, title: 'Clean the apartment', category: 'Personal', done: false },
  { id: 8, title: 'Review pull requests', category: 'Work', done: false },
];

function TaskSection() {
  return (
    <div
      style={{
        backgroundColor: '#2e2e2e',
        padding: '16px',
        fontFamily: 'Inter, sans-serif',
        flex: 1,
        minHeight: '300px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        paddingBottom: '100px',
      }}
    >
      {tasks.map((task) => (
        <div
          key={task.id}
          style={{
            backgroundColor: '#3a3a3a',
            borderRadius: '12px',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              border: task.done ? 'none' : '2px solid #666',
              backgroundColor: task.done ? '#4a90d9' : 'transparent',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {task.done && (
              <span style={{ color: '#fff', fontSize: '13px' }}>✓</span>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                color: task.done ? '#888' : '#fff',
                fontSize: '15px',
                textDecoration: task.done ? 'line-through' : 'none',
              }}
            >
              {task.title}
            </div>
            <div style={{ color: '#888', fontSize: '12px', marginTop: '2px' }}>
              {task.category}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default TaskSection;
