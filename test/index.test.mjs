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

    describe('errors', () => {
      describe('with percy:options.ignoreErrors false', () => {
        it('logs errors if any', async () => {
          driver.takeScreenshot = jasmine.createSpy().and.throwError(new Error('Screenshot failed'));

          await expectAsync(percyScreenshot(driver, 'Screenshot 1'))
            .toBeRejectedWithError('Screenshot failed');
        });
      });

      describe('with percy:options.ignoreErrors true', () => {
        it('logs errors if any', async () => {
          driver = wdDriver({ ignoreErrors: true });
          driver.takeScreenshot = jasmine.createSpy().and.throwError(new Error('Screenshot failed'));

          await percyScreenshot(driver, 'Screenshot 1');
        });
      });
    });
  });

  describe('wdio standalone context', () => {
    describe('with browser not defined', () => {
      it('throws an error when a driver is not provided', async () => {
        await expectAsync(percyScreenshot('Screenshot 1'))
          .toBeRejectedWithError('The WebdriverIO `browser` object or wd `driver` object is required.');
      });
    });

    // Currently unable to declare browser that would be accessible inside percyScreenshot function
    // TODO: Fix me
    // describe('with browser defined', () => {
    //   beforeEach(() => {
    //     // browser = wdioDriver();
    //   });

    //   it('uses browser from context when browser is defined', async () => {
    //     await percyScreenshot('Screenshot 1');

    //     expect(await helpers.get('logs')).toEqual(jasmine.arrayContaining([
    //       'Snapshot found: Screenshot 1'
    //     ]));
    //   });

    //   it('uses name arg as options when driver is a string in wdio context', async () => {
    //     await percyScreenshot('Screenshot 1', { fullscreen: true });

    //     expect(await helpers.get('logs')).toEqual(jasmine.arrayContaining([
    //       'Snapshot found: Screenshot 1'
    //     ]));
    //   });
    // });
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

      it('gets orientation from driver if orientation is auto', async () => {
        driver = driverFunc({ enabled: true });

        await percyScreenshot(driver, 'Screenshot 1', { orientation: 'auto' });

        expect(await helpers.get('logs')).toEqual(jasmine.arrayContaining([
          'Snapshot found: Screenshot 1'
        ]));
      });
    });
  };
});
