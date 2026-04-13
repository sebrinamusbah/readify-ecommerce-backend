const mediaRepo = require("./media.repository");
const uploadService = require("../../services/upload.service");

const { NotFoundError, BadRequestError } = require("../../shared/errors");
const { mediaDTO } = require("./media.dto");

exports.upload = async(userId, file) => {
    if (!file) throw new BadRequestError("No file provided");

    // upload to cloud (Cloudinary/S3 abstraction)
    const uploaded = await uploadService.uploadFile(file);

    const media = await mediaRepo.create({
        userId,
        url: uploaded.url,
        publicId: uploaded.publicId,
        type: file.mimetype,
    });

    return mediaDTO(media);
};

exports.remove = async(userId, id) => {
    const media = await mediaRepo.findById(id);

    if (!media) throw new NotFoundError("File not found");

    if (media.userId !== userId) {
        throw new BadRequestError("Unauthorized");
    }

    await uploadService.deleteFile(media.publicId);
    await mediaRepo.delete(id);
};

exports.getUserFiles = async(userId, query) => {
    const { page = 1, limit = 10 } = query;
    const offset = (page - 1) * limit;

    const { rows, count } = await mediaRepo.findByUser(userId, {
        limit,
        offset,
    });

    return {
        data: rows.map(mediaDTO),
        meta: {
            total: count,
            page: Number(page),
            pages: Math.ceil(count / limit),
        },
    };
};