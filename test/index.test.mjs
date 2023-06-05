import helpers from '@percy/sdk-utils/test/helpers';
import percyScreenshot from '../index.js';
import wdDriver from './mocks/appium/wd_driver.js';
import wdioDriver from './mocks/appium/wdio_driver.js';
import { Cache } from '../percy/util/cache.js';
import utils from '@percy/sdk-utils';

describe('percyScreenshot', () => {
  let driver;

  beforeEach(async () => {
    await helpers.setupTest();
    Cache.reset();
    utils.percy.build = {
      id: '123',
      url: 'https://percy.io/test/test/123'
    }
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

    it('prints warning if fullPage: true is used on generic provider and doesnt throw', async () => {
      await percyScreenshot(driver, 'Screenshot 1', { fullPage: true });
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

              if (appAutomate) {
                it('posts full page screenshot to the local percy server', async () => {
                  driver = driverFunc({ platform, appAutomate });

                  await percyScreenshot(driver, 'Screenshot 1', { fullPage: true });
                  await percyScreenshot(driver, 'Screenshot 2', { fullPage: true });

                  expect(await helpers.get('logs')).toEqual(jasmine.arrayContaining([
                    'Snapshot found: Screenshot 1',
                    'Snapshot found: Screenshot 2'
                  ]));
                });

                describe('with failed screenshot call', () => {
                  beforeEach(() => {
                    driver = driverFunc({ platform, appAutomate, failScreenshot: true });
                  });

                  it('does not post screenshot to local percy server', async () => {
                    let error = null;
                    try {
                      await percyScreenshot(driver, 'Screenshot 1', { fullPage: true });
                    } catch (e) {
                      error = e;
                    }

                    expect(error).not.toEqual(null);
                    expect(await helpers.get('logs')).not.toEqual(jasmine.arrayContaining([
                      'Snapshot found: Screenshot 1'
                    ]));
                  });
                });

                describe('with failed percyScreenshotBegin call', () => {
                  beforeEach(() => {
                    driver = driverFunc({ platform, appAutomate, failedBeginCall: true });
                  });

                  it('does not throw', async () => {
                    await percyScreenshot(driver, 'Screenshot 1', { fullPage: true });

                    expect(await helpers.get('logs')).toEqual(jasmine.arrayContaining([
                      'Snapshot found: Screenshot 1'
                    ]));
                  });
                });
              }
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

      it('tests ignore elments works', async () => {
        driver = driverFunc({ enabled: true });
        let ignoreRegionXpaths = ['someXpath'];
        await percyScreenshot(driver, 'Screenshot 1', { ignoreRegionXpaths });

        expect(await helpers.get('logs')).toEqual(jasmine.arrayContaining([
          'Snapshot found: Screenshot 1'
        ]));
        if (driverType === 'wd driver') {
          expect(driver.elementByXPath).toHaveBeenCalledWith('someXpath');
          expect(driver.elementByAccessibilityId).not.toHaveBeenCalled();
        } else {
          expect(driver.$).toHaveBeenCalledWith('someXpath');
          expect(driver.$).not.toHaveBeenCalledWith('~someXpath');
        }
      });
    });
  };
});
