import { AndroidMetadata } from '../../../percy/metadata/androidMetadata.js';
import AppiumDriverMock from '../../mocks/appium/appium_driver.js';

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
  });

  describe('systemBars', () => {
    it('returns from appium systemBars', async () => {
      const expectedData = { some: 'data' };
      driver.getSystemBars = jasmine.createSpy().and.resolveTo(expectedData);
      expect(await metadata.systemBars()).toEqual(expectedData);
    });
  });
});
