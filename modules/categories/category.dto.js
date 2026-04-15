exports.categoryDTO = (cat) => ({
    id: cat.id,
    name: cat.name,
    parentId: cat.parentId,
});

exports.buildTree = (categories) => {
    const map = {};
    const roots = [];

    categories.forEach((cat) => {
        map[cat.id] = {...cat.toJSON(), children: [] };
    });

    categories.forEach((cat) => {
        if (cat.parentId) {
            map[cat.parentId] ?.children.push(map[cat.id]);
        } else {
            roots.push(map[cat.id]);

        }
    });

    return roots;
};