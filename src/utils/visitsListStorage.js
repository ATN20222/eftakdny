// Utility functions for managing visits list in localStorage

const STORAGE_KEY = 'eftakdny_visits_list';

/**
 * Get all child IDs in the visits list
 * @returns {number[]} Array of child IDs
 */
export const getVisitsList = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error('Error reading visits list from localStorage:', error);
    return [];
  }
};

/**
 * Add a child ID to the visits list
 * @param {number} childId - The child ID to add
 * @returns {boolean} True if added successfully, false if already exists
 */
export const addToVisitsList = (childId) => {
  try {
    const list = getVisitsList();
    if (list.includes(childId)) {
      return false; // Already in list
    }
    list.push(childId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    return true;
  } catch (error) {
    console.error('Error adding to visits list:', error);
    return false;
  }
};

/**
 * Remove a child ID from the visits list
 * @param {number} childId - The child ID to remove
 * @returns {boolean} True if removed successfully
 */
export const removeFromVisitsList = (childId) => {
  try {
    const list = getVisitsList();
    // Convert childId to number for comparison, and filter out both string and number versions
    const idToRemove = typeof childId === 'string' ? parseInt(childId, 10) : Number(childId);
    const filtered = list.filter(id => Number(id) !== idToRemove);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Error removing from visits list:', error);
    return false;
  }
};

/**
 * Check if a child ID is in the visits list
 * @param {number} childId - The child ID to check
 * @returns {boolean} True if child is in the list
 */
export const isInVisitsList = (childId) => {
  const list = getVisitsList();
  return list.includes(childId);
};

/**
 * Clear the entire visits list
 */
export const clearVisitsList = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing visits list:', error);
    return false;
  }
};

/**
 * Get the count of children in the visits list
 * @returns {number} Number of children in the list
 */
export const getVisitsListCount = () => {
  return getVisitsList().length;
};

