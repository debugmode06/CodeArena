const mongoose = require("mongoose");

module.exports = {
  version: 2,
  name: "Migrate username field back to email",
  up: async () => {
    const db = mongoose.connection.db;
    const users = db.collection("users");

    // Drop stale indexes left over from the old email/username schemas —
    // a leftover unique email_1 index (all null) was rejecting every insert.
    const existingIndexes = await users.indexes();
    for (const idx of existingIndexes) {
      if (idx.name === "email_1" || idx.name === "username_1") {
        await users.dropIndex(idx.name).catch(() => {});
      }
    }

    // Backfill any documents still holding the old username field.
    await users.updateMany(
      { username: { $exists: true }, email: { $exists: false } },
      [{ $set: { email: "$username" } }, { $unset: "username" }]
    );
    await users.updateMany({}, { $unset: { username: "" } });

    await users.createIndex({ email: 1 }, { unique: true });
  }
};
