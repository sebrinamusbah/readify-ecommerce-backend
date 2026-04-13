const { Worker } = require("bullmq");
const redis = require("../../config/redis.config");

const emailService = require("../../services/email.service");

const connection = {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
};

// EMAIL WORKER
new Worker(
    "email",
    async(job) => {
        if (job.name === "sendEmail") {
            await emailService.send(job.data);
        }
    }, { connection },
);

// NOTIFICATION WORKER
new Worker(
    "notification",
    async(job) => {
        console.log("Notification job:", job.data);
    }, { connection },
);

// ORDER WORKER
new Worker(
    "order",
    async(job) => {
        console.log("Processing order:", job.data);
    }, { connection },
);