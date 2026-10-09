/**
 * AQUASENSE Database Connection & Resilient Data Layer
 * 
 * Primary: Native MongoDB via Mongoose.
 * Fallback: Built-in Persistent Datastore if MongoDB is not running locally,
 * ensuring 100% zero-crash operation for hackathon demos and evaluations.
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const logger = require('../utils/logger');

const DATA_FILE = path.join(__dirname, 'aquasense_store.json');

let isConnectedToMongo = false;
let fallbackStore = {
  users: [],
  cases: [],
  alerts: []
};

// Ensure pre-configured demo users are always available for testing and evaluation
const ensureDemoUsers = () => {
  if (!fallbackStore.users) fallbackStore.users = [];
  const demoAccounts = [
    {
      _id: 'user_demo_healthworker',
      name: 'Primary Health Worker Demo',
      email: 'healthworker@demo.com',
      password: '$2b$10$7D8bKUYIzF.8.PomQ0O9S.pcxQVQYXonmk683Q5WPKRhwQpQjUHwq', // password123
      role: 'HEALTH_WORKER',
      createdAt: '2026-10-09T00:00:00.000Z',
      updatedAt: '2026-10-09T00:00:00.000Z'
    },
    {
      _id: 'user_demo_authority',
      name: 'District Health Authority Demo',
      email: 'authority@demo.com',
      password: '$2b$10$7D8bKUYIzF.8.PomQ0O9S.pcxQVQYXonmk683Q5WPKRhwQpQjUHwq', // password123
      role: 'HEALTH_AUTHORITY',
      createdAt: '2026-10-09T00:00:00.000Z',
      updatedAt: '2026-10-09T00:00:00.000Z'
    }
  ];

  for (const account of demoAccounts) {
    const existing = fallbackStore.users.find(u => u.email.toLowerCase() === account.email.toLowerCase());
    if (!existing) {
      fallbackStore.users.unshift(account);
    } else {
      existing.role = account.role;
      existing.password = account.password;
    }
  }
};

// Load saved datastore from disk if exists
const loadStoreFromFile = () => {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      fallbackStore = JSON.parse(raw);
    }
  } catch (e) {
    logger.warn(`Could not read fallback store file: ${e.message}`);
  }
  ensureDemoUsers();
};

// Save datastore to disk for persistence across server restarts
const saveStoreToFile = () => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(fallbackStore, null, 2), 'utf-8');
  } catch (e) {
    logger.warn(`Could not write fallback store file: ${e.message}`);
  }
};

const connectDB = async () => {
  loadStoreFromFile();
  const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/aquasense';
  
  try {
    logger.info(`Attempting to connect to MongoDB at ${mongoURI}...`);
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 2500
    });
    isConnectedToMongo = true;
    logger.success(`MongoDB Connected Successfully: ${mongoURI}`);
    return { isConnected: true, mode: 'MONGODB' };
  } catch (error) {
    isConnectedToMongo = false;
    logger.warn(`Could not connect to MongoDB at ${mongoURI} (${error.message}).`);
    logger.info(`⚡ Activating AQUASENSE Zero-Setup Persistent Datastore for seamless demo execution!`);
    logger.info(`💡 Note: To connect to live MongoDB, start local mongod or set MONGO_URI in .env`);
    return { isConnected: false, mode: 'IN_MEMORY' };
  }
};

const isMongoActive = () => isConnectedToMongo;

const getFallbackStore = () => fallbackStore;

module.exports = {
  connectDB,
  isMongoActive,
  getFallbackStore,
  saveStoreToFile,
  loadStoreFromFile
};
