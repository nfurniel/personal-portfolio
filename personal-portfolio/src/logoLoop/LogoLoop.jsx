import { useRef, useEffect, useState } from 'react';
import './LogoLoop.css';

const LogoLoop = ({
  logos,
  speed = 40, // Seconds for one full cycle (adjusted for CSS)
  direction = 'left',
  pauseOnHover = true,
  className = '',
  gap = 40
}) => {
  const [content, setContent] = useState([]);

  // Ensure we have enough copies to cover the screen and loop smoothly
  // Standard CSS marquee usually needs at least 2 complete sets of items
  // to translate -50% smoothly.

  useEffect(() => {
    if (logos && logos.length > 0) {
      // Create 4 copies to be safe for wide screens
      setContent([...logos, ...logos, ...logos, ...logos]);
    }
  }, [logos]);

  const animationStyle = {
    animationDuration: `${speed}s`,
    animationDirection: direction === 'right' ? 'reverse' : 'normal',
    gap: `${gap}px`
  };

  return (
    <div className={`logoloop-container ${className}`}>
      <div
        className={`logoloop-track ${pauseOnHover ? 'pause-on-hover' : ''}`}
        style={animationStyle}
      >
        {content.map((item, index) => (
          <div key={index} className="logoloop-item">
            {item.node ? (
              <span className="logoloop-icon">
                {item.node}
              </span>
            ) : (
              <img src={item.src} alt={item.alt} />
            )}
            {/* Optional: Add title/label if needed */}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LogoLoop;