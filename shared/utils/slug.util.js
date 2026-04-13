exports.generateSlug = (title, id) => {
    return `${title.toLowerCase().replace(/ /g, "-")}-${id}`;
};