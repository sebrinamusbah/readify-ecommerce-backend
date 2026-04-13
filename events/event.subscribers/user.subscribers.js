const emailService = require("../../services/email.service");
const logger = require("../../shared/logger/logger");

// ============================
// USER EVENT SUBSCRIBERS
// ============================

module.exports = {
    /**
     * USER REGISTERED EVENT
     */
    "user.registered": [
        async(data) => {
            try {
                await emailService.send({
                    to: data.email,
                    subject: "Welcome to Book Store 📚",
                    html: `
            <h1>Welcome, ${data.name}</h1>
            <p>Thanks for joining our platform.</p>
          `,
                });

                logger.info(`Welcome email sent to ${data.email}`);
            } catch (err) {
                logger.error(`user.registered email failed: ${err.message}`);
                throw err;
            }
        },

        /**
         * ANALYTICS TRACKING
         */
        async(data) => {
            try {
                logger.info("User registration tracked", {
                    userId: data.userId,
                    email: data.email,
                });

                // Future: send to analytics service (Mixpanel, Segment, etc.)
            } catch (err) {
                logger.error(`analytics failed: ${err.message}`);
            }
        },
    ],
};