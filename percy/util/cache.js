
class Cache {
  static cache = {}

  // Common stores, const, dont modify outside
  static caps = "caps";
  static bstackSessionDetails = "bstack:getSessionDetails";

  static async withCache(store, key, func, cacheExceptions = false) {
    if (this.cache[store] === undefined) this.cache[store] = {};

    store = this.cache[store];
    if (store[key]) {
      if (store[key].success) {
        return store[key].val;
      } else {
        throw store[key].val;
      }
    }

    const obj = { success: false, val: null };
    try {
      obj.val = await func();
      obj.success = true;
    } catch(e) {
      if (!cacheExceptions) throw e;
      obj.val = e;
    }
    obj.time = Date.now();
    store[key] = obj;
    return obj.val;
  } 
}

module.exports = {
  Cache,
}