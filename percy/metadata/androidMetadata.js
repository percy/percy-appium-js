const { Metadata } = require('./metadata');

class AndroidMetadata extends Metadata {
  async systemBars() {
    return await this.driver.getSystemBars();
  }
}

module.exports = {
  AndroidMetadata
};
