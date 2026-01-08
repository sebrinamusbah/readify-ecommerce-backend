const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Import security middleware
const { securityMiddleware, authLimiter } = require('./middleware/securityMiddleware');

// Import database connection
const { sequelize } = require('./config/db');

// Import routes
const authRoutes = require('./routes/authRoutes');
const bookRoutes = require('./routes/bookRoutes');
const adminRoutes = require('./routes/adminRoutes');
const cartRoutes = require('./routes/cartRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const reviewRoutes = require('./routes/reviewRoutes');

// Initialize Express app
const app = express();

// ========================
// SECURITY MIDDLEWARE
// ========================

// Apply all security middleware from the array (includes helmet + custom security)
app.use(securityMiddleware);

// Rate limiting for all routes (optional - you can comment this out if too restrictive)
// app.use(authLimiter); // Comment this out for now since it's very restrictive (10 requests/15min)

// ========================
// BASIC MIDDLEWARE
// ========================

// CORS configuration
app.use(cors({
    origin: process.env.NODE_ENV === 'production' ?
        process.env.CORS_ORIGIN ?.split(',') || ['https://yourdomain.com'] : ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Request logging
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ========================
// DATABASE CONNECTION
// ========================

// Test database connection
const testDatabaseConnection = async() => {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connection established successfully.');

        // Sync models (use with caution in production)
        if (process.env.NODE_ENV === 'development') {
            // await sequelize.sync({ alter: true });
            console.log('📊 Database models are ready.');
        }
    } catch (error) {
        console.error('❌ Unable to connect to the database:', error.message);
        console.error('🔧 Check your DATABASE_URL in .env file');
        process.exit(1);
    }
};

// ========================
// ROUTES
// ========================

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Bookstore API is running 🚀',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0'
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reviews', reviewRoutes);

// Welcome route
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Welcome to Readify Bookstore API 📚',
        documentation: 'Visit /api/health for API status',
        endpoints: {
            auth: '/api/auth',
            books: '/api/books',
            admin: '/api/admin',
            cart: '/api/cart',
                 categories: "/api/categories", 
            orders: '/api/orders',
            payments: '/api/payments'
        }
    });
});

// ========================
// ERROR HANDLING
// ========================

// 404 Not Found handler - FIXED
app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        error: `Cannot ${req.method} ${req.originalUrl}`
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('[ERROR]', err.stack);

    const statusCode = err.statusCode || 500;
    const message = process.env.NODE_ENV === 'production' ?
        'Something went wrong. Please try again later.' :
        err.message;

    res.status(statusCode).json({
        success: false,
        error: message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// ========================
// SERVER STARTUP
// ========================

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

// Start server after database connection
const startServer = async() => {
    try {
        // Test database connection
        await testDatabaseConnection();

        // Start server
        app.listen(PORT, HOST, () => {
            console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                 READIFY BOOKSTORE API                                        ║
╠══════════════════════════════════════════════════════════════════════════════╣
║ 🔗 Server:  http://${HOST}:${PORT}                                           ║
║ 🌱 Environment: ${process.env.NODE_ENV || 'development'}                     ║
║ 🗄️  Database: ${sequelize.config.database}                                  ║
║ 📁 Schema: project2                                                          ║
║ ✅ Status: Ready                                                             ║
╚══════════════════════════════════════════════════════════════════════════════╝
            `);

            console.log('\n📦 Available Endpoints:');
            console.log('   🔐 Auth:    POST /api/auth/register');
            console.log('   🔐 Auth:    POST /api/auth/login');
            console.log('   🏥 Health:  GET  /api/health');
            console.log('   📚 Books:   GET  /api/books');
            console.log('   🛒 Cart:    GET  /api/cart');
            console.log('   📦 Orders:  GET  /api/orders');
            console.log('   💳 Payments:GET  /api/payments');
            console.log('\n🛡️  Security Features:');
            console.log('   ✅ Rate Limiting');
            console.log('   ✅ CORS Protection');
            console.log('   ✅ Security Headers');
            console.log('   ✅ Input Validation');
            console.log('\n💡 Tip: Use /api/health to check API status');
        });

    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

// Handle graceful shutdown
process.on('SIGTERM', async() => {
    console.log('🛑 SIGTERM received. Shutting down gracefully...');
    await sequelize.close();
    console.log('✅ Database connection closed.');
    process.exit(0);
});

process.on('SIGINT', async() => {
    console.log('🛑 SIGINT received. Shutting down gracefully...');
    await sequelize.close();
    console.log('✅ Database connection closed.');
    process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('💥 Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Start the server
startServer();

module.exports = app; // For testing
