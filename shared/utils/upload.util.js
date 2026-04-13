const uploadService = require("../../services/upload.service");

/**
 * Upload a single image/file
 * Keeps controller/service clean
 */
exports.uploadImage = async(file) => {
    if (!file) return null;

    const result = await uploadService.uploadFile(file);

    return {
        url: result.url,
        publicId: result.publicId,
        type: file.mimetype,
        size: file.size,
    };
};

/**
 * Upload multiple images (for books, galleries, etc.)
 */
exports.uploadMultipleImages = async(files = []) => {
    if (!files.length) return [];

    const uploads = await Promise.all(
        files.map(async(file) => {
            const result = await uploadService.uploadFile(file);

            return {
                url: result.url,
                publicId: result.publicId,
                type: file.mimetype,
                size: file.size,
            };
        }),
    );

    return uploads;
};

/**
 * Delete image from cloud storage
 */
exports.deleteImage = async(publicId) => {
    if (!publicId) return;

    return uploadService.deleteFile(publicId);
};