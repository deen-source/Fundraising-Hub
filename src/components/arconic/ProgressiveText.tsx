import { useState, useEffect } from 'react';

interface ProgressiveTextProps {
  text: string;
  speed?: number; // milliseconds per word (default: 100ms = ~600 WPM reading speed, faster than typical speech)
  className?: string;
  onComplete?: () => void;
}

export const ProgressiveText = ({
  text,
  speed = 60, // ~60ms per word = fast but smooth reveal
  className = '',
  onComplete
}: ProgressiveTextProps) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // Reset when text changes
    setDisplayedText('');
    setCurrentIndex(0);
  }, [text]);

  useEffect(() => {
    if (!text) return;

    // Split into words for more natural reveal
    const words = text.split(' ');

    if (currentIndex < words.length) {
      const timer = setTimeout(() => {
        setDisplayedText(prev => {
          const newText = prev ? `${prev} ${words[currentIndex]}` : words[currentIndex];
          return newText;
        });
        setCurrentIndex(prev => prev + 1);
      }, speed);

      return () => clearTimeout(timer);
    } else if (currentIndex === words.length && onComplete) {
      // Animation complete
      onComplete();
    }
  }, [text, currentIndex, speed, onComplete]);

  return <span className={className}>{displayedText}</span>;
};
