
class Browser {
  constructor({
    appAutomate,
    platform,
    deviceName,
    enabled,
    ignoreErrors,
    failScreenshot
  } = {}) {
    appAutomate = appAutomate || false;
    const ios = platform === 'iOS' || false;
    const android = !ios;
    deviceName = deviceName || android ? 'GenericAndroid' : 'iPhone 8 Plus'; // some device from static config
    enabled = enabled === undefined ? true : enabled;
    ignoreErrors = ignoreErrors === undefined ? false : ignoreErrors;

    this.sessionId = 'sessionId';

    const sessionCaps = {
      platformName: ios ? 'iOS' : 'Android',
      'percy:options': {
        enabled,
        ignoreErrors
      }
    };

    if (android) {
      sessionCaps.deviceScreenSize = '1080x1920';
      sessionCaps.desired = {
        deviceName
      };
    } else if (ios) {
      sessionCaps['percy:options'] = {
        enabled,
        ignoreErrors
      };
      sessionCaps.deviceName = deviceName;
    }

    this.options = {
      hostname: appAutomate ? 'hub.browserstack.com' : 'localhost'
    };

    this.capabilities = sessionCaps;

    this.getSession = jasmine.createSpy().and.returnValue(sessionCaps);
    this.takeScreenshot = jasmine.createSpy().and.resolveTo('some screenshot data');
    this.getSystemBars = jasmine.createSpy().and.resolveTo({
      statusBar: { height: 60 },
      navigationBar: { height: 30 }
    });
    this.execute = jasmine.createSpy().and.callFake((str) => {
      if (str.includes('percyScreenshot')) {
        if (str.includes('begin')) {
          let res = {
            success: true,
            deviceName,
            osVersion: '12.0',
            buildHash: 'abc',
            sessionHash: 'def'
          };
          return JSON.stringify(res);
        } else if (str.includes('end')) {
          return JSON.stringify({ success: true });
        } else if (str.includes('screenshot')) {
          return JSON.stringify({
            success: !failScreenshot,
            result: JSON.stringify([
              { sha: '123-12', headerHeight: 12, footerHeight: 123 },
              { sha: '124-12', headerHeight: 12, footerHeight: 123 }
            ])
          });
        }
      }
    });
    this.getOrientation = jasmine.createSpy().and.returnValue('PORTRAIT');
  }
};

module.exports = function(options) {
  return new Browser(options);
};
