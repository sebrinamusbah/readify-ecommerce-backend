const redis = require("../../config/redis.config");

exports.get = async(key) => {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
};

exports.set = async(key, value, ttl = 60) => {
    await redis.set(key, JSON.stringify(value), "EX", ttl);
};

exports.del = async(key) => {
    await redis.del(key);
};

exports.clearByPattern = async(pattern) => {
    const keys = await redis.keys(pattern);
    if (keys.length) {
        await redis.del(keys);
    }
};