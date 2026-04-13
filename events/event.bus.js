const redis = require("../config/redis.config");
const logger = require("../shared/logger/logger");

const subscribers = require("./event.subscribers");

redis.subscribe("*");

redis.on("message", async(channel, message) => {
    const data = JSON.parse(message);

    logger.info(`Event received: ${channel}`);

    if (subscribers[channel]) {
        await subscribers[channel].forEach((fn) => fn(data));
    }
});