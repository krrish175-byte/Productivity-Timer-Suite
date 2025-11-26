/**
 * Database Module - IndexedDB wrapper for session storage
 * Provides CRUD operations for timer sessions
 */

const DB_NAME = 'TimerDB';
const DB_VERSION = 1;
const STORE_NAME = 'sessions';

let db = null;

/**
 * Initialize or open the TimerDB database
 * Creates the sessions object store if it doesn't exist
 * @returns {Promise<IDBDatabase>} The database instance
 */
export async function initDB() {
  return new Promise((resolve, reject) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Database failed to open:', request.error);
        reject(new Error('Failed to open database: ' + request.error));
      };

      request.onsuccess = () => {
        db = request.result;
        console.log('Database opened successfully');
        resolve(db);
      };

      request.onupgradeneeded = (event) => {
        db = event.target.result;
        
        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const objectStore = db.createObjectStore(STORE_NAME, { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          console.log('Sessions object store created');
        }
      };
    } catch (error) {
      console.error('Error initializing database:', error);
      reject(error);
    }
  });
}

/**
 * Add a new session to the database
 * @param {string} type - Session type ("Stopwatch" or "Pomodoro")
 * @param {number} duration - Duration in milliseconds
 * @param {Date} date - Timestamp when session was saved
 * @returns {Promise<number>} The ID of the newly created session
 */
export async function addSession(type, duration, date) {
  return new Promise((resolve, reject) => {
    try {
      if (!db) {
        reject(new Error('Database not initialized. Call initDB() first.'));
        return;
      }

      if (!type || typeof duration !== 'number' || !(date instanceof Date)) {
        reject(new Error('Invalid session data: type, duration, and date are required'));
        return;
      }

      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAME);
      
      const session = {
        type,
        duration,
        date
      };

      const request = objectStore.add(session);

      request.onsuccess = () => {
        console.log('Session added successfully with ID:', request.result);
        resolve(request.result);
      };

      request.onerror = () => {
        console.error('Error adding session:', request.error);
        reject(new Error('Failed to add session: ' + request.error));
      };

      transaction.onerror = () => {
        console.error('Transaction error:', transaction.error);
        reject(new Error('Transaction failed: ' + transaction.error));
      };
    } catch (error) {
      console.error('Error in addSession:', error);
      reject(error);
    }
  });
}

/**
 * Retrieve all sessions from the database
 * @returns {Promise<Array<{id: number, type: string, duration: number, date: Date}>>}
 */
export async function getSessions() {
  return new Promise((resolve, reject) => {
    try {
      if (!db) {
        reject(new Error('Database not initialized. Call initDB() first.'));
        return;
      }

      const transaction = db.transaction([STORE_NAME], 'readonly');
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.getAll();

      request.onsuccess = () => {
        console.log('Retrieved sessions:', request.result.length);
        resolve(request.result);
      };

      request.onerror = () => {
        console.error('Error retrieving sessions:', request.error);
        reject(new Error('Failed to retrieve sessions: ' + request.error));
      };

      transaction.onerror = () => {
        console.error('Transaction error:', transaction.error);
        reject(new Error('Transaction failed: ' + transaction.error));
      };
    } catch (error) {
      console.error('Error in getSessions:', error);
      reject(error);
    }
  });
}

/**
 * Delete a session from the database
 * @param {number} id - The ID of the session to delete
 * @returns {Promise<void>}
 */
export async function deleteSession(id) {
  return new Promise((resolve, reject) => {
    try {
      if (!db) {
        reject(new Error('Database not initialized. Call initDB() first.'));
        return;
      }

      if (typeof id !== 'number') {
        reject(new Error('Invalid session ID: must be a number'));
        return;
      }

      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.delete(id);

      request.onsuccess = () => {
        console.log('Session deleted successfully:', id);
        resolve();
      };

      request.onerror = () => {
        console.error('Error deleting session:', request.error);
        reject(new Error('Failed to delete session: ' + request.error));
      };

      transaction.onerror = () => {
        console.error('Transaction error:', transaction.error);
        reject(new Error('Transaction failed: ' + transaction.error));
      };
    } catch (error) {
      console.error('Error in deleteSession:', error);
      reject(error);
    }
  });
}
