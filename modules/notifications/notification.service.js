const notificationRepo = require("./notification.repository");
const { NotFoundError, BadRequestError } = require("../../shared/errors");

const { notificationDTO } = require("./notification.dto");

exports.getForUser = async(userId, query) => {
    const { page = 1, limit = 10 } = query;
    const offset = (page - 1) * limit;

    const { rows, count } = await notificationRepo.findByUser(userId, {
        limit,
        offset,
    });

    return {
        data: rows.map(notificationDTO),
        meta: {
            total: count,
            page: Number(page),
            pages: Math.ceil(count / limit),
        },
    };
};

exports.markAsRead = async(userId, id) => {
    const notification = await notificationRepo.findById(id);

    if (!notification) throw new NotFoundError("Notification not found");

    if (notification.userId !== userId) {
        throw new BadRequestError("Unauthorized");
    }

    await notificationRepo.update(id, { read: true });

    return { success: true };
};

exports.delete = async(userId, id) => {
    const notification = await notificationRepo.findById(id);

    if (!notification) throw new NotFoundError("Notification not found");

    if (notification.userId !== userId) {
        throw new BadRequestError("Unauthorized");
    }

    await notificationRepo.delete(id);
};