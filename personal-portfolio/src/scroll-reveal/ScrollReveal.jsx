import { useEffect, useRef, useMemo } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import './ScrollReveal.css';

gsap.registerPlugin(ScrollTrigger);

const ScrollReveal = ({
    children,
    scrollContainerRef,
    enableBlur = true,
    baseOpacity = 0.1,
    baseRotation = 3,
    blurStrength = 4,
    containerClassName = '',
    textClassName = '',
    rotationEnd = 'bottom bottom',
    wordAnimationEnd = 'bottom bottom'
}) => {
    const containerRef = useRef(null);

    const isText = typeof children === 'string';

    const content = useMemo(() => {
        if (!isText) return children;

        const text = children;
        return text.split(/(\s+)/).map((word, index) => {
            if (word.match(/^\s+$/)) return word;
            return (
                <span className="word" key={index}>
                    {word}
                </span>
            );
        });
    }, [children, isText]);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const scroller = scrollContainerRef && scrollContainerRef.current ? scrollContainerRef.current : window;

        const rotationTween = gsap.fromTo(
            el,
            { transformOrigin: '0% 50%', rotate: baseRotation },
            {
                ease: 'none',
                rotate: 0,
                scrollTrigger: {
                    trigger: el,
                    scroller,
                    start: 'top bottom',
                    end: rotationEnd,
                    scrub: true
                }
            }
        );

        const wordElements = el.querySelectorAll('.word');
        const targetElements = wordElements.length > 0 ? wordElements : el;

        const anim1 = gsap.fromTo(
            targetElements,
            { opacity: baseOpacity, willChange: 'opacity' },
            {
                ease: 'none',
                opacity: 1,
                stagger: 0.05,
                scrollTrigger: {
                    trigger: el,
                    scroller,
                    start: 'top bottom-=20%',
                    end: wordAnimationEnd,
                    scrub: true
                }
            }
        );

        let anim2;
        if (enableBlur) {
            anim2 = gsap.fromTo(
                targetElements,
                { filter: `blur(${blurStrength}px)` },
                {
                    ease: 'none',
                    filter: 'blur(0px)',
                    stagger: 0.05,
                    scrollTrigger: {
                        trigger: el,
                        scroller,
                        start: 'top bottom-=20%',
                        end: wordAnimationEnd,
                        scrub: true
                    }
                }
            );
        }

        return () => {
            // Only kill triggers associated with this element's animations if possible,
            // but relying on cleanup function scope variables is better.
            if (anim1.scrollTrigger) anim1.scrollTrigger.kill();
            if (anim2 && anim2.scrollTrigger) anim2.scrollTrigger.kill();
            if (rotationTween && rotationTween.scrollTrigger) rotationTween.scrollTrigger.kill();
        };
    }, [scrollContainerRef, enableBlur, baseRotation, baseOpacity, rotationEnd, wordAnimationEnd, blurStrength]);

    return (
        <div ref={containerRef} className={`scroll-reveal ${containerClassName}`}>
            {isText ? (
                <p className={`scroll-reveal-text ${textClassName}`}>{content}</p>
            ) : (
                content
            )}
        </div>
    );
};

export default ScrollReveal;



// USage
// import ScrollReveal from './ScrollReveal';

// <ScrollReveal
//   baseOpacity={0.1}
//   enableBlur
//   baseRotation={3}
//   blurStrength={4}
// >
//   When does a man die? When he is hit by a bullet? No! When he suffers a disease?
//   No! When he ate a soup made out of a poisonous mushroom?
//   No! A man dies when he is forgotten!
// </ScrollReveal>
