import { useState } from 'react';

function Footer() {
  const [pressed, setPressed] = useState(false);

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: '75px',
      zIndex: 100,
    }}>
      <svg
        style={{ position: 'absolute', bottom: 0, width: '100%', height: '75px' }}
        viewBox="0 0 400 75"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0,35 Q0,0 35,0 L150,0 C170,0 170,30 200,30 C230,30 230,0 250,0 L365,0 Q400,0 400,35 L400,75 L0,75 Z"
          fill="#1a1a1a"
        />
      </svg>

      {/* Plus button */}
      <div
        onPointerDown={() => setPressed(true)}
        onPointerUp={() => setPressed(false)}
        onPointerLeave={() => setPressed(false)}
        style={{
          position: 'absolute',
          left: '50%',
          top: '-35px',
          transform: 'translateX(-50%)',
          width: '55px',
          height: '55px',
          borderRadius: '50%',
          backgroundColor: pressed ? '#3a78b8' : '#4a90d9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(74, 144, 217, 0.3)',
          zIndex: 2,
          transition: 'background-color 0.1s',
        }}>
        <span style={{
          color: '#ffffff',
          fontSize: '40px',
          fontWeight: 700,
          lineHeight: 1,
        }}>+</span>
      </div>
    </div>
  );
}

export default Footer;
