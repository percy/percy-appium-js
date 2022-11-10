const { GenericProvider } = require('./genericProvider');
const { AppAutomateProvider } = require('./appAutomateProvider');

class ProviderResolver {
  static resolve(driver) {
    // We can safely do [0] because GenericProvider is catch all
    const klass = [AppAutomateProvider, GenericProvider].filter(x => (x.supports(driver)))[0];
    return new klass(driver);
  }
}

module.exports = {
  ProviderResolver
};
