// File utility functions for handling file names and paths

/**
 * Truncates a filename if it exceeds the maximum length
 * @param {string} name - The filename to truncate
 * @param {number} maxLength - Maximum length before truncation
 * @returns {string} Truncated filename
 */
export function truncateFileName(name, maxLength = 30) {
  if (!name) return '';
  if (name.length <= maxLength) return name;
  return name.slice(0, maxLength - 3) + '...';
}

/**
 * Extracts the complete file name (with extension) from a path
 * @param {string} filePath - The full file path
 * @returns {string} Complete file name with extension
 */
export function getFileNameFromPath(filePath) {
  if (!filePath) return '';
  return filePath.replace(/\\/g, '/').split('/').pop();
}

/**
 * Gets the file name without extension from a path
 * @param {string} filePath - The full file path
 * @returns {string} File name without extension
 */
export function getFileNameWithoutExt(filePath) {
  if (!filePath) return '';
  const fileName = getFileNameFromPath(filePath);
  return fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
}

/**
 * Checks if a file is a valid document type (PDF or DOCX)
 * @param {string} fileName - The file name to check
 * @returns {boolean} True if the file is a valid document type
 */
export function isValidDocumentFile(fileName) {
  if (!fileName) return false;
  const ext = fileName.toLowerCase().split('.').pop();
  return ext === 'pdf' || ext === 'docx';
}