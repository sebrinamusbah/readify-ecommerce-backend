const authService = require("../services/authService");

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password, address, phone } = req.body;
    const result = await authService.registerUser({
      name,
      email,
      password,
      address,
      phone,
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      token: result.token,
      user: result.user,
    });
  } catch (error) {
    console.error("[ERROR] Registration failed:", error);

    if (error.message === "User already exists with this email") {
      return res.status(409).json({
        success: false,
        error: error.message,
      });
    }

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
    const ip = req.ip || req.connection.remoteAddress;

    const result = await authService.loginUser({ email, password, ip });

    res.json({
      success: true,
      message: "Login successful",
      token: result.token,
      user: result.user,
    });
  } catch (error) {
    console.error("[ERROR] Login failed:", error);

    if (error.message === "Too many login attempts") {
      return res.status(429).json({
        success: false,
        error: error.message,
      });
    }

    if (
      error.message === "Invalid email or password" ||
      error.message === "Account is deactivated"
    ) {
      const statusCode = error.message === "Account is deactivated" ? 403 : 401;
      return res.status(statusCode).json({
        success: false,
        error: error.message,
      });
    }

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
    const userResponse = authService.getUserProfile(user);

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

    const updatedUser = await authService.updateUserProfile(user.id, {
      name,
      address,
      phone,
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

    await authService.changeUserPassword(
      user.id,
      currentPassword,
      newPassword,
      user.email
    );

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("[ERROR] Change password failed:", error);

    if (error.message === "Current password is incorrect") {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

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
  try {
    authService.logoutUser(req.user.email);
    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("[ERROR] Logout failed:", error);
    res.status(500).json({
      success: false,
      error: "Failed to logout",
    });
  }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh-token
// @access  Private
exports.refreshToken = async (req, res) => {
  try {
    const user = req.user;
    const token = await authService.refreshAuthToken(user);

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
    await authService.processForgotPassword(email);

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

    await authService.resetUserPassword(token, password);

    res.json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("[ERROR] Reset password failed:", error.message);

    const statusCode = error.message.includes("token") ? 400 : 500;
    res.status(statusCode).json({
      success: false,
      error: "Invalid or expired token",
    });
  }
};
