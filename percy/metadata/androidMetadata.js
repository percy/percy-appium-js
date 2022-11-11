const { Metadata } = require('./metadata');

class AndroidMetadata extends Metadata {
  async systemBars() {
    await this.driver.getSystemBars();
  }
}

module.exports = {
  AndroidMetadata
};
