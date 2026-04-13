const logger = require("../shared/logger/logger");

exports.processOrderJob = async(job) => {
    try {
        const { orderId } = job.data;

        // simulate heavy logic
        logger.info(`Processing order ${orderId}`);

        // Example tasks:
        // - reduce stock
        // - send notification
        // - trigger email
        // - analytics tracking

        logger.info(`Order ${orderId} processed`);
    } catch (error) {
        logger.error(`Order job failed: ${error.message}`);
        throw error;
    }
};