import {
  extractStatusBarHeight,
  extractNavigationBarHeight
} from './../../../percy/util/util.js';

describe('Utils', () => {
  describe('extractStatusBarHeight', () => {
    it('should extract height from ITYPE_STATUS_BAR pattern', () => {
      const input = 'ITYPE_STATUS_BAR frame=[0,0][1080,80]';
      const result = extractStatusBarHeight(input);
      expect(result).toEqual(80);
    });

    it('should extract height from statusBars pattern (Android 14)', () => {
      const input = 'statusBars frame=[0,0][1080,100]';
      const result = extractStatusBarHeight(input);
      expect(result).toEqual(100);
    });

    it('should return null when no match is found', () => {
      const input = 'no status bar data here';
      const result = extractStatusBarHeight(input);
      expect(result).toEqual(null);
    });

    it('should catch and log exceptions', () => {
      const result = extractStatusBarHeight(null); // Will cause an error
      expect(result).toEqual(null);
    });
  });

  describe('extractNavigationBarHeight', () => {
    it('should extract height from ITYPE_NAVIGATION_BAR pattern', () => {
      const input = 'ITYPE_NAVIGATION_BAR frame=[0,1900][1080,1920]';
      const result = extractNavigationBarHeight(input);
      expect(result).toEqual(20);
    });

    it('should extract height from navigationBars pattern (Android 14)', () => {
      const input = 'navigationBars frame=[0,1800][1080,1850]';
      const result = extractNavigationBarHeight(input);
      expect(result).toEqual(50);
    });

    it('should return null when no match is found', () => {
      const input = 'no nav bar data here';
      const result = extractNavigationBarHeight(input);
      expect(result).toEqual(null);
    });

    it('should catch and log exceptions', () => {
      const result = extractNavigationBarHeight(undefined); // Will cause an error
      expect(result).toEqual(null);
    });
  });
});
