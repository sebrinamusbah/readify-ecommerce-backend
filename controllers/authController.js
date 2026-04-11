const { User } = require("../models");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const validator = require("validator");
const { sendEmail } = require("../utils/sendEmail");

// ================= RATE LIMIT =================
const loginAttempts = new Map();
const MAX_ATTEMPTS = 5;
const LOCK_TIME = 15 * 60 * 1000;

// cleanup every 30 mins
setInterval(
  () => {
    const now = Date.now();
    for (const [key, value] of loginAttempts.entries()) {
      if (now - value.firstAttempt > LOCK_TIME) {
        loginAttempts.delete(key);
      }
    }
  },
  30 * 60 * 1000,
);

// ================= REGISTER =================
exports.register = async (req, res) => {
  try {
    const { name, email, password, address, phone } = req.body;

    // ✅ Validation
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ error: "Name too short" });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ error: "Invalid email" });
    }

    if (
      !validator.isStrongPassword(password, {
        minLength: 6,
        minNumbers: 1,
      })
    ) {
      return res.status(400).json({
        error: "Password must contain at least 6 chars & 1 number",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const exists = await User.findOne({ where: { email: normalizedEmail } });
    if (exists) {
      return res.status(409).json({ error: "Email already exists" });
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password, // hashed by model hook
      address,
      phone,
    });

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Registration failed" });
  }
};

// ================= LOGIN =================
exports.login = async (req, res) => {
  try {
    const email = req.body.email.toLowerCase().trim();
    const { password } = req.body;

    const key = `${email}_${req.ip}`;
    const attempts = loginAttempts.get(key) || {
      count: 0,
      firstAttempt: Date.now(),
    };

    if (attempts.count >= MAX_ATTEMPTS) {
      if (Date.now() - attempts.firstAttempt < LOCK_TIME) {
        return res.status(429).json({ error: "Too many attempts. Try later." });
      } else {
        loginAttempts.delete(key);
      }
    }

    const user = await User.findOne({ where: { email } });

    let valid = false;
    if (user) {
      valid = await bcrypt.compare(password, user.password);
    } else {
      await bcrypt.compare(password, "$2b$12$faketimingattackhash");
    }

    if (!user || !valid) {
      loginAttempts.set(key, {
        count: attempts.count + 1,
        firstAttempt: attempts.firstAttempt,
      });

      return res.status(401).json({ error: "Invalid credentials" });
    }

    loginAttempts.delete(key);

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Login failed" });
  }
};

// ================= PROFILE =================
exports.getProfile = async (req, res) => {
  const user = { ...req.user.toJSON() };
  delete user.password;

  res.json({
    success: true,
    user,
  });
};

// ================= UPDATE PROFILE =================
exports.updateProfile = async (req, res) => {
  try {
    const { name, address, phone } = req.body;

    const updates = {};

    if (name) {
      if (name.trim().length < 2) {
        return res.status(400).json({ error: "Invalid name" });
      }
      updates.name = name.trim();
    }

    if (address !== undefined) {
      updates.address = address || null;
    }

    if (phone !== undefined) {
      updates.phone = phone || null;
    }

    await req.user.update(updates);

    const user = { ...req.user.toJSON() };
    delete user.password;

    res.json({
      success: true,
      user,
    });
  } catch (err) {
    res.status(500).json({ error: "Update failed" });
  }
};

// ================= CHANGE PASSWORD =================
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const valid = await bcrypt.compare(currentPassword, req.user.password);
    if (!valid) {
      return res.status(400).json({ error: "Wrong password" });
    }

    if (
      !validator.isStrongPassword(newPassword, {
        minLength: 6,
        minNumbers: 1,
      })
    ) {
      return res.status(400).json({ error: "Weak password" });
    }

    req.user.password = newPassword;
    await req.user.save();

    res.json({ success: true, message: "Password updated" });
  } catch (err) {
    res.status(500).json({ error: "Failed" });
  }
};

// ================= FORGOT PASSWORD =================
exports.forgotPassword = async (req, res) => {
  try {
    const email = req.body.email.toLowerCase().trim();

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.json({ message: "If user exists, email sent" });
    }

    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET + process.env.JWT_RESET_SECRET,
      { expiresIn: "1h" },
    );

    const link = `${process.env.FRONTEND_URL}/reset-password/${token}`;

    await sendEmail(
      user.email,
      "Reset Password",
      `<h3>Reset Password</h3><p><a href="${link}">Click here</a></p>`,
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Error" });
  }
};

// ================= RESET PASSWORD =================
exports.resetPassword = async (req, res) => {
  try {
    const { password } = req.body;

    if (
      !validator.isStrongPassword(password, {
        minLength: 6,
        minNumbers: 1,
      })
    ) {
      return res.status(400).json({ error: "Weak password" });
    }

    const decoded = jwt.verify(
      req.params.token,
      process.env.JWT_SECRET + process.env.JWT_RESET_SECRET,
    );

    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.password = password;
    await user.save();

    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: "Invalid token" });
  }
};
