import { MongoMemoryServer } from 'mongodb-memory-server';
import fs from 'fs';
import path from 'path';

const dbPath = path.resolve('.mongo_data');
if (!fs.existsSync(dbPath)) {
  fs.mkdirSync(dbPath, { recursive: true });
}

console.log('Starting standalone MongoDB server...');
try {
  const mongod = await MongoMemoryServer.create({
    instance: {
      port: 27017,
      dbPath: dbPath,
      storageEngine: 'wiredTiger',
    },
  });

  console.log(`\n=============================================`);
  console.log(` MongoDB is running on: ${mongod.getUri()}`);
  console.log(` Data directory: ${dbPath}`);
  console.log(`=============================================\n`);
} catch (err) {
  console.error('Failed to start MongoDB:', err);
  process.exit(1);
}
