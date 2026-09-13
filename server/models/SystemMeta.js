const mongoose = require("mongoose");

const systemMetaSchema = new mongoose.Schema(
  {
    schemaVersion: {
      type: Number,
      required: true,
      default: 0,
    },
    lastMigratedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SystemMeta", systemMetaSchema);
