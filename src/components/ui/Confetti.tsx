'use client';
import React, { useEffect, useState } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  driftX: number;
  endY: number;
  rotation: number;
  duration: number;
  shape: 'circle' | 'square' | 'star';
  delay: number;
}

const COLORS = [
  '#FFD700', // gold
  '#FF6B6B', // coral
  '#4ECDC4', // teal
  '#45B7D1', // sky
  '#96CEB4', // sage
  '#FFEAA7', // cream
  '#DDA0DD', // plum
  '#98D8C8', // mint
  '#F7DC6F', // sunshine
  '#82E0AA', // spring
];

function generateParticles(count: number, originX?: number, originY?: number): Particle[] {
  const cx = originX ?? 50;
  const cy = originY ?? 30;

  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: cx + (Math.random() - 0.5) * 60,
    y: cy,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    size: 4 + Math.random() * 6,
    driftX: (Math.random() - 0.5) * 120,
    endY: 60 + Math.random() * 40,
    rotation: Math.random() * 1080,
    duration: 1.2 + Math.random() * 1.2,
    shape: (['circle', 'square', 'star'] as const)[Math.floor(Math.random() * 3)],
    delay: Math.random() * 0.3,
  }));
}

interface ConfettiProps {
  active: boolean;
  count?: number;
  originX?: number;
  originY?: number;
  onComplete?: () => void;
}

export function Confetti({ active, count = 40, originX, originY, onComplete }: ConfettiProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (active) {
      setParticles(generateParticles(count, originX, originY));
      const timer = setTimeout(() => {
        setParticles([]);
        onComplete?.();
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setParticles([]);
    }
  }, [active, count, originX, originY, onComplete]);

  if (particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.shape !== 'star' ? p.color : 'transparent',
            borderRadius: p.shape === 'circle' ? '50%' : p.shape === 'square' ? '2px' : '0',
            boxShadow: p.shape === 'star' ? `0 0 0 ${p.size / 3}px ${p.color}` : 'none',
            clipPath: p.shape === 'star' ? 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' : 'none',
            animationDelay: `${p.delay}s`,
            '--fall-duration': `${p.duration}s`,
            '--drift-x': `${p.driftX}px`,
            '--end-y': `${p.endY}vh`,
            '--start-y': '0px',
            '--end-rotation': `${p.rotation}deg`,
            animation: `confettiFall ${p.duration}s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${p.delay}s forwards`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

/**
 * Mini confetti burst — used for individual habit completions.
 * Spawns a handful of particles from a specific element position.
 */
interface ParticleBurstProps {
  active: boolean;
  color?: string;
  x: number;
  y: number;
  count?: number;
}

export function ParticleBurst({ active, color = '#16A34A', x, y, count = 12 }: ParticleBurstProps) {
  const [particles, setParticles] = useState<Array<{
    id: number;
    angle: number;
    distance: number;
    size: number;
    color: string;
    delay: number;
  }>>([]);

  useEffect(() => {
    if (active) {
      const colors = [color, COLORS[0], COLORS[2], COLORS[4]];
      setParticles(
        Array.from({ length: count }, (_, i) => ({
          id: i,
          angle: (360 / count) * i + (Math.random() - 0.5) * 30,
          distance: 15 + Math.random() * 25,
          size: 3 + Math.random() * 3,
          color: colors[Math.floor(Math.random() * colors.length)],
          delay: Math.random() * 0.1,
        }))
      );
      const timer = setTimeout(() => setParticles([]), 700);
      return () => clearTimeout(timer);
    } else {
      setParticles([]);
    }
  }, [active, color, count]);

  if (particles.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible" style={{ zIndex: 50 }}>
      {particles.map(p => {
        const rad = (p.angle * Math.PI) / 180;
        const tx = Math.cos(rad) * p.distance;
        const ty = Math.sin(rad) * p.distance;
        return (
          <div
            key={p.id}
            className="absolute rounded-full"
            style={{
              left: x,
              top: y,
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              transform: `translate(-50%, -50%)`,
              animation: `particleBurst 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${p.delay}s forwards`,
              '--tx': `${tx}px`,
              '--ty': `${ty}px`,
            } as React.CSSProperties}
          />
        );
      })}
      <style jsx>{`
        @keyframes particleBurst {
          0%   { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          100% { transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(0); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
