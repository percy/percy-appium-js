import { getElementIdFromElements } from '../../../percy/percyOnAutomate.js';
import { AppiumDriver } from '../../../percy/driver/driverWrapper.js';
import { Cache } from '../../../percy/util/cache.js';
import { resolveAppiumClientPkg } from '../../../percy/util/resolveClientPkg.js';
import { startFakeAppium, attachBrowser } from '../../mocks/appium/fakeAppiumServer.mjs';

describe('webdriverio contract', () => {
  let server, browser, requests;

  beforeAll(async () => {
    server = await startFakeAppium();
    requests = server.requests;
    browser = await attachBrowser(server.port);
  });

  afterAll(async () => {
    await server.close();
  });

  beforeEach(() => {
    requests.length = 0;
    Cache.reset();
  });

  it('detects a real webdriverio browser as wdio', () => {
    expect(new AppiumDriver(browser).type).toBe('wdio');
  });

  it('detects a Proxy-wrapped browser as wdio', () => { // @wdio/globals exports a Proxy
    expect(new AppiumDriver(new Proxy(browser, {})).type).toBe('wdio');
  });

  it('reads session id, host and executor URL from the browser', () => {
    const driver = new AppiumDriver(browser);
    expect(driver.sessionId).toBe('fake-session');
    expect(driver.remoteHostname).toBe('127.0.0.1');
    expect(driver.commandExecutorUrl).toBe('http://127.0.0.1/');
  });

  it('resolves the installed webdriverio package', () => {
    const pkg = resolveAppiumClientPkg();
    expect(pkg.name).toBe('webdriverio');
    if (process.env.WDIO_MAJOR) expect(pkg.version.split('.')[0]).toBe(process.env.WDIO_MAJOR);
  });

  it('reads the Android system bars', async () => {
    expect(await new AppiumDriver(browser).getSystemBars())
      .toEqual({ statusbarHeight: 66, navigationBarHeight: 126 });
    // v10: POST /execute/sync with 'mobile: getSystemBars'; v8/v9: GET /appium/device/system_bars
    expect(requests.some(r => r.path.endsWith('/appium/device/system_bars') ||
      r.body?.script === 'mobile: getSystemBars')).toBeTrue();
  });

  it('returns the first match of an XPath that matches two elements', async () => {
    expect((await new AppiumDriver(browser).elementByXPath('//dup')).elementId).toBe('el-1');
  });

  it('returns the first match of an accessibility id that matches two elements', async () => {
    expect((await new AppiumDriver(browser).elementByAccessibilityId('dup')).elementId).toBe('el-1');
  });

  it('collects element ids from an un-awaited $$ list', async () => {
    expect(await getElementIdFromElements('wdio', browser.$$('//dup'))).toEqual(['el-1', 'el-2']);
  });

  it('collects element ids from an awaited $$ list', async () => {
    expect(await getElementIdFromElements('wdio', await browser.$$('//dup'))).toEqual(['el-1', 'el-2']);
  });

  it('posts string scripts to the Classic execute endpoint', async () => {
    await new AppiumDriver(browser).execute('browserstack_executor: {"action":"x"}');
    expect(requests).toContain(jasmine.objectContaining({
      method: 'POST',
      path: '/session/fake-session/execute/sync',
      body: { script: 'browserstack_executor: {"action":"x"}', args: [] }
    }));
  });
});
