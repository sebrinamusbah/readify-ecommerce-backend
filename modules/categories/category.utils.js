const slugify = require("slugify");

/**
 * Generate SEO-friendly slug from category name
 */
const generateSlug = (name) => {
  if (!name) return null;

  return slugify(name, {
    lower: true,
    strict: true,
    remove: /[*+~.()'"!:@]/g,
  });
};

/**
 * Normalize category name (clean input)
 */
const normalizeName = (name) => {
  if (!name) return null;
  return name.trim().replace(/\s+/g, " ");
};

/**
 * Build safe category response object
 */
const formatCategoryResponse = (category, extra = {}) => {
  if (!category) return null;

  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
    ...extra,
  };
};

/**
 * Calculate book count safely
 */
const calculateBookCount = (books = []) => {
  return Array.isArray(books) ? books.length : 0;
};

/**
 * Filter featured books
 */
const getFeaturedBooks = (books = [], limit = 5) => {
  return books.filter((b) => b.isFeatured).slice(0, limit);
};

module.exports = {
  generateSlug,
  normalizeName,
  formatCategoryResponse,
  calculateBookCount,
  getFeaturedBooks,
};
