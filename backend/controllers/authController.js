const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { asyncHandler } = require("../utils/asyncHandler");
const { ApiError } = require("../utils/ApiError");
const { bootstrapDemoWorkspace } = require("../services/accountBootstrapService");
const crypto = require("crypto");
const REFRESH_EXPIRES_IN =process.env.JWT_REFRESH_EXPIRES_IN || "7d";
const REFRESH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const signToken = (user) =>
  jwt.sign(
    {
      userId: user._id,
      email: user.email,
      role: user.role,
      isProfileComplete: user.isProfileComplete,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" },
  );
const hashToken = (token) =>
  crypto.createHash("sha256")
    .update(token)
    .digest("hex");

const signRefreshToken = (user) =>
  jwt.sign(
    { userId: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_EXPIRES_IN }
  );

const setRefreshCookie = (res, token) => {
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure:
      process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: REFRESH_COOKIE_MAX_AGE_MS,
    path: "/api/auth",
  });
};

const serializeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  businessName: user.businessName || "",
  industry: user.industry || "",
  website: user.website || "",
  role: user.role,
  isProfileComplete: user.isProfileComplete,
  preferences: user.preferences,
  createdAt: user.createdAt,
});

const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new ApiError(400, "Email already registered.");
  }

  const user = await User.create({
  name,
  email: email.toLowerCase(),
  password,
  });

  res.status(201).json({
    message: "Account created successfully.",
    token: signToken(user),
    user: serializeUser(user),
  });
});

const login = asyncHandler(async (req, res) => {
  console.log("LOGIN BODY:", req.body);
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required.");
  }

  const user = await User.findOne({
    email: email.toLowerCase(),
  }).select("+password");

  if (!user) {
    throw new ApiError(400, "Invalid email or password.");
  }

  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    throw new ApiError(400, "Invalid email or password.");
  }

  await User.updateOne({ _id: user._id }, { lastLoginAt: new Date() });

  const accessToken = signToken(user);
  const refreshToken = signRefreshToken(user);

  await User.updateOne({ _id: user._id }, {
    refreshTokenHash: hashToken(refreshToken),
    refreshTokenExpiresAt: new Date(Date.now() + REFRESH_COOKIE_MAX_AGE_MS),
  });

  setRefreshCookie(res, refreshToken);

  res.status(200).json({
    accessToken,
    user: serializeUser(user),
    role: user.role,
    isProfileComplete: user.isProfileComplete,
    isBanned: user.isBanned || false,
    banReason: user.banReason || "",
  });
});

const refresh = asyncHandler(
  async (req, res) => {
    const token =
      req.cookies?.refreshToken;

    if (!token) {
      throw new ApiError(
        401,
        "Unauthorized"
      );
    }

    let decoded;

    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_REFRESH_SECRET
      );
    } catch {
      throw new ApiError(
        401,
        "Session expired."
      );
    }

    const user =
      await User.findById(
        decoded.userId
      );

    if (
      !user ||
      !user.refreshTokenHash ||
      user.refreshTokenHash !==
        hashToken(token) ||
      !user.refreshTokenExpiresAt ||
      user.refreshTokenExpiresAt <
        new Date()
    ) {
      throw new ApiError(
        401,
        "Session expired."
      );
    }

    const accessToken =
      signToken(user);

    const newRefreshToken =
      signRefreshToken(user);

    await User.updateOne({ _id: user._id }, {
      refreshTokenHash: hashToken(newRefreshToken),
      refreshTokenExpiresAt: new Date(Date.now() + REFRESH_COOKIE_MAX_AGE_MS),
    });

    setRefreshCookie(
      res,
      newRefreshToken
    );

    res.status(200).json({
      accessToken,
      user: serializeUser(user),
      role: user.role,
      isProfileComplete: user.isProfileComplete,
      isBanned: user.isBanned || false,
      banReason: user.banReason || "",
    });
  }
);
const logout = asyncHandler(
  async (req, res) => {
    const token =
      req.cookies?.refreshToken;

    if (token) {
      try {
        const decoded =
          jwt.verify(
            token,
            process.env
              .JWT_REFRESH_SECRET,
            {
              ignoreExpiration:
                true,
            }
          );

        await User.findByIdAndUpdate(
          decoded.userId,
          {
            refreshTokenHash:
              null,
            refreshTokenExpiresAt:
              null,
          }
        );
      } catch {}
    }

    res.clearCookie(
      "refreshToken",
      {
        path: "/api/auth",
      }
    );

    res.status(200).json({
      message: "Logged out.",
    });
  }
);

const updateProfile =
  asyncHandler(
    async (req, res) => {
      const {
        name,
        phone,
        businessName,
        industry,
        website,
        companySize,
        country,
        city,
        bio,
        linkedIn,
        twitter,
        timezone,
      } = req.body;

      const user =
        await User.findByIdAndUpdate(
          req.user.userId,
          {
            name,
            phone,
            businessName,
            industry,
            website,
            companySize,
            country,
            city,
            bio,
            linkedIn,
            twitter,
            timezone,
            isProfileComplete:
              true,
          },
          {
            new: true,
            runValidators: true,
          }
        );

      if (!user) {
        throw new ApiError(
          404,
          "User not found."
        );
      }

      res.status(200).json({
        message:
          "Profile updated successfully.",
        user:
          serializeUser(user),
      });
    }
  );

const completeOnboarding = asyncHandler(async (req, res) => {
  const { businessName, industry, website } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user.userId,
    {
      businessName,
      industry,
      website,
      isProfileComplete: true,
    },
    { new: true },
  );
  if (!user) {
    throw new ApiError(404, "User not found.");
  }
  await bootstrapDemoWorkspace(user);

  res.status(200).json({
    message: "Profile saved.",
    token: signToken(user),
    user: serializeUser(user),
  });
});

const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.userId).select("-password");
  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  if (user.isProfileComplete) {
    await bootstrapDemoWorkspace(user);
  }

  res.status(200).json({
    user: serializeUser(user),
    role: user.role,
    isProfileComplete: user.isProfileComplete,
    isBanned: user.isBanned || false,
    banReason: user.banReason || "",
  });
});

module.exports = {
  register,
  login,
  refresh,
  logout,
  completeOnboarding,
  getProfile,
  updateProfile,
};
