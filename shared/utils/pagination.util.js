exports.getPagination = (page = 1, limit = 10) => {
    const offset = (page - 1) * limit;

    return {
        limit: Number(limit),
        offset,
    };
};

exports.getMeta = (page, limit, total) => {
    return {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit),
    };
};