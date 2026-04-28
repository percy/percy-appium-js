import { AppiumDriver } from '../../../percy/driver/driverWrapper.js';
import { Cache } from '../../../percy/util/cache.js';

describe('AppiumDriver', () => {
  beforeEach(() => {
    Cache.reset();
  });

  function wdioDriver(overrides = {}) {
    const caps = overrides.capabilities || { platformName: 'Android' };
    return new class Browser {
      constructor() {
        this.sessionId = 'session-123';
        this.capabilities = caps;
        this.options = {
          protocol: 'https',
          path: '/wd/hub',
          hostname: 'localhost'
        };
      }
    }();
  }

  function wdDriver(overrides = {}) {
    const caps = overrides.sessionCaps || { platformName: 'Android' };
    return {
      sessionID: 'session-456',
      sessionCapabilities: jasmine.createSpy('sessionCapabilities').and.resolveTo(caps),
      configUrl: { protocol: 'https:', hostname: 'localhost', path: '/wd/hub' }
    };
  }

  describe('resolveAppiumVersion', () => {
    it('detects version from appium:appiumVersion capability', async () => {
      const raw = wdioDriver({ capabilities: { 'appium:appiumVersion': '2.5.1', platformName: 'Android' } });
      const driver = new AppiumDriver(raw);
      const version = await driver.resolveAppiumVersion();
      expect(version).toEqual('2.5.1');
      expect(driver.appiumMajor).toEqual(2);
    });

    it('detects version from bare appiumVersion capability', async () => {
      const raw = wdioDriver({ capabilities: { appiumVersion: '1.22.3', platformName: 'Android' } });
      const driver = new AppiumDriver(raw);
      const version = await driver.resolveAppiumVersion();
      expect(version).toEqual('1.22.3');
      expect(driver.appiumMajor).toEqual(1);
    });

    it('detects Appium 3.x from capabilities', async () => {
      const raw = wdioDriver({ capabilities: { 'appium:appiumVersion': '3.0.0', platformName: 'Android' } });
      const driver = new AppiumDriver(raw);
      const version = await driver.resolveAppiumVersion();
      expect(version).toEqual('3.0.0');
      expect(driver.appiumMajor).toEqual(3);
    });

    it('falls back to /status endpoint for wdio when caps lack version', async () => {
      const raw = wdioDriver({ capabilities: { platformName: 'Android' } });
      raw.status = jasmine.createSpy('status').and.resolveTo({ build: { version: '2.11.0' } });
      const driver = new AppiumDriver(raw);
      const version = await driver.resolveAppiumVersion();
      expect(version).toEqual('2.11.0');
      expect(driver.appiumMajor).toEqual(2);
      expect(raw.status).toHaveBeenCalled();
    });

    it('returns undefined and sets no major when version is undetectable', async () => {
      const raw = wdioDriver({ capabilities: { platformName: 'Android' } });
      const driver = new AppiumDriver(raw);
      const version = await driver.resolveAppiumVersion();
      expect(version).toBeUndefined();
      expect(driver.appiumMajor).toBeNull();
    });

    it('does not call /status for wd drivers', async () => {
      const raw = wdDriver({ sessionCaps: { platformName: 'Android' } });
      raw.status = jasmine.createSpy('status');
      const driver = new AppiumDriver(raw);
      await driver.resolveAppiumVersion();
      expect(raw.status).not.toHaveBeenCalled();
    });

    it('caches the result across calls', async () => {
      const raw = wdioDriver({ capabilities: { 'appium:appiumVersion': '2.5.1', platformName: 'Android' } });
      const driver = new AppiumDriver(raw);
      await driver.resolveAppiumVersion();
      await driver.resolveAppiumVersion();
      // Cache.withCache is called but the inner function only runs once
      expect(driver.appiumMajor).toEqual(2);
    });

    it('handles /status failure gracefully', async () => {
      const raw = wdioDriver({ capabilities: { platformName: 'Android' } });
      raw.status = jasmine.createSpy('status').and.rejectWith(new Error('network error'));
      const driver = new AppiumDriver(raw);
      const version = await driver.resolveAppiumVersion();
      expect(version).toBeUndefined();
      expect(driver.appiumMajor).toBeNull();
    });

    it('handles capabilities failure gracefully', async () => {
      const raw = wdDriver();
      raw.sessionCapabilities = jasmine.createSpy().and.rejectWith(new Error('session gone'));
      const driver = new AppiumDriver(raw);
      const version = await driver.resolveAppiumVersion();
      expect(version).toBeNull();
    });
  });

  describe('getCapabilityValue', () => {
    let driver;

    beforeEach(() => {
      driver = new AppiumDriver(wdioDriver());
    });

    it('returns bare key for Appium 1.x style caps', () => {
      const caps = { deviceName: 'Pixel 5', platformName: 'Android' };
      expect(driver.getCapabilityValue(caps, 'deviceName')).toEqual('Pixel 5');
    });

    it('returns appium: prefixed key for Appium 2.x style caps', () => {
      const caps = { 'appium:deviceName': 'Pixel 5', platformName: 'Android' };
      expect(driver.getCapabilityValue(caps, 'deviceName')).toEqual('Pixel 5');
    });

    it('prefers bare key over appium: prefixed when both exist', () => {
      const caps = { deviceName: 'bare', 'appium:deviceName': 'prefixed' };
      expect(driver.getCapabilityValue(caps, 'deviceName')).toEqual('bare');
    });

    it('returns W3C standard keys without prefix lookup', () => {
      const caps = { platformName: 'iOS', 'appium:platformName': 'Android' };
      expect(driver.getCapabilityValue(caps, 'platformName')).toEqual('iOS');
    });

    it('returns undefined for missing keys', () => {
      const caps = { platformName: 'Android' };
      expect(driver.getCapabilityValue(caps, 'nonexistent')).toBeUndefined();
    });

    it('returns undefined for null/undefined caps', () => {
      expect(driver.getCapabilityValue(null, 'key')).toBeUndefined();
      expect(driver.getCapabilityValue(undefined, 'key')).toBeUndefined();
    });

    it('handles all W3C standard keys', () => {
      const w3cKeys = ['browserName', 'browserVersion', 'platformName', 'acceptInsecureCerts', 'pageLoadStrategy', 'proxy', 'timeouts', 'unhandledPromptBehavior'];
      for (const key of w3cKeys) {
        const caps = { [key]: 'test-value', [`appium:${key}`]: 'should-not-return' };
        expect(driver.getCapabilityValue(caps, key)).toEqual('test-value');
      }
    });
  });

  describe('getAllCapabilities', () => {
    it('returns full capabilities for wdio driver', async () => {
      const caps = { platformName: 'Android', 'appium:deviceName': 'Pixel 5' };
      const raw = wdioDriver({ capabilities: caps });
      const driver = new AppiumDriver(raw);
      const result = await driver.getAllCapabilities();
      expect(result).toEqual(caps);
    });

    it('returns session capabilities for wd driver', async () => {
      const caps = { platformName: 'Android', deviceName: 'Pixel 5' };
      const raw = wdDriver({ sessionCaps: caps });
      const driver = new AppiumDriver(raw);
      const result = await driver.getAllCapabilities();
      expect(result).toEqual(caps);
    });

    it('caches the result', async () => {
      const caps = { platformName: 'Android' };
      const raw = wdDriver({ sessionCaps: caps });
      const driver = new AppiumDriver(raw);
      await driver.getAllCapabilities();
      await driver.getAllCapabilities();
      expect(raw.sessionCapabilities).toHaveBeenCalledTimes(1);
    });
  });

  describe('type detection', () => {
    it('detects wdio driver', () => {
      const driver = new AppiumDriver(wdioDriver());
      expect(driver.wdio).toBeTrue();
      expect(driver.wd).toBeFalse();
      expect(driver.type).toEqual('wdio');
    });

    it('detects wd driver', () => {
      const driver = new AppiumDriver(wdDriver());
      expect(driver.wd).toBeTrue();
      expect(driver.wdio).toBeFalse();
      expect(driver.type).toEqual('wd');
    });
  });

  describe('appiumMajor', () => {
    it('returns null before resolveAppiumVersion is called', () => {
      const driver = new AppiumDriver(wdioDriver());
      expect(driver.appiumMajor).toBeNull();
    });

    it('returns parsed major version after detection', async () => {
      const raw = wdioDriver({ capabilities: { 'appium:appiumVersion': '2.15.0', platformName: 'Android' } });
      const driver = new AppiumDriver(raw);
      await driver.resolveAppiumVersion();
      expect(driver.appiumMajor).toEqual(2);
    });
  });
});
