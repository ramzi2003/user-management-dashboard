import { useState, useRef, useEffect } from 'react';
import { Droplets, Globe, BookOpen, TreePine, FileText, Check, RotateCcw } from 'lucide-react';

const SKIP_WIDTH = 80;
const DONE_WIDTH = 80;
const UNDO_WIDTH = 80;
const SKIP_THRESHOLD = 56; // release past this to confirm skip
const SWIPE_BG = '#3d4552'; // muted blue-gray while swiping (card during swipe)
const SKIP_BG = '#0ea5e9'; // bright sky blue for skip strip
const DONE_BG = '#2e6b2e'; // green for done strip
const UNDO_BG = '#d35400'; // orange for undo strip
const SWIPE_GAP = 8;
const REST_OFFSET = -(DONE_WIDTH + SWIPE_GAP); // transform base so card is centered when offset=0
const undoMaxOffset = -(UNDO_WIDTH + SWIPE_GAP);

function TaskSection({ tasks = [], setTasks }) {
  const [swipeOffsets, setSwipeOffsets] = useState({});
  const [spinningTaskId, setSpinningTaskId] = useState(null);
  const touchStartX = useRef(0);
  const touchStartOffset = useRef(0);

  useEffect(() => {
    if (spinningTaskId == null) return;
    const t = setTimeout(() => setSpinningTaskId(null), 600);
    return () => clearTimeout(t);
  }, [spinningTaskId]);

  const canSwipe = (task) => !task.done && !task.skipped;

  const sortedTasks = [...tasks].sort((a, b) => {
    const order = (t) => (t.done ? 2 : t.skipped ? 1 : 0);
    return order(a) - order(b);
  });

  const displayUnitValue = (unitValue) =>
    unitValue.includes('/') ? unitValue.split('/')[1] : unitValue;

  const getOffset = (taskId) => swipeOffsets[taskId] ?? 0;

  const handleSwipeStart = (taskId, clientX) => {
    touchStartOffset.current = getOffset(taskId);
    setSwipeOffsets((s) => {
      const next = {};
      tasks.forEach((t) => {
        next[t.id] = t.id === taskId ? (s[t.id] ?? 0) : 0;
      });
      return next;
    });
    touchStartX.current = clientX;
  };

  const minOffset = -(SKIP_WIDTH + SWIPE_GAP);
  const maxOffset = DONE_WIDTH + SWIPE_GAP;

  const SKIP_SWIPE_FACTOR = 0.5; // slow down when revealing Skip (left swipe)

  const handleSwipeMove = (taskId, clientX) => {
    if (!canSwipe(tasks.find((t) => t.id === taskId))) return;
    const prev = getOffset(taskId);
    const delta = clientX - touchStartX.current;
    touchStartX.current = clientX;
    const effectiveDelta = delta < 0 ? delta * SKIP_SWIPE_FACTOR : delta;
    const next = Math.max(minOffset, Math.min(maxOffset, prev + effectiveDelta));
    setSwipeOffsets((s) => ({ ...s, [taskId]: next }));
  };

  const handleSwipeEnd = (taskId) => {
    const offset = getOffset(taskId);
    const startedFromClosed = Math.abs(touchStartOffset.current) < 1;
    if (startedFromClosed && offset <= minOffset) {
      setSpinningTaskId(taskId);
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, skipped: true } : t)));
      setSwipeOffsets((s) => ({ ...s, [taskId]: 0 }));
    } else if (offset > 0) {
      setSwipeOffsets((s) => ({ ...s, [taskId]: offset >= maxOffset / 2 ? maxOffset : 0 }));
    } else {
      setSwipeOffsets((s) => ({ ...s, [taskId]: 0 }));
    }
  };

  const handleDoneClick = (taskId, e) => {
    e.preventDefault();
    e.stopPropagation();
    setSpinningTaskId(taskId);
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, done: true } : t)));
    setSwipeOffsets((s) => ({ ...s, [taskId]: 0 }));
  };

  const handleDoneSwipeMove = (taskId, clientX) => {
    const prev = getOffset(taskId);
    const delta = clientX - touchStartX.current;
    touchStartX.current = clientX;
    const next = Math.max(undoMaxOffset, Math.min(0, prev + delta));
    setSwipeOffsets((s) => ({ ...s, [taskId]: next }));
  };

  const handleDoneSwipeEnd = (taskId) => {
    const offset = getOffset(taskId);
    if (offset <= undoMaxOffset / 2) {
      setSwipeOffsets((s) => ({ ...s, [taskId]: undoMaxOffset }));
    } else {
      setSwipeOffsets((s) => ({ ...s, [taskId]: 0 }));
    }
  };

  const handleUndoClick = (taskId, e) => {
    e.preventDefault();
    e.stopPropagation();
    setSpinningTaskId(taskId);
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, done: false, skipped: false } : t)));
    setSwipeOffsets((s) => ({ ...s, [taskId]: 0 }));
  };

  const renderCard = (task, isSwiping, forceSkippedStyle = false) => {
    const Icon = task.Icon;
    const cardBg = isSwiping ? SWIPE_BG : '#3a3a3a';
    return (
      <div
        style={{
          backgroundColor: forceSkippedStyle ? '#3a3a3a' : cardBg,
          borderRadius: '12px',
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          borderBottom: forceSkippedStyle ? '3px solid #3a3a3a' : (task.done ? '3px solid #2e6b2e' : task.skipped ? '3px solid #3a3a3a' : '3px solid #484848'),
          transition: isSwiping ? 'none' : 'background-color 0.15s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={22} color={task.skipped || task.done ? '#555' : task.iconColor} strokeWidth={2} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: task.done || task.skipped ? '#555' : '#c8c8c8', fontSize: '15px', fontWeight: 400, textDecoration: 'none' }}>
              {task.title}
            </div>
            <div style={{ fontSize: '12px', marginTop: '2px' }}>
              {!task.skipped && !task.done && <span style={{ color: task.iconColor }}>★</span>}
              {!task.skipped && !task.done && ' '}
              <span style={{ color: task.done ? '#2e6b2e' : task.skipped ? '#3a6a94' : '#888' }}>
                {task.done ? 'Done' : task.skipped ? 'Skipped' : task.description}
              </span>
            </div>
          </div>
        </div>
        <div style={{ flexShrink: 0, textAlign: 'right' }}>
          <div style={{ color: task.done || task.skipped ? '#555' : task.iconColor, fontSize: '15px', fontWeight: 600, textDecoration: 'none' }}>
            {displayUnitValue(task.unitValue)}
          </div>
          {task.unitLabel && (
            <div style={{ color: task.skipped || task.done ? '#444' : '#666', fontSize: '12px', marginTop: '2px' }}>
              {task.unitLabel}
            </div>
          )}
        </div>
      </div>
    );
  };

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
      {sortedTasks.map((task) => {
        const offset = getOffset(task.id);
        const isPlanned = canSwipe(task);

        if (task.skipped || task.done) {
          const undoOffset = getOffset(task.id);
          return (
            <div key={task.id} style={{ overflow: 'hidden', borderRadius: '12px' }}>
              <div
                style={{
                  display: 'flex',
                  width: `calc(100% + ${UNDO_WIDTH}px + ${SWIPE_GAP}px)`,
                  gap: SWIPE_GAP,
                  transform: `translateX(${undoOffset}px)`,
                  transition: (undoOffset === 0 || undoOffset === undoMaxOffset) ? 'transform 0.2s ease-out' : 'none',
                }}
                onTouchStart={(e) => handleSwipeStart(task.id, e.touches[0].clientX)}
                onTouchMove={(e) => handleDoneSwipeMove(task.id, e.touches[0].clientX)}
                onTouchEnd={() => handleDoneSwipeEnd(task.id)}
                onTouchCancel={() => handleDoneSwipeEnd(task.id)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSwipeStart(task.id, e.clientX);
                  const onMove = (ev) => handleDoneSwipeMove(task.id, ev.clientX);
                  const onUp = () => {
                    handleDoneSwipeEnd(task.id);
                    document.removeEventListener('mousemove', onMove);
                    document.removeEventListener('mouseup', onUp);
                  };
                  document.addEventListener('mousemove', onMove);
                  document.addEventListener('mouseup', onUp);
                }}
              >
                <div
                  className={task.id === spinningTaskId ? 'task-state-spin-wrapper' : ''}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    ...(task.id === spinningTaskId
                      ? { animation: 'taskStateSpin 0.6s ease-out', transformStyle: 'preserve-3d' }
                      : {}),
                  }}
                >
                  {renderCard(task, false, task.id === spinningTaskId && task.skipped)}
                </div>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={(e) => handleUndoClick(task.id, e)}
                  style={{
                    width: UNDO_WIDTH,
                    flexShrink: 0,
                    backgroundColor: UNDO_BG,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    gap: '6px',
                    fontSize: '14px',
                    fontWeight: 600,
                  }}
                >
                  <RotateCcw size={20} strokeWidth={2.5} />
                  Undo
                </div>
              </div>
            </div>
          );
        }

        return (
          <div
            key={task.id}
            style={{ overflow: 'hidden', borderRadius: '12px' }}
          >
            <div
              style={{
                display: 'flex',
                width: `calc(100% + ${DONE_WIDTH}px + ${SKIP_WIDTH}px + ${2 * SWIPE_GAP}px)`,
                gap: SWIPE_GAP,
                transform: `translateX(${REST_OFFSET + offset}px)`,
                transition: (offset === 0 || offset === maxOffset) ? 'transform 0.2s ease-out' : 'none',
                perspective: '600px',
              }}
              onTouchStart={(e) => handleSwipeStart(task.id, e.touches[0].clientX)}
              onTouchMove={(e) => handleSwipeMove(task.id, e.touches[0].clientX)}
              onTouchEnd={() => handleSwipeEnd(task.id)}
              onTouchCancel={() => handleSwipeEnd(task.id)}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSwipeStart(task.id, e.clientX);
                const onMove = (ev) => handleSwipeMove(task.id, ev.clientX);
                const onUp = () => {
                  handleSwipeEnd(task.id);
                  document.removeEventListener('mousemove', onMove);
                  document.removeEventListener('mouseup', onUp);
                };
                document.addEventListener('mousemove', onMove);
                document.addEventListener('mouseup', onUp);
              }}
            >
              <div
                role="button"
                tabIndex={0}
                onClick={(e) => handleDoneClick(task.id, e)}
                style={{
                  width: DONE_WIDTH,
                  flexShrink: 0,
                  backgroundColor: DONE_BG,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  borderRadius: '12px',
                  cursor: 'pointer',
                }}
              >
                <Check size={28} strokeWidth={2.5} />
              </div>
              <div
                className={task.id === spinningTaskId ? 'task-state-spin-wrapper' : ''}
                style={{
                  flex: 1,
                  minWidth: 0,
                  ...(task.id === spinningTaskId
                    ? { animation: 'taskStateSpin 0.6s ease-out', transformStyle: 'preserve-3d' }
                    : {}),
                }}
              >
                {renderCard(task, offset < 0)}
              </div>
              <div
                style={{
                  width: SKIP_WIDTH,
                  flexShrink: 0,
                  backgroundColor: SKIP_BG,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: 600,
                  borderRadius: '12px',
                }}
              >
                Skip
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default TaskSection;
