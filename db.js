/**
 * Database Module - IndexedDB wrapper for session storage
 * Provides CRUD operations for timer sessions using browser's built-in database
 * Effects on webpage: Enables persistent storage of completed timer sessions
 * Used by: History tab, session saving functionality, data persistence across browser sessions
 * Removal impact: All session data would be lost on page refresh, history tab would be empty
 */

// Database name stored in browser's IndexedDB - identifies this app's database
// Effects: Creates isolated storage space for timer app data
// Removal impact: Database operations would fail without a name identifier
const DB_NAME = 'TimerDB';

// Database version number for schema management and upgrades
// Effects: Allows database structure changes and migration handling
// Removal impact: Database opening would fail without version specification
const DB_VERSION = 1;

// Object store name within the database - like a table name in SQL
// Effects: Organizes session data in a structured container
// Removal impact: Data operations would fail without store name reference
const STORE_NAME = 'sessions';

// Global variable holding the database connection instance
// Effects: Provides shared access to database across all functions in this module
// Removal impact: All database operations would fail without connection reference
let db = null;

/**
 * Initialize or open the TimerDB database and create schema if needed
 * Effects on webpage: Enables session storage functionality, creates database structure
 * Called by: App initialization, ensures database is ready before any operations
 * Removal impact: No sessions could be saved, history tab would be non-functional
 * @returns {Promise<IDBDatabase>} The database instance for further operations
 */
export async function initDB() {
  // Return Promise to handle asynchronous database opening
  // Effects: Allows async/await usage in calling code for cleaner error handling
  // Removal impact: Function would not be awaitable, causing timing issues
  return new Promise((resolve, reject) => {
    try {
      // Request to open IndexedDB database with specified name and version
      // Effects: Initiates database connection or creation process
      // Removal impact: No database connection would be established
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      // Error handler for database opening failures
      // Effects: Provides error feedback when database access is denied or fails
      // Removal impact: Errors would be silent, making debugging impossible
      request.onerror = () => {
        console.error('Database failed to open:', request.error);
        reject(new Error('Failed to open database: ' + request.error));
      };

      // Success handler when database opens successfully
      // Effects: Stores database reference and signals successful initialization
      // Removal impact: Database reference would not be stored, breaking all operations
      request.onsuccess = () => {
        // Store database instance in global variable for use by other functions
        db = request.result;
        console.log('Database opened successfully');
        // Resolve promise to indicate successful initialization
        resolve(db);
      };

      // Upgrade handler for database schema changes (runs on first creation or version change)
      // Effects: Creates the sessions table structure when database is first created
      // Removal impact: Database would have no structure to store session data
      request.onupgradeneeded = (event) => {
        // Get database instance from upgrade event
        db = event.target.result;
        
        // Create object store if it doesn't exist (like creating a table in SQL)
        // Effects: Establishes the sessions storage container with auto-incrementing IDs
        // Removal impact: No storage structure for sessions, all save operations would fail
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const objectStore = db.createObjectStore(STORE_NAME, { 
            keyPath: 'id',        // Primary key field name
            autoIncrement: true   // Automatically generate unique IDs
          });
          console.log('Sessions object store created');
        }
      };
    } catch (error) {
      // Catch any synchronous errors during database opening
      // Effects: Handles browser compatibility issues or permission errors
      // Removal impact: Unhandled errors could crash the application
      console.error('Error initializing database:', error);
      reject(error);
    }
  });
}

/**
 * Add a new completed timer session to the database
 * Effects on webpage: Saves session data that appears in history tab
 * Called by: Stopwatch save button, Pomodoro work completion
 * Removal impact: Sessions would not be saved, history tab would remain empty
 * @param {string} type - Session type ("Stopwatch" or "Pomodoro") for categorization
 * @param {number} duration - Duration in milliseconds (e.g., 1500000 for 25 minutes)
 * @param {Date} date - Timestamp when session was completed/saved
 * @returns {Promise<number>} The auto-generated ID of the newly created session record
 */
export async function addSession(type, duration, date) {
  // Return Promise for asynchronous database write operation
  // Effects: Allows calling code to wait for save completion and handle errors
  // Removal impact: Function would not be awaitable, causing timing issues
  return new Promise((resolve, reject) => {
    try {
      // Check if database connection exists before attempting to save
      // Effects: Prevents errors when trying to save before database is ready
      // Removal impact: Would attempt operations on null database, causing crashes
      if (!db) {
        reject(new Error('Database not initialized. Call initDB() first.'));
        return;
      }

      // Validate input parameters to ensure data integrity
      // Effects: Prevents invalid data from being stored in database
      // Removal impact: Corrupt or invalid data could be saved, breaking history display
      if (!type || typeof duration !== 'number' || !(date instanceof Date)) {
        reject(new Error('Invalid session data: type, duration, and date are required'));
        return;
      }

      // Create a read-write transaction for the sessions store
      // Effects: Ensures data consistency and allows writing to database
      // Removal impact: No transaction means no way to write data to database
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      
      // Get reference to the sessions object store within the transaction
      // Effects: Provides access to the sessions storage container
      // Removal impact: No access to storage means no way to save session data
      const objectStore = transaction.objectStore(STORE_NAME);
      
      // Create session object with provided data
      // Effects: Structures data for storage with consistent format
      // Removal impact: No data object means nothing to save to database
      const session = {
        type,      // "Stopwatch" or "Pomodoro" for filtering in history
        duration,  // Time in milliseconds for display formatting
        date       // Timestamp for chronological sorting
      };

      // Add the session object to the database store
      // Effects: Initiates the actual save operation to persistent storage
      // Removal impact: Session data would not be written to database
      const request = objectStore.add(session);

      // Success handler when session is successfully saved
      // Effects: Provides confirmation and returns the auto-generated session ID
      // Removal impact: Calling code would not know if save succeeded or get the ID
      request.onsuccess = () => {
        console.log('Session added successfully with ID:', request.result);
        // Return the auto-generated ID for potential future reference
        resolve(request.result);
      };

      // Error handler for save operation failures
      // Effects: Provides error feedback when save fails due to storage issues
      // Removal impact: Save failures would be silent, making debugging impossible
      request.onerror = () => {
        console.error('Error adding session:', request.error);
        reject(new Error('Failed to add session: ' + request.error));
      };

      // Transaction error handler for broader transaction failures
      // Effects: Catches transaction-level errors like storage quota exceeded
      // Removal impact: Transaction errors would be unhandled, potentially crashing app
      transaction.onerror = () => {
        console.error('Transaction error:', transaction.error);
        reject(new Error('Transaction failed: ' + transaction.error));
      };
    } catch (error) {
      // Catch any synchronous errors during the save process
      // Effects: Handles unexpected errors like browser compatibility issues
      // Removal impact: Unhandled errors could crash the application
      console.error('Error in addSession:', error);
      reject(error);
    }
  });
}

/**
 * Retrieve all saved timer sessions from the database for history display
 * Effects on webpage: Populates the history tab with all completed sessions
 * Called by: History tab rendering, when user switches to history view
 * Removal impact: History tab would be empty, no way to view past sessions
 * @returns {Promise<Array<{id: number, type: string, duration: number, date: Date}>>} Array of all session records
 */
export async function getSessions() {
  // Return Promise for asynchronous database read operation
  // Effects: Allows calling code to wait for data retrieval and handle errors
  // Removal impact: Function would not be awaitable, causing timing issues
  return new Promise((resolve, reject) => {
    try {
      // Check if database connection exists before attempting to read
      // Effects: Prevents errors when trying to read before database is ready
      // Removal impact: Would attempt operations on null database, causing crashes
      if (!db) {
        reject(new Error('Database not initialized. Call initDB() first.'));
        return;
      }

      // Create a read-only transaction for the sessions store
      // Effects: Ensures data consistency during read operation, prevents conflicts
      // Removal impact: No transaction means no way to read data from database
      const transaction = db.transaction([STORE_NAME], 'readonly');
      
      // Get reference to the sessions object store within the transaction
      // Effects: Provides access to the sessions storage container for reading
      // Removal impact: No access to storage means no way to retrieve session data
      const objectStore = transaction.objectStore(STORE_NAME);
      
      // Request all records from the sessions store
      // Effects: Initiates retrieval of all saved session data for history display
      // Removal impact: No data would be retrieved, history tab would be empty
      const request = objectStore.getAll();

      // Success handler when sessions are successfully retrieved
      // Effects: Returns array of all session objects to populate history table
      // Removal impact: History tab would not receive data, remaining empty
      request.onsuccess = () => {
        console.log('Retrieved sessions:', request.result.length);
        // Return the array of session objects with all their properties
        resolve(request.result);
      };

      // Error handler for retrieval operation failures
      // Effects: Provides error feedback when read fails due to storage issues
      // Removal impact: Read failures would be silent, history would appear empty
      request.onerror = () => {
        console.error('Error retrieving sessions:', request.error);
        reject(new Error('Failed to retrieve sessions: ' + request.error));
      };

      // Transaction error handler for broader transaction failures
      // Effects: Catches transaction-level errors like database corruption
      // Removal impact: Transaction errors would be unhandled, potentially crashing app
      transaction.onerror = () => {
        console.error('Transaction error:', transaction.error);
        reject(new Error('Transaction failed: ' + transaction.error));
      };
    } catch (error) {
      // Catch any synchronous errors during the read process
      // Effects: Handles unexpected errors like browser compatibility issues
      // Removal impact: Unhandled errors could crash the application
      console.error('Error in getSessions:', error);
      reject(error);
    }
  });
}

/**
 * Delete a specific session record from the database
 * Effects on webpage: Removes session from history table when delete button is clicked
 * Called by: Delete button click handler in history table
 * Removal impact: Users could not delete unwanted sessions, history would become cluttered
 * @param {number} id - The auto-generated ID of the session record to delete
 * @returns {Promise<void>} Promise that resolves when deletion is complete
 */
export async function deleteSession(id) {
  // Return Promise for asynchronous database delete operation
  // Effects: Allows calling code to wait for deletion completion and handle errors
  // Removal impact: Function would not be awaitable, causing timing issues
  return new Promise((resolve, reject) => {
    try {
      // Check if database connection exists before attempting to delete
      // Effects: Prevents errors when trying to delete before database is ready
      // Removal impact: Would attempt operations on null database, causing crashes
      if (!db) {
        reject(new Error('Database not initialized. Call initDB() first.'));
        return;
      }

      // Validate that ID is a number to prevent invalid delete operations
      // Effects: Ensures only valid session IDs are used for deletion
      // Removal impact: Invalid IDs could cause database errors or delete wrong records
      if (typeof id !== 'number') {
        reject(new Error('Invalid session ID: must be a number'));
        return;
      }

      // Create a read-write transaction for the sessions store
      // Effects: Ensures data consistency during delete operation, prevents conflicts
      // Removal impact: No transaction means no way to delete data from database
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      
      // Get reference to the sessions object store within the transaction
      // Effects: Provides access to the sessions storage container for deletion
      // Removal impact: No access to storage means no way to delete session data
      const objectStore = transaction.objectStore(STORE_NAME);
      
      // Request deletion of the specific session by ID
      // Effects: Initiates removal of the session record from persistent storage
      // Removal impact: Session would not be deleted, remaining in history permanently
      const request = objectStore.delete(id);

      // Success handler when session is successfully deleted
      // Effects: Confirms deletion completion, allows UI to update
      // Removal impact: Calling code would not know if deletion succeeded
      request.onsuccess = () => {
        console.log('Session deleted successfully:', id);
        // Resolve with no value to indicate successful completion
        resolve();
      };

      // Error handler for delete operation failures
      // Effects: Provides error feedback when delete fails (e.g., ID not found)
      // Removal impact: Delete failures would be silent, making debugging impossible
      request.onerror = () => {
        console.error('Error deleting session:', request.error);
        reject(new Error('Failed to delete session: ' + request.error));
      };

      // Transaction error handler for broader transaction failures
      // Effects: Catches transaction-level errors like database corruption
      // Removal impact: Transaction errors would be unhandled, potentially crashing app
      transaction.onerror = () => {
        console.error('Transaction error:', transaction.error);
        reject(new Error('Transaction failed: ' + transaction.error));
      };
    } catch (error) {
      // Catch any synchronous errors during the delete process
      // Effects: Handles unexpected errors like browser compatibility issues
      // Removal impact: Unhandled errors could crash the application
      console.error('Error in deleteSession:', error);
      reject(error);
    }
  });
}
