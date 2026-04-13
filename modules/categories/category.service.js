const categoryRepo = require("./category.repository");
const { NotFoundError } = require("../../shared/errors");
const { categoryDTO, buildTree } = require("./category.dto");

exports.getAll = async() => {
    const categories = await categoryRepo.findAll();

    // build hierarchical tree
    const tree = buildTree(categories);

    return tree;
};

exports.getById = async(id) => {
    const category = await categoryRepo.findById(id);
    if (!category) throw new NotFoundError("Category not found");

    return categoryDTO(category);
};

exports.create = async(data) => {
    const category = await categoryRepo.create(data);
    return categoryDTO(category);
};

exports.update = async(id, data) => {
    const existing = await categoryRepo.findById(id);
    if (!existing) throw new NotFoundError("Category not found");

    const updated = await categoryRepo.update(id, data);
    return categoryDTO(updated);
};

exports.delete = async(id) => {
    const existing = await categoryRepo.findById(id);
    if (!existing) throw new NotFoundError("Category not found");

    await categoryRepo.delete(id);
};