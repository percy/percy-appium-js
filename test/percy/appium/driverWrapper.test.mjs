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

      expect(await driver.getPercyOptions()).toEqual({ enabled: true, raiseErrors: false });
    });

    it('returns options from percy.* caps', async () => {
      const driver = new AppiumDriver(wdDriver());

      // Mocking case where there are percy.enabled or percy.raiseErrors
      // Note: here we are mocking function from AppiumDriver instead of giving
      // correct data in underlying wd driver
      driver.getCapabilities = jasmine.createSpy().and.resolveTo(
        { 'percy.enabled': true, 'percy.raiseErrors': true }
      );

      expect(await driver.getPercyOptions()).toEqual({ enabled: true, raiseErrors: true });
    });

    it('returns options from percy:options caps', async () => {
      const driver = new AppiumDriver(wdDriver());

      expect(await driver.getPercyOptions()).toEqual({ enabled: true, raiseErrors: true });
    });
  });
});
