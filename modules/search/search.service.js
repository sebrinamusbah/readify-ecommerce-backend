const searchRepo = require("./search.repository");
const { searchDTO } = require("./search.dto");

exports.search = async(query) => {
    const { q, category, minPrice, maxPrice, page = 1, limit = 10 } = query;

    const offset = (page - 1) * limit;

    const { rows, count } = await searchRepo.searchBooks({
        q,
        category,
        minPrice,
        maxPrice,
        limit,
        offset,
    });

    return {
        data: rows.map(searchDTO),
        meta: {
            total: count,
            page: Number(page),
            pages: Math.ceil(count / limit),
        },
    };
};