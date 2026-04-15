module.exports = (schema) => {
    return (req, res, next) => {
        const data = {
            body: req.body,
            query: req.query,
            params: req.params,
        };

        const { error } = schema.validate(data.body || data.query, {
            abortEarly: false,
        });

        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details.map((e) => e.message),
            });
        }

        next();
    };
};