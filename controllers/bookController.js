const { Book, Category } = require("../models");
const cloudinary = require("../config/cloudinary");

// ================================
// Helper: Upload image to Cloudinary
// ================================
const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "books",
        resource_type: "image",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      },
    );

    stream.end(fileBuffer);
  });
};

// ================================
// CREATE BOOK (ADMIN)
// ================================
exports.createBook = async (req, res) => {
  try {
    const {
      title,
      author,
      isbn,
      description,
      price,
      stock,
      pages,
      language,
      isFeatured,
      categoryId,
    } = req.body;

    // ================= VALIDATION =================
    if (!title || !author || !price || !categoryId) {
      return res.status(400).json({
        success: false,
        error: "Title, author, price, and category are required",
      });
    }

    if (isNaN(price) || price < 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid price",
      });
    }

    if (stock && isNaN(stock)) {
      return res.status(400).json({
        success: false,
        error: "Invalid stock value",
      });
    }

    // ================= CATEGORY CHECK =================
    const category = await Category.findByPk(categoryId);
    if (!category) {
      return res.status(400).json({
        success: false,
        error: "Category not found",
      });
    }

    // ================= ISBN UNIQUE =================
    if (isbn) {
      const existing = await Book.findOne({ where: { isbn } });
      if (existing) {
        return res.status(400).json({
          success: false,
          error: "Book with this ISBN already exists",
        });
      }
    }

    // ================= IMAGE UPLOAD =================
    let imageUrl =
      "https://via.placeholder.com/300x400/4A90E2/FFFFFF?text=Book+Cover";

    if (req.file) {
      try {
        const result = await uploadToCloudinary(req.file.buffer);
        imageUrl = result.secure_url;
      } catch (uploadError) {
        console.error("Cloudinary Error:", uploadError);
        return res.status(500).json({
          success: false,
          error: "Image upload failed",
        });
      }
    }

    // ================= CREATE BOOK =================
    const book = await Book.create({
      title: title.trim(),
      author: author.trim(),
      isbn: isbn || null,
      description: description || null,
      price: parseFloat(price),
      stock: stock ? parseInt(stock) : 0,
      pages: pages ? parseInt(pages) : null,
      language: language || "English",
      isFeatured: isFeatured === "true" || isFeatured === true,
      categoryId,
      coverImage: imageUrl,
    });

    return res.status(201).json({
      success: true,
      message: "Book created successfully",
      data: book,
    });
  } catch (error) {
    console.error("[CREATE BOOK ERROR]", error);
    return res.status(500).json({
      success: false,
      error: "Failed to create book",
    });
  }
};
