// This contains a wrapped appium driver to write tests easily without
// being dependent on ws/wdio structire
module.exports = function() {
  return {
    sessionId: 'sessionId',
    remoteHostname: 'localhost',
    execute: jasmine.createSpy().and.resolveTo(JSON.stringify({ success: true }))
  };
};
