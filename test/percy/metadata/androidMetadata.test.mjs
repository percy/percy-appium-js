import { AndroidMetadata } from '../../../percy/metadata/androidMetadata.js';
import AppiumDriverMock from '../../mocks/appium/appium_driver.js';
import { Cache } from '../../../percy/util/cache.js';

describe('AndroidMetadata', () => {
  let driver;
  let metadata;

  const mockCaps = (opts) => {
    driver.getCapabilities = jasmine.createSpy().and.resolveTo(opts || {});
  };

  const meta = (opts) => {
    metadata = new AndroidMetadata(driver, opts || {});
  };

  beforeEach(async () => {
    driver = AppiumDriverMock();
    meta();
    mockCaps();
    Cache.reset();
  });

  describe('systemBars', () => {
    it('returns from appium systemBars', async () => {
      const expectedData = { some: 'data' };
      driver.getSystemBars = jasmine.createSpy().and.resolveTo(expectedData);
      expect(await metadata.systemBars()).toEqual(expectedData);
    });
  });

  describe('statusBarHeight', () => {
    it('returns from sys dump', async () => {
      const input = 'ITYPE_STATUS_BAR frame=[0,0][1080,80]';
      driver.execute = jasmine.createSpy().and.returnValue(input);
      expect(await metadata.statusBarHeight()).toEqual(80);
    });

    it('returns user input status bar', async () => {
      metadata._statusBarHeight = 20;
      expect(await metadata.statusBarHeight()).toEqual(20);
    });
  });

  describe('navigationBarHeight', () => {
    it('returns from sys dump', async () => {
      const input = 'ITYPE_NAVIGATION_BAR frame=[0,1900][1080,1920]';
      driver.execute = jasmine.createSpy().and.returnValue(input);
      expect(await metadata.navigationBarHeight()).toEqual(20);
    });

    it('returns user input navigation bar', async () => {
      metadata._navigationBarHeight = 30;
      expect(await metadata.navigationBarHeight()).toEqual(30);
    });
  });
});
