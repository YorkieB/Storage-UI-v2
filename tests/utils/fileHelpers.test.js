import { describe, it, expect } from 'vitest';
import { getFileType, fileToBase64 } from '../../src/utils/fileHelpers.js';

describe('getFileType', () => {
  it('returns "image" for image MIME types', () => {
    expect(getFileType('image/jpeg')).toBe('image');
    expect(getFileType('image/png')).toBe('image');
  });

  it('returns "video" for video MIME types', () => {
    expect(getFileType('video/mp4')).toBe('video');
  });

  it('returns "audio" for audio MIME types', () => {
    expect(getFileType('audio/mpeg')).toBe('audio');
  });

  it('returns "pdf" for PDF MIME type', () => {
    expect(getFileType('application/pdf')).toBe('pdf');
  });

  it('returns "excel" for spreadsheet MIME types', () => {
    expect(getFileType('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')).toBe('excel');
    expect(getFileType('application/vnd.ms-excel')).toBe('excel');
  });

  it('returns "word" for document MIME types', () => {
    expect(getFileType('application/vnd.openxmlformats-officedocument.wordprocessingml.document')).toBe('word');
    expect(getFileType('application/msword')).toBe('word');
  });

  it('returns "text" for unrecognized MIME types', () => {
    expect(getFileType('text/plain')).toBe('text');
    expect(getFileType('application/octet-stream')).toBe('text');
  });
});

describe('fileToBase64', () => {
  it('resolves with base64 string from a File', async () => {
    const content = 'hello world';
    const file = new File([content], 'test.txt', { type: 'text/plain' });

    const result = await fileToBase64(file);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);

    const decoded = atob(result);
    expect(decoded).toBe(content);
  });

  it('rejects when the FileReader encounters an error', async () => {
    const file = new File(['data'], 'test.txt', { type: 'text/plain' });
    const readError = new Error('Read error');

    const originalFileReader = global.FileReader;
    global.FileReader = class {
      readAsDataURL() {
        setTimeout(() => this.onerror(readError), 0);
      }
    };

    await expect(fileToBase64(file)).rejects.toThrow('Read error');

    global.FileReader = originalFileReader;
  });
});
