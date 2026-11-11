import http from 'http';
import { attach } from 'webdriverio';

const SESSION = 'fake-session';
const BASE = `/session/${SESSION}`;
const ELEMENT_KEY = 'element-6066-11e4-a52e-4f735466cecf';
const CAPABILITIES = {
  platformName: 'Android',
  'appium:automationName': 'UiAutomator2',
  'appium:deviceName': 'Pixel 7'
};
const BARS = {
  statusBar: { visible: true, x: 0, y: 0, width: 1080, height: 66 },
  navigationBar: { visible: true, x: 0, y: 2274, width: 1080, height: 126 }
};

function route(method, path, body) {
  if (method === 'GET' && path === BASE) return { value: CAPABILITIES };
  if (method === 'POST' && path === `${BASE}/element`) {
    return { value: { [ELEMENT_KEY]: 'el-1' } };
  }
  if (method === 'POST' && path === `${BASE}/elements`) {
    const dup = body?.value === '//dup' || body?.value === 'dup';
    const ids = dup ? ['el-1', 'el-2'] : ['el-1'];
    return { value: ids.map(id => ({ [ELEMENT_KEY]: id })) };
  }
  if (method === 'GET' && /^\/session\/fake-session\/element\/[^/]+\/rect$/.test(path)) {
    return { value: { x: 10, y: 20, width: 100, height: 200 } };
  }
  if (method === 'POST' && path === `${BASE}/execute/sync`) {
    const script = body?.script;
    if (script === 'mobile: getSystemBars') return { value: BARS };
    if (script === 'mobile: viewportRect') {
      return { value: { left: 0, top: 47, width: 390, height: 797 } };
    }
    if (typeof script === 'string' && script.startsWith('browserstack_executor:')) {
      return { value: JSON.stringify({ success: true }) };
    }
  }
  if (method === 'GET' && path === `${BASE}/appium/device/system_bars`) {
    return { value: BARS };
  }
  return null;
}

export async function startFakeAppium() {
  const requests = [];
  const server = http.createServer((req, res) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString();
      const path = req.url.split('?')[0];
      res.setHeader('content-type', 'application/json');
      let body;
      try {
        body = raw ? JSON.parse(raw) : undefined;
      } catch {
        res.statusCode = 400;
        res.end(JSON.stringify({ value: { error: 'invalid argument', message: 'body is not JSON' } }));
        return;
      }
      requests.push({ method: req.method, path, body });
      const reply = route(req.method, path, body);
      res.statusCode = reply ? 200 : 404;
      res.end(JSON.stringify(reply || {
        value: { error: 'unknown command', message: `${req.method} ${path}` }
      }));
    });
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  return {
    port: server.address().port,
    requests,
    close: () => new Promise(resolve => {
      server.closeAllConnections?.();
      server.close(() => resolve());
    })
  };
}

export function attachBrowser(port) {
  // webdriverio 8/9 attach() read the connection from `options`
  return attach({
    sessionId: SESSION,
    capabilities: CAPABILITIES,
    options: { hostname: '127.0.0.1', port, protocol: 'http', path: '/' },
    logLevel: 'silent'
  });
}
