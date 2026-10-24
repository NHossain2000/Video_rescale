import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { MascotSlot } from '../components/MascotSlot';

describe('MascotSlot component', () => {
  it('renders video element on treadmill variant', () => {
    const { container } = render(<MascotSlot variant="treadmill" />);
    const video = container.querySelector('video');
    expect(video).toBeDefined();
    expect(video?.getAttribute('src')).toBe('/mascot/tuck-run.mp4');
  });

  it('falls back to SVG when video triggers error', () => {
    const { container } = render(<MascotSlot variant="treadmill" />);
    const video = container.querySelector('video');
    expect(video).toBeDefined();

    if (video) {
      fireEvent.error(video);
    }

    const svg = container.querySelector('svg');
    expect(svg).toBeDefined();
  });

  it('renders SVG for trophy and stretching variants', () => {
    const { container: trophyContainer } = render(<MascotSlot variant="trophy" />);
    expect(trophyContainer.querySelector('svg')).toBeDefined();

    const { container: stretchContainer } = render(<MascotSlot variant="stretching" />);
    expect(stretchContainer.querySelector('svg')).toBeDefined();
  });
});
