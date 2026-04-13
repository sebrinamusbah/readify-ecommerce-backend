const bookRepo = require("./book.repository");
const { NotFoundError } = require("../../shared/errors");
const { bookDTO } = require("./book.dto");

exports.getAll = async(query) => {
    const { page = 1, limit = 10, search, category, minPrice, maxPrice } = query;

    const offset = (page - 1) * limit;

    const { rows, count } = await bookRepo.findAll({
        limit,
        offset,
        search,
        category,
        minPrice,
        maxPrice,
    });

    return {
        data: rows.map(bookDTO),
        meta: {
            total: count,
            page: Number(page),
            pages: Math.ceil(count / limit),
        },
    };
};

exports.getById = async(id) => {
    const book = await bookRepo.findById(id);
    if (!book) throw new NotFoundError("Book not found");
    return bookDTO(book);
};

exports.create = async(data) => {
    const book = await bookRepo.create(data);
    return bookDTO(book);
};

exports.update = async(id, data) => {
    const existing = await bookRepo.findById(id);
    if (!existing) throw new NotFoundError("Book not found");

    const updated = await bookRepo.update(id, data);
    return bookDTO(updated);
};

exports.delete = async(id) => {
    const book = await bookRepo.findById(id);
    if (!book) throw new NotFoundError("Book not found");

    await bookRepo.delete(id);
};