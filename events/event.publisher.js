const redis = require("../config/redis.config");

exports.publish = async(event, data) => {
    await redis.publish(event, JSON.stringify(data));
};