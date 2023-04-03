module.exports = function({
  appAutomate,
  platform,
  deviceName,
  enabled,
  ignoreErrors,
  failScreenshot,
  failedBeginCall
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
        enabled,
        ignoreErrors
      }
    };
  } else if (ios) {
    sessionCaps['percy:options'] = {
      enabled,
      ignoreErrors
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
      if (str.includes('percyScreenshot')) {
        if (str.includes('begin')) {
          if (failedBeginCall) {
            throw new Error('failed percyScreenshotBegin');
          }
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
    }),
    getOrientation: jasmine.createSpy().and.returnValue('PORTRAIT')
  };

  return obj;
};
