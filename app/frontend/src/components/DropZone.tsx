// DropZone.tsx — Dashed-ink vacuum mouth with friendly face and drag-wobble
import React, { useState, useRef } from 'react';
import styles from './DropZone.module.css';
import { COPY } from '../copy';
import { getDeviceCapabilities } from '../services/clientCompressor';

interface DropZoneProps {
  selectedFile: File | null;
  onFileSelect: (file: File) => void;
  onFileRemove: () => void;
  onError: (msg: string) => void;
}

export const DropZone: React.FC<DropZoneProps> = ({
  selectedFile,
  onFileSelect,
  onFileRemove,
  onError
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const caps = getDeviceCapabilities();

  const validateAndHandleFile = (file: File) => {
    // Check MIME type or FFmpeg video extensions
    const isVideoMime =
      file.type.startsWith('video/') ||
      file.type === 'application/octet-stream' ||
      file.type === 'application/x-matroska' ||
      file.type === 'application/ogg' ||
      file.type === 'application/vnd.rn-realmedia';

    const isVideoExt =
      /\.(mp4|mov|mkv|webm|avi|flv|wmv|m4v|ts|mts|m2ts|3gp|3g2|ogv|ogg|vob|asf|rm|rmvb|divx|f4v|mpg|mpeg|mpe)$/i.test(
        file.name
      );

    if (!isVideoMime && !isVideoExt) {
      onError(COPY.errors.invalidFormat);
      return;
    }

    // Only mobile has a hardware memory cap to prevent OS jetsam tab crashes.
    // Desktop/PC is in-house on client hardware and is completely limit-free!
    if (caps.isMobile && file.size > caps.maxSafeFileSizeBytes) {
      onError(COPY.errors.fileTooLarge);
      return;
    }

    onFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndHandleFile(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndHandleFile(e.target.files[0]);
    }
  };

  const formatFileSize = (bytes: number): string => {
    const mb = bytes / (1024 * 1024);
    if (mb < 1) {
      return `${(bytes / 1024).toFixed(0)} KB`;
    }
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <div className={styles.wrapper}>
      {selectedFile ? (
        // File selected chip card
        <div className={styles.selectedCard}>
          <div className={styles.fileDetails}>
            <div className={styles.videoIcon} aria-hidden="true">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="4" width="18" height="16" rx="4" fill="#FFD84D" stroke="#1B1A17" strokeWidth="2" />
                <polygon points="10,8 16,12 10,16" fill="#1B1A17" />
              </svg>
            </div>
            <div className={styles.fileText}>
              <span className={styles.fileName}>{selectedFile.name}</span>
              <span className={styles.fileSize}>{formatFileSize(selectedFile.size)}</span>
            </div>
          </div>
          <button
            type="button"
            className={styles.removeBtn}
            onClick={onFileRemove}
            aria-label="Remove selected file"
          >
            ✕
          </button>
        </div>
      ) : (
        // Dashed Vacuum Mouth
        <div
          className={`${styles.dropZone} ${isDragOver ? styles.dragOver : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          tabIndex={0}
          role="button"
          aria-label={COPY.drop.dropzoneIdle}
        >
          <input
            ref={inputRef}
            type="file"
            accept="video/*,.mp4,.mov,.mkv,.webm,.avi,.flv,.wmv,.m4v,.ts,.mts,.m2ts,.3gp,.3g2,.ogv,.ogg,.vob,.asf"
            className={styles.hiddenInput}
            onChange={handleInputChange}
          />

          {/* Vacuum Bag Cute Face */}
          <div className={styles.face} aria-hidden="true">
            <div className={styles.eye} />
            <div className={styles.mouthOpening}>
              <span className={styles.mouthTongue} />
            </div>
            <div className={styles.eye} />
          </div>

          <p className={styles.promptText}>
            {isDragOver ? COPY.drop.dropzoneActive : COPY.drop.dropzoneIdle}
          </p>
          <span className={styles.helpText}>
            {caps.isMobile
              ? `MP4, MOV, MKV, WebM up to ${caps.maxSafeFileSizeMb} MB`
              : COPY.drop.dropzoneHelp}
          </span>
        </div>
      )}
    </div>
  );
};
