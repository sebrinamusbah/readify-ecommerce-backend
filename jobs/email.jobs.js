const emailService = require("../services/email.service");
const logger = require("../shared/logger/logger");

exports.sendEmailJob = async(job) => {
    try {
        const { to, subject, html } = job.data;

        await emailService.send({
            to,
            subject,
            html,
        });

        logger.info(`Email sent to ${to}`);
    } catch (error) {
        logger.error(`Email job failed: ${error.message}`);
        throw error; // important for retry
    }
};