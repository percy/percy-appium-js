const { AndroidMetadata } = require('./androidMetadata');
const { IosMetadata } = require('./iosMetadata');

class MetadataResolver {
  static async resolve(driver, options) {
    const platform = (await driver.getCapabilities()).platformName.toLowerCase();
    if (platform === 'android') {
      return new AndroidMetadata(driver, options);
    } else if (platform === 'ios') {
      return new IosMetadata(driver, options);
    } else {
      throw new Error('Unknown platform');
    }
  }
}

module.exports = {
  MetadataResolver
};
