const emailService = require("../../services/email.service");
const notificationService = require("../../services/notification.service");

module.exports = {
    "order.created": [
        async(data) => {
            await emailService.send({
                to: data.email,
                subject: "Order Confirmed",
                html: "Thanks for your order",
            });
        },

        async(data) => {
            console.log("Analytics tracked for order:", data.orderId);
        },
    ],
};