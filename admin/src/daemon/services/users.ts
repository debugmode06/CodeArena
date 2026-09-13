import { existsSync, readFileSync } from "fs";
import { MongoClient, ObjectId } from "mongodb";
import bcrypt from "bcryptjs";
import { createError } from "../core/errors";
import { parseConfigYaml, parseEnv } from "../core/config";
import type { Paths } from "../core/types";

let mongoClient: MongoClient | null = null;
let currentMongoUri: string | null = null;

function getMongoUri(paths: Paths): string {
  const cfgYaml = parseConfigYaml(paths) || {};
  const dbMode = cfgYaml.infrastructure?.database?.mode ?? "internal";

  if (existsSync(paths.envFile)) {
    const env = parseEnv(readFileSync(paths.envFile, "utf8"));
    if (env.MONGODB_URI) {
      if (dbMode === "internal") {
        return env.MONGODB_URI.replace("mongodb://mongo:", "mongodb://localhost:");
      }
      return env.MONGODB_URI;
    }
  }
  return "mongodb://localhost:27017/pomelo";
}

async function getDb(paths: Paths) {
  const uri = getMongoUri(paths);
  if (mongoClient && currentMongoUri !== uri) {
    try {
      await mongoClient.close();
    } catch { }
    mongoClient = null;
  }

  if (!mongoClient) {
    mongoClient = new MongoClient(uri);
    await mongoClient.connect();
    currentMongoUri = uri;
  }
  return mongoClient.db();
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateUserPayload(payload: any, isUpdate = false) {
  const { name, email, password, role } = payload;

  if (!isUpdate || email !== undefined) {
    if (typeof email !== "string" || !email.trim()) {
      throw createError("Email is required and must be a string", 400);
    }
    if (email.length > 254) {
      throw createError("Email must be 254 characters or less", 400);
    }
    if (!EMAIL_REGEX.test(email)) {
      throw createError("Invalid email format", 400);
    }
  }

  if (!isUpdate || password !== undefined) {
    if (typeof password !== "string" || !password) {
      throw createError("Password is required and must be a string", 400);
    }
    if (password.length < 6 || password.length > 72) {
      throw createError("Password must be between 6 and 72 characters", 400);
    }
  }

  if (name !== undefined) {
    if (typeof name !== "string") {
      throw createError("Name must be a string", 400);
    }
    if (name.length > 100) {
      throw createError("Name must be 100 characters or less", 400);
    }
  }

  if (!isUpdate || role !== undefined) {
    if (role !== "admin" && role !== "user") {
      throw createError("Role must be 'admin' or 'user'", 400);
    }
  }
}

export async function listUsers(
  paths: Paths,
  options: { role?: string; page?: number; limit?: number } = {},
) {
  const { role, page = 1, limit = 10 } = options;
  const db = await getDb(paths);
  const query: Record<string, any> = {};
  if (role) {
    query.role = role;
  }
  const skip = (page - 1) * limit;

  const total = await db.collection("users").countDocuments(query);
  const users = await db
    .collection("users")
    .find(query, { projection: { passwordHash: 0 } })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .toArray();

  return {
    users,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function createUser(paths: Paths, body: any) {
  validateUserPayload(body, false);
  const { name, email, password, role } = body;

  const db = await getDb(paths);
  const normalizedEmail = email.toLowerCase().trim();
  const existing = await db.collection("users").findOne({ email: normalizedEmail });
  if (existing) {
    throw createError("User with this email already exists", 400);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const now = new Date();

  const derivedName = name || normalizedEmail.split("@")[0];

  const doc = {
    email: normalizedEmail,
    passwordHash,
    name: derivedName,
    role: role === "admin" ? "admin" : "user",
    registeredContests: [],
    createdAt: now,
    updatedAt: now,
  };

  const result = await db.collection("users").insertOne(doc);
  return {
    _id: result.insertedId.toString(),
    email: doc.email,
    name: doc.name,
    role: doc.role,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export async function updateUser(paths: Paths, id: string, body: any) {
  validateUserPayload(body, true);
  const db = await getDb(paths);
  const update: Record<string, any> = { updatedAt: new Date() };

  if (body.name !== undefined) update.name = body.name;
  if (body.email !== undefined) update.email = body.email.toLowerCase().trim();
  if (body.role !== undefined) update.role = body.role;
  if (body.password) {
    update.passwordHash = await bcrypt.hash(body.password, 10);
  }

  const result = await db
    .collection("users")
    .findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: update },
      { returnDocument: "after", projection: { passwordHash: 0 } },
    );

  if (!result) {
    throw createError("User not found", 404);
  }

  return result;
}

export async function deleteUser(paths: Paths, id: string) {
  const db = await getDb(paths);
  const result = await db
    .collection("users")
    .deleteOne({ _id: new ObjectId(id) });
  if (result.deletedCount === 0) {
    throw createError("User not found", 404);
  }
}
