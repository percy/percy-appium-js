// Covering only not covered in index tests
import { MetadataResolver } from '../../../percy/metadata/metadataResolver.js';
import AppiumDriverMock from '../../mocks/appium/appium_driver.js';

describe('MetadataResolver', () => {
  let driver;

  beforeEach(async () => {
    driver = AppiumDriverMock();
  });

  describe('resolve', () => {
    it('throws if unknown driver', async () => {
      driver.getCapabilities = jasmine.createSpy().and.resolveTo({ platformName: 'Unsupported platform' });
      await expectAsync(MetadataResolver.resolve(driver)).toBeRejectedWithError('Unknown platform');
    });
  });
});
