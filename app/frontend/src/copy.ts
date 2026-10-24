// copy.ts — Clean UI copy for Tuckin

export const COPY = {
  brand: {
    name: 'Tuckin',
    mascot: 'Tuck',
    tagline: 'Same video. Way less weight.',
    subline: 'Small file. Same picture. Zero fuss.',
    navReviews: 'What people say'
  },

  hero: {
    cardTitle: 'Fast, private compression',
    cardDesc: 'Shrinks video files without crushing quality.\nIsolated container, zero tracking.'
  },

  drop: {
    headline: 'Same video. Way less weight.',
    subline: 'Small file. Same picture. Zero fuss.',
    dropzoneIdle: 'Drop your video here, or click to browse',
    dropzoneActive: 'Release to drop your video',
    dropzoneHelp: 'MP4, MOV, MKV, WebM (no file size limit)',
    fileSelected: 'Selected video',
    removeFile: 'Remove file',
    changeFile: 'Choose another',
    cta: 'Compress video',
    tuckStretching: 'Initializing compression engine…'
  },

  dial: {
    title: 'Squeeze Dial',
    subtitle: 'Choose compression intensity',
    recommendedBadge: 'RECOMMENDED',
    options: {
      light: {
        label: 'Light',
        desc: 'Gentle compression. Near-identical quality (saves 40% file size).'
      },
      regular: {
        label: 'Standard',
        desc: 'Balanced best. Maximum quality per byte (recommended).'
      },
      marathon: {
        label: 'Maximum',
        desc: 'Maximum compression. Clean visuals with maximum space saved (saves 70% file size).'
      }
    }
  },

  squeezing: {
    headline: 'Compressing your video…',
    cancel: 'Cancel',
    cancelled: 'Compression cancelled.',
    statusLines: [
      'Loading video engine...',
      'Analyzing video streams...',
      'Optimizing video bitrate...',
      'Finalizing compressed file...'
    ],
    stages: {
      uploading: 'Preparing video file...',
      analyzing: 'Analyzing video metadata...',
      compressing: 'Encoding video frames...',
      finishing: 'Finalizing output...'
    }
  },

  done: {
    headline: 'Compression complete!',
    subhead: 'Your video is ready. Smaller size, high quality.',
    originalLabel: 'Original',
    tuckedLabel: 'Compressed',
    reductionSuffix: 'SMALLER',
    compareTitle: 'Spot the difference',
    compareCaption: 'Compare original and compressed video side by side',
    download: 'Download video',
    tuckAnother: 'Compress another video',
    expiredWarning: 'Your video stays in your browser memory until you leave or start another.'
  },

  privacy: {
    badge: 'Zero Traces',
    stamp: '100% PRIVATE',
    fullStatement:
      'Your video is processed in an isolated temporary container. The original file is permanently deleted the second compression finishes, and your compressed copy is erased when you leave the page or after 30 minutes. No accounts, no cookies, no permanent storage.',
    summary: '100% private. Zero bytes stored or tracked.',
    footer:
      'Your video is processed in an isolated temporary container. The original file is permanently deleted the second compression finishes, and your compressed copy is erased when you leave the page or after 30 minutes. No accounts, no cookies, no permanent storage.'
  },

  reviews: {
    promptTitle: 'What was your experience?',
    promptSubtitle: 'Leave a quick, anonymous note.',
    wallTitle: 'What people say',
    wallSubtitle: 'Real reviews from people who used Tuckin.',
    empty: 'No reviews yet. Be the first.',
    charCount: 'chars',
    textareaLabel: 'What was your experience?',
    textareaPlaceholder: 'How did the quality look and how fast did it go?',
    nameTagLabel: 'Your alias',
    rerollName: 'Roll another alias',
    disclaimer: 'Reviews are public. Don’t include personal info.',
    submit: 'Post review',
    submitting: 'Posting...',
    submittedTitle: 'Thanks, your review is in!',
    submittedSubtitle: 'Your feedback helps improve Tuckin.',
    showMore: 'Show more reviews',
    ratingLabels: [
      '1 out of 5 — Poor',
      '2 out of 5 — Fair',
      '3 out of 5 — Good',
      '4 out of 5 — Very good',
      '5 out of 5 — Excellent'
    ]
  },

  errors: {
    fileTooLarge: 'Selected file is too large for mobile memory limits. Please choose a smaller video or compress on PC.',
    invalidFormat: 'Please select a valid video file (MP4, MOV, MKV, WebM, etc.).',
    uploadFailed: 'Failed to process file. Please try again.',
    probeFailed: 'Could not read video. It might be corrupt or an unsupported format.',
    compressionFailed: 'Compression failed. Please try again with another setting.',
    cancelled: 'Compression was cancelled.',
    jobExpired: 'Session expired. Please select your video again.',
    networkError: 'Network glitch! Check your internet connection.',
    generic: 'Something unexpected happened. Please try again.'
  }
} as const;
