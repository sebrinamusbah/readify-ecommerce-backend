exports.success = (data, message = "Success") => {
    return {
        success: true,
        message,
        data,
    };
};

exports.error = (message = "Error", code = 500) => {
    return {
        success: false,
        message,
        code,
    };
};