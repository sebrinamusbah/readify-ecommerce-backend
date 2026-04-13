exports.sanitizeUser = (user) => {
    const obj = user.toJSON();
    delete obj.password;
    return obj;
};