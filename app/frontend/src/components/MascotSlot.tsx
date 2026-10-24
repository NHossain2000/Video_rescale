import React, { useState } from 'react';
import { TuckSvg } from './TuckSvg';
import styles from './MascotSlot.module.css';

interface MascotSlotProps {
  variant?: 'treadmill' | 'trophy' | 'stretching';
  progress?: number; // 0.0 to 1.0
  className?: string;
}

export const MascotSlot: React.FC<MascotSlotProps> = ({
  variant = 'treadmill',
  progress = 0,
  className = ''
}) => {
  const [videoError, setVideoError] = useState<boolean>(false);

  // During compression ('treadmill'), display the visual relief video loop with automatic SVG fallback
  if (variant === 'treadmill' && !videoError) {
    return (
      <div className={`${styles.slotWrapper} ${className}`}>
        <video
          src="/mascot/tuck-run.mp4"
          autoPlay
          loop
          muted
          playsInline
          onError={() => setVideoError(true)}
          className={styles.assetMedia}
        />
      </div>
    );
  }

  // Pure SVG fallback (or trophy / stretching variants)
  return (
    <div className={`${styles.slotWrapper} ${className}`}>
      <TuckSvg variant={variant} progress={progress} />
    </div>
  );
};

