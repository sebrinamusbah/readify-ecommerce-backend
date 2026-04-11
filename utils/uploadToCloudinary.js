const cloudinary = require("../config/cloudinary");

const uploadToCloudinary = (buffer) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream({
                folder: "books", // all book images go here
            },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            },
        );

        stream.end(buffer);
    });
};

module.exports = uploadToCloudinary;