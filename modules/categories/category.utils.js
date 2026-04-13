exports.isRootCategory = (category) => {
    return !category.parentId;
};