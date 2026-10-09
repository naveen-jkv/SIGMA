/**
 * AQUASENSE - Case Model
 * Water-borne disease clinical case report
 */

const mongoose = require('mongoose');
const { isMongoActive, getFallbackStore, saveStoreToFile } = require('../config/db');
const { generateCaseId } = require('../utils/idGenerator');

const caseSchema = new mongoose.Schema(
  {
    caseId: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    age: {
      type: Number,
      required: [true, 'Patient age is required'],
      min: [0, 'Age cannot be negative'],
      max: [125, 'Age cannot exceed 125']
    },
    gender: {
      type: String,
      required: [true, 'Patient gender is required'],
      enum: ['MALE', 'FEMALE', 'OTHER', 'Male', 'Female', 'Other']
    },
    symptoms: {
      type: [String],
      required: [true, 'At least one symptom is required'],
      validate: [v => Array.isArray(v) && v.length > 0, 'Symptoms list cannot be empty']
    },
    suspectedDisease: {
      type: String,
      default: 'Acute Gastroenteritis',
      trim: true
    },
    symptomDate: {
      type: Date,
      required: [true, 'Date of symptom onset is required']
    },
    reportedDate: {
      type: Date,
      default: Date.now
    },
    severity: {
      type: String,
      enum: ['LOW', 'MODERATE', 'HIGH', 'CRITICAL', 'MILD', 'SEVERE'],
      default: 'MODERATE'
    },
    district: {
      type: String,
      required: [true, 'District is required'],
      trim: true
    },
    locality: {
      type: String,
      required: [true, 'Locality is required'],
      trim: true
    },
    latitude: {
      type: Number,
      required: [true, 'Latitude is required'],
      min: -90,
      max: 90
    },
    longitude: {
      type: Number,
      required: [true, 'Longitude is required'],
      min: -180,
      max: 180
    },
    waterSource: {
      type: String,
      default: 'Municipal Tap Water',
      trim: true
    },
    waterQualityConcern: {
      type: Boolean,
      default: false
    },
    flooding: {
      type: Boolean,
      default: false
    },
    similarCasesNearby: {
      type: Number,
      default: 0
    },
    riskScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    riskLevel: {
      type: String,
      enum: ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'],
      default: 'LOW'
    },
    status: {
      type: String,
      enum: ['REPORTED', 'INVESTIGATING', 'CONFIRMED', 'RESOLVED'],
      default: 'REPORTED'
    },
    createdBy: {
      type: String,
      default: 'system'
    },
    createdById: {
      type: String,
      default: ''
    },
    createdByEmail: {
      type: String,
      default: ''
    },
    createdByName: {
      type: String,
      default: ''
    },
    notes: {
      type: String,
      default: '',
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

// Helpful indexes for geospatial and query performance
caseSchema.index({ locality: 1, symptomDate: -1 });
caseSchema.index({ latitude: 1, longitude: 1 });
caseSchema.index({ riskLevel: 1 });

const MongooseCaseModel = mongoose.models.Case || mongoose.model('Case', caseSchema);

// --- In-Memory Proxy ---
class CaseProxy {
  static async create(data) {
    if (isMongoActive()) {
      if (!data.caseId) {
        data.caseId = generateCaseId();
      }
      return await MongooseCaseModel.create(data);
    }
    const store = getFallbackStore();
    const caseDoc = {
      _id: `case_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      caseId: data.caseId || generateCaseId(),
      age: Number(data.age),
      gender: (data.gender || 'OTHER').toUpperCase(),
      symptoms: Array.isArray(data.symptoms) ? data.symptoms : [data.symptoms].filter(Boolean),
      suspectedDisease: data.suspectedDisease || 'Acute Gastroenteritis',
      symptomDate: data.symptomDate ? new Date(data.symptomDate) : new Date(),
      reportedDate: data.reportedDate ? new Date(data.reportedDate) : new Date(),
      severity: (data.severity || 'MODERATE').toUpperCase(),
      district: data.district || 'Metro District',
      locality: data.locality || 'Central Ward',
      latitude: Number(data.latitude),
      longitude: Number(data.longitude),
      waterSource: data.waterSource || 'Municipal Tap Water',
      waterQualityConcern: Boolean(data.waterQualityConcern),
      flooding: Boolean(data.flooding),
      similarCasesNearby: Number(data.similarCasesNearby || 0),
      riskScore: Number(data.riskScore || 0),
      riskLevel: data.riskLevel || 'LOW',
      status: data.status || 'REPORTED',
      createdBy: data.createdBy || 'system',
      createdById: data.createdById || '',
      createdByEmail: data.createdByEmail || '',
      createdByName: data.createdByName || '',
      notes: data.notes || '',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    store.cases.push(caseDoc);
    saveStoreToFile();
    return caseDoc;
  }

  static async find(filter = {}) {
    if (isMongoActive()) {
      return await MongooseCaseModel.find(filter).sort({ reportedDate: -1, createdAt: -1 });
    }
    const store = getFallbackStore();
    let results = [...store.cases];

    if (filter.locality) {
      results = results.filter(c => c.locality.toLowerCase().includes(filter.locality.toLowerCase()));
    }
    if (filter.district) {
      results = results.filter(c => c.district.toLowerCase().includes(filter.district.toLowerCase()));
    }
    if (filter.riskLevel) {
      results = results.filter(c => c.riskLevel.toUpperCase() === filter.riskLevel.toUpperCase());
    }
    if (filter.status) {
      results = results.filter(c => c.status.toUpperCase() === filter.status.toUpperCase());
    }
    if (filter.suspectedDisease) {
      results = results.filter(c => c.suspectedDisease.toLowerCase().includes(filter.suspectedDisease.toLowerCase()));
    }
    if (filter.createdBy) {
      const target = String(filter.createdBy).toLowerCase();
      results = results.filter(c => {
        const cb = String(c.createdBy || '').toLowerCase();
        const cbId = String(c.createdById || '').toLowerCase();
        const cbEmail = String(c.createdByEmail || '').toLowerCase();
        const cbName = String(c.createdByName || '').toLowerCase();
        return cb === target || cbId === target || cbEmail === target || cbName === target;
      });
    }

    // Sort descending by reportedDate
    results.sort((a, b) => new Date(b.reportedDate) - new Date(a.reportedDate));
    return results;
  }

  static async findById(id) {
    if (isMongoActive()) {
      return await MongooseCaseModel.findById(id);
    }
    const store = getFallbackStore();
    return store.cases.find(c => c._id === id || c.caseId === id) || null;
  }

  static async findOne(query) {
    if (isMongoActive()) {
      return await MongooseCaseModel.findOne(query);
    }
    const store = getFallbackStore();
    if (query._id) return store.cases.find(c => c._id === query._id) || null;
    if (query.caseId) return store.cases.find(c => c.caseId === query.caseId) || null;
    return store.cases[0] || null;
  }

  static async findByIdAndUpdate(id, updateData, options = {}) {
    if (isMongoActive()) {
      return await MongooseCaseModel.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    }
    const store = getFallbackStore();
    const index = store.cases.findIndex(c => c._id === id || c.caseId === id);
    if (index === -1) return null;
    store.cases[index] = {
      ...store.cases[index],
      ...updateData,
      updatedAt: new Date()
    };
    saveStoreToFile();
    return store.cases[index];
  }

  static async findByIdAndDelete(id) {
    if (isMongoActive()) {
      return await MongooseCaseModel.findByIdAndDelete(id);
    }
    const store = getFallbackStore();
    const index = store.cases.findIndex(c => c._id === id || c.caseId === id);
    if (index === -1) return null;
    const deleted = store.cases.splice(index, 1)[0];
    saveStoreToFile();
    return deleted;
  }

  static async countDocuments(filter = {}) {
    if (isMongoActive()) {
      return await MongooseCaseModel.countDocuments(filter);
    }
    const store = getFallbackStore();
    if (!filter || Object.keys(filter).length === 0) return store.cases.length;
    const filtered = await this.find(filter);
    return filtered.length;
  }

  static async deleteMany(query = {}) {
    if (isMongoActive()) {
      return await MongooseCaseModel.deleteMany(query);
    }
    const store = getFallbackStore();
    const count = store.cases.length;
    store.cases = [];
    saveStoreToFile();
    return { deletedCount: count };
  }
}

module.exports = CaseProxy;
