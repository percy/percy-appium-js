
const { Undefined } = require('./validations');

class Cache {
  static cache = {};

  // Common stores, const, dont modify outside
  static caps = 'caps';
  static bstackSessionDetails = 'bstack:getSessionDetails';
  static systemBars = 'systemBars';

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
      if (!cacheExceptions) throw e;
      obj.val = e;
    }
    store[key] = obj;
    return obj.val;
  }

  static maintain() {
    if (this.lastTime + this.timeout > Date.now()) return;

    for (const [, store] in Object.entries(this.cache)) {
      for (const [key, item] in Object.entries(store)) {
        if (item.time + this.timeout < Date.now()) {
          delete store[key];
        }
      }
    }
    this.lastTime = Date.now();
  }
}

module.exports = {
  Cache
};
