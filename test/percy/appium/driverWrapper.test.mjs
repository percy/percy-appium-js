// Covering only not covered in index tests
import { AppiumDriver } from '../../../percy/driver/driverWrapper.js';
import wdDriver from '../../mocks/appium/wd_driver.js';
import wdioDriver from '../../mocks/appium/wdio_driver.js';

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
        {
          percyOptions: {
            enabled: false,
            ignoreErrors: true
          }
        }
      );
      expect(await driver.getPercyOptions()).toEqual({ enabled: false, ignoreErrors: true });
    });

    it('should return correct element location by XPath for wd driver', async () => {
      const driver = new AppiumDriver(wdDriver());
      const xpath = '//div[@class="example"]';
      const element = await driver.elementByXPath(xpath);
      expect(element.getLocation()).toEqual({ x: 10, y: 20 });
      expect(element.getSize()).toEqual({ width: 100, height: 200 });
    });

    it('should return an element by id for wd driver', async () => {
      const driver = new AppiumDriver(wdDriver());
      const id = 'some id';
      const element = await driver.elementByAccessibilityId(id);
      expect(element.getLocation()).toEqual({ x: 10, y: 20 });
      expect(element.getSize()).toEqual({ width: 100, height: 200 });
    });

    it('should return correct element location by XPath for wdio driver', async () => {
      const driver = new AppiumDriver(wdioDriver());
      const xpath = '//div[@class="example"]';
      const element = await driver.elementByXPath(xpath);
      expect(element.getLocation()).toEqual({ x: 10, y: 20 });
      expect(element.getSize()).toEqual({ width: 100, height: 200 });
    });

    it('should return correct element location by id for wdio driver', async () => {
      const driver = new AppiumDriver(wdioDriver());
      const id = 'id';
      const element = await driver.elementByAccessibilityId(id);
      expect(element.getLocation()).toEqual({ x: 10, y: 20 });
      expect(element.getSize()).toEqual({ width: 100, height: 200 });
    });
  });
});
