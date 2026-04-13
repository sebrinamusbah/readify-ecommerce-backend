const cloudinary = require("cloudinary").v2;
const env = require("./env.config");

cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD,
    api_key: env.CLOUDINARY_KEY,
    api_secret: env.CLOUDINARY_SECRET,
});

module.exports = cloudinary;
s;