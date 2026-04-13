const { Queue } = require("bullmq");
const redis = require("../../config/redis.config");

const connection = {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
};

exports.queues = {
    emailQueue: new Queue("email", { connection }),
    notificationQueue: new Queue("notification", { connection }),
    orderQueue: new Queue("order", { connection }),
};