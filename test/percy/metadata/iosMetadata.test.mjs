import { IosMetadata } from '../../../percy/metadata/iosMetadata.js';
import AppiumDriverMock from '../../mocks/appium/appium_driver.js';

describe('Metadata', () => {
  let driver;
  let metadata;

  const mockCaps = (opts) => {
    driver.getCapabilities = jasmine.createSpy().and.resolveTo(opts || {});
  };

  const meta = (opts) => {
    metadata = new IosMetadata(driver, opts || {});
  };

  beforeEach(async () => {
    driver = AppiumDriverMock();
    meta();
    mockCaps();
  });

  describe('statusBarHeight', () => {
    const expectedStatusBarHeight = 40;
    const pixelRatio = 2;
    const statBarHeight = 20;

    describe('with statusBarHeight passed', () => {
      it('returns stored statusBarHeight', async () => {
        meta({ statusBarHeight: expectedStatusBarHeight });
        expect(await metadata.statusBarHeight()).toEqual(expectedStatusBarHeight);
      });
    });

    describe('with statusBarHeight not passed', () => {
      it('returns statusBarHeight from caps', async () => {
        meta({ deviceName: 'not in config device' });
        mockCaps({ statBarHeight, pixelRatio });
        expect(await metadata.statusBarHeight()).toEqual(expectedStatusBarHeight);
      });

      it('returns from config if available in config', async () => {
        meta({ deviceName: 'iPad Pro 12.9' });
        expect(await metadata.statusBarHeight()).toEqual(expectedStatusBarHeight);
      });

      it('returns 1 otherwise', async () => {
        meta({ deviceName: 'not in config device' });
        expect(await metadata.statusBarHeight()).toEqual(1);
      });
    });
  });

  describe('navigationBarHeight', () => {
    const expectedNavigationBarHeight = 10;
    describe('with navigationBarHeight passed', () => {
      it('returns stored navigationBarHeight', async () => {
        meta({ navigationBarHeight: expectedNavigationBarHeight });
        expect(await metadata.navigationBarHeight()).toEqual(expectedNavigationBarHeight);
      });
    });

    describe('with navigationBarHeight not passed', () => {
      it('returns 0', async () => {
        expect(await metadata.navigationBarHeight()).toEqual(0);
      });
    });
  });

  describe('screenSize', () => {
    const pixelRatio = 2;
    const statBarHeight = 20;
    const viewPortHeight = 1500;
    const viewPortWidth = 900;

    it('returns from static data if exists', async () => {
      meta({ deviceName: 'iPad Pro 12.9' });
      const { width, height } = await metadata.screenSize();
      expect(width).toEqual(1536);
      expect(height).toEqual(2048);
    });

    it('returns calculated screen width and height', async () => {
      mockCaps({
        pixelRatio,
        statBarHeight,
        viewportRect: { height: viewPortHeight, width: viewPortWidth }
      });
      meta({ deviceName: 'unknown with correct caps' });
      const { width, height } = await metadata.screenSize();
      expect(width).toEqual(viewPortWidth);
      expect(height).toEqual(viewPortHeight + statBarHeight * pixelRatio);
    });
  });

  describe('deviceName', () => {
    const expectedDeviceName = 'abc';
    describe('with deviceName passed', () => {
      it('gets from cache', async () => {
        meta({ deviceName: expectedDeviceName });
        expect(await metadata.deviceName()).toEqual(expectedDeviceName);
      });
    });

    describe('with deviceName not passed', () => {
      it('gets deviceName from caps', async () => {
        mockCaps({ deviceName: expectedDeviceName });
        expect(await metadata.deviceName()).toEqual(expectedDeviceName);
      });

      it('defaults to device from caps if deviceName is null', async () => {
        mockCaps({ device: expectedDeviceName });
        expect(await metadata.deviceName()).toEqual(expectedDeviceName);
      });
    });
  });

  describe('scaleFactor', () => {
    const expectedScaleFactor = 1.5;

    it('returns from pixelRatio field', async () => {
      mockCaps({
        pixelRatio: expectedScaleFactor,
      });
      expect(await metadata.scaleFactor()).toEqual(expectedScaleFactor);
    });
  });
});
