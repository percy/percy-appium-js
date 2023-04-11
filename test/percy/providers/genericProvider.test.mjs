// Covering only not covered in index tests
import { GenericProvider } from '../../../percy/providers/genericProvider.js';
import AppiumDriverMock from '../../mocks/appium/appium_driver.js';
import { IgnoreRegion } from '../../../percy/util/ignoreRegion.js';

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
        provider.metadata = { statusBarHeight: () => 1, navigationBarHeight: () => 1};
      });

      it('defaults to single page screenshot', async () => {
        const tiles = await provider.getTiles(true, true);
        expect(tiles.length).toEqual(1);
      });
    });
  });

  describe('ignoreElementObject', () => {
    beforeEach(() => {
      // mock metadata
      provider.metadata = { scaleFactor: () => 1};
    });

    it('should return a JSON object with the correct selector and coordinates', async () => {
      // Mock element data
      const mockLocation = { x: 10, y: 20 };
      const mockSize = { width: 100, height: 200 };
      const mockElement = {
        getLocation: jasmine.createSpy().and.returnValue(mockLocation),
        getSize: jasmine.createSpy().and.returnValue(mockSize),
      };

      // Call function with mock data
      const selector = 'mock-selector';
      const result = await provider.ignoreElementObject(selector, mockElement);
  
      // Assert expected result
      expect(result.selector).toEqual(selector);
      expect(result.coOrdinates).toEqual({
        top: mockLocation.y,
        bottom: mockLocation.y + mockSize.height,
        left: mockLocation.x,
        right: mockLocation.x + mockSize.width,
      });
  
      // Assert element methods were called
      expect(mockElement.getLocation).toHaveBeenCalled();
      expect(mockElement.getSize).toHaveBeenCalled();
    });
  });

  describe('ignoreRegionsByXpaths', () => {
    let ignoreElementObjectSpy;

    beforeEach(() => {
      driver = {
        elementByXPath: jasmine.createSpy('elementByXPath').and.resolveTo({}),
      };
      ignoreElementObjectSpy = spyOn(provider, 'ignoreElementObject').and.resolveTo({});
    });
  
    it('should ignore regions for each xpath', async () => {
      const ignoredElementsArray = [];
      const xpaths = ['/xpath/1', '/xpath/2', '/xpath/3'];
  
      await provider.ignoreRegionsByXpaths.call({driver, ignoreElementObject: ignoreElementObjectSpy}, ignoredElementsArray, xpaths);
  
      expect(driver.elementByXPath).toHaveBeenCalledTimes(3);
      expect(ignoreElementObjectSpy).toHaveBeenCalledTimes(3);
      expect(ignoredElementsArray).toEqual([{}, {}, {}]);
    });
  
    it('should ignore xpath when element is not found', async () => {
      driver.elementByXPath.and.rejectWith(new Error('Element not found'));
      const ignoredElementsArray = [];
      const xpaths = ['/xpath/1', '/xpath/2', '/xpath/3'];
  
      await provider.ignoreRegionsByXpaths.call({driver, ignoreElementObject: ignoreElementObjectSpy}, ignoredElementsArray, xpaths);
  
      expect(driver.elementByXPath).toHaveBeenCalledTimes(3);
      expect(ignoreElementObjectSpy).not.toHaveBeenCalled();
      expect(ignoredElementsArray).toEqual([]);
    });
  });

  describe('ignoreRegionsByIds', () => {
    let ignoreElementObjectSpy;
  
    beforeEach(() => {
      driver = {
        elementByAccessibilityId: jasmine.createSpy('elementByAccessibilityId').and.resolveTo({}),
      };
      ignoreElementObjectSpy = spyOn(provider, 'ignoreElementObject').and.resolveTo({});
    });
  
    it('should ignore regions for each id', async () => {
      const ignoredElementsArray = [];
      const ids = ['id1', 'id2', 'id3'];
  
      await provider.ignoreRegionsByIds.call({driver, ignoreElementObject: ignoreElementObjectSpy}, ignoredElementsArray, ids);
  
      expect(driver.elementByAccessibilityId).toHaveBeenCalledTimes(3);
      expect(ignoreElementObjectSpy).toHaveBeenCalledTimes(3);
      expect(ignoredElementsArray).toEqual([{}, {}, {}]);
    });
  
    it('should ignore id when element is not found', async () => {
      driver.elementByAccessibilityId.and.rejectWith(new Error('Element not found'));
      const ignoredElementsArray = [];
      const ids = ['id1', 'id2', 'id3'];
  
      await provider.ignoreRegionsByIds.call({driver, ignoreElementObject: ignoreElementObjectSpy}, ignoredElementsArray, ids);
  
      expect(driver.elementByAccessibilityId).toHaveBeenCalledTimes(3);
      expect(ignoreElementObjectSpy).not.toHaveBeenCalled();
      expect(ignoredElementsArray).toEqual([]);
    });
  });

  describe('ignoreRegionsByElement', () => {
    let ignoreElementObjectSpy;
    let mockElement;
  
    beforeEach(() => {
      ignoreElementObjectSpy = spyOn(provider, 'ignoreElementObject').and.resolveTo({});
      mockElement = {
        getAttribute: jasmine.createSpy().and.returnValue("some-class")
      };
    });
  
    it('should ignore regions for each element', async () => {
      const ignoredElementsArray = [];
      const elements = [mockElement, mockElement, mockElement];
  
      await provider.ignoreRegionsByElement.call({driver, ignoreElementObject: ignoreElementObjectSpy}, ignoredElementsArray, elements);
  
      expect(ignoreElementObjectSpy).toHaveBeenCalledTimes(3);
      expect(ignoredElementsArray).toEqual([{}, {}, {}]);
    });
  
    it('should ignore when error', async () => {
      ignoreElementObjectSpy.and.rejectWith(new Error('Element not found'));
      const ignoredElementsArray = [];
      const elements = [mockElement, mockElement, mockElement];
  
      await provider.ignoreRegionsByElement.call({driver, ignoreElementObject: ignoreElementObjectSpy}, ignoredElementsArray, elements);
  
      //expect(ignoreElementObjectSpy).not.toHaveBeenCalled();
      expect(ignoredElementsArray).toEqual([]);
    });
  });
  
  describe('addCustomIgnoreRegions function', () => {
    let testObj;
  
    beforeEach(() => {
      provider.metadata = {
        screenSize: async () => ({ width: 1920, height: 1080 }),
      }
    });
  
    it('should add custom ignore regions to the provided array', async () => {
      const ignoredElementsArray = [];
      const customLocations = [
        new IgnoreRegion(100, 200, 100, 200),
        new IgnoreRegion(300, 400, 300, 400)
      ];
  
      await provider.addCustomIgnoreRegions(ignoredElementsArray, customLocations);
  
      expect(ignoredElementsArray).toEqual([
        {
          selector: 'custom ignore region 0',
          coOrdinates: { top: 100, bottom: 200, left: 100, right: 200 },
        },
        {
          selector: 'custom ignore region 1',
          coOrdinates: { top: 300, bottom: 400, left: 300, right: 400 },
        },
      ]);
    });
  
    it('should ignore invalid custom ignore regions', async () => {
      const ignoredElementsArray = [];
      const customLocations = [
        new IgnoreRegion(100, 1090, 100, 200),
        new IgnoreRegion(300, 400, 300, 1921),
      ];

      await provider.addCustomIgnoreRegions(ignoredElementsArray, customLocations);
  
      expect(ignoredElementsArray).toEqual([]);
    });
  });  
});
