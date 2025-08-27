import React, { useEffect, useRef, useState } from 'react';

interface ScrollAnimationProps {
  children: React.ReactNode;
  className?: string;
  animationType?: 'up' | 'left' | 'right' | 'scale';
  delay?: number;
}

const ScrollAnimation: React.FC<ScrollAnimationProps> = ({ 
  children, 
  className = '', 
  animationType = 'up',
  delay = 0
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            setIsVisible(true);
          }, delay);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      if (elementRef.current) {
        observer.unobserve(elementRef.current);
      }
    };
  }, [delay]);

  const getAnimationClass = () => {
    const baseClass = `scroll-animate${animationType !== 'up' ? `-${animationType}` : ''}`;
    return `${baseClass} ${isVisible ? 'animate' : ''}`;
  };

  return (
    <div 
      ref={elementRef} 
      className={`${getAnimationClass()} ${className}`}
    >
      {children}
    </div>
  );
};

export default ScrollAnimation;