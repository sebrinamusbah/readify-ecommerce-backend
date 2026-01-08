# Create README
echo "# Readify E-commerce Backend

A full-featured Node.js e-commerce backend for a bookstore.

## 🚀 Features
- User authentication with JWT
- Book catalog with search/filter
- Shopping cart functionality
- Order management
- Payment integration (Stripe)
- Admin dashboard
- Reviews and ratings system

## 🛠️ Tech Stack
- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL, Sequelize ORM
- **Authentication:** JWT, bcrypt
- **Payment:** Stripe API
- **Security:** Helmet, CORS, rate limiting

## 📦 Installation
1. Clone repository: \`git clone https://github.com/sebrinamusbah/readify-ecommerce-backend.git\`
2. Install dependencies: \`npm install\`
3. Configure environment variables in \`.env\`
4. Start server: \`npm start\`

## 🔧 Environment Variables
Create a \`.env\` file with:
\`\`\`
DB_HOST=localhost
DB_PORT=5432
DB_NAME=your_db
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_jwt_secret
STRIPE_SECRET_KEY=your_stripe_key
PORT=5000
\`\`\`

## 📁 Project Structure
\`\`\`
├── controllers/     # Business logic
├── middleware/      # Custom middleware
├── models/         # Database models
├── routes/         # API routes
├── config/         # Configuration files
├── server.js       # Entry point
└── package.json    # Dependencies
\`\`\`

## 🚦 API Endpoints
- \`GET /api/health\` - Health check
- \`POST /api/auth/register\` - User registration
- \`POST /api/auth/login\` - User login
- \`GET /api/books\` - Get all books
- \`GET /api/cart\` - Get user cart

## 📝 License
MIT
" > README.md

# Add and commit README
git add README.md
git commit -m "docs: Add project README"
git push origin main
