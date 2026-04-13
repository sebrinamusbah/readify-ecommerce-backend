const searchService = require("./search.service");

exports.searchBooks = async(req, res, next) => {
    try {
        const result = await searchService.search(req.query);
        res.json(result);
    } catch (err) {
        next(err);
    }
};