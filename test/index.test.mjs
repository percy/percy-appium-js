import helpers from '@percy/sdk-utils/test/helpers';
import percyScreenshot from '../index.js';
import wdDriver from './mocks/appium/wd_driver.js';
import wdioDriver from './mocks/appium/wdio_driver.js';
import { Cache } from '../percy/util/cache.js';

describe('percyScreenshot', () => {
  let driver;

  beforeEach(async () => {
    await helpers.setupTest();
    Cache.reset();
  });

  describe('common', () => {
    beforeEach(() => {
      driver = wdDriver();
    });

    it('throws an error when a driver is not provided', async () => {
      await expectAsync(percyScreenshot())
        .toBeRejectedWithError('The WebdriverIO `browser` object or wd `driver` object is required.');
    });

    it('throws an error when a name is not provided', async () => {
      await expectAsync(percyScreenshot(driver))
        .toBeRejectedWithError('The `name` argument is required.');
    });

    it('disables screenshots when the healthcheck fails', async () => {
      await helpers.test('error', '/percy/healthcheck');

      await percyScreenshot(driver, 'Screenshot 1');
      await percyScreenshot(driver, 'Screenshot 2');

      expect(helpers.logger.stdout).toEqual(jasmine.arrayContaining([
        '[percy] Percy is not running, disabling snapshots'
      ]));
    });

    it('logs errors if any', async () => {
      driver.takeScreenshot = jasmine.createSpy().and.throwError(new Error('Screenshot failed'));

      await expectAsync(percyScreenshot(driver, 'Screenshot 1'))
        .toBeRejectedWithError('Screenshot failed');
    });
  });

  for (const [driverType, driverFunc] of [['wd driver', wdDriver], ['wdio driver', wdioDriver]]) {
    describe(`with ${driverType}`, () => {
      for (const appAutomate of [true, false]) {
        describe(`with app automate ${appAutomate}`, () => {
          for (const platform of ['Android', 'iOS']) {
            describe(`with platform ${platform}`, () => {
              it('posts screenshots to the local percy server', async () => {
                driver = driverFunc({ platform, appAutomate });

                await percyScreenshot(driver, 'Screenshot 1');
                await percyScreenshot(driver, 'Screenshot 2');

                expect(await helpers.get('logs')).toEqual(jasmine.arrayContaining([
                  'Snapshot found: Screenshot 1',
                  'Snapshot found: Screenshot 2'
                ]));
              });
            });
          }
        });

        it('tests', async () => {
          try {
            driver = driverFunc();
            await percyScreenshot(driver, 'abc');
          } catch (e) {
            console.log(e);
            console.log(e.stack);
          }
        });
      }

      it('disables screenshots if percy:options.enabled is false', async () => {
        driver = driverFunc({ enabled: false });

        await percyScreenshot(driver, 'Screenshot 1');

        // logs from cli will be empty as we will not post screenshot to it
        expect(await helpers.get('logs')).toEqual([]);
      });
    });
  };
});
