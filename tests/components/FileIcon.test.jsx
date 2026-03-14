import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import FileIcon from '../../src/components/files/FileIcon.jsx';

describe('FileIcon', () => {
  it('renders a folder icon for folder type', () => {
    const { container } = render(<FileIcon type="folder" />);
    expect(container.firstChild).toBeDefined();
  });

  it('renders an image preview when fileType is image and previewUrl is provided', () => {
    render(<FileIcon type="file" fileType="image" previewUrl="https://example.com/img.jpg" />);
    const img = screen.getByAltText('preview');
    expect(img).toBeDefined();
    expect(img.src).toBe('https://example.com/img.jpg');
  });

  it('renders an icon for image fileType without preview', () => {
    const { container } = render(<FileIcon type="file" fileType="image" />);
    expect(container.querySelector('svg')).toBeDefined();
  });

  it('renders an icon for video fileType', () => {
    const { container } = render(<FileIcon type="file" fileType="video" />);
    expect(container.querySelector('svg')).toBeDefined();
  });

  it('renders an icon for audio fileType', () => {
    const { container } = render(<FileIcon type="file" fileType="audio" />);
    expect(container.querySelector('svg')).toBeDefined();
  });

  it('renders an icon for pdf fileType', () => {
    const { container } = render(<FileIcon type="file" fileType="pdf" />);
    expect(container.querySelector('svg')).toBeDefined();
  });

  it('renders an icon for excel fileType', () => {
    const { container } = render(<FileIcon type="file" fileType="excel" />);
    expect(container.querySelector('svg')).toBeDefined();
  });

  it('renders an icon for word fileType', () => {
    const { container } = render(<FileIcon type="file" fileType="word" />);
    expect(container.querySelector('svg')).toBeDefined();
  });

  it('renders a default text icon for unknown fileType', () => {
    const { container } = render(<FileIcon type="file" fileType="unknown" />);
    expect(container.querySelector('svg')).toBeDefined();
  });

  it('applies a custom className', () => {
    const { container } = render(<FileIcon type="folder" className="w-10 h-10" />);
    const svg = container.querySelector('svg');
    expect(svg.className.baseVal).toContain('w-10');
    expect(svg.className.baseVal).toContain('h-10');
  });
});
