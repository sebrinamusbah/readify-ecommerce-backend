const bookService = require("./book.service");

exports.getAllBooks = async(req, res, next) => {
    try {
        const result = await bookService.getAll(req.query);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

exports.getBookById = async(req, res, next) => {
    try {
        const book = await bookService.getById(req.params.id);
        res.json(book);
    } catch (err) {
        next(err);
    }
};

exports.createBook = async(req, res, next) => {
    try {
        const book = await bookService.create(req.body);
        res.status(201).json(book);
    } catch (err) {
        next(err);
    }
};

exports.updateBook = async(req, res, next) => {
    try {
        const book = await bookService.update(req.params.id, req.body);
        res.json(book);
    } catch (err) {
        next(err);
    }
};

exports.deleteBook = async(req, res, next) => {
    try {
        await bookService.delete(req.params.id);
        res.json({ message: "Book deleted" });
    } catch (err) {
        next(err);
    }
};