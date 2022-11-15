module.exports = function({
  appAutomate,
  platform,
  deviceName,
  enabled,
  ignoreErrors
} = {}) {
  appAutomate = appAutomate || false;
  const ios = platform === 'iOS';
  const android = !ios;
  deviceName = deviceName || android ? 'GenericAndroid' : 'iPhone 8 Plus'; // some device from static config
  enabled = enabled === undefined ? true : enabled;
  ignoreErrors = ignoreErrors === undefined ? false : ignoreErrors;

  const sessionCaps = {
    platformName: ios ? 'iOS' : 'Android'
  };

  if (android) {
    sessionCaps.deviceScreenSize = '1080x1920';
    sessionCaps.desired = {
      deviceName,
      'percy:options': {
        enabled: enabled,
        ignoreErrors: ignoreErrors
      }
    };
  } else if (ios) {
    sessionCaps['percy:options'] = {
      enabled: enabled,
      ignoreErrors: ignoreErrors
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
    }),
    getOrientation: jasmine.createSpy().and.returnValue('PORTRAIT')
  };

  return obj;
};
