import { describe, it, expect } from 'vitest';
import { formatSize, getInitials } from '../../src/utils/formatters.js';

describe('formatSize', () => {
  it('returns "0 B" for 0 bytes', () => {
    expect(formatSize(0)).toBe('0 B');
  });

  it('formats bytes correctly', () => {
    expect(formatSize(512)).toBe('512 B');
  });

  it('formats kilobytes correctly', () => {
    expect(formatSize(1024)).toBe('1 KB');
  });

  it('formats megabytes correctly', () => {
    expect(formatSize(1024 * 1024)).toBe('1 MB');
  });

  it('formats gigabytes correctly', () => {
    expect(formatSize(1024 * 1024 * 1024)).toBe('1 GB');
  });

  it('formats terabytes correctly', () => {
    expect(formatSize(1024 * 1024 * 1024 * 1024)).toBe('1 TB');
  });

  it('rounds to one decimal place', () => {
    expect(formatSize(1536)).toBe('1.5 KB');
  });
});

describe('getInitials', () => {
  it('returns "U" for falsy input (null)', () => {
    expect(getInitials(null)).toBe('U');
  });

  it('returns "U" for empty string', () => {
    expect(getInitials('')).toBe('U');
  });

  it('returns "U" for undefined', () => {
    expect(getInitials(undefined)).toBe('U');
  });

  it('returns single initial for single name', () => {
    expect(getInitials('Alice')).toBe('A');
  });

  it('returns two initials for two-word name', () => {
    expect(getInitials('Alice Bob')).toBe('AB');
  });

  it('returns uppercase initials', () => {
    expect(getInitials('alice bob')).toBe('AB');
  });

  it('truncates to two characters for long names', () => {
    expect(getInitials('Alice Bob Charlie')).toBe('AB');
  });
});
