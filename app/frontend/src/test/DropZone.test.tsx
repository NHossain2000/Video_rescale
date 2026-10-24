import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DropZone } from '../components/DropZone';

describe('DropZone component', () => {
  it('renders idle prompt and accepts file via input', () => {
    const handleFileSelect = vi.fn();
    const handleFileRemove = vi.fn();
    const handleError = vi.fn();

    const { container } = render(
      <DropZone
        selectedFile={null}
        onFileSelect={handleFileSelect}
        onFileRemove={handleFileRemove}
        onError={handleError}
      />
    );

    expect(screen.getByText(/Drop your video here, or click to browse/i)).toBeDefined();

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).toBeDefined();

    const file = new File(['dummy content'], 'sample.mkv', { type: 'video/x-matroska' });
    fireEvent.change(input, { target: { files: [file] } });

    expect(handleFileSelect).toHaveBeenCalledWith(file);
    expect(handleError).not.toHaveBeenCalled();
  });

  it('rejects unsupported file formats like .txt or .png', () => {
    const handleFileSelect = vi.fn();
    const handleFileRemove = vi.fn();
    const handleError = vi.fn();

    const { container } = render(
      <DropZone
        selectedFile={null}
        onFileSelect={handleFileSelect}
        onFileRemove={handleFileRemove}
        onError={handleError}
      />
    );

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['text content'], 'notes.txt', { type: 'text/plain' });
    fireEvent.change(input, { target: { files: [file] } });

    expect(handleFileSelect).not.toHaveBeenCalled();
    expect(handleError).toHaveBeenCalled();
  });

  it('allows files larger than 500 MB on PC/desktop without restriction', () => {
    const handleFileSelect = vi.fn();
    const handleFileRemove = vi.fn();
    const handleError = vi.fn();

    const { container } = render(
      <DropZone
        selectedFile={null}
        onFileSelect={handleFileSelect}
        onFileRemove={handleFileRemove}
        onError={handleError}
      />
    );

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const largeFile = new File(['x'], 'huge.mp4', { type: 'video/mp4' });
    Object.defineProperty(largeFile, 'size', { value: 650 * 1024 * 1024 }); // 650 MB

    fireEvent.change(input, { target: { files: [largeFile] } });

    expect(handleFileSelect).toHaveBeenCalledWith(largeFile);
    expect(handleError).not.toHaveBeenCalled();
  });

  it('displays selected file and allows removing it', () => {
    const handleFileSelect = vi.fn();
    const handleFileRemove = vi.fn();
    const handleError = vi.fn();

    const selectedFile = new File(['data'], 'presentation.mov', { type: 'video/quicktime' });
    Object.defineProperty(selectedFile, 'size', { value: 15 * 1024 * 1024 });

    render(
      <DropZone
        selectedFile={selectedFile}
        onFileSelect={handleFileSelect}
        onFileRemove={handleFileRemove}
        onError={handleError}
      />
    );

    expect(screen.getByText('presentation.mov')).toBeDefined();
    expect(screen.getByText('15.0 MB')).toBeDefined();

    const removeButton = screen.getByRole('button', { name: /Remove selected file/i });
    fireEvent.click(removeButton);
    expect(handleFileRemove).toHaveBeenCalled();
  });
});
