function NightScene() {
  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '200px',
      backgroundColor: '#1a1a1a',
      borderRadius: '0',
      overflow: 'hidden',
      marginTop: '12px',
      marginBottom: '-1px',
    }}>
      {/* Stars */}
      <div style={{ position: 'absolute', width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#555', top: '40px', left: '80px' }} />
      <div style={{ position: 'absolute', width: '3px', height: '3px', borderRadius: '50%', backgroundColor: '#666', top: '70px', right: '100px' }} />
      <div style={{ position: 'absolute', width: '3px', height: '3px', borderRadius: '50%', backgroundColor: '#555', top: '30px', right: '160px' }} />
      <div style={{ position: 'absolute', width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#666', top: '55px', left: '200px' }} />


      {/* Crescent Moon */}
      <div style={{ position: 'absolute', top: '40px', left: '50%', transform: 'translateX(-50%)' }}>
        <div style={{
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          backgroundColor: '#f0c866',
          position: 'relative',
          boxShadow: '0 0 20px rgba(240, 200, 102, 0.3)',
        }}>
          <div style={{
            position: 'absolute',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: '#1a1a1a',
            top: '-5px',
            right: '-8px',
          }} />
        </div>
      </div>

      {/* Hills */}
      <svg
        viewBox="0 0 400 100"
        style={{ position: 'absolute', bottom: 0, width: '100%', height: '80px' }}
        preserveAspectRatio="none"
      >
        <path fill="#2a2a2a" d="M0,60 Q50,30 100,45 Q150,60 200,40 Q250,20 300,35 Q350,50 400,30 L400,100 L0,100 Z" />
        <path fill="#2e2e2e" d="M0,70 Q60,50 120,60 Q180,70 240,55 Q300,40 360,50 Q380,55 400,45 L400,100 L0,100 Z" />
      </svg>

      {/* Trees */}
      {/* Left small tree */}
      <div style={{ position: 'absolute', bottom: '38px', left: '30px', zIndex: 2 }}>
        <div style={{ width: '4px', height: '12px', backgroundColor: '#2d5f5f', margin: '0 auto' }} />
        <div style={{ width: '20px', height: '24px', borderRadius: '50%', backgroundColor: '#3db8a0', marginTop: '-16px' }} />
      </div>

      {/* Left second tree */}
      <div style={{ position: 'absolute', bottom: '32px', left: '55px', zIndex: 2 }}>
        <div style={{ width: '3px', height: '8px', backgroundColor: '#2d5f5f', margin: '0 auto' }} />
        <div style={{ width: '14px', height: '18px', borderRadius: '50%', backgroundColor: '#2fa88e', marginTop: '-12px' }} />
      </div>

      {/* Center small tree */}
      <div style={{ position: 'absolute', bottom: '40px', left: '48%', zIndex: 2 }}>
        <div style={{ width: '3px', height: '10px', backgroundColor: '#2d5f5f', margin: '0 auto' }} />
        <div style={{ width: '16px', height: '20px', borderRadius: '50%', backgroundColor: '#3db8a0', marginTop: '-14px' }} />
      </div>

      {/* Right tall tree */}
      <div style={{ position: 'absolute', bottom: '35px', right: '70px', zIndex: 2 }}>
        <div style={{ width: '5px', height: '18px', backgroundColor: '#2d5f5f', margin: '0 auto' }} />
        <div style={{ width: '24px', height: '30px', borderRadius: '50%', backgroundColor: '#3db8a0', marginTop: '-20px' }} />
      </div>

      {/* Right small tree */}
      <div style={{ position: 'absolute', bottom: '30px', right: '45px', zIndex: 2 }}>
        <div style={{ width: '3px', height: '10px', backgroundColor: '#2d5f5f', margin: '0 auto' }} />
        <div style={{ width: '16px', height: '20px', borderRadius: '50%', backgroundColor: '#2fa88e', marginTop: '-14px' }} />
      </div>
    </div>
  );
}

export default NightScene;
