const service = require("./category.service");

const response = (res, status, success, message, data) =>
  res.status(status).json({ success, message, data });

class CategoryController {
  async getAll(req, res) {
    try {
      const data = await service.getAll();
      return response(res, 200, true, "OK", data);
    } catch (e) {
      return response(res, 500, false, e.message);
    }
  }

  async getById(req, res) {
    try {
      const data = await service.getById(req.params.id);
      return response(res, 200, true, "OK", data);
    } catch (e) {
      return response(res, 404, false, e.message);
    }
  }

  async getBySlug(req, res) {
    try {
      const data = await service.getBySlug(req.params.slug);
      return response(res, 200, true, "OK", data);
    } catch (e) {
      return response(res, 404, false, e.message);
    }
  }

  async create(req, res) {
    try {
      const data = await service.create(req.body);
      return response(res, 201, true, "Created", data);
    } catch (e) {
      return response(res, 400, false, e.message);
    }
  }

  async update(req, res) {
    try {
      const data = await service.update(req.params.id, req.body);
      return response(res, 200, true, "Updated", data);
    } catch (e) {
      return response(res, 400, false, e.message);
    }
  }

  async delete(req, res) {
    try {
      await service.delete(req.params.id);
      return response(res, 200, true, "Deleted");
    } catch (e) {
      return response(res, 400, false, e.message);
    }
  }

  async summary(req, res) {
    try {
      const data = await service.summary();
      return response(res, 200, true, "OK", data);
    } catch (e) {
      return response(res, 500, false, e.message);
    }
  }

  async search(req, res) {
    try {
      const data = await service.search(req.query.q);
      return response(res, 200, true, "OK", data);
    } catch (e) {
      return response(res, 400, false, e.message);
    }
  }

  async bulkCreate(req, res) {
    try {
      const data = await service.bulkCreate(req.body.categories);
      return response(res, 201, true, "Created", data);
    } catch (e) {
      return response(res, 400, false, e.message);
    }
  }
}

module.exports = new CategoryController();
