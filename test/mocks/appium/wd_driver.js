module.exports = function({
  appAutomate,
  platform,
  deviceName,
  enabled
} = {}) {
  appAutomate = appAutomate || false;
  const ios = platform === 'iOS';
  const android = !ios;
  deviceName = deviceName || android ? 'GenericAndroid' : 'iPhone 8 Plus'; // some device from static config
  enabled = enabled === undefined ? true : enabled;

  const sessionCaps = {
    platformName: ios ? 'iOS' : 'Android'
  };

  if (android) {
    sessionCaps.deviceScreenSize = '1080x1920';
    sessionCaps.desired = {
      deviceName,
      'percy:options': {
        enabled: enabled,
        raiseErrors: true
      }
    };
  } else if (ios) {
    sessionCaps['percy:options'] = {
      enabled: enabled,
      raiseErrors: true
    };
    sessionCaps.deviceName = deviceName;
  }

  let obj = {
    sessionID: 'sessionID',
    configUrl: {
      hostname: appAutomate ? 'hub.browserstack.com' : 'localhost'
    },
    sessionCapabilities: jasmine.createSpy().and.returnValue(sessionCaps),
    takeScreenshot: jasmine.createSpy().and.resolveTo('some screenshot data'),
    execute: jasmine.createSpy().and.callFake((str) => {
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
    })
  };

  return obj;
};
