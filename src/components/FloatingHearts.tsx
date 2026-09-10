import React, { useEffect, useState } from 'react';

interface FloatingHeartItem {
  id: number;
  color: string;
  leftOffset: number;
  scale: number;
}

interface FloatingHeartsProps {
  triggerCount: number;
}

const HEART_COLORS = ['#ec4899', '#f43f5e', '#ef4444', '#f59e0b', '#8b5cf6', '#06b6d4'];

export const FloatingHearts: React.FC<FloatingHeartsProps> = ({ triggerCount }) => {
  const [hearts, setHearts] = useState<FloatingHeartItem[]>([]);

  useEffect(() => {
    if (triggerCount === 0) return;

    const newHeart: FloatingHeartItem = {
      id: Date.now() + Math.random(),
      color: HEART_COLORS[Math.floor(Math.random() * HEART_COLORS.length)],
      leftOffset: Math.random() * 40 - 20, // -20 to +20px drift
      scale: 0.8 + Math.random() * 0.5,
    };

    setHearts((prev) => [...prev.slice(-15), newHeart]);

    const timeout = setTimeout(() => {
      setHearts((prev) => prev.filter((h) => h.id !== newHeart.id));
    }, 1800);

    return () => clearTimeout(timeout);
  }, [triggerCount]);

  return (
    <div className="absolute right-4 bottom-24 pointer-events-none z-30 w-16 h-64 overflow-hidden flex flex-col justify-end items-center">
      {hearts.map((h) => (
        <div
          key={h.id}
          className="absolute bottom-0 text-xl font-bold animate-float-heart"
          style={{
            transform: `translateX(${h.leftOffset}px) scale(${h.scale})`,
            color: h.color,
          }}
        >
          ❤️
        </div>
      ))}
    </div>
  );
};
