import { Metadata } from '../../../percy/metadata/metadata.js';
import AppiumDriverMock from '../../mocks/appium/appium_driver.js';

describe('Metadata', () => {
  let driver;
  let metadata;

  const mockCaps = (opts) => {
    driver.getCapabilities = jasmine.createSpy().and.resolveTo(opts || {});
  };

  const meta = (opts) => {
    metadata = new Metadata(driver, opts);
  };

  beforeEach(async () => {
    driver = AppiumDriverMock();
    meta();
    mockCaps();
  });

  describe('caps', () => {
    it('returns session capabilities', async () => {
      mockCaps({ platformName: 'abc' });
      expect(await metadata.caps()).toEqual({ platformName: 'abc' });
    });
  });

  describe('osName', () => {
    it('returns session capabilities', async () => {
      mockCaps({ platformName: 'Android' });
      expect(await metadata.osName()).toEqual('Android');
    });
  });

  describe('osVersion', () => {
    it('returns major os version', async () => {
      mockCaps({ osVersion: '12.5' });
      expect(await metadata.osVersion()).toEqual('12');
    });

    it('returns major os version from platform caps', async () => {
      mockCaps({ platformVersion: '12.5' });
      expect(await metadata.osVersion()).toEqual('12');
    });

    it('returns major os version if both osVersion and platformVersion are present', async () => {
      mockCaps({ osVersion: '12.5', platformVersion: '13.7' }); // keeping different for test
      expect(await metadata.osVersion()).toEqual('12');
    });
  });

  describe('orientation', () => {
    describe('with orientation == auto', () => {
      it('gets orientation from driver', async () => {
        driver.getOrientation = jasmine.createSpy().and.resolveTo('some orientation');
        meta({ orientation: 'auto' });
        expect(await metadata.orientation()).toEqual('some orientation');
      });
    });

    describe('with orientation == portrait/landscape', () => {
      it('gets orientation from cache', async () => {
        meta({ orientation: 'portrait' });
        expect(await metadata.orientation()).toEqual('portrait');

        meta({ orientation: 'landscape' });
        expect(await metadata.orientation()).toEqual('landscape');
      });
    });

    describe('with orientation not passed', () => {
      it('gets orientation from caps', async () => {
        mockCaps({ deviceOrientation: 'LANDSCAPE' });
        expect(await metadata.orientation()).toEqual('landscape');
      });

      it('defaults to portrait if caps is empty', async () => {
        expect(await metadata.orientation()).toEqual('portrait');
      });
    });
  });

  describe('systemBars', () => {
    it('throws', async () => {
      await expectAsync(metadata.systemBars())
        .toBeRejectedWithError('Not implemented');
    });
  });

  describe('statusBarHeight', () => {
    const expectedStatusBarHeight = 100;
    describe('with statusBarHeight passed', () => {
      it('returns stored statusBarHeight', async () => {
        meta({ statusBarHeight: expectedStatusBarHeight });
        expect(await metadata.statusBarHeight()).toEqual(expectedStatusBarHeight);
      });
    });

    describe('with statusBarHeight not passed', () => {
      it('gets statusBarHeight from caps', async () => {
        mockCaps({ statBarHeight: expectedStatusBarHeight });
        expect(await metadata.statusBarHeight()).toEqual(expectedStatusBarHeight);
      });

      it('returns from systemBars otherwise', async () => {
        metadata.systemBars = () => { return { statusBarHeight: expectedStatusBarHeight }; };
        expect(await metadata.statusBarHeight()).toEqual(expectedStatusBarHeight);
      });
    });
  });

  describe('navigationBarHeight', () => {
    const expectedNavigationBarHeight = 100;
    describe('with navigationBarHeight passed', () => {
      it('returns stored navigationBarHeight', async () => {
        meta({ navigationBarHeight: expectedNavigationBarHeight });
        expect(await metadata.navigationBarHeight()).toEqual(expectedNavigationBarHeight);
      });
    });

    describe('with navigationBarHeight not passed', () => {
      it('gets navigationBarHeight from caps', async () => {
        mockCaps({ deviceScreenSize: '1080x1920', statBarHeight: 100, viewportRect: { height: 1620 } });
        expect(await metadata.navigationBarHeight()).toEqual(200);
      });

      it('returns from systemBars otherwise', async () => {
        metadata.systemBars = () => { return { navigationBarHeight: expectedNavigationBarHeight }; };
        expect(await metadata.navigationBarHeight()).toEqual(expectedNavigationBarHeight);
      });
    });
  });

  describe('screenSize', () => {
    it('returns width and height', async () => {
      mockCaps({ deviceScreenSize: '1080x1920' });
      const { width, height } = await metadata.screenSize();
      expect(width).toEqual(1080);
      expect(height).toEqual(1920);
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
        mockCaps({ desired: { deviceName: expectedDeviceName } });
        expect(await metadata.deviceName()).toEqual(expectedDeviceName);
      });

      it('defaults to device from caps if deviceName is null', async () => {
        mockCaps({ desired: { device: expectedDeviceName } });
        expect(await metadata.deviceName()).toEqual(expectedDeviceName);
      });
    });
  });
});
