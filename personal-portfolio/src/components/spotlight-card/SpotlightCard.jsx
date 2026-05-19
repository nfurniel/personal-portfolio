import { useRef, useCallback } from 'react';
import './SpotlightCard.css';

const SpotlightCard = ({
  children,
  className = '',
  icon,
  index,
  meta,
  footer,
  accent = 'var(--accent-color)',
  spotlightSize = 320,
  as: Tag = 'article',
  ...rest
}) => {
  const ref = useRef(null);
  const rafRef = useRef(0);

  const handleMove = useCallback((e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      el.style.setProperty('--mx', `${x}px`);
      el.style.setProperty('--my', `${y}px`);
    });
  }, []);

  const handleLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty('--mx', `-9999px`);
    el.style.setProperty('--my', `-9999px`);
  }, []);

  const hasHeader = icon || typeof index === 'number' || meta;

  return (
    <Tag
      ref={ref}
      className={`spotlight-card ${className}`}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      style={{
        '--accent': accent,
        '--spot-size': `${spotlightSize}px`
      }}
      {...rest}
    >
      <span className="spotlight-card__border" aria-hidden="true" />
      <span className="spotlight-card__glow" aria-hidden="true" />

      <div className="spotlight-card__content">
        {hasHeader && (
          <div className="spotlight-card__header">
            {icon && (
              <span className="spotlight-card__icon" aria-hidden="true">
                {icon}
              </span>
            )}
            {meta && !icon && (
              <span className="spotlight-card__meta">
                <span className="spotlight-card__meta-dot" aria-hidden="true" />
                {meta}
              </span>
            )}
            {typeof index === 'number' && (
              <span className="spotlight-card__index" aria-hidden="true">
                {String(index).padStart(2, '0')}
              </span>
            )}
          </div>
        )}
        {meta && icon && (
          <span className="spotlight-card__meta">
            <span className="spotlight-card__meta-dot" aria-hidden="true" />
            {meta}
          </span>
        )}
        {children}
        {footer && (
          <div className="spotlight-card__footer">
            <span className="spotlight-card__footer-label">{footer}</span>
            <span className="spotlight-card__footer-bar" aria-hidden="true" />
          </div>
        )}
      </div>
    </Tag>
  );
};

export default SpotlightCard;
