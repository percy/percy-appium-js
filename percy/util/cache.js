const { Undefined } = require('./validations');

class Cache {
  static cache = {};

  // Common stores, const, dont modify outside
  static caps = 'caps';
  static systemBars = 'systemBars';
  static capabilities = 'capabilities';
  static sessionCapabilities = 'session_capabilites';
  static commandExecutorUrl = 'command_executor_url';
  static sysDump = 'sysDump';

  // maintainance
  static lastTime = Date.now();
  static timeout = 5 * 60 * 1000;

  static async withCache(store, key, func, cacheExceptions = false) {
    this.maintain();
    if (Undefined(this.cache[store])) this.cache[store] = {};

    store = this.cache[store];
    if (store[key]) {
      if (store[key].success) {
        return store[key].val;
      } else {
        throw store[key].val;
      }
    }

    const obj = { success: false, val: null, time: Date.now() };
    try {
      obj.val = await func();
      obj.success = true;
    } catch (e) {
      obj.val = e;
    }

    // We seem to have correct coverage for both flows but nyc is marking it as missing
    // branch coverage anyway
    /* istanbul ignore next */
    if (obj.success || cacheExceptions) {
      store[key] = obj;
    }

    if (!obj.success) throw obj.val;
    return obj.val;
  }

  static maintain() {
    if (this.lastTime + this.timeout > Date.now()) return;

    for (const [, store] of Object.entries(this.cache)) {
      for (const [key, item] of Object.entries(store)) {
        if (item.time + this.timeout < Date.now()) {
          delete store[key];
        }
      }
    }
    this.lastTime = Date.now();
  }

  static reset() {
    this.cache = {};
  }
}

module.exports = {
  Cache
};
