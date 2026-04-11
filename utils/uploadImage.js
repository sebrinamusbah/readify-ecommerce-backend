const cloudinary = require("../../config/cloudinary");

const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "books",
        resource_type: "image",
      },
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      },
    );

    stream.end(buffer);
  });
};

module.exports = {
  uploadToCloudinary,
};
