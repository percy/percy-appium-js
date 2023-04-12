import { IgnoreRegion } from './../../../percy/util/ignoreRegion.js';

describe('IgnoreRegion', () => {
  describe('constructor', () => {
    it('should create an IgnoreRegion object with valid parameters', () => {
      const top = 10;
      const bottom = 20;
      const left = 5;
      const right = 15;
      const ignoreRegion = new IgnoreRegion(top, bottom, left, right);
      expect(ignoreRegion.top).toBe(top);
      expect(ignoreRegion.bottom).toBe(bottom);
      expect(ignoreRegion.left).toBe(left);
      expect(ignoreRegion.right).toBe(right);
    });

    it('should throw an error for negative parameters', () => {
      expect(() => new IgnoreRegion(-10, 20, 5, 15)).toThrow();
      expect(() => new IgnoreRegion(10, 20, -5, 15)).toThrow();
      expect(() => new IgnoreRegion(10, -20, 5, 15)).toThrow();
      expect(() => new IgnoreRegion(10, 20, 5, -15)).toThrow();
    });

    it('should throw an error for invalid parameters', () => {
      expect(() => new IgnoreRegion(20, 10, 5, 15)).toThrow();
      expect(() => new IgnoreRegion(10, 20, 15, 5)).toThrow();
    });
  });

  describe('isValid', () => {
    it('should return true for valid ignore region', () => {
      const ignoreRegion = new IgnoreRegion(10, 20, 5, 15);
      expect(ignoreRegion.isValid(30, 30)).toBe(true);
    });

    it('should return false for invalid ignore region', () => {
      const ignoreRegion1 = new IgnoreRegion(10, 40, 5, 15);
      expect(ignoreRegion1.isValid(30, 30)).toBe(false);

      const ignoreRegion2 = new IgnoreRegion(10, 20, 5, 35);
      expect(ignoreRegion2.isValid(30, 30)).toBe(false);

      const ignoreRegion3 = new IgnoreRegion(10, 40, 5, 15);
      expect(ignoreRegion3.isValid(30, 30)).toBe(false);

      const ignoreRegion4 = new IgnoreRegion(10, 20, 5, 40);
      expect(ignoreRegion4.isValid(30, 30)).toBe(false);
    });
  });
});
