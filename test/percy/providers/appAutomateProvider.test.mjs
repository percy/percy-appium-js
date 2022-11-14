// Covering only not covered in index tests
import { AppAutomateProvider } from '../../../percy/providers/appAutomateProvider.js';
import { GenericProvider } from '../../../percy/providers/genericProvider.js';
import AppiumDriverMock from '../../mocks/appium/appium_driver.js';

describe('AppAutomateProvider', () => {
  let driver;

  beforeEach(async () => {
    driver = AppiumDriverMock();
  });

  describe('screenshot', () => {
    it('test call with default args', async () => {
      const appAutomate = new AppAutomateProvider(driver);

      spyOn(GenericProvider.prototype, 'screenshot').and.resolveTo({});
      await appAutomate.screenshot('abc');
    });

    it('passes exception message to percyScreenshotEnd in case of exception', async () => {
      const appAutomate = new AppAutomateProvider(driver);
      const errorMessage = 'Some error occured';
      spyOn(GenericProvider.prototype, 'screenshot').and.rejectWith(new Error(errorMessage));
      const percyScreenshotEndSpy = spyOn(AppAutomateProvider.prototype,
        'percyScreenshotEnd').and.rejectWith(new Error(errorMessage));
      await expectAsync(appAutomate.screenshot('abc')).toBeRejectedWithError(errorMessage);
      expect(percyScreenshotEndSpy).toHaveBeenCalledWith(
        'abc', undefined, `Error: ${errorMessage}`);
    });
  });

  describe('percyScreenshotBegin', () => {
    it('supresses exception and does not throw', async () => {
      driver.execute = jasmine.createSpy().and.rejectWith(new Error('Random network error'));
      const appAutomate = new AppAutomateProvider(driver);
      await appAutomate.percyScreenshotBegin('abc');
    });
  });

  describe('percyScreenshotEnd', () => {
    it('supresses exception and does not throw', async () => {
      driver.execute = jasmine.createSpy().and.rejectWith(new Error('Random network error'));
      const appAutomate = new AppAutomateProvider(driver);
      await appAutomate.percyScreenshotEnd('abc', 'url');
    });

    it('marks status as failed if screenshot url is not present', async () => {
      driver.execute = jasmine.createSpy().and.rejectWith(new Error('Random network error'));
      const appAutomate = new AppAutomateProvider(driver);
      await appAutomate.percyScreenshotEnd('abc');

      expect(driver.execute).toHaveBeenCalledWith(jasmine.stringContaining('failure'));
    });
  });
});
