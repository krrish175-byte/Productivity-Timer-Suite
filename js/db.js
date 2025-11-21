/**
 * IndexedDB wrapper for timer session persistence
 * Database: TimerDB
 * Object Store: sessions
 */

const DB_NAME = 'TimerDB';
const DB_VERSION = 1;
const STORE_NAME = 'sessions';

/**
 * Initialize and open the IndexedDB database
 * Creates the object store if it doesn't exist
 * @returns {Promise<IDBDatabase>} The opened database instance
 */
export async function initDB() {
  return new Promise((resolve, reject) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error(`Failed to open database: ${request.error}`));
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { 
            keyPath: 'id', 
            autoIncrement: true 
          });
        }
      };
    } catch (error) {
      reject(new Error(`Database initialization failed: ${error.message}`));
    }
  });
}

/**
 * Add a new timer session to the database
 * @param {string} type - Session type ('stopwatch' or 'pomodoro')
 * @param {number} duration - Duration in milliseconds
 * @param {Date} date - Timestamp when session was saved
 * @returns {Promise<number>} The ID of the newly created session
 */
export async function addSession(type, duration, date) {
  try {
    const db = await initDB();
    
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        
        const session = {
          type,
          duration,
          date
        };
        
        const request = store.add(session);
        
        request.onsuccess = () => {
          resolve(request.result);
        };
        
        request.onerror = () => {
          reject(new Error(`Failed to add session: ${request.error}`));
        };
        
        transaction.onerror = () => {
          reject(new Error(`Transaction failed: ${transaction.error}`));
        };
      } catch (error) {
        reject(new Error(`Add session operation failed: ${error.message}`));
      }
    });
  } catch (error) {
    return Promise.reject(new Error(`Failed to add session: ${error.message}`));
  }
}

/**
 * Retrieve all timer sessions from the database
 * @returns {Promise<Array<Object>>} Array of session objects
 */
export async function getSessions() {
  try {
    const db = await initDB();
    
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();
        
        request.onsuccess = () => {
          resolve(request.result);
        };
        
        request.onerror = () => {
          reject(new Error(`Failed to retrieve sessions: ${request.error}`));
        };
        
        transaction.onerror = () => {
          reject(new Error(`Transaction failed: ${transaction.error}`));
        };
      } catch (error) {
        reject(new Error(`Get sessions operation failed: ${error.message}`));
      }
    });
  } catch (error) {
    return Promise.reject(new Error(`Failed to retrieve sessions: ${error.message}`));
  }
}

/**
 * Delete a timer session by ID
 * @param {number} id - The ID of the session to delete
 * @returns {Promise<void>}
 */
export async function deleteSession(id) {
  try {
    const db = await initDB();
    
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);
        
        request.onsuccess = () => {
          resolve();
        };
        
        request.onerror = () => {
          reject(new Error(`Failed to delete session: ${request.error}`));
        };
        
        transaction.onerror = () => {
          reject(new Error(`Transaction failed: ${transaction.error}`));
        };
      } catch (error) {
        reject(new Error(`Delete session operation failed: ${error.message}`));
      }
    });
  } catch (error) {
    return Promise.reject(new Error(`Failed to delete session: ${error.message}`));
  }
}
