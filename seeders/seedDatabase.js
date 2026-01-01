const { User, Book, Category } = require("../models");
const { sequelize } = require("../config/db");

const seedDatabase = async () => {
  try {
    console.log("🌱 Seeding database...");

    // Ensure database connection
    await sequelize.authenticate();
    console.log("✅ Database connection established successfully.");

    // Create tables first
    console.log("🔄 Creating tables...");
    await sequelize.sync({ force: true });
    console.log("✅ Tables created");

    // Create categories
    const categories = await Category.bulkCreate([
      { name: "Fiction", slug: "fiction" },
      { name: "Non-Fiction", slug: "non-fiction" },
      { name: "Science Fiction", slug: "science-fiction" },
      { name: "Fantasy", slug: "fantasy" },
      { name: "Biography", slug: "biography" },
      { name: "Self-Help", slug: "self-help" },
      { name: "Technology", slug: "technology" },
      { name: "Business", slug: "business" },
      { name: "Romance", slug: "romance" },
      { name: "Mystery", slug: "mystery" },
      { name: "History", slug: "history" },
      { name: "Science", slug: "science" },
    ]);

    // Create admin user
    const adminUser = await User.create({
      name: "Admin User",
      email: "admin@bookstore.com",
      password: "password123",
      role: "admin",
    });

    // Create regular user
    const regularUser = await User.create({
      name: "John Doe",
      email: "john@example.com",
      password: "password123",
      role: "user",
    });

    // Create books WITH categoryId (ONE-TO-MANY)
    const books = await Book.bulkCreate([
      // Book 1 - Fiction
      {
        title: "The Book Thief",
        author: "Markus Zusak",
        isbn: "9780375831003",
        description: "Historical novel set in Nazi Germany",
        price: 13.99,
        stock: 40,
        pages: 552,
        language: "English",
        rating: 4.7,
        coverImage:
          "https://images-na.ssl-images-amazon.com/images/I/81Ls+SBCLiL.jpg",
        categoryId: categories[0].id, // Fiction
      },
      // Book 2 - Science Fiction
      {
        title: "The Martian",
        author: "Andy Weir",
        isbn: "9780804139021",
        description: "Science fiction about an astronaut stranded on Mars",
        price: 15.99,
        stock: 55,
        pages: 369,
        language: "English",
        isFeatured: true,
        rating: 4.6,
        coverImage:
          "https://images-na.ssl-images-amazon.com/images/I/91p5a1rqH9L.jpg",
        categoryId: categories[2].id, // Science Fiction
      },
      // Book 3 - Mystery
      {
        title: "The Girl on the Train",
        author: "Paula Hawkins",
        isbn: "9781594634024",
        description: "Psychological thriller novel",
        price: 14.99,
        stock: 45,
        pages: 336,
        language: "English",
        rating: 4.1,
        coverImage:
          "https://images-na.ssl-images-amazon.com/images/I/91HHqVTAJQL.jpg",
        categoryId: categories[9].id, // Mystery
      },
      // Book 4 - Fiction
      {
        title: "The Great Gatsby",
        author: "F. Scott Fitzgerald",
        isbn: "9780743273565",
        description: "A classic novel of the Jazz Age",
        price: 12.99,
        stock: 50,
        pages: 180,
        language: "English",
        isFeatured: true,
        rating: 4.5,
        coverImage:
          "https://images-na.ssl-images-amazon.com/images/I/71FTb9X6wsL.jpg",
        categoryId: categories[0].id, // Fiction
      },
      // Book 5 - Fiction
      {
        title: "To Kill a Mockingbird",
        author: "Harper Lee",
        isbn: "9780061120084",
        description: "A novel about racial injustice",
        price: 14.99,
        stock: 30,
        pages: 281,
        language: "English",
        isFeatured: true,
        rating: 4.8,
        coverImage:
          "https://images-na.ssl-images-amazon.com/images/I/81gepf1eMqL.jpg",
        categoryId: categories[0].id, // Fiction
      },
      // Book 6 - Science Fiction
      {
        title: "1984",
        author: "George Orwell",
        isbn: "9780451524935",
        description: "Dystopian social science fiction",
        price: 10.99,
        stock: 40,
        pages: 328,
        language: "English",
        rating: 4.7,
        coverImage:
          "https://images-na.ssl-images-amazon.com/images/I/71kxa1-0mfL.jpg",
        categoryId: categories[2].id, // Science Fiction
      },
      // Book 7 - Fiction
      {
        title: "Pride and Prejudice",
        author: "Jane Austen",
        isbn: "9780141439518",
        description: "Romantic novel of manners",
        price: 9.99,
        stock: 35,
        pages: 432,
        language: "English",
        rating: 4.6,
        coverImage:
          "https://images-na.ssl-images-amazon.com/images/I/71Q1tPupKjL.jpg",
        categoryId: categories[0].id, // Fiction
      },
      // Book 8 - Fantasy
      {
        title: "The Hobbit",
        author: "J.R.R. Tolkien",
        isbn: "9780547928227",
        description: "Fantasy novel about Bilbo Baggins",
        price: 15.99,
        stock: 45,
        pages: 310,
        language: "English",
        isFeatured: true,
        rating: 4.9,
        coverImage:
          "https://images-na.ssl-images-amazon.com/images/I/91b0C2YNSrL.jpg",
        categoryId: categories[3].id, // Fantasy
      },
      // Book 9 - Fantasy
      {
        title: "Harry Potter and the Sorcerer's Stone",
        author: "J.K. Rowling",
        isbn: "9780590353427",
        description: "The first book in the Harry Potter series",
        price: 19.99,
        stock: 60,
        pages: 309,
        language: "English",
        isFeatured: true,
        rating: 4.8,
        coverImage:
          "https://images-na.ssl-images-amazon.com/images/I/81iqZ2HHD-L.jpg",
        categoryId: categories[3].id, // Fantasy
      },
      // Book 10 - Fiction
      {
        title: "The Catcher in the Rye",
        author: "J.D. Salinger",
        isbn: "9780316769488",
        description: "Novel about teenage rebellion",
        price: 11.99,
        stock: 25,
        pages: 277,
        language: "English",
        rating: 4.0,
        coverImage:
          "https://images-na.ssl-images-amazon.com/images/I/91HPG31dTwL.jpg",
        categoryId: categories[0].id, // Fiction
      },
      // Book 11 - Mystery
      {
        title: "The Da Vinci Code",
        author: "Dan Brown",
        isbn: "9780307474278",
        description: "Mystery thriller novel",
        price: 16.99,
        stock: 55,
        pages: 489,
        language: "English",
        rating: 4.2,
        coverImage:
          "https://images-na.ssl-images-amazon.com/images/I/91Q5dCjc2KL.jpg",
        categoryId: categories[9].id, // Mystery
      },
      // Book 12 - Fiction
      {
        title: "The Alchemist",
        author: "Paulo Coelho",
        isbn: "9780061122415",
        description: "Philosophical novel about following your dreams",
        price: 13.99,
        stock: 70,
        pages: 197,
        language: "English",
        isFeatured: true,
        rating: 4.5,
        coverImage:
          "https://images-na.ssl-images-amazon.com/images/I/71aFt4%2BOTOL.jpg",
        categoryId: categories[0].id, // Fiction
      },
      // Book 13 - Self-Help
      {
        title: "Atomic Habits",
        author: "James Clear",
        isbn: "9780735211292",
        description: "Guide to building good habits and breaking bad ones",
        price: 27.99,
        stock: 80,
        pages: 320,
        language: "English",
        rating: 4.7,
        coverImage:
          "https://images-na.ssl-images-amazon.com/images/I/81wgcld4wxL.jpg",
        categoryId: categories[5].id, // Self-Help
      },
      // Book 14 - Non-Fiction
      {
        title: "Thinking, Fast and Slow",
        author: "Daniel Kahneman",
        isbn: "9780374533557",
        description: "Book about the two systems that drive thinking",
        price: 29.99,
        stock: 40,
        pages: 499,
        language: "English",
        rating: 4.6,
        coverImage:
          "https://images-na.ssl-images-amazon.com/images/I/71wHr3XOWbL.jpg",
        categoryId: categories[1].id, // Non-Fiction
      },
      // Book 15 - Non-Fiction
      {
        title: "Sapiens: A Brief History of Humankind",
        author: "Yuval Noah Harari",
        isbn: "9780062316097",
        description: "Exploration of the history of human species",
        price: 24.99,
        stock: 65,
        pages: 443,
        language: "English",
        isFeatured: true,
        rating: 4.7,
        coverImage:
          "https://images-na.ssl-images-amazon.com/images/I/713jIoMO3UL.jpg",
        categoryId: categories[1].id, // Non-Fiction
      },
      // Book 16 - Science Fiction
      {
        title: "Dune",
        author: "Frank Herbert",
        isbn: "9780441172719",
        description: "Epic science fiction novel",
        price: 18.99,
        stock: 40,
        pages: 412,
        language: "English",
        rating: 4.8,
        coverImage:
          "https://images-na.ssl-images-amazon.com/images/I/81zqOQqQZ9L.jpg",
        isFeatured: true,
        categoryId: categories[2].id, // Science Fiction
      },
      // Book 17 - Mystery
      {
        title: "The Silent Patient",
        author: "Alex Michaelides",
        isbn: "9781250301697",
        description: "Psychological thriller mystery novel",
        price: 16.99,
        stock: 35,
        pages: 325,
        language: "English",
        rating: 4.5,
        coverImage:
          "https://images-na.ssl-images-amazon.com/images/I/81pL6L7CXpL.jpg",
        categoryId: categories[9].id, // Mystery
      },
      // Book 18 - Biography
      {
        title: "Becoming",
        author: "Michelle Obama",
        isbn: "9781524763138",
        description: "Memoir by former First Lady Michelle Obama",
        price: 22.99,
        stock: 75,
        pages: 426,
        language: "English",
        isFeatured: true,
        rating: 4.9,
        coverImage:
          "https://images-na.ssl-images-amazon.com/images/I/91R5mKq+JjL.jpg",
        categoryId: categories[4].id, // Biography
      },
      // Book 19 - Business
      {
        title: "The Lean Startup",
        author: "Eric Ries",
        isbn: "9780307887894",
        description: "How today's entrepreneurs use continuous innovation",
        price: 21.99,
        stock: 50,
        pages: 336,
        language: "English",
        rating: 4.6,
        coverImage:
          "https://images-na.ssl-images-amazon.com/images/I/81RCqzwrYzL.jpg",
        categoryId: categories[7].id, // Business
      },
      // Book 20 - Fantasy
      {
        title: "The Lord of the Rings",
        author: "J.R.R. Tolkien",
        isbn: "9780544003415",
        description: "Epic fantasy trilogy",
        price: 29.99,
        stock: 40,
        pages: 1178,
        language: "English",
        isFeatured: true,
        rating: 4.9,
        coverImage:
          "https://images-na.ssl-images-amazon.com/images/I/71jLBXtWJWL.jpg",
        categoryId: categories[3].id, // Fantasy
      },
      // Book 21 - Science Fiction
      {
        title: "The Hunger Games",
        author: "Suzanne Collins",
        isbn: "9780439023481",
        description: "Dystopian young adult novel",
        price: 14.99,
        stock: 65,
        pages: 374,
        language: "English",
        rating: 4.7,
        coverImage:
          "https://images-na.ssl-images-amazon.com/images/I/71WSzS6zvCL.jpg",
        categoryId: categories[2].id, // Science Fiction
      },
      // Book 22 - Biography
      {
        title: "Educated",
        author: "Tara Westover",
        isbn: "9780399590504",
        description: "Memoir about education and self-discovery",
        price: 18.99,
        stock: 55,
        pages: 334,
        language: "English",
        isFeatured: true,
        rating: 4.8,
        coverImage:
          "https://images-na.ssl-images-amazon.com/images/I/71yE9wEKVML.jpg",
        categoryId: categories[4].id, // Biography
      },
      // Book 23 - Fiction
      {
        title: "The Nightingale",
        author: "Kristin Hannah",
        isbn: "9780312577223",
        description: "Historical fiction about WWII",
        price: 16.99,
        stock: 45,
        pages: 440,
        language: "English",
        rating: 4.8,
        coverImage:
          "https://images-na.ssl-images-amazon.com/images/I/81G-YGZAcIL.jpg",
        categoryId: categories[0].id, // Fiction
      },
      // Book 24 - Science Fiction
      {
        title: "Project Hail Mary",
        author: "Andy Weir",
        isbn: "9780593135204",
        description: "Science fiction space adventure",
        price: 19.99,
        stock: 60,
        pages: 476,
        language: "English",
        isFeatured: true,
        rating: 4.8,
        coverImage:
          "https://images-na.ssl-images-amazon.com/images/I/91p5a1rqH9L.jpg",
        categoryId: categories[2].id, // Science Fiction
      },
    ]);

    console.log("✅ Database seeded successfully!");
    console.log(`📚 Created ${books.length} books`);
    console.log(`📂 Created ${categories.length} categories`);
    console.log(`👥 Created 2 users (admin & regular)`);

    // Show summary
    console.log("\n📊 SEEDER SUMMARY:");
    console.log("==================");
    categories.forEach((cat, idx) => {
      const bookCount = books.filter((b) => b.categoryId === cat.id).length;
      console.log(`${cat.name}: ${bookCount} books`);
    });

    console.log("\n🏠 Featured Books for Homepage:");
    books
      .filter((b) => b.isFeatured)
      .slice(0, 6)
      .forEach((b, i) => {
        console.log(`${i + 1}. ${b.title} - $${b.price} ⭐${b.rating}`);
      });

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error.message);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
