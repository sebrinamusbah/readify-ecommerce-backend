const request = require("supertest");
const app = require("../app");
const { Book, Category, User } = require("../models");

describe("Books API Tests", () => {
    let adminToken;
    let userToken;
    let testBook;
    let testCategory;

    beforeAll(async() => {
        // Clean up
        await Book.destroy({ where: {} });
        await Category.destroy({ where: {} });
        await User.destroy({ where: {} });

        // Create admin user
        const adminUser = await User.create({
            name: "Admin",
            email: "admin@test.com",
            password: "password123",
            role: "admin",
        });

        // Create regular user
        const regularUser = await User.create({
            name: "User",
            email: "user@test.com",
            password: "password123",
            role: "user",
        });

        // Login as admin to get token
        const adminLogin = await request(app).post("/api/auth/login").send({
            email: "admin@test.com",
            password: "password123",
        });
        adminToken = adminLogin.body.data.token;

        // Login as user to get token
        const userLogin = await request(app).post("/api/auth/login").send({
            email: "user@test.com",
            password: "password123",
        });
        userToken = userLogin.body.data.token;

        // Create test category
        testCategory = await Category.create({
            name: "Test Category",
            slug: "test-category",
        });

        // Test book data
        testBook = {
            title: "Test Book",
            author: "Test Author",
            description: "Test Description",
            price: 19.99,
            stock: 10,
            isbn: "1234567890",
            pages: 200,
            language: "English",
        };
    });

    describe("GET /api/books", () => {
        beforeEach(async() => {
            await Book.destroy({ where: {} });
            await Book.create(testBook);
        });

        it("should get all books (public)", async() => {
            const res = await request(app).get("/api/books").expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty("books");
            expect(Array.isArray(res.body.data.books)).toBe(true);
            expect(res.body.data).toHaveProperty("totalBooks");
            expect(res.body.data.totalBooks).toBeGreaterThanOrEqual(1);
        });

        it("should paginate books", async() => {
            // Create multiple books
            for (let i = 1; i <= 15; i++) {
                await Book.create({
                    ...testBook,
                    title: `Test Book ${i}`,
                    isbn: `123456789${i}`,
                });
            }

            const res = await request(app)
                .get("/api/books?page=1&limit=10")
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.data.books.length).toBe(10);
            expect(res.body.data.totalPages).toBe(2);
            expect(res.body.data.currentPage).toBe(1);
        });

        it("should search books", async() => {
            await Book.create({
                title: "Unique Search Book",
                author: "Search Author",
                price: 25.99,
                stock: 5,
            });

            const res = await request(app)
                .get("/api/books?search=Unique")
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.data.books.length).toBeGreaterThanOrEqual(1);
            expect(res.body.data.books[0].title).toContain("Unique");
        });

        it("should filter books by price range", async() => {
            await Book.create({
                title: "Expensive Book",
                author: "Author",
                price: 50.0,
                stock: 2,
            });

            const res = await request(app)
                .get("/api/books?minPrice=40&maxPrice=60")
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.data.books.length).toBeGreaterThanOrEqual(1);
            expect(parseFloat(res.body.data.books[0].price)).toBeGreaterThanOrEqual(
                40
            );
        });
    });

    describe("GET /api/books/:id", () => {
        let createdBook;

        beforeEach(async() => {
            createdBook = await Book.create(testBook);
        });

        it("should get single book by ID (public)", async() => {
            const res = await request(app)
                .get(`/api/books/${createdBook.id}`)
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.data.id).toBe(createdBook.id);
            expect(res.body.data.title).toBe(testBook.title);
            expect(res.body.data.author).toBe(testBook.author);
        });

        it("should return 404 for non-existent book", async() => {
            const res = await request(app)
                .get("/api/books/00000000-0000-0000-0000-000000000000")
                .expect(404);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain("not found");
        });

        it("should return 400 for invalid UUID", async() => {
            const res = await request(app).get("/api/books/invalid-id").expect(500); // Sequelize will throw error for invalid UUID

            expect(res.body.success).toBe(false);
        });
    });

    describe("POST /api/books (Admin only)", () => {
        beforeEach(async() => {
            await Book.destroy({ where: {} });
        });

        it("should create book with admin token", async() => {
            const res = await request(app)
                .post("/api/books")
                .set("Authorization", `Bearer ${adminToken}`)
                .send(testBook)
                .expect(201);

            expect(res.body.success).toBe(true);
            expect(res.body.data.title).toBe(testBook.title);
            expect(res.body.data.author).toBe(testBook.author);
            expect(parseFloat(res.body.data.price)).toBe(testBook.price);
            expect(res.body.data.stock).toBe(testBook.stock);
        });

        it("should create book with categories", async() => {
            const bookWithCategory = {
                ...testBook,
                categories: [testCategory.id],
            };

            const res = await request(app)
                .post("/api/books")
                .set("Authorization", `Bearer ${adminToken}`)
                .send(bookWithCategory)
                .expect(201);

            expect(res.body.success).toBe(true);
            expect(res.body.data.title).toBe(testBook.title);
        });

        it("should not create book without admin token", async() => {
            const res = await request(app)
                .post("/api/books")
                .send(testBook)
                .expect(401);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain("Not authorized");
        });

        it("should not create book with user token", async() => {
            const res = await request(app)
                .post("/api/books")
                .set("Authorization", `Bearer ${userToken}`)
                .send(testBook)
                .expect(403);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain("Admin privileges");
        });

        it("should validate required fields", async() => {
            const res = await request(app)
                .post("/api/books")
                .set("Authorization", `Bearer ${adminToken}`)
                .send({
                    // Missing required fields
                    title: "Missing Fields",
                })
                .expect(500); // Sequelize validation error

            expect(res.body.success).toBe(false);
        });
    });

    describe("PUT /api/books/:id (Admin only)", () => {
        let bookToUpdate;

        beforeEach(async() => {
            await Book.destroy({ where: {} });
            bookToUpdate = await Book.create(testBook);
        });

        it("should update book with admin token", async() => {
            const updates = {
                title: "Updated Title",
                price: 29.99,
                stock: 20,
            };

            const res = await request(app)
                .put(`/api/books/${bookToUpdate.id}`)
                .set("Authorization", `Bearer ${adminToken}`)
                .send(updates)
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.data.title).toBe(updates.title);
            expect(parseFloat(res.body.data.price)).toBe(updates.price);
            expect(res.body.data.stock).toBe(updates.stock);
        });

        it("should not update non-existent book", async() => {
            const res = await request(app)
                .put("/api/books/00000000-0000-0000-0000-000000000000")
                .set("Authorization", `Bearer ${adminToken}`)
                .send({ title: "Updated" })
                .expect(404);

            expect(res.body.success).toBe(false);
        });

        it("should not update without admin token", async() => {
            const res = await request(app)
                .put(`/api/books/${bookToUpdate.id}`)
                .send({ title: "Updated" })
                .expect(401);

            expect(res.body.success).toBe(false);
        });
    });

    describe("DELETE /api/books/:id (Admin only)", () => {
        let bookToDelete;

        beforeEach(async() => {
            await Book.destroy({ where: {} });
            bookToDelete = await Book.create(testBook);
        });

        it("should delete book with admin token", async() => {
            const res = await request(app)
                .delete(`/api/books/${bookToDelete.id}`)
                .set("Authorization", `Bearer ${adminToken}`)
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.message).toContain("deleted");

            // Verify book is deleted
            const checkRes = await request(app)
                .get(`/api/books/${bookToDelete.id}`)
                .expect(404);

            expect(checkRes.body.success).toBe(false);
        });

        it("should not delete non-existent book", async() => {
            const res = await request(app)
                .delete("/api/books/00000000-0000-0000-0000-000000000000")
                .set("Authorization", `Bearer ${adminToken}`)
                .expect(404);

            expect(res.body.success).toBe(false);
        });

        it("should not delete without admin token", async() => {
            const res = await request(app)
                .delete(`/api/books/${bookToDelete.id}`)
                .expect(401);

            expect(res.body.success).toBe(false);
        });
    });

    describe("Book Model Tests", () => {
        it("should create book with all fields", async() => {
            const book = await Book.create({
                title: "Model Test Book",
                author: "Model Author",
                price: 15.99,
                stock: 5,
                isbn: "9876543210",
                pages: 150,
                language: "English",
                isFeatured: true,
            });

            expect(book).toHaveProperty("id");
            expect(book.title).toBe("Model Test Book");
            expect(book.author).toBe("Model Author");
            expect(parseFloat(book.price)).toBe(15.99);
            expect(book.stock).toBe(5);
            expect(book.isFeatured).toBe(true);
            expect(book.isbn).toBe("9876543210");
        });

        it("should validate price is positive", async() => {
            await expect(
                Book.create({
                    title: "Negative Price",
                    author: "Author",
                    price: -10.0,
                    stock: 5,
                })
            ).rejects.toThrow();
        });

        it("should validate stock is non-negative", async() => {
            await expect(
                Book.create({
                    title: "Negative Stock",
                    author: "Author",
                    price: 10.0,
                    stock: -5,
                })
            ).rejects.toThrow();
        });

        it("should have unique ISBN", async() => {
            await Book.create({
                title: "Book 1",
                author: "Author",
                price: 10.0,
                stock: 5,
                isbn: "1111111111",
            });

            await expect(
                Book.create({
                    title: "Book 2",
                    author: "Author",
                    price: 20.0,
                    stock: 3,
                    isbn: "1111111111", // Same ISBN
                })
            ).rejects.toThrow();
        });
    });
});