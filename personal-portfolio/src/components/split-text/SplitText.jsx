import { useEffect, useMemo, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './SplitText.css';

gsap.registerPlugin(ScrollTrigger);

const splitByChars = (text) => {
  const words = text.split(/(\s+)/);
  const out = [];
  let charIndex = 0;
  words.forEach((word, wi) => {
    if (/^\s+$/.test(word)) {
      out.push({ type: 'space', value: word, key: `s-${wi}` });
      return;
    }
    const chars = Array.from(word).map((ch) => ({
      type: 'char',
      value: ch,
      key: `c-${charIndex++}`
    }));
    out.push({ type: 'word', chars, key: `w-${wi}` });
  });
  return out;
};

const PRESETS = {
  fadeUp: { y: 40, opacity: 0, rotateX: 0, filter: 'blur(8px)' },
  rise:   { y: 28, opacity: 0, rotateX: -45, filter: 'blur(4px)' },
  drop:   { y: -32, opacity: 0, rotateX: 30, filter: 'blur(6px)' },
  flip:   { y: 0, opacity: 0, rotateX: -90, filter: 'blur(0px)' }
};

const SplitText = ({
  children,
  as: Tag = 'span',
  variant = 'fadeUp',
  stagger = 0.035,
  duration = 0.9,
  ease = 'power3.out',
  delay = 0,
  start = 'top 85%',
  once = true,
  className = '',
  style
}) => {
  const ref = useRef(null);
  const text = typeof children === 'string' ? children : '';
  const tokens = useMemo(() => splitByChars(text), [text]);

  useEffect(() => {
    const el = ref.current;
    if (!el || !text) return;

    const chars = el.querySelectorAll('.split-char');
    if (!chars.length) return;

    const from = PRESETS[variant] || PRESETS.fadeUp;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      gsap.set(chars, { opacity: 1, y: 0, rotateX: 0, filter: 'none' });
      return;
    }

    const tween = gsap.fromTo(
      chars,
      { ...from },
      {
        y: 0,
        opacity: 1,
        rotateX: 0,
        filter: 'blur(0px)',
        duration,
        ease,
        stagger,
        delay,
        scrollTrigger: {
          trigger: el,
          start,
          toggleActions: once ? 'play none none none' : 'play reverse play reverse'
        }
      }
    );

    return () => {
      if (tween.scrollTrigger) tween.scrollTrigger.kill();
      tween.kill();
    };
  }, [text, variant, stagger, duration, ease, delay, start, once]);

  return (
    <Tag ref={ref} className={`split-text ${className}`} style={style} aria-label={text}>
      {tokens.map((tok) => {
        if (tok.type === 'space') return <span key={tok.key}>{tok.value}</span>;
        return (
          <span className="split-word" key={tok.key} aria-hidden="true">
            {tok.chars.map((c) => (
              <span className="split-char" key={c.key}>
                {c.value}
              </span>
            ))}
          </span>
        );
      })}
    </Tag>
  );
};

export default SplitText;
