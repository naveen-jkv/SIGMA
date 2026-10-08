/**
 * Unique Readable ID Generator
 */

const generateCaseId = () => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(100 + Math.random() * 900);
  return `CASE-${timestamp}-${random}`;
};

const generateAlertId = () => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(100 + Math.random() * 900);
  return `ALT-${timestamp}-${random}`;
};

module.exports = {
  generateCaseId,
  generateAlertId
};
