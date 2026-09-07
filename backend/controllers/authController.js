const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

function signToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "30d",
  });
}

function sanitize(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
    locality: user.locality,
    isAnonymous: user.isAnonymous,
    watchedLocality: user.watchedLocality,
  };
}

// @route POST /api/auth/anonymous
// @desc  Instant, no-friction access for citizens. A device ID (generated
//        client-side and stored locally) lets returning anonymous users keep
//        their report history without ever giving up personal info.
const anonymousLogin = asyncHandler(async (req, res) => {
  const { deviceId } = req.body;
  if (!deviceId) {
    res.status(400);
    throw new Error("deviceId is required for anonymous access");
  }

  let user = await User.findOne({ anonymousDeviceId: deviceId });
  if (!user) {
    user = await User.create({
      isAnonymous: true,
      anonymousDeviceId: deviceId,
      name: "Anonymous Citizen",
      role: "citizen",
    });
  }

  const token = signToken(user);
  res.status(200).json({ token, user: sanitize(user) });
});

// @route POST /api/auth/register
// @desc  Registration for citizens who want a persistent named account,
//        and for authority staff (role assigned by an admin/seed script).
const register = asyncHandler(async (req, res) => {
  const { name, email, password, locality } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Email and password are required");
  }

  const existing = await User.findOne({ email });
  if (existing) {
    res.status(409);
    throw new Error("An account with this email already exists");
  }

  const user = await User.create({
    name: name || "Citizen",
    email,
    password,
    locality,
    role: "citizen",
  });

  const token = signToken(user);
  res.status(201).json({ token, user: sanitize(user) });
});

// @route POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.comparePassword(password))) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  const token = signToken(user);
  res.status(200).json({ token, user: sanitize(user) });
});

// @route GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({ user: sanitize(req.user) });
});

// @route PATCH /api/auth/me
const updateMe = asyncHandler(async (req, res) => {
  const { name, watchedLocality } = req.body;
  if (name !== undefined) req.user.name = name;
  if (watchedLocality !== undefined) req.user.watchedLocality = watchedLocality;
  await req.user.save();
  res.status(200).json({ user: sanitize(req.user) });
});

module.exports = { anonymousLogin, register, login, getMe, updateMe };
