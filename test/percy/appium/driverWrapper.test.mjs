// Covering only not covered in index tests
import { AppiumDriver } from '../../../percy/driver/driverWrapper.js';
import wdDriver from '../../mocks/appium/wd_driver.js';

describe('AppiumDriver', () => {
  describe('getPercyOptions', () => {
    it('returns default options if no options are provided', async () => {
      const driver = new AppiumDriver(wdDriver());

      // Mocking case where no percy:options in caps
      // Note: here we are mocking function from AppiumDriver instead of giving
      // correct data in underlying wd driver
      driver.getCapabilities = jasmine.createSpy().and.resolveTo({});

      expect(await driver.getPercyOptions()).toEqual({ enabled: true, ignoreErrors: true });
    });

    it('returns options from percy.* caps', async () => {
      const driver = new AppiumDriver(wdDriver());

      // Mocking case where there are percy.enabled or percy.ignoreErrors
      // Note: here we are mocking function from AppiumDriver instead of giving
      // correct data in underlying wd driver
      driver.getCapabilities = jasmine.createSpy().and.resolveTo(
        { 'percy.enabled': true, 'percy.ignoreErrors': false }
      );

      expect(await driver.getPercyOptions()).toEqual({ enabled: true, ignoreErrors: false });
    });

    it('returns default options from percy:options caps', async () => {
      const driver = new AppiumDriver(wdDriver());

      expect(await driver.getPercyOptions()).toEqual({ enabled: true, ignoreErrors: false });
    });

    it('returns options from percyOptions caps', async () => {
      const driver = new AppiumDriver(wdDriver());
      // Mocking case where there are percyOptions
      // Note: here we are mocking function from AppiumDriver instead of giving
      // correct data in underlying wd driver
      driver.getCapabilities = jasmine.createSpy().and.resolveTo(
        {'percyOptions': {
          enabled: false,
          ignoreErrors: true
        }}
      );
      expect(await driver.getPercyOptions()).toEqual({ enabled: false, ignoreErrors: true });
    });
  });
});
