exports.slugify = (text) => {
    return text
        .toLowerCase()
        .trim()
        .replace(/ /g, "-")
        .replace(/[^\w-]+/g, "");
};

exports.capitalize = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
};