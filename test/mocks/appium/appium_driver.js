// This contains a wrapped appium driver to write tests easily without
// being dependent on ws/wdio structire
module.exports = function() {
  return {
    sessionId: 'sessionId',
    remoteHostname: 'localhost',
    // execute: jasmine.createSpy().and.resolveTo(JSON.stringify({ success: true })),
    execute: jasmine.createSpy().and.callFake((str) => {
      if (str.includes('viewportRect')) {
        return { width: 100, height: 200 };
      } else {
        return JSON.stringify({ success: true });
      }
    }),
    takeScreenshot: jasmine.createSpy().and.resolveTo('abcd='),
    getCapabilityValue(caps, key) {
      if (caps == null) return undefined;
      const w3cStandard = ['browserName', 'browserVersion', 'platformName', 'acceptInsecureCerts', 'pageLoadStrategy', 'proxy', 'timeouts', 'unhandledPromptBehavior'];
      if (w3cStandard.includes(key)) return caps[key];
      const val = caps[key];
      if (val != null) return val;
      return caps[`appium:${key}`];
    }
  };
};
