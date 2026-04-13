const { QueueEvents } = require("bullmq");

const connection = {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
};

const emailEvents = new QueueEvents("email", { connection });

emailEvents.on("completed", ({ jobId }) => {
    console.log(`Email job ${jobId} completed`);
});

emailEvents.on("failed", ({ jobId, failedReason }) => {
    console.error(`Email job ${jobId} failed: ${failedReason}`);
});