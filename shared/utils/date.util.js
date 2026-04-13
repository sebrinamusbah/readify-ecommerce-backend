exports.isExpired = (date) => {
    return new Date(date) < new Date();
};

exports.addDays = (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};