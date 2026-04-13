const cacheService = require("./cache.service");

exports.getOrSet = async(key, cb, ttl = 60) => {
    const cached = await cacheService.get(key);

    if (cached) return cached;

    const freshData = await cb();

    await cacheService.set(key, freshData, ttl);

    return freshData;
};