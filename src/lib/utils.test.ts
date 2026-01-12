import { describe, it, expect } from 'vitest';
import { cn, getInitialIcon } from './utils';

describe('utils', () => {
  describe('cn (className merger)', () => {
    it('should merge class names', () => {
      const result = cn('class1', 'class2');
      expect(result).toBe('class1 class2');
    });

    it('should handle conditional classes', () => {
      const result = cn('base', true && 'conditional', false && 'excluded');
      expect(result).toBe('base conditional');
    });

    it('should merge Tailwind classes correctly', () => {
      const result = cn('p-4', 'p-8');
      // twMerge should keep only the last padding class
      expect(result).toBe('p-8');
    });

    it('should handle undefined and null values', () => {
      const result = cn('base', undefined, null, 'valid');
      expect(result).toBe('base valid');
    });

    it('should handle empty input', () => {
      const result = cn();
      expect(result).toBe('');
    });

    it('should merge complex Tailwind classes', () => {
      const result = cn('bg-red-500 text-white', 'bg-blue-500');
      // Should keep blue background and text white
      expect(result).toBe('text-white bg-blue-500');
    });
  });

  describe('getInitialIcon', () => {
    it('should return first letter uppercase', () => {
      expect(getInitialIcon('John')).toBe('J');
      expect(getInitialIcon('alice')).toBe('A');
    });

    it('should return music emoji for empty string', () => {
      expect(getInitialIcon('')).toBe('🎵');
    });

    it('should handle single character', () => {
      expect(getInitialIcon('x')).toBe('X');
    });

    it('should handle names with spaces', () => {
      expect(getInitialIcon('John Doe')).toBe('J');
    });

    it('should handle special characters', () => {
      expect(getInitialIcon('@user')).toBe('@');
    });

    it('should handle numbers', () => {
      expect(getInitialIcon('123')).toBe('1');
    });
  });
});
