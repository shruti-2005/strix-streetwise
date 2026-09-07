const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, default: "Anonymous Citizen" },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true, // allows many docs with no email (anonymous users)
    },
    password: { type: String, select: false },

    // "citizen" | "authority" | "admin"
    role: { type: String, enum: ["citizen", "authority", "admin"], default: "citizen" },

    // Authority-only fields
    department: { type: String }, // e.g. "Roads", "Sanitation", "Electrical"
    locality: { type: String },

    // Citizens can use the app fully anonymously (no email/password)
    isAnonymous: { type: Boolean, default: false },
    anonymousDeviceId: { type: String, index: true },

    // Locality-based notification preference
    watchedLocality: { type: String },

    reportsCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (candidate) {
  if (!this.password) return false;
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model("User", userSchema);
