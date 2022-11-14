
class Browser {
  constructor({
    appAutomate,
    platform,
    deviceName,
    enabled
  } = {}) {
    appAutomate = appAutomate || false;
    const ios = platform === 'iOS' || false;
    const android = !ios;
    deviceName = deviceName || android ? 'GenericAndroid' : 'iPhone 8 Plus'; // some device from static config
    enabled = enabled === undefined ? true : enabled;

    this.sessionId = 'sessionId';

    const sessionCaps = {
      platformName: ios ? 'iOS' : 'Android',
      'percy:options': {
        enabled: enabled,
        raiseErrors: true
      }
    };

    if (android) {
      sessionCaps.deviceScreenSize = '1080x1920';
      sessionCaps.desired = {
        deviceName
      };
    } else if (ios) {
      sessionCaps['percy:options'] = {
        enabled: enabled,
        raiseErrors: true
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
      let res;
      if (str.includes('getSessionDetails')) {
        res = {
          device: deviceName,
          browser_url: 'url'
        };
      } else {
        res = { success: true };
      }
      return JSON.stringify(res);
    });
  }
};

module.exports = function(options) {
  return new Browser(options);
};
