const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const authRepo = require("./auth.repository");
const { generateTokens, verifyRefreshToken } = require("./auth.utils");
const { UnauthorizedError } = require("../../shared/errors");

exports.register = async(data) => {
    const { email, password, name } = data;

    const existing = await authRepo.findByEmail(email);
    if (existing) {
        throw new Error("Email already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await authRepo.createUser({
        email,
        password: hashedPassword,
        name,
    });

    const tokens = generateTokens(user);

    return {
        user,
        ...tokens,
    };
};

exports.login = async({ email, password }) => {
    const user = await authRepo.findByEmail(email);
    if (!user) throw new UnauthorizedError("Invalid credentials");

    const match = await bcrypt.compare(password, user.password);
    if (!match) throw new UnauthorizedError("Invalid credentials");

    const tokens = generateTokens(user);

    return {
        user,
        ...tokens,
    };
};

exports.refreshToken = async(refreshToken) => {
    const payload = verifyRefreshToken(refreshToken);

    const user = await authRepo.findById(payload.id);
    if (!user) throw new UnauthorizedError("User not found");

    return generateTokens(user);
};

exports.logout = async(userId) => {
    // optional: blacklist tokens / remove refresh tokens from DB
    return true;
};