const { Category, Book } = require("../../models");
const { Op, sequelize } = require("sequelize");

class CategoryRepository {
  async findAllWithBookCount() {
    return Category.findAll({
      attributes: [
        "id",
        "name",
        "slug",
        "description",
        "createdAt",
        [sequelize.fn("COUNT", sequelize.col("books.id")), "bookCount"],
      ],
      include: [
        {
          model: Book,
          as: "books",
          attributes: [],
          required: false,
        },
      ],
      group: ["Category.id"],
      order: [["name", "ASC"]],
    });
  }

  async findById(id) {
    return Category.findByPk(id, {
      include: [
        {
          model: Book,
          as: "books",
          attributes: ["id", "title", "author", "price", "coverImage", "stock"],
        },
      ],
    });
  }

  async findBySlug(slug) {
    return Category.findOne({
      where: { slug },
      include: [
        {
          model: Book,
          as: "books",
          limit: 20,
          order: [["createdAt", "DESC"]],
        },
      ],
    });
  }

  async findDuplicate(name, slug, excludeId = null) {
    return Category.findOne({
      where: {
        ...(excludeId && {
          id: {
            [Op.ne]: excludeId,
          },
        }),
        [Op.or]: [{ name }, { slug }],
      },
    });
  }

  async create(data) {
    return Category.create(data);
  }

  async update(category, data) {
    return category.update(data);
  }

  async delete(category) {
    return category.destroy();
  }

  async countBooks(categoryId) {
    return Book.count({ where: { categoryId } });
  }

  async findSummary() {
    const categories = await Category.findAll({
      attributes: ["id", "name", "slug"],
    });

    const result = await Promise.all(
      categories.map(async (c) => {
        const count = await this.countBooks(c.id);
        return { ...c.toJSON(), bookCount: count };
      }),
    );

    return result.filter((c) => c.bookCount > 0);
  }
}

module.exports = new CategoryRepository();
