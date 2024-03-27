import helpers from '@percy/sdk-utils/test/helpers';
import percyScreenshot from '../index.js';
import wdDriver from './mocks/appium/wd_driver.js';
import wdioDriver from './mocks/appium/wdio_driver.js';
import { Cache } from '../percy/util/cache.js';
import utils from '@percy/sdk-utils';
import percyOnAutomate from '../percy/percyOnAutomate.js';
import postFailedEvents from '../percy/util/postFailedEvents.js';

describe('percyScreenshot', () => {
  let driver;

  beforeEach(async () => {
    await helpers.setupTest();
    Cache.reset();
    utils.percy.build = {
      id: '123',
      url: 'https://percy.io/test/test/123'
    };
    utils.percy.type = 'app-percy';
  });

  describe('common', () => {
    beforeEach(() => {
      driver = wdDriver();
    });

    it('throws an error when a driver is not provided', async () => {
      spyOn(postFailedEvents, 'request').and.callFake(() => {});
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
          spyOn(postFailedEvents, 'request').and.callFake(() => {});
          driver.takeScreenshot = jasmine.createSpy().and.throwError(new Error('Screenshot failed'));
          await expectAsync(percyScreenshot(driver, 'Screenshot 1'))
            .toBeRejectedWithError('Screenshot failed');
        });
      });

      describe('with percy:options.ignoreErrors true', () => {
        it('logs errors if any', async () => {
          driver = wdDriver({ ignoreErrors: true });
          spyOn(postFailedEvents, 'request').and.callFake(() => {});
          driver.takeScreenshot = jasmine.createSpy().and.throwError(new Error('Screenshot failed'));

          await percyScreenshot(driver, 'Screenshot 1');
        });
      });
    });
  });

  describe('wdio standalone context', () => {
    describe('with browser not defined', () => {
      it('throws an error when a driver is not provided', async () => {
        spyOn(postFailedEvents, 'request').and.callFake(() => {});
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

      it('tests consider elments works', async () => {
        driver = driverFunc({ enabled: true });
        let considerRegionXpaths = ['someXpath'];
        await percyScreenshot(driver, 'Screenshot 1', { considerRegionXpaths });

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

      it('should call POA percyScreenshot', async () => {
        const driver = driverFunc({ enabled: true });
        spyOn(percyScreenshot, 'isPercyEnabled').and.returnValue(Promise.resolve(true))
        utils.percy.type = 'automate';
        const mockresponse = {};
        spyOn(percyOnAutomate, 'request').and.callFake(() => mockresponse);

        const response = await percyScreenshot(driver, 'Screenshot 1');
        expect(percyOnAutomate.request).toHaveBeenCalledWith(jasmine.objectContaining({
          sessionId: 'sessionID', commandExecutorUrl: 'https://localhost/wd/hub', snapshotName: 'Screenshot 1'
        }));

        expect(response).toEqual(undefined);
      });

      it('should call POA percyScreenshot with ignoreRegion and considerRegion', async () => {
        const element = { value: '123', elementId: '123' };
        const element2 = { value: '456', elementId: '456' };
        const driver = driverFunc({ enabled: true });
        spyOn(percyScreenshot, 'isPercyEnabled').and.returnValue(Promise.resolve(true))
        utils.percy.type = 'automate';
        spyOn(percyOnAutomate, 'request').and.callFake(() => {});

        await percyScreenshot(driver, 'Screenshot 2', {
          ignore_region_appium_elements: [element], consider_region_appium_elements: [element], testCase: 'test-case-1', thTestCaseExecutionId: 'ID123'
        });
        expect(percyOnAutomate.request).toHaveBeenCalledWith(jasmine.objectContaining({
          sessionId: 'sessionID',
          commandExecutorUrl: 'https://localhost/wd/hub',
          snapshotName: 'Screenshot 2',
          options: {
            ignore_region_elements: ['123'],
            consider_region_elements: ['123'],
            testCase: 'test-case-1',
            thTestCaseExecutionId: 'ID123'
          }
        }));

        await percyScreenshot(driver, 'Screenshot 3', {
          ignoreRegionAppiumElements: [element2], considerRegionAppiumElements: [element2], testCase: 'test-case-2', thTestCaseExecutionId: 'ID123'
        });
        expect(percyOnAutomate.request).toHaveBeenCalledWith(jasmine.objectContaining({
          sessionId: 'sessionID',
          commandExecutorUrl: 'https://localhost/wd/hub',
          snapshotName: 'Screenshot 3',
          options: {
            ignore_region_elements: ['456'],
            consider_region_elements: ['456'],
            testCase: 'test-case-2',
            thTestCaseExecutionId: 'ID123'
          }
        }));
      });

      it('should return CLI response', async() => {
        const mockResponse = {
          success: true,
          body: { data: { name: 'test_snapshot', some_data: 'some_data', some_obj: { some_obj: 'some_obj' }}}
        }
        const driver = driverFunc({ enabled: true });
        spyOn(percyScreenshot, 'isPercyEnabled').and.returnValue(Promise.resolve(true))
        utils.percy.type = 'automate';

        spyOn(percyOnAutomate, 'request').and.callFake(() => mockResponse);
        const response = await percyScreenshot(driver, 'Screenshot 1', { sync: true })
        expect(response).toEqual(mockResponse.body.data)
      })

      it('should handle error POA', async () => {
        const driver = driverFunc({ enabled: true, ignoreErrors: false });
        spyOn(percyScreenshot, 'isPercyEnabled').and.returnValue(Promise.resolve(true))
        utils.percy.type = 'automate';
        spyOn(percyOnAutomate, 'request').and.returnValue(Promise.reject(new Error('Not found 404')));
        let error = null;
        try {
          await percyScreenshot(driver, 'Screenshot 2');
        } catch (e) {
          error = e;
        }
        expect(error).not.toEqual(null);
      });

      it('should handle error POA ignoreError false', async () => {
        const driver = driverFunc({ enabled: true, ignoreErrors: true });
        spyOn(percyScreenshot, 'isPercyEnabled').and.returnValue(Promise.resolve(true))
        utils.percy.type = 'automate';
        spyOn(percyOnAutomate, 'request').and.returnValue(Promise.reject(new Error('Not found 404')));
        let error = null;
        try {
          await percyScreenshot(driver, 'Screenshot 3');
        } catch (e) {
          error = e;
        }
        expect(error).toEqual(null);
      });
    });
  };
});
