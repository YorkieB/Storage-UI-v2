import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Breadcrumbs from '../../src/components/navigation/Breadcrumbs.jsx';

describe('Breadcrumbs', () => {
  it('renders the Home button when path is empty', () => {
    render(<Breadcrumbs path={[]} onNavigate={vi.fn()} darkMode={false} />);
    expect(screen.getByText('Home')).toBeDefined();
  });

  it('calls onNavigate(null) when Home button is clicked', () => {
    const onNavigate = vi.fn();
    render(<Breadcrumbs path={[]} onNavigate={onNavigate} darkMode={false} />);

    fireEvent.click(screen.getByText('Home'));
    expect(onNavigate).toHaveBeenCalledWith(null);
  });

  it('renders folder names in the path', () => {
    const path = [
      { id: '1', name: 'Documents' },
      { id: '2', name: 'Work' },
    ];
    render(<Breadcrumbs path={path} onNavigate={vi.fn()} darkMode={false} />);

    expect(screen.getByText('Documents')).toBeDefined();
    expect(screen.getByText('Work')).toBeDefined();
  });

  it('calls onNavigate with the folder when a path segment is clicked', () => {
    const onNavigate = vi.fn();
    const folder = { id: '1', name: 'Documents' };
    render(<Breadcrumbs path={[folder]} onNavigate={onNavigate} darkMode={false} />);

    fireEvent.click(screen.getByText('Documents'));
    expect(onNavigate).toHaveBeenCalledWith(folder);
  });

  it('applies dark mode styles when darkMode is true', () => {
    const { container } = render(
      <Breadcrumbs path={[]} onNavigate={vi.fn()} darkMode={true} />
    );
    expect(container.firstChild.className).toContain('text-gray-400');
  });

  it('applies light mode styles when darkMode is false', () => {
    const { container } = render(
      <Breadcrumbs path={[]} onNavigate={vi.fn()} darkMode={false} />
    );
    expect(container.firstChild.className).toContain('text-gray-600');
  });
});
