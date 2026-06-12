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
      // Promise-dedup (CWE-362): concurrent callers for the same key await a
      // single in-flight computation instead of each invoking func().
      if (store[key].promise) {
        return await store[key].promise;
      }
      if (store[key].success) {
        return store[key].val;
      } else {
        throw store[key].val;
      }
    }

    const promise = (async () => {
      const obj = { success: false, val: null, time: Date.now() };
      try {
        obj.val = await func();
        obj.success = true;
      } catch (e) {
        obj.val = e;
      }

      // Replace the in-flight marker with the settled value, or drop it so a
      // failed computation can be retried (unless exceptions are cached).
      if (obj.success || cacheExceptions) {
        store[key] = obj;
      } else {
        delete store[key];
      }

      if (!obj.success) throw obj.val;
      return obj.val;
    })();

    // Mark the key as in-flight so overlapping callers dedup onto `promise`.
    store[key] = { promise, time: Date.now() };
    return await promise;
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
