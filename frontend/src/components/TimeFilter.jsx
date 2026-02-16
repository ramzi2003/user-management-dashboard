import { useState, useRef, useEffect, useCallback } from 'react';

const filters = ['Morning', 'Afternoon', 'Evening', 'All Day'];

function TimeFilter() {
  const [active, setActive] = useState('Evening');
  const containerRef = useRef(null);
  const buttonRefs = useRef({});
  const innerRef = useRef(null);

  const scrollToCenter = useCallback((filter, smooth = true) => {
    const container = containerRef.current;
    const button = buttonRefs.current[filter];
    if (!container || !button) return;

    const containerWidth = container.offsetWidth;
    const buttonLeft = button.offsetLeft;
    const buttonWidth = button.offsetWidth;
    const scrollLeft = buttonLeft - containerWidth / 2 + buttonWidth / 2;

    container.scrollTo({
      left: scrollLeft,
      behavior: smooth ? 'smooth' : 'instant',
    });
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    const inner = innerRef.current;
    if (!container || !inner) return;

    const updatePadding = () => {
      const containerWidth = container.offsetWidth;
      const pad = containerWidth / 2;
      inner.style.paddingLeft = `${pad}px`;
      inner.style.paddingRight = `${pad}px`;
      scrollToCenter(active, false);
    };

    updatePadding();
    window.addEventListener('resize', updatePadding);
    return () => window.removeEventListener('resize', updatePadding);
  }, [active, scrollToCenter]);

  useEffect(() => {
    scrollToCenter(active, true);
  }, [active, scrollToCenter]);

  return (
    <div style={{ position: 'sticky', top: '165px', zIndex: 50, backgroundColor: '#2e2e2e', marginTop: '-1px' }}>
      <div
        ref={containerRef}
        style={{
          marginTop: '0px',
          overflowX: 'auto',
          fontFamily: 'Inter, sans-serif',
          scrollbarWidth: 'none',
        }}
      >
      <div
        ref={innerRef}
        style={{
          display: 'inline-flex',
          gap: '12px',
          padding: '12px 0 12px 0',
        }}
      >
        {filters.map((filter) => (
          <button
            key={filter}
            ref={(el) => (buttonRefs.current[filter] = el)}
            onClick={() => setActive(filter)}
            style={{
              padding: '8px 20px',
              borderRadius: '20px',
              border: 'none',
              backgroundColor: active === filter ? '#3a3a3a' : 'transparent',
              color: active === filter ? '#e0e0e0' : '#666666',
              fontSize: '14px',
              fontWeight: 500,
              fontFamily: 'Inter, sans-serif',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {filter}
          </button>
        ))}
      </div>
      </div>
      {/* Left fade */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: '30%',
          background: 'linear-gradient(to right, #2e2e2e, transparent)',
          pointerEvents: 'none',
        }}
      />
      {/* Right fade */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          width: '30%',
          background: 'linear-gradient(to left, #2e2e2e, transparent)',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}

export default TimeFilter;
