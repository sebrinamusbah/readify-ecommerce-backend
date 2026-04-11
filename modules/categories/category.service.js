const repo = require("./category.repository");
const slugify = require("slugify");

class CategoryService {
    generateSlug(name) {
        return slugify(name, {
            lower: true,
            strict: true,
            remove: /[*+~.()'"!:@]/g,
        });
    }

    async getAll() {
        return repo.findAllWithBookCount();
    }

    async getById(id) {
        const category = await repo.findById(id);
        if (!category) throw new Error("Category not found");

        const bookCount = await repo.countBooks(id);

        return {
            ...category.toJSON(),
            bookCount,
        };
    }

    async getBySlug(slug) {
        const category = await repo.findBySlug(slug);
        if (!category) throw new Error("Category not found");

        const bookCount = await repo.countBooks(category.id);

        const featuredBooks = category.books
            .filter((b) => b.isFeatured)
            .slice(0, 5);

        return {
            ...category.toJSON(),
            bookCount,
            featuredBooks,
        };
    }

    async create(data) {
        const { name, description } = data;

        if (!name || name.trim().length < 2) {
            throw new Error("Category name too short");
        }

        const slug = this.generateSlug(name);

        const exists = await repo.findDuplicate(name, slug);
        if (exists) throw new Error("Category already exists");

        return repo.create({
            name: name.trim(),
            slug,
            description: description ? .trim() || null,
        });
    }

    async update(id, data) {
        const category = await repo.findById(id);
        if (!category) throw new Error("Category not found");

        const updateData = {};

        if (data.name) {
            const slug = this.generateSlug(data.name);

            const exists = await repo.findDuplicate(data.name, slug, id);
            if (exists) throw new Error("Category already exists");

            updateData.name = data.name.trim();
            updateData.slug = slug;
        }

        if (data.description !== undefined) {
            updateData.description = data.description ? .trim() || null;
        }

        return repo.update(category, updateData);
    }

    async delete(id) {
        const category = await repo.findById(id);
        if (!category) throw new Error("Category not found");

        const bookCount = await repo.countBooks(id);
        if (bookCount > 0) {
            throw new Error(`Category has ${bookCount} books`);
        }

        return repo.delete(category);
    }

    async summary() {
        return repo.findSummary();
    }

    async search(q) {
        if (!q || q.length < 2) {
            throw new Error("Search too short");
        }

        const { Op } = require("sequelize");
        const { Category } = require("../../models");

        return Category.findAll({
            where: {
                name: {
                    [Op.like]: `%${q}%`,
                },
            },
            limit: 10,
        });
    }

    async bulkCreate(categories) {
        const data = categories.map((c) => ({
            name: c.name.trim(),
            slug: this.generateSlug(c.name),
            description: c.description || null,
        }));

        return repo.create(data);
    }
}

module.exports = new CategoryService();