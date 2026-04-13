const { queues } = require("./queue.config");

exports.addEmailJob = async(data) => {
    await queues.emailQueue.add("sendEmail", data);
};

exports.addNotificationJob = async(data) => {
    await queues.notificationQueue.add("sendNotification", data);
};

exports.addOrderJob = async(data) => {
    await queues.orderQueue.add("processOrder", data);
};