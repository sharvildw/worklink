const User = require("../models/User");
const Worker = require("../models/Worker");
const generateToken = require("../utils/generateToken");

const buildAuthUser = (user) => ({
  ...user.toJSON()
});

const register = async (req, res, next) => {
  try {
    const { name, email, password, role, location, skills } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists with this email." });
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      location: location || ""
    });

    if (role === "worker") {
      await Worker.create({
        userId: user._id,
        skills: Array.isArray(skills) ? skills : [],
        location: location || ""
      });
    }

    return res.status(201).json({
      message: "Registration successful",
      token: generateToken(user._id),
      user: buildAuthUser(user)
    });
  } catch (error) {
    return next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    return res.status(200).json({
      message: "Login successful",
      token: generateToken(user._id),
      user: buildAuthUser(user)
    });
  } catch (error) {
    return next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    return res.status(200).json({
      user: req.user.toJSON()
    });
  } catch (error) {
    return next(error);
  }
};

const logout = async (_req, res, next) => {
  try {
    return res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  logout
};
