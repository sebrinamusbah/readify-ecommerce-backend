// controllers/authController.js
const { User } = require("../models");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const validator = require("validator");

// Rate limiting storage (keep this)
const loginAttempts = new Map();
const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000;

// Clean up old login attempts every hour
setInterval(
  () => {
    const now = Date.now();
    for (const [ip, attempts] of loginAttempts.entries()) {
      if (now - attempts.firstAttempt > LOCKOUT_TIME) {
        loginAttempts.delete(ip);
      }
    }
  },
  60 * 60 * 1000
);

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password, address, phone } = req.body;

    // 1. Check if user already exists
    const existingUser = await User.findOne({
      where: { email: email.toLowerCase() },
    });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: "User already exists with this email",
      });
    }

    // 2. Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // 3. Create user
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      address: address ? address.trim() : null,
      phone: phone ? phone.trim() : null,
      role: "user",
      isActive: true,
    });

    // 4. Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // 5. Remove sensitive data from response
    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      address: user.address,
      phone: user.phone,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    // 6. Send response
    res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user: userResponse,
    });
  } catch (error) {
    console.error("[ERROR] Registration failed:", error);
    res.status(500).json({
      success: false,
      error: "Registration failed",
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Rate limiting check
    const ip = req.ip || req.connection.remoteAddress;
    const attempts = loginAttempts.get(ip) || {
      count: 0,
      firstAttempt: Date.now(),
    };

    if (attempts.count >= MAX_ATTEMPTS) {
      const timeElapsed = Date.now() - attempts.firstAttempt;
      if (timeElapsed < LOCKOUT_TIME) {
        return res.status(429).json({
          success: false,
          error: "Too many login attempts. Please try again later.",
        });
      } else {
        loginAttempts.delete(ip);
      }
    }

    // 2. Find user
    const user = await User.findOne({
      where: { email: email.toLowerCase() },
    });

    // 3. Check password (with timing attack protection)
    let isPasswordValid = false;
    if (user) {
      isPasswordValid = await bcrypt.compare(password, user.password);
    } else {
      // Fake comparison for timing attack protection
      await bcrypt.compare(password, "$2b$12$fakehashforsecurity");
    }

    // 4. Handle failed login
    if (!user || !isPasswordValid) {
      const newAttempts = {
        count: attempts.count + 1,
        firstAttempt: attempts.firstAttempt || Date.now(),
      };
      loginAttempts.set(ip, newAttempts);

      console.log(`[SECURITY] Failed login for: ${email} from IP: ${ip}`);
      return res.status(401).json({
        success: false,
        error: "Invalid email or password",
      });
    }

    // 5. Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        error: "Account is deactivated",
      });
    }

    // 6. Reset attempts on success
    loginAttempts.delete(ip);

    // 7. Generate token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // 8. Create response
    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      address: user.address,
      phone: user.phone,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    // 9. Send response
    res.json({
      success: true,
      message: "Login successful",
      token,
      user: userResponse,
    });
  } catch (error) {
    console.error("[ERROR] Login failed:", error);
    res.status(500).json({
      success: false,
      error: "Login failed",
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    const user = req.user;

    // Remove password from response
    const userResponse = { ...user.toJSON() };
    delete userResponse.password;

    res.json({
      success: true,
      user: userResponse,
    });
  } catch (error) {
    console.error("[ERROR] Get profile failed:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get profile",
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { name, address, phone } = req.body;
    const user = req.user;

    // Update only provided fields
    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (address !== undefined)
      updateData.address = address ? address.trim() : null;
    if (phone !== undefined) updateData.phone = phone ? phone.trim() : null;

    await user.update(updateData);

    // Get fresh user data
    const updatedUser = await User.findByPk(user.id, {
      attributes: { exclude: ["password"] },
    });

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("[ERROR] Update profile failed:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update profile",
    });
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = req.user;

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        error: "Current password is incorrect",
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await user.update({
      password: hashedPassword,
    });

    console.log(`[SECURITY] Password changed for user: ${user.email}`);

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("[ERROR] Change password failed:", error);
    res.status(500).json({
      success: false,
      error: "Failed to change password",
    });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
exports.logout = (req, res) => {
  console.log(`[SECURITY] User logged out: ${req.user.email}`);
  res.json({
    success: true,
    message: "Logged out successfully",
  });
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh-token
// @access  Private
exports.refreshToken = async (req, res) => {
  try {
    const user = req.user;

    // Generate new token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      message: "Token refreshed successfully",
      token,
    });
  } catch (error) {
    console.error("[ERROR] Refresh token failed:", error);
    res.status(500).json({
      success: false,
      error: "Failed to refresh token",
    });
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ where: { email: email.toLowerCase() } });

    if (!user) {
      // Security: Don't reveal if user exists
      return res.json({
        success: true,
        message: "If an account exists, you will receive a reset link",
      });
    }

    // Generate reset token with separate secret
    const resetToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        purpose: "password_reset",
        timestamp: Date.now(),
      },
      process.env.JWT_SECRET + process.env.JWT_RESET_SECRET, // Use separate secret
      { expiresIn: "1h" }
    );

    // TODO: Send email
    console.log(`[PASSWORD RESET] Token for ${user.email}: ${resetToken}`);

    res.json({
      success: true,
      message: "If an account exists, you will receive a reset link",
    });
  } catch (error) {
    console.error("[ERROR] Forgot password failed:", error);
    res.status(500).json({
      success: false,
      error: "Failed to process request",
    });
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password/:token
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: "Invalid token",
      });
    }

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET + process.env.JWT_RESET_SECRET
    );

    if (decoded.purpose !== "password_reset") {
      throw new Error("Invalid token purpose");
    }

    // Find user
    const user = await User.findByPk(decoded.id);
    if (!user) {
      throw new Error("User not found");
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update password
    await user.update({ password: hashedPassword });

    console.log(`[SECURITY] Password reset for user: ${user.email}`);

    res.json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("[ERROR] Reset password failed:", error.message);
    res.status(400).json({
      success: false,
      error: "Invalid or expired token",
    });
  }
};
