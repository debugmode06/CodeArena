const SystemMeta = require("../models/SystemMeta");
const migrations = require("./index");

async function runMigrations() {
  console.log("[Migrations] Checking for pending database migrations...");
  
  let meta = await SystemMeta.findOne();
  if (!meta) {
    meta = new SystemMeta({ schemaVersion: 0 });
    await meta.save();
  }

  const currentVersion = meta.schemaVersion;
  const pendingMigrations = migrations.filter(m => m.version > currentVersion);

  if (pendingMigrations.length === 0) {
    console.log(`[Migrations] Database schema is up-to-date (v${currentVersion}).`);
    return;
  }

  console.log(`[Migrations] Found ${pendingMigrations.length} pending migrations.`);

  // Sort migrations by version ascending to ensure sequential execution
  pendingMigrations.sort((a, b) => a.version - b.version);

  for (const migration of pendingMigrations) {
    console.log(`[Migrations] Running migration v${migration.version}: ${migration.name}`);
    try {
      await migration.up();
      
      meta.schemaVersion = migration.version;
      meta.lastMigratedAt = new Date();
      await meta.save();
      
      console.log(`[Migrations] Successfully migrated to v${migration.version}.`);
    } catch (error) {
      console.error(`[Migrations] FATAL ERROR during migration v${migration.version}: ${migration.name}`);
      console.error(error);
      throw error; // Halt the server if a migration fails to avoid data corruption
    }
  }

  console.log(`[Migrations] All migrations completed successfully. Current schema version: ${meta.schemaVersion}`);
}

module.exports = { runMigrations };
