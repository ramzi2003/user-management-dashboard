import { useRef, useEffect } from 'react';

const dayNames = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function buildDays() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = [];
  for (let i = -28; i <= 28; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    days.push({
      key: i,
      abbr: dayNames[date.getDay()],
      num: date.getDate(),
      offset: i,
      date,
    });
  }
  return days;
}

function getTitle(offset, date) {
  if (offset === 0) return 'Today';
  if (offset === -1) return 'Yesterday';
  if (offset === 1) return 'Tomorrow';
  return `${monthNames[date.getMonth()]} ${date.getDate()}`;
}

function Header({ selectedDay: selected, onSelectDay, getDayStats }) {
  const days = buildDays();
  const scrollRef = useRef(null);
  const todayRef = useRef(null);

  useEffect(() => {
    const container = scrollRef.current;
    const todayEl = todayRef.current;
    if (!container || !todayEl) return;
    const itemWidth = todayEl.offsetWidth;
    const scrollLeft = todayEl.offsetLeft - (itemWidth * 4);
    container.scrollTo({ left: scrollLeft, behavior: 'instant' });
  }, []);

  const selectedDayData = days.find((d) => d.key === selected);
  const title = selectedDayData ? getTitle(selectedDayData.offset, selectedDayData.date) : 'Today';

  return (
    <header style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, backgroundColor: '#1a1a1a', padding: '0 16px', paddingBottom: '10px' }}>
      <h1 style={{ color: 'white', fontSize: '20px', textAlign: 'center', paddingTop: '48px', fontFamily: 'Inter, sans-serif', fontWeight: 500, letterSpacing: '0.02em' }}>
        {title}
      </h1>

      <div
        ref={scrollRef}
        style={{
          display: 'flex',
          marginTop: '12px',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          fontFamily: 'Inter, sans-serif',
          scrollSnapType: 'x mandatory',
        }}
      >
        {days.map((day) => {
          const isSelected = day.key === selected;
          const { total, completed } = getDayStats ? getDayStats(day.key) : { total: 0, completed: 0 };
          const hasTasks = total > 0;
          const progress = hasTasks ? completed / total : 0;
          const radius = 13;
          const circumference = 2 * Math.PI * radius;
          const strokeDashoffset = circumference * (1 - progress);
          const showOutline = !hasTasks && isSelected;
          return (
            <div
              key={day.key}
              ref={day.key === 0 ? todayRef : undefined}
              onClick={() => onSelectDay?.(day.key)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px',
                width: 'calc(100% / 7)',
                minWidth: 'calc(100% / 7)',
                height: '50px',
                borderRadius: '20px',
                backgroundColor: isSelected ? '#333333' : 'transparent',
                justifyContent: 'center',
                padding: '6px 0',
                cursor: 'pointer',
                flexShrink: 0,
                scrollSnapAlign: 'start',
              }}
            >
              <span style={{ fontSize: '11px', fontWeight: 500, color: isSelected ? '#ffffff' : '#555555', letterSpacing: '0.05em' }}>
                {day.abbr}
              </span>
              <span
                style={{
                  position: 'relative',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  border: showOutline ? '2px solid #14b8a6' : 'none',
                  borderRadius: '50%',
                  boxSizing: 'border-box',
                }}
              >
                {hasTasks && (
                  <svg
                    width="32"
                    height="32"
                    style={{ position: 'absolute', transform: 'rotate(-90deg)' }}
                  >
                    <circle
                      cx="16"
                      cy="16"
                      r={radius}
                      fill="none"
                      stroke="#14b8a6"
                      strokeWidth="2"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                    />
                  </svg>
                )}
                <span
                  style={{
                    position: 'relative',
                    zIndex: 1,
                    fontSize: '14px',
                    fontWeight: isSelected ? 600 : 400,
                    color: isSelected ? '#ffffff' : '#888888',
                  }}
                >
                  {day.num}
                </span>
              </span>
            </div>
          );
        })}
      </div>
    </header>
  );
}

export default Header;
