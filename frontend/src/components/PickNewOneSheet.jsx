import { useState, useEffect } from 'react';
import notebookPencilIcon from '../assets/notebook-and-pencil-3d-icon-png-download-4577202.png';

const DURATION_MS = 280;

function HabitCard({ title, subtitle, iconSrc, isFirst, onClick }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
      style={{ position: 'relative', padding: '48px 48px 24px 0', ...(isFirst && { marginTop: '-24px' }), cursor: onClick ? 'pointer' : undefined }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#3a3a3a',
          borderRadius: '14px',
          padding: '12px 20px',
          height: '64px',
          paddingRight: '100px',
          marginRight: '-48px',
        }}
      >
        <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
          <div style={{ color: '#d0d0d0', fontSize: '18px', fontWeight: 500, marginBottom: '6px' }}>{title}</div>
          <div style={{ color: '#8a8a8a', fontSize: '13px', fontWeight: 400 }}>{subtitle}</div>
        </div>
      </div>
      <img
        src={iconSrc}
        alt=""
        style={{
          position: 'absolute',
          right: '-12px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '112px',
          height: 'auto',
          objectFit: 'contain',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}

function PickNewOneSheet({ open, onClose }) {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setClosing(false);
      setVisible(false);
      setDetailsOpen(false);
      const start = requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
      return () => cancelAnimationFrame(start);
    }
  }, [open]);

  const requestClose = () => {
    if (closing) return;
    setClosing(true);
  };

  const handleTransitionEnd = (e) => {
    if (e.target !== e.currentTarget) return;
    if (closing) onClose();
  };

  if (!open) return null;

  const sheetClosed = closing ? '100%' : visible ? '0' : '100%';
  const overlayOpacity = closing ? 0 : visible ? 1 : 0;

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={requestClose}
        onKeyDown={(e) => e.key === 'Escape' && requestClose()}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 200,
          opacity: overlayOpacity,
          transition: `opacity ${DURATION_MS}ms ease-out`,
        }}
      />
      <div
        onTransitionEnd={handleTransitionEnd}
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          transform: `translateY(${sheetClosed})`,
          transition: `transform ${DURATION_MS}ms cubic-bezier(0.32, 0.72, 0, 1)`,
          backgroundColor: '#2e2e2e',
          borderTopLeftRadius: '20px',
          borderTopRightRadius: '20px',
          zIndex: 201,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 -4px 24px rgba(0,0,0,0.3)',
          position: 'relative',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            paddingTop: 'max(16px, env(safe-area-inset-top))',
            minHeight: '56px',
          }}
        >
          <button
            type="button"
            onClick={requestClose}
            aria-label="Close"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              border: 'none',
              background: 'transparent',
              color: '#e0e0e0',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <span
            style={{
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: '18px',
              fontWeight: 400,
              color: '#e0e0e0',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            Pick a New One
          </span>
          <div style={{ width: '40px' }} />
        </div>
        <div
          style={{
            padding: '0 20px 12px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              backgroundColor: '#3a3a3a',
              borderRadius: '14px',
              padding: '14px 20px',
              minHeight: '26px',
              border: 'none',
            }}
          >
            <svg
              width="38"
              height="38"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#888"
              strokeWidth="2"
              strokeLinecap="round"
              style={{ flexShrink: 0 }}
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="search"
              placeholder="Search"
              aria-label="Search"
              className="pick-new-one-search"
              style={{
                flex: 1,
                border: 'none',
                background: 'transparent',
                outline: 'none',
                color: '#e0e0e0',
                fontSize: '18px',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 300,
              }}
            />
          </div>
        </div>
        <div style={{ padding: '0 20px 20px', flex: 1, overflow: 'auto', position: 'relative' }}>
          <HabitCard
            title="Trending habits"
            subtitle="Take a step in the right direction"
            iconSrc={notebookPencilIcon}
            isFirst
            onClick={() => setDetailsOpen(true)}
          />
        </div>
        {detailsOpen && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: '#2e2e2e',
              zIndex: 10,
              display: 'flex',
              flexDirection: 'column',
              paddingTop: 'max(16px, env(safe-area-inset-top))',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', padding: '12px 20px' }}>
              <button
                type="button"
                onClick={() => setDetailsOpen(false)}
                aria-label="Go back"
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  border: 'none',
                  background: 'transparent',
                  color: '#e0e0e0',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
              </button>
            </div>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <button
                type="button"
                style={{
                  padding: '12px 24px',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: '#3a3a3a',
                  color: '#e0e0e0',
                  fontSize: '16px',
                  cursor: 'pointer',
                }}
              >
                Button
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default PickNewOneSheet;
