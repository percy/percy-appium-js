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
    let percyScreenshotBeginSpy;
    let percyScreenshotEndSpy;

    beforeEach(() => {
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

  describe('browserstackExecutor', () => {
    it('only sends action when no arguments are provided', async () => {
      const appAutomate = new AppAutomateProvider(driver);
      await appAutomate.browserstackExecutor('action');

      expect(driver.execute).toHaveBeenCalledWith(jasmine.stringContaining('action'));
    });

    it('uses arguments when provided', async () => {
      const appAutomate = new AppAutomateProvider(driver);
      await appAutomate.browserstackExecutor('action', { arg: 'arg1' });

      expect(driver.execute).toHaveBeenCalledWith(jasmine.stringContaining('arguments'));
    });
  });

  describe('setDebugUrl', () => {
    const expectedBrowserUrl = 'https://app-automate.browserstack.com/dashboard/v2/builds/abc/sessions/def';

    it('returns url', async () => {
      const appAutomate = new AppAutomateProvider(driver);
      await appAutomate.setDebugUrl({ buildHash: 'abc', sessionHash: 'def' });
      expect(appAutomate.debugUrl).toEqual(expectedBrowserUrl);
    });

    it('returns null if passed result was null', async () => {
      const appAutomate = new AppAutomateProvider(driver);
      await appAutomate.setDebugUrl(null);
      expect(appAutomate.debugUrl).toEqual(null);
    });
  });

  describe('getTiles', () => {

    it('when env isDisableRemoteUpload is true', async () => {
      const appAutomate = new AppAutomateProvider(driver);
      spyOn(AppAutomateProvider.prototype, 'isDisableRemoteUpload')
                            .and.returnValue('true');
      let superGetTilesSpy = spyOn(GenericProvider.prototype, 'getTiles');
      superGetTilesSpy.and.resolveTo([])
                            
      await appAutomate.getTiles(true, false, null, null, null);
      expect(superGetTilesSpy).toHaveBeenCalledWith(true, false, null);
    });

    it('when env isPercyDev is true', async () => {
      const appAutomate = new AppAutomateProvider(driver);
      spyOn(AppAutomateProvider.prototype, 'isPercyDev')
                            .and.returnValue('true');
      let superGetTilesSpy = spyOn(GenericProvider.prototype, 'getTiles');
      let browserstack_executorSpy = spyOn(AppAutomateProvider.prototype, 'browserstackExecutor');
      superGetTilesSpy.and.resolveTo([])
      let response = {
        success: true,
        result: JSON.stringify([{header_height: 100, footer_height: 200, sha: "abc"}])
      };
      browserstack_executorSpy.and.resolveTo(response);
      var screenSize = {
        height: 2000,
      }
      appAutomate.metadata = { statusBarHeight: () => 100, navigationBarHeight: () => 200, scaleFactor: () => 1, screenSize: () => screenSize };
                            
      await appAutomate.getTiles(true, false, null, null, null);
      expect(browserstack_executorSpy).toHaveBeenCalledWith('percyScreenshot', jasmine.any(Object));
    });

  });
});
