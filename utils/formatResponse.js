const formatResponse = (
    success,
    data = null,
    message = "",
    statusCode = 200
) => {
    const response = {
        success,
        message,
        data,
        statusCode,
        timestamp: new Date().toISOString(),
    };

    // Remove null or undefined fields
    Object.keys(response).forEach((key) => {
        if (response[key] === null || response[key] === undefined) {
            delete response[key];
        }
    });

    return response;
};

module.exports = formatResponse;