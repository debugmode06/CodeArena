const mongoose = require("mongoose");

module.exports = {
  version: 1,
  name: "Initial Schema Setup",
  up: async () => {
    // This is the initial migration.
    // It is primarily used to establish the version 1 baseline.
    // You can add logic here to backfill old collections with required fields if needed.
    
    // Example of how to modify existing documents directly using mongoose models or db interface
    const db = mongoose.connection.db;
    
    // For example, ensuring all users have a 'role' field:
    // await db.collection("users").updateMany(
    //   { role: { $exists: false } },
    //   { $set: { role: "USER" } }
    // );
  }
};
