/**
 * AQUASENSE - Alert Model
 * Outbreak Early Warning Notifications
 */

const mongoose = require('mongoose');
const { isMongoActive, getFallbackStore, saveStoreToFile } = require('../config/db');
const { generateAlertId } = require('../utils/idGenerator');

const alertSchema = new mongoose.Schema(
  {
    alertId: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    location: {
      type: String,
      required: [true, 'Alert location is required'],
      trim: true
    },
    riskLevel: {
      type: String,
      required: true,
      enum: ['LOW', 'MODERATE', 'HIGH', 'CRITICAL']
    },
    caseCount: {
      type: Number,
      required: true,
      min: 0
    },
    reason: {
      type: String,
      required: [true, 'Alert triggering reason is required'],
      trim: true
    },
    recommendedAction: {
      type: String,
      required: [true, 'Recommended public health response action is required'],
      trim: true
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'ACKNOWLEDGED', 'UNDER_INVESTIGATION', 'RESOLVED'],
      default: 'ACTIVE'
    },
    acknowledgedAt: {
      type: Date
    },
    investigationStartedAt: {
      type: Date
    },
    resolvedAt: {
      type: Date
    },
    resolutionReason: {
      type: String,
      trim: true
    },
    statusNotes: {
      type: String,
      trim: true
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

alertSchema.index({ location: 1, status: 1 });
alertSchema.index({ riskLevel: 1 });

const MongooseAlertModel = mongoose.models.Alert || mongoose.model('Alert', alertSchema);

// --- In-Memory Proxy ---
class AlertProxy {
  static async create(data) {
    if (isMongoActive()) {
      if (!data.alertId) {
        data.alertId = generateAlertId();
      }
      return await MongooseAlertModel.create(data);
    }
    const store = getFallbackStore();
    const alertDoc = {
      _id: `alert_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      alertId: data.alertId || generateAlertId(),
      location: data.location,
      riskLevel: data.riskLevel,
      caseCount: Number(data.caseCount || 0),
      reason: data.reason,
      recommendedAction: data.recommendedAction,
      status: data.status || 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    store.alerts.push(alertDoc);
    saveStoreToFile();
    return alertDoc;
  }

  static async find(filter = {}) {
    if (isMongoActive()) {
      return await MongooseAlertModel.find(filter).sort({ createdAt: -1 });
    }
    const store = getFallbackStore();
    let results = [...store.alerts];
    if (filter.status) {
      results = results.filter(a => a.status.toUpperCase() === filter.status.toUpperCase());
    }
    if (filter.riskLevel) {
      results = results.filter(a => a.riskLevel.toUpperCase() === filter.riskLevel.toUpperCase());
    }
    if (filter.location) {
      results = results.filter(a => a.location.toLowerCase().includes(filter.location.toLowerCase()));
    }
    results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return results;
  }

  static async findById(id) {
    if (isMongoActive()) {
      return await MongooseAlertModel.findById(id);
    }
    const store = getFallbackStore();
    return store.alerts.find(a => a._id === id || a.alertId === id) || null;
  }

  static async findByIdAndUpdate(id, updateData, options = {}) {
    if (isMongoActive()) {
      return await MongooseAlertModel.findByIdAndUpdate(id, updateData, { new: true });
    }
    const store = getFallbackStore();
    const index = store.alerts.findIndex(a => a._id === id || a.alertId === id);
    if (index === -1) return null;
    store.alerts[index] = {
      ...store.alerts[index],
      ...updateData,
      updatedAt: new Date()
    };
    saveStoreToFile();
    return store.alerts[index];
  }

  static async findByIdAndDelete(id) {
    if (isMongoActive()) {
      return await MongooseAlertModel.findByIdAndDelete(id);
    }
    const store = getFallbackStore();
    const index = store.alerts.findIndex(a => a._id === id || a.alertId === id);
    if (index === -1) return null;
    const deleted = store.alerts.splice(index, 1)[0];
    saveStoreToFile();
    return deleted;
  }

  static async countDocuments(filter = {}) {
    if (isMongoActive()) {
      return await MongooseAlertModel.countDocuments(filter);
    }
    const store = getFallbackStore();
    if (!filter || Object.keys(filter).length === 0) return store.alerts.length;
    const filtered = await this.find(filter);
    return filtered.length;
  }

  static async deleteMany(query = {}) {
    if (isMongoActive()) {
      return await MongooseAlertModel.deleteMany(query);
    }
    const store = getFallbackStore();
    const count = store.alerts.length;
    store.alerts = [];
    saveStoreToFile();
    return { deletedCount: count };
  }
}

module.exports = AlertProxy;
