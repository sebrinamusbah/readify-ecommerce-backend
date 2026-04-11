const { Book, Category, Review, User } = require("../models");
const { Op } = require("sequelize");
const cloudinary = require("../config/cloudinary");

// ================================
// Helper: Upload image to Cloudinary
// ================================
const uploadToCloudinary = (fileBuffer) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream({ folder: "books" },
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
exports.createBook = async(req, res) => {
    try {
        let imageUrl = null;

        // upload image if exists
        if (req.file) {
            const result = await uploadToCloudinary(req.file.buffer);
            imageUrl = result.secure_url;
        }

        const book = await Book.create({
            title: req.body.title,
            author: req.body.author,
            isbn: req.body.isbn,
            description: req.body.description,
            price: req.body.price,
            stock: req.body.stock,
            pages: req.body.pages,
            language: req.body.language || "English",
            isFeatured: req.body.isFeatured || false,
            categoryId: req.body.categoryId,
            coverImage: imageUrl, // Cloudinary URL
        });

        res.status(201).json({
            success: true,
            message: "Book created successfully",
            data: book,
        });
    } catch (error) {
        console.error("[CREATE BOOK ERROR]", error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
};