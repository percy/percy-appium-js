// Covering only not covered in index tests
import { GenericProvider } from '../../../percy/providers/genericProvider.js';
import AppiumDriverMock from '../../mocks/appium/appium_driver.js';
import { Region } from '../../../percy/util/region.js';

describe('GenericProvider', () => {
  let driver;
  let provider;

  beforeEach(async () => {
    driver = AppiumDriverMock();
    provider = new GenericProvider(driver);
  });

  describe('tempFile', () => {
    describe('with PERCY_TMP_DIR', () => {
      beforeAll(() => {
        if (['linux', 'darwin'].includes(process.platform)) {
          process.env.PERCY_TMP_DIR = '/tmp/percy-app-test';
        } else if (process.platform === 'win32') {
          process.env.PERCY_TMP_DIR = 'C:\\percy-app-test';
        }
      });

      afterAll(() => {
        delete process.env.PERCY_TMP_DIR;
      });

      it('creates tmp file in the specified directory', async () => {
        const path = await provider.tempFile();
        expect(path.startsWith(process.env.PERCY_TMP_DIR));
      });
    });
  });

  describe('getTiles', () => {
    describe('with fullPage on generic provider', () => {
      beforeEach(() => {
        // mock metadata
        provider.metadata = { statusBarHeight: () => 1, navigationBarHeight: () => 1 };
      });

      it('defaults to single page screenshot', async () => {
        const tiles = await provider.getTiles(true, true);
        expect(tiles.length).toEqual(1);
      });
    });
  });

  describe('getRegionObject', () => {
    beforeEach(() => {
      // mock metadata
      provider.metadata = { scaleFactor: () => 1 };
    });

    it('should return a JSON object with the correct selector and coordinates', async () => {
      // Mock element data
      const mockLocation = { x: 10, y: 20 };
      const mockSize = { width: 100, height: 200 };
      const mockElement = {
        getLocation: jasmine.createSpy().and.returnValue(mockLocation),
        getSize: jasmine.createSpy().and.returnValue(mockSize)
      };

      // Call function with mock data
      const selector = 'mock-selector';
      const result = await provider.getRegionObject(selector, mockElement);

      // Assert expected result
      expect(result.selector).toEqual(selector);
      expect(result.coOrdinates).toEqual({
        top: mockLocation.y,
        bottom: mockLocation.y + mockSize.height,
        left: mockLocation.x,
        right: mockLocation.x + mockSize.width
      });

      // Assert element methods were called
      expect(mockElement.getLocation).toHaveBeenCalled();
      expect(mockElement.getSize).toHaveBeenCalled();
    });
  });

  describe('getRegionsByXpath', () => {
    let getRegionObjectSpy;

    beforeEach(() => {
      driver = {
        elementByXPath: jasmine.createSpy('elementByXPath').and.resolveTo({})
      };
      getRegionObjectSpy = spyOn(provider, 'getRegionObject').and.resolveTo({});
    });

    it('should get regions for each xpath', async () => {
      const elementsArray = [];
      const xpaths = ['/xpath/1', '/xpath/2', '/xpath/3'];

      await provider.getRegionsByXpath.call({ driver, getRegionObject: getRegionObjectSpy }, elementsArray, xpaths);

      expect(driver.elementByXPath).toHaveBeenCalledTimes(3);
      expect(getRegionObjectSpy).toHaveBeenCalledTimes(3);
      expect(elementsArray).toEqual([{}, {}, {}]);
    });

    it('should ignore xpath when element is not found', async () => {
      driver.elementByXPath.and.rejectWith(new Error('Element not found'));
      const elementsArray = [];
      const xpaths = ['/xpath/1', '/xpath/2', '/xpath/3'];

      await provider.getRegionsByXpath.call({ driver, getRegionObject: getRegionObjectSpy }, elementsArray, xpaths);

      expect(driver.elementByXPath).toHaveBeenCalledTimes(3);
      expect(getRegionObjectSpy).not.toHaveBeenCalled();
      expect(elementsArray).toEqual([]);
    });
  });

  describe('getRegionsByIds', () => {
    let getRegionObjectSpy;

    beforeEach(() => {
      driver = {
        elementByAccessibilityId: jasmine.createSpy('elementByAccessibilityId').and.resolveTo({})
      };
      getRegionObjectSpy = spyOn(provider, 'getRegionObject').and.resolveTo({});
    });

    it('should get regions for each id', async () => {
      const elementsArray = [];
      const ids = ['id1', 'id2', 'id3'];

      await provider.getRegionsByIds.call({ driver, getRegionObject: getRegionObjectSpy }, elementsArray, ids);

      expect(driver.elementByAccessibilityId).toHaveBeenCalledTimes(3);
      expect(getRegionObjectSpy).toHaveBeenCalledTimes(3);
      expect(elementsArray).toEqual([{}, {}, {}]);
    });

    it('should ignore id when element is not found', async () => {
      driver.elementByAccessibilityId.and.rejectWith(new Error('Element not found'));
      const elementsArray = [];
      const ids = ['id1', 'id2', 'id3'];

      await provider.getRegionsByIds.call({ driver, getRegionObject: getRegionObjectSpy }, elementsArray, ids);

      expect(driver.elementByAccessibilityId).toHaveBeenCalledTimes(3);
      expect(getRegionObjectSpy).not.toHaveBeenCalled();
      expect(elementsArray).toEqual([]);
    });
  });

  describe('getRegionsByElements', () => {
    let getRegionObjectSpy;
    let mockElement;

    beforeEach(() => {
      getRegionObjectSpy = spyOn(provider, 'getRegionObject').and.resolveTo({});
      mockElement = {
        getAttribute: jasmine.createSpy().and.returnValue('some-class')
      };
    });

    it('should get regions for each element', async () => {
      const elementsArray = [];
      const elements = [mockElement, mockElement, mockElement];

      await provider.getRegionsByElements.call({ driver, getRegionObject: getRegionObjectSpy }, elementsArray, elements);

      expect(getRegionObjectSpy).toHaveBeenCalledTimes(3);
      expect(elementsArray).toEqual([{}, {}, {}]);
    });

    it('should ignore when error', async () => {
      getRegionObjectSpy.and.rejectWith(new Error('Element not found'));
      const elementsArray = [];
      const elements = [mockElement, mockElement, mockElement];

      await provider.getRegionsByElements.call({ driver, getRegionObject: getRegionObjectSpy }, elementsArray, elements);

      // expect(getRegionObjectSpy).not.toHaveBeenCalled();
      expect(elementsArray).toEqual([]);
    });
  });

  describe('getRegionsByLocation function', () => {
    beforeEach(() => {
      provider.metadata = {
        screenSize: async () => ({ width: 1920, height: 1080 })
      };
    });

    it('should add custom regions to the provided array', async () => {
      const elementsArray = [];
      const customLocations = [
        new Region(100, 200, 100, 200),
        new Region(300, 400, 300, 400)
      ];

      await provider.getRegionsByLocation(elementsArray, customLocations);

      expect(elementsArray).toEqual([
        {
          selector: 'custom ignore region 0',
          coOrdinates: { top: 100, bottom: 200, left: 100, right: 200 }
        },
        {
          selector: 'custom ignore region 1',
          coOrdinates: { top: 300, bottom: 400, left: 300, right: 400 }
        }
      ]);
    });

    it('should ignore invalid custom regions', async () => {
      const elementsArray = [];
      const customLocations = [
        new Region(100, 1090, 100, 200),
        new Region(300, 400, 300, 1921)
      ];

      await provider.getRegionsByLocation(elementsArray, customLocations);

      expect(elementsArray).toEqual([]);
    });
  });
});
