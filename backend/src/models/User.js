/**
 * AQUASENSE - User Model
 * Roles: HEALTH_WORKER, AUTHORITY, ADMIN
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { isMongoActive, getFallbackStore, saveStoreToFile } = require('../config/db');

// --- 1. Mongoose Schema ---
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
      type: String,
      required: [true, 'Please provide an email address'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address'
      ]
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false
    },
    role: {
      type: String,
      enum: {
        values: ['HEALTH_WORKER', 'HEALTH_AUTHORITY', 'AUTHORITY', 'ADMIN'],
        message: '{VALUE} is not a valid role'
      },
      default: 'HEALTH_WORKER'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Hash password before saving in Mongoose
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const MongooseUserModel = mongoose.models.User || mongoose.model('User', userSchema);

// --- 2. In-Memory Store Proxy for Zero-Setup Mode ---
class UserProxy {
  static async create(data) {
    if (isMongoActive()) {
      return await MongooseUserModel.create(data);
    }
    const store = getFallbackStore();
    const existing = store.users.find(u => u.email.toLowerCase() === data.email.toLowerCase());
    if (existing) {
      const err = new Error('Email already registered');
      err.code = 11000;
      throw err;
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(data.password, salt);
    const userDoc = {
      _id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      name: data.name,
      email: data.email.toLowerCase().trim(),
      password: hashedPassword,
      role: data.role || 'HEALTH_WORKER',
      createdAt: new Date(),
      updatedAt: new Date(),
      async matchPassword(enteredPassword) {
        return await bcrypt.compare(enteredPassword, this.password);
      },
      toObject() {
        const copy = { ...this };
        delete copy.password;
        return copy;
      }
    };
    store.users.push(userDoc);
    saveStoreToFile();
    return userDoc;
  }

  static async findOne(query) {
    if (isMongoActive()) {
      const q = MongooseUserModel.findOne(query);
      return q;
    }
    const store = getFallbackStore();
    let found = null;
    if (query.email) {
      found = store.users.find(u => u.email.toLowerCase() === query.email.toLowerCase());
    } else if (query._id) {
      found = store.users.find(u => u._id === query._id);
    }
    if (!found) return null;

    // Attach methods
    return {
      ...found,
      async matchPassword(pwd) {
        return await bcrypt.compare(pwd, found.password);
      },
      select: function(fields) {
        return this;
      }
    };
  }

  static async findById(id) {
    if (isMongoActive()) {
      return await MongooseUserModel.findById(id).select('-password');
    }
    const store = getFallbackStore();
    const user = store.users.find(u => u._id === id);
    if (!user) return null;
    const clean = { ...user };
    delete clean.password;
    return clean;
  }

  static async find(query = {}) {
    if (isMongoActive()) {
      return await MongooseUserModel.find(query).select('-password');
    }
    const store = getFallbackStore();
    return store.users.map(u => {
      const copy = { ...u };
      delete copy.password;
      return copy;
    });
  }

  static async deleteMany(query = {}) {
    if (isMongoActive()) {
      return await MongooseUserModel.deleteMany(query);
    }
    const store = getFallbackStore();
    store.users = [];
    saveStoreToFile();
    return { deletedCount: store.users.length };
  }

  static async countDocuments(query = {}) {
    if (isMongoActive()) {
      return await MongooseUserModel.countDocuments(query);
    }
    const store = getFallbackStore();
    return store.users.length;
  }
}

module.exports = UserProxy;
