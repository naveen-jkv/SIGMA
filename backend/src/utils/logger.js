/**
 * AQUASENSE Structured Logger
 */

const formatTimestamp = () => new Date().toISOString();

const logger = {
  info: (message, meta = "") => {
    console.log(`[${formatTimestamp()}] [INFO] ${message}`, meta ? meta : "");
  },
  warn: (message, meta = "") => {
    console.warn(`[${formatTimestamp()}] [WARN] ⚠️  ${message}`, meta ? meta : "");
  },
  error: (message, meta = "") => {
    console.error(`[${formatTimestamp()}] [ERROR] ❌ ${message}`, meta ? meta : "");
  },
  success: (message, meta = "") => {
    console.log(`[${formatTimestamp()}] [SUCCESS] ✅ ${message}`, meta ? meta : "");
  }
};

module.exports = logger;
