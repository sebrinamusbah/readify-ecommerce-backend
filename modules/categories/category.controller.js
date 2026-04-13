const categoryService = require("./category.service");

exports.getAll = async(req, res, next) => {
    try {
        const data = await categoryService.getAll();
        res.json(data);
    } catch (err) {
        next(err);
    }
};

exports.getById = async(req, res, next) => {
    try {
        const data = await categoryService.getById(req.params.id);
        res.json(data);
    } catch (err) {
        next(err);
    }
};

exports.create = async(req, res, next) => {
    try {
        const data = await categoryService.create(req.body);
        res.status(201).json(data);
    } catch (err) {
        next(err);
    }
};

exports.update = async(req, res, next) => {
    try {
        const data = await categoryService.update(req.params.id, req.body);
        res.json(data);
    } catch (err) {
        next(err);
    }
};

exports.delete = async(req, res, next) => {
    try {
        await categoryService.delete(req.params.id);
        res.json({ message: "Category deleted" });
    } catch (err) {
        next(err);
    }
};