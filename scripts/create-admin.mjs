import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import fs from "node:fs";
import path from "node:path";

let envContent = "";
try {
  envContent = fs.readFileSync(".env", "utf8");
} catch {}
const match = envContent.match(/^MONGODB_URI=(.*)$/m);
const mongoUri = match ? match[1].trim() : (process.env.MONGODB_URI || "mongodb://localhost:27017/pomelo");

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  passwordHash: { type: String, required: true, select: false },
  name: { type: String, required: true, trim: true },
  role: { type: String, enum: ["user", "admin"], default: "user" },
  registeredContests: [{ type: mongoose.Schema.Types.ObjectId, ref: "Contest" }],
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model("User", userSchema);

const args = process.argv.slice(2);
const email = args[0] || "admin@pomelo.local";
const password = args[1] || "admin123456";
const name = args[2] || "Admin";

console.log(`Connecting to MongoDB...`);
await mongoose.connect(mongoUri);

const normalizedEmail = email.toLowerCase().trim();
let user = await User.findOne({ email: normalizedEmail });

if (user) {
  user.role = "admin";
  if (args[1]) {
    user.passwordHash = await bcrypt.hash(password, 10);
  }
  await user.save();
  console.log(`\n\x1b[32m✔ User '${normalizedEmail}' has been promoted to Admin!\x1b[0m`);
} else {
  const passwordHash = await bcrypt.hash(password, 10);
  user = new User({
    name,
    email: normalizedEmail,
    passwordHash,
    role: "admin",
    registeredContests: [],
  });
  await user.save();
  console.log(`\n\x1b[32m✔ Admin account created successfully!\x1b[0m`);
}

console.log(`-----------------------------------------`);
console.log(` Email:    ${normalizedEmail}`);
console.log(` Password: ${password}`);
console.log(` Role:     admin`);
console.log(` Login at: http://localhost:3000/auth/login`);
console.log(` Admin at: http://localhost:3000/admin`);
console.log(`-----------------------------------------\n`);

process.exit(0);
