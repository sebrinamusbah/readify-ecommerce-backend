const mediaService = require("./media.service");

exports.upload = async(req, res, next) => {
    try {
        const file = req.file; // from multer
        const result = await mediaService.upload(req.user.id, file);

        res.status(201).json(result);
    } catch (err) {
        next(err);
    }
};

exports.remove = async(req, res, next) => {
    try {
        await mediaService.remove(req.user.id, req.params.id);
        res.json({ message: "Deleted" });
    } catch (err) {
        next(err);
    }
};

exports.getMyFiles = async(req, res, next) => {
    try {
        const files = await mediaService.getUserFiles(req.user.id, req.query);
        res.json(files);
    } catch (err) {
        next(err);
    }
};