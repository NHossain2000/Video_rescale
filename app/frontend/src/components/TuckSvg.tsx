// TuckSvg.tsx — Pure SVG + CSS animations for Tuck, the lovable video-file gym buddy!
// Styled strictly with 2px ink outline, hard offset shadows, butter fill, and tomato accents.
import React from 'react';
import styles from './TuckSvg.module.css';

interface TuckSvgProps {
  variant: 'treadmill' | 'trophy' | 'stretching';
  progress?: number; // 0.0 to 1.0
  className?: string;
}

export const TuckSvg: React.FC<TuckSvgProps> = ({
  variant,
  progress = 0,
  className = ''
}) => {
  // Clamped progress for safe styling
  const p = Math.max(0, Math.min(1, progress));

  if (variant === 'treadmill') {
    // Treadmill runner: body gets slimmer from 1.0 down to ~0.74, belt dashes move faster
    const scaleX = (1 - p * 0.26).toFixed(3);
    const beltSpeed = (1.2 - p * 0.7).toFixed(2); // belt moves faster as progress rises

    return (
      <div
        className={`${styles.tuckContainer} ${className}`}
        style={{
          '--progress': p,
          '--scale-x': scaleX,
          '--belt-speed': `${beltSpeed}s`
        } as React.CSSProperties}
        role="img"
        aria-label={`Tuck running on a treadmill, ${(p * 100).toFixed(0)}% done`}
      >
        <svg viewBox="0 0 240 180" className={styles.svg}>
          <defs>
            <filter id="inkShadow" x="-10%" y="-10%" width="130%" height="130%">
              <feDropShadow dx="3" dy="3" stdDeviation="0" floodColor="#1B1A17" />
            </filter>
          </defs>

          {/* Treadmill Frame */}
          <g className={styles.treadmill}>
            {/* Front Console */}
            <path
              d="M 185 140 L 195 75 L 180 70 L 175 75"
              fill="none"
              stroke="#1B1A17"
              strokeWidth="3"
              strokeLinecap="round"
            />
            {/* Display screen */}
            <rect
              x="170"
              y="58"
              width="24"
              height="16"
              rx="4"
              fill="#FFFDF8"
              stroke="#1B1A17"
              strokeWidth="2"
            />
            <rect x="174" y="62" width="16" height="8" rx="2" fill="#9FE3BF" />

            {/* Base deck */}
            <rect
              x="30"
              y="136"
              width="170"
              height="12"
              rx="6"
              fill="#FFFDF8"
              stroke="#1B1A17"
              strokeWidth="2.5"
            />

            {/* Belt rollers */}
            <circle cx="42" cy="142" r="4" fill="#1B1A17" />
            <circle cx="188" cy="142" r="4" fill="#1B1A17" />

            {/* Moving Belt Surface */}
            <line
              x1="44"
              y1="137"
              x2="186"
              y2="137"
              stroke="#1B1A17"
              strokeWidth="3"
              strokeDasharray="8 6"
              className={styles.movingBelt}
            />
          </g>

          {/* Flying Sweat Drops */}
          {p > 0.1 && (
            <g className={styles.sweat}>
              <circle cx="95" cy="52" r="3.5" fill="#BDE3F6" stroke="#1B1A17" strokeWidth="1.5" />
              <circle cx="85" cy="62" r="2.5" fill="#BDE3F6" stroke="#1B1A17" strokeWidth="1.5" />
            </g>
          )}

          {/* Tuck Character Group */}
          <g className={styles.tuckRunner} transform="translate(105, 95)">
            {/* Left Foot */}
            <ellipse
              cx="-12"
              cy="36"
              rx="7"
              ry="4"
              fill="#FF5A36"
              stroke="#1B1A17"
              strokeWidth="2"
              className={styles.footLeft}
            />
            {/* Right Foot */}
            <ellipse
              cx="12"
              cy="36"
              rx="7"
              ry="4"
              fill="#FF5A36"
              stroke="#1B1A17"
              strokeWidth="2"
              className={styles.footRight}
            />

            {/* Body Group (scales horizontally as Tuck gets leaner) */}
            <g className={styles.tuckBodyGroup}>
              {/* Chubby butter body */}
              <rect
                x="-36"
                y="-38"
                width="72"
                height="68"
                rx="20"
                fill="#FFD84D"
                stroke="#1B1A17"
                strokeWidth="2.5"
                filter="url(#inkShadow)"
              />

              {/* Red Headband */}
              <rect
                x="-36"
                y="-33"
                width="72"
                height="8"
                rx="3"
                fill="#FF5A36"
                stroke="#1B1A17"
                strokeWidth="2"
              />

              {/* Rosy Tomato Cheeks */}
              <circle cx="-22" cy="-8" r="4" fill="#FF5A36" />
              <circle cx="22" cy="-8" r="4" fill="#FF5A36" />

              {/* Dot Eyes */}
              <circle cx="-12" cy="-14" r="3.2" fill="#1B1A17" />
              <circle cx="12" cy="-14" r="3.2" fill="#1B1A17" />
              {/* Eye shine */}
              <circle cx="-10.5" cy="-15.5" r="1" fill="#FFFDF8" />
              <circle cx="13.5" cy="-15.5" r="1" fill="#FFFDF8" />

              {/* Mouth: determined O-shape at start, proud grin towards the end */}
              {p < 0.65 ? (
                <ellipse cx="0" cy="-6" rx="4" ry="3" fill="#1B1A17" />
              ) : (
                <path
                  d="M -7 -7 Q 0 -1 7 -7"
                  fill="none"
                  stroke="#1B1A17"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              )}

              {/* Video Play Triangle on Belly */}
              <polygon
                points="-5,10 7,16 -5,22"
                fill="#1B1A17"
                stroke="#1B1A17"
                strokeWidth="1"
              />
            </g>

            {/* Arms pumping */}
            <path
              d="M -30 -10 Q -42 2 -32 14"
              fill="none"
              stroke="#1B1A17"
              strokeWidth="3.5"
              strokeLinecap="round"
              className={styles.armLeft}
            />
            <path
              d="M 30 -10 Q 42 2 32 14"
              fill="none"
              stroke="#1B1A17"
              strokeWidth="3.5"
              strokeLinecap="round"
              className={styles.armRight}
            />
          </g>
        </svg>
      </div>
    );
  }

  if (variant === 'trophy') {
    // Done screen: Slim Tuck in sunglasses holding tiny file trophy with celebratory bounce
    return (
      <div
        className={`${styles.tuckContainer} ${styles.trophyBounce} ${className}`}
        role="img"
        aria-label="Slim Tuck wearing sunglasses and holding up a tiny compressed file like a trophy"
      >
        <svg viewBox="0 0 200 180" className={styles.svg}>
          <defs>
            <filter id="inkShadowTrophy" x="-10%" y="-10%" width="130%" height="130%">
              <feDropShadow dx="3" dy="3" stdDeviation="0" floodColor="#1B1A17" />
            </filter>
          </defs>

          {/* Tiny File Trophy held overhead */}
          <g transform="translate(100, 26)">
            {/* Golden radiance sparks */}
            <line x1="-22" y1="-14" x2="-28" y2="-20" stroke="#FF5A36" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="0" y1="-20" x2="0" y2="-28" stroke="#FF5A36" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="22" y1="-14" x2="28" y2="-20" stroke="#FF5A36" strokeWidth="2.5" strokeLinecap="round" />

            {/* Tiny featherweight file card */}
            <rect
              x="-18"
              y="-12"
              width="36"
              height="40"
              rx="6"
              fill="#FFFDF8"
              stroke="#1B1A17"
              strokeWidth="2"
              filter="url(#inkShadowTrophy)"
            />
            <path d="M 8 -12 L 18 -2 L 8 -2 Z" fill="#9FE3BF" stroke="#1B1A17" strokeWidth="1.5" />
            <polygon points="-4,6 6,11 -4,16" fill="#FF5A36" />
          </g>

          {/* Tuck Body */}
          <g transform="translate(100, 110)">
            {/* Feet planted proudly */}
            <ellipse cx="-16" cy="38" rx="8" ry="4.5" fill="#FF5A36" stroke="#1B1A17" strokeWidth="2" />
            <ellipse cx="16" cy="38" rx="8" ry="4.5" fill="#FF5A36" stroke="#1B1A17" strokeWidth="2" />

            {/* Slimmer, toned body */}
            <rect
              x="-28"
              y="-36"
              width="56"
              height="68"
              rx="18"
              fill="#FFD84D"
              stroke="#1B1A17"
              strokeWidth="2.5"
              filter="url(#inkShadowTrophy)"
            />

            {/* Arms raised holding the trophy */}
            <path
              d="M -24 -15 Q -38 -45 -12 -58"
              fill="none"
              stroke="#1B1A17"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <path
              d="M 24 -15 Q 38 -45 12 -58"
              fill="none"
              stroke="#1B1A17"
              strokeWidth="4"
              strokeLinecap="round"
            />

            {/* Cool Sunglasses */}
            <g transform="translate(0, -18)">
              {/* Frame bridge */}
              <line x1="-6" y1="0" x2="6" y2="0" stroke="#1B1A17" strokeWidth="2" />
              {/* Left Lens */}
              <rect x="-20" y="-4" width="15" height="11" rx="3" fill="#1B1A17" />
              <line x1="-18" y1="-1" x2="-7" y2="5" stroke="#FFFDF8" strokeWidth="1.5" strokeLinecap="round" />
              {/* Right Lens */}
              <rect x="5" y="-4" width="15" height="11" rx="3" fill="#1B1A17" />
              <line x1="7" y1="-1" x2="18" y2="5" stroke="#FFFDF8" strokeWidth="1.5" strokeLinecap="round" />
            </g>

            {/* Cheeks */}
            <circle cx="-18" cy="-5" r="3.5" fill="#FF5A36" />
            <circle cx="18" cy="-5" r="3.5" fill="#FF5A36" />

            {/* Big proud grin */}
            <path
              d="M -10 3 Q 0 12 10 3"
              fill="#FFFDF8"
              stroke="#1B1A17"
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            {/* Belly play icon */}
            <polygon points="-4,20 5,24 -4,28" fill="#1B1A17" />
          </g>
        </svg>
      </div>
    );
  }

  // Variant: stretching (Drop screen corner peek)
  return (
    <div
      className={`${styles.tuckContainer} ${className}`}
      role="img"
      aria-label="Tuck stretching with a headband, ready to work"
    >
      <svg viewBox="0 0 140 130" className={styles.svg}>
        <defs>
          <filter id="inkShadowStretch" x="-10%" y="-10%" width="130%" height="130%">
            <feDropShadow dx="3" dy="3" stdDeviation="0" floodColor="#1B1A17" />
          </filter>
        </defs>

        <g transform="translate(70, 70)">
          {/* Feet */}
          <ellipse cx="-16" cy="38" rx="8" ry="4.5" fill="#FF5A36" stroke="#1B1A17" strokeWidth="2" />
          <ellipse cx="16" cy="38" rx="8" ry="4.5" fill="#FF5A36" stroke="#1B1A17" strokeWidth="2" />

          {/* Chubby butter body */}
          <rect
            x="-36"
            y="-38"
            width="72"
            height="70"
            rx="20"
            fill="#FFD84D"
            stroke="#1B1A17"
            strokeWidth="2.5"
            filter="url(#inkShadowStretch)"
          />

          {/* Sweatband */}
          <rect
            x="-36"
            y="-33"
            width="72"
            height="8"
            rx="3"
            fill="#FF5A36"
            stroke="#1B1A17"
            strokeWidth="2"
          />

          {/* Cheeks */}
          <circle cx="-22" cy="-8" r="4" fill="#FF5A36" />
          <circle cx="22" cy="-8" r="4" fill="#FF5A36" />

          {/* Eyes */}
          <circle cx="-12" cy="-14" r="3.2" fill="#1B1A17" />
          <circle cx="12" cy="-14" r="3.2" fill="#1B1A17" />
          <circle cx="-10.5" cy="-15.5" r="1" fill="#FFFDF8" />
          <circle cx="13.5" cy="-15.5" r="1" fill="#FFFDF8" />

          {/* Excited smile */}
          <path
            d="M -7 -4 Q 0 4 7 -4"
            fill="none"
            stroke="#1B1A17"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Video Play triangle */}
          <polygon points="-5,12 7,18 -5,24" fill="#1B1A17" />

          {/* Arm stretching across chest */}
          <path
            d="M 32 -6 Q 0 -6 -24 4"
            fill="none"
            stroke="#1B1A17"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <path
            d="M -28 -10 Q -12 6 -12 18"
            fill="none"
            stroke="#1B1A17"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </g>
      </svg>
    </div>
  );
};
