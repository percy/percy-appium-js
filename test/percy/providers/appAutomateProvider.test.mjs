// Covering only not covered in index tests
import { AppAutomateProvider } from '../../../percy/providers/appAutomateProvider.js';
import { GenericProvider } from '../../../percy/providers/genericProvider.js';
import AppiumDriverMock from '../../mocks/appium/appium_driver.js';

describe('AppAutomateProvider', () => {
  let driver;
  let superScreenshotSpy;

  beforeEach(async () => {
    driver = AppiumDriverMock();
    superScreenshotSpy = spyOn(GenericProvider.prototype, 'screenshot');
  });

  describe('screenshot', () => {
    let getDeviceNameSpy;
    let getOsVersionSpy;
    let percyScreenshotBeginSpy;
    let percyScreenshotEndSpy;

    beforeEach(() => {
      getDeviceNameSpy = spyOn(AppAutomateProvider.prototype,
        'getDeviceName').and.returnValue('deviceName');
      getOsVersionSpy = spyOn(AppAutomateProvider.prototype,
        'getOsVersion').and.returnValue('osVersion');
      percyScreenshotBeginSpy = spyOn(AppAutomateProvider.prototype,
        'percyScreenshotBegin').and.returnValue(true);
      percyScreenshotEndSpy = spyOn(AppAutomateProvider.prototype,
        'percyScreenshotEnd').and.returnValue(true);
    });

    it('test call with default args', async () => {
      const appAutomate = new AppAutomateProvider(driver);

      superScreenshotSpy.and.resolveTo({ body: { link: 'link to screenshot' } });
      await appAutomate.screenshot('abc');

      expect(percyScreenshotBeginSpy).toHaveBeenCalledWith('abc');

      expect(getDeviceNameSpy.calls.count()).toEqual(1);
      expect(getOsVersionSpy.calls.count()).toEqual(1);

      expect(superScreenshotSpy).toHaveBeenCalledWith('abc', jasmine.any(Object));

      expect(percyScreenshotEndSpy).toHaveBeenCalledWith('abc', 'link to screenshot', 'undefined');
    });

    it('passes exception message to percyScreenshotEnd in case of exception', async () => {
      const appAutomate = new AppAutomateProvider(driver);
      const errorMessage = 'Some error occured';
      superScreenshotSpy.and.rejectWith(new Error(errorMessage));
      percyScreenshotEndSpy.and.rejectWith(new Error(errorMessage));

      await expectAsync(appAutomate.screenshot('abc')).toBeRejectedWithError(errorMessage);

      expect(percyScreenshotBeginSpy).toHaveBeenCalledWith('abc');

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
