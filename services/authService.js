const { User } = require("../models");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Rate limiting storage
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

class AuthService {
  // User Registration
  async registerUser({ name, email, password, address, phone }) {
    // Check if user already exists
    const existingUser = await User.findOne({
      where: { email: email.toLowerCase() },
    });
    if (existingUser) {
      throw new Error("User already exists with this email");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      address: address ? address.trim() : null,
      phone: phone ? phone.trim() : null,
      role: "user",
      isActive: true,
    });

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Remove sensitive data from response
    const userResponse = this.sanitizeUser(user);

    return { token, user: userResponse };
  }

  // User Login
  async loginUser({ email, password, ip }) {
    // Rate limiting check
    const attempts = loginAttempts.get(ip) || {
      count: 0,
      firstAttempt: Date.now(),
    };

    if (attempts.count >= MAX_ATTEMPTS) {
      const timeElapsed = Date.now() - attempts.firstAttempt;
      if (timeElapsed < LOCKOUT_TIME) {
        throw new Error("Too many login attempts");
      } else {
        loginAttempts.delete(ip);
      }
    }

    // Find user
    const user = await User.findOne({
      where: { email: email.toLowerCase() },
    });

    // Check password (with timing attack protection)
    let isPasswordValid = false;
    if (user) {
      isPasswordValid = await bcrypt.compare(password, user.password);
    } else {
      // Fake comparison for timing attack protection
      await bcrypt.compare(password, "$2b$12$fakehashforsecurity");
    }

    // Handle failed login
    if (!user || !isPasswordValid) {
      const newAttempts = {
        count: attempts.count + 1,
        firstAttempt: attempts.firstAttempt || Date.now(),
      };
      loginAttempts.set(ip, newAttempts);

      console.log(`[SECURITY] Failed login for: ${email} from IP: ${ip}`);
      throw new Error("Invalid email or password");
    }

    // Check if user is active
    if (!user.isActive) {
      throw new Error("Account is deactivated");
    }

    // Reset attempts on success
    loginAttempts.delete(ip);

    // Generate token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Create response
    const userResponse = this.sanitizeUser(user);

    return { token, user: userResponse };
  }

  // Get User Profile
  getUserProfile(user) {
    return this.sanitizeUser(user);
  }

  // Update User Profile
  async updateUserProfile(userId, { name, address, phone }) {
    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (address !== undefined)
      updateData.address = address ? address.trim() : null;
    if (phone !== undefined) updateData.phone = phone ? phone.trim() : null;

    await User.update(updateData, { where: { id: userId } });

    // Get updated user data
    const updatedUser = await User.findByPk(userId, {
      attributes: { exclude: ["password"] },
    });

    return updatedUser;
  }

  // Change Password
  async changeUserPassword(userId, currentPassword, newPassword, email) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isPasswordValid) {
      throw new Error("Current password is incorrect");
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await user.update({ password: hashedPassword });

    console.log(`[SECURITY] Password changed for user: ${email}`);
  }

  // Logout User
  logoutUser(email) {
    console.log(`[SECURITY] User logged out: ${email}`);
  }

  // Refresh Auth Token
  async refreshAuthToken(user) {
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return token;
  }

  // Forgot Password
  async processForgotPassword(email) {
    const user = await User.findOne({ where: { email: email.toLowerCase() } });

    if (!user) {
      // Security: Don't reveal if user exists
      return;
    }

    // Generate reset token with separate secret
    const resetToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        purpose: "password_reset",
        timestamp: Date.now(),
      },
      process.env.JWT_SECRET + process.env.JWT_RESET_SECRET,
      { expiresIn: "1h" }
    );

    // TODO: Send email
    console.log(`[PASSWORD RESET] Token for ${user.email}: ${resetToken}`);
  }

  // Reset Password
  async resetUserPassword(token, password) {
    if (!token) {
      throw new Error("Invalid token");
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
  }

  // Helper: Sanitize User Data
  sanitizeUser(user) {
    const userData = user.toJSON ? user.toJSON() : user;
    const { password, ...userResponse } = userData;
    return userResponse;
  }
}

module.exports = new AuthService();
