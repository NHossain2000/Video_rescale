// TvFrame.tsx — Retro TV sticker frame tilted at -1.5deg with ink outlines and channel dials
import React from 'react';
import styles from './TvFrame.module.css';

interface TvFrameProps {
  children: React.ReactNode;
  className?: string;
}

export const TvFrame: React.FC<TvFrameProps> = ({ children, className = '' }) => {
  return (
    <div className={`${styles.tvFrame} ${className}`}>
      {/* Retro Antenna */}
      <div className={styles.antenna} aria-hidden="true">
        <span className={styles.antennaLeft} />
        <span className={styles.antennaRight} />
        <span className={styles.antennaBase} />
      </div>

      {/* Main TV Cabinet */}
      <div className={styles.cabinet}>
        {/* Screen Bezel */}
        <div className={styles.screenBezel}>
          <div className={styles.screen}>{children}</div>
        </div>

        {/* Control Panel Strip */}
        <div className={styles.controls} aria-hidden="true">
          <div className={styles.dialKnob} />
          <div className={styles.dialKnobSmall} />
          <div className={styles.speakerGrill}>
            <span />
            <span />
            <span />
          </div>
          <div className={styles.powerPill} />
        </div>
      </div>
    </div>
  );
};
