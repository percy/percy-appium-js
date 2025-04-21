const {
  extractStatusBarHeight,
  extractNavigationBarHeight
} = require('../util/util');
const { Metadata } = require('./metadata');
const { Cache } = require('../util/cache');
const { TimeIt } = require('../util/timing');

class AndroidMetadata extends Metadata {
  async systemBars() {
    return await this.driver.getSystemBars();
  }

  async statusBarHeight() {
    // We are rechecking this first as we dont want to apply pixelRatio if this given by user
    if (this._statusBarHeight) return this._statusBarHeight;

    try {
      if (this._orientation === 'auto') {
        return extractStatusBarHeight(await this.getDisplaySysDump());
      } else {
        return extractStatusBarHeight(await this.getDisplaySysDumpCache());
      }
    } catch (exe) {
      await super.statusBarHeight();
    }
  }

  async navigationBarHeight() {
    if (this._navigationBarHeight) return this._navigationBarHeight;

    try {
      if (this._orientation === 'auto') {
        return extractNavigationBarHeight(await this.getDisplaySysDump());
      } else {
        return extractNavigationBarHeight(await this.getDisplaySysDumpCache());
      }
    } catch (ex) {
      await super.navigationBarHeight();
    }
  }

  async getDisplaySysDumpCache() {
    return await Cache.withCache(Cache.sysDump, this.driver.sessionId, async () => {
      return await this.getDisplaySysDump();
    });
  }

  async getDisplaySysDump() {
    return await TimeIt.run('getSysDump', async () => {
      const args = {
        action: 'adbShell',
        arguments: {
          command: 'dumpsys window displays'
        }
      };

      const script = `browserstack_executor: ${JSON.stringify(args)}`;
      const result = await this.driver.execute(script);

      return result.toString();
    });
  }
}

module.exports = {
  AndroidMetadata
};
