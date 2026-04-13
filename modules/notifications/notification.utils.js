exports.buildMessage = (type, data) => {
    switch (type) {
        case "ORDER_CREATED":
            return `Your order #${data.orderId} has been created`;

        case "PAYMENT_SUCCESS":
            return `Payment successful for order #${data.orderId}`;

        case "BOOK_REVIEWED":
            return `Someone reviewed your book`;

        default:
            return "You have a new notification";
    }
};