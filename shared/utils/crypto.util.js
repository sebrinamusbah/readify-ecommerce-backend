const crypto = require("crypto");

exports.generateRandomToken = (size = 32) => {
    return crypto.randomBytes(size).toString("hex");
};

exports.hash = (value) => {
    return crypto.createHash("sha256").update(value).digest("hex");
};