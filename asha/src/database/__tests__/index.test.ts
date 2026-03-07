import { Platform } from 'react-native';
import { initDatabase, getDatabase, closeDatabase } from '../index';

// Mock SQLite
const mockExecuteSql = jest.fn();
const mockClose = jest.fn();
const mockOpenDatabase = jest.fn(() => ({
  executeSql: mockExecuteSql,
  close: mockClose,
}));

jest.mock('react-native-sqlite-storage', () => ({
  DEBUG: jest.fn(),
  enablePromise: jest.fn(),
  openDatabase: mockOpenDatabase,
}));

// Mock localStorage for web platform
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

describe('Database Initialization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset database state
    jest.resetModules();
  });

  describe('Native Platform', () => {
    beforeEach(() => {
      // Mock Platform.OS as native
      jest.spyOn(Platform, 'OS', 'get').mockReturnValue('ios');
    });

    it('should initialize database successfully on native platform', async () => {
      mockExecuteSql.mockResolvedValue([{ rows: { length: 0 } }]);
      
      const db = await initDatabase();
      
      expect(mockOpenDatabase).toHaveBeenCalledWith({
        name: 'asha_app.db',
        version: '1.0',
        displayName: 'ASHA Mobile App Database',
        size: 200000,
      });
      expect(db).toBeDefined();
      expect(mockExecuteSql).toHaveBeenCalled(); // Tables creation
    });

    it('should create all required tables', async () => {
      mockExecuteSql.mockResolvedValue([{ rows: { length: 0 } }]);
      
      await initDatabase();
      
      // Check that all table creation queries were called
      const executedQueries = mockExecuteSql.mock.calls.map(call => call[0]);
      
      expect(executedQueries.some(query => query.includes('CREATE TABLE IF NOT EXISTS patients'))).toBe(true);
      expect(executedQueries.some(query => query.includes('CREATE TABLE IF NOT EXISTS referrals'))).toBe(true);
      expect(executedQueries.some(query => query.includes('CREATE TABLE IF NOT EXISTS audio_files'))).toBe(true);
      expect(executedQueries.some(query => query.includes('CREATE TABLE IF NOT EXISTS sync_queue'))).toBe(true);
      expect(executedQueries.some(query => query.includes('CREATE TABLE IF NOT EXISTS follow_ups'))).toBe(true);
    });

    it('should create indexes for performance', async () => {
      mockExecuteSql.mockResolvedValue([{ rows: { length: 0 } }]);
      
      await initDatabase();
      
      const executedQueries = mockExecuteSql.mock.calls.map(call => call[0]);
      
      expect(executedQueries.some(query => query.includes('CREATE INDEX IF NOT EXISTS idx_patients_asha_id'))).toBe(true);
      expect(executedQueries.some(query => query.includes('CREATE INDEX IF NOT EXISTS idx_referrals_patient_id'))).toBe(true);
      expect(executedQueries.some(query => query.includes('CREATE INDEX IF NOT EXISTS idx_sync_queue_priority'))).toBe(true);
    });

    it('should handle database initialization errors', async () => {
      mockOpenDatabase.mockRejectedValue(new Error('Database error'));
      
      await expect(initDatabase()).rejects.toThrow('Database error');
    });
  });

  describe('Web Platform', () => {
    beforeEach(() => {
      // Mock Platform.OS as web
      jest.spyOn(Platform, 'OS', 'get').mockReturnValue('web');
      mockLocalStorage.getItem.mockReturnValue(null);
    });

    it('should initialize mock database on web platform', async () => {
      const db = await initDatabase();
      
      expect(db).toBeDefined();
      expect(db.executeSql).toBeDefined();
      expect(db.close).toBeDefined();
      expect(mockLocalStorage.setItem).toHaveBeenCalled(); // Mock tables initialization
    });

    it('should initialize mock tables in localStorage', async () => {
      await initDatabase();
      
      const expectedTables = ['patients', 'referrals', 'audio_files', 'sync_queue', 'follow_ups'];
      expectedTables.forEach(tableName => {
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(`mock_${tableName}`, JSON.stringify([]));
      });
    });

    it('should not reinitialize existing mock tables', async () => {
      mockLocalStorage.getItem.mockReturnValue('[]'); // Existing data
      
      await initDatabase();
      
      // Should not call setItem if data already exists
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    });
  });

  describe('Database Operations', () => {
    beforeEach(() => {
      jest.spyOn(Platform, 'OS', 'get').mockReturnValue('ios');
      mockExecuteSql.mockResolvedValue([{ rows: { length: 0 } }]);
    });

    it('should get database instance after initialization', async () => {
      await initDatabase();
      
      const db = getDatabase();
      expect(db).toBeDefined();
      expect(db.executeSql).toBeDefined();
    });

    it('should throw error when getting database before initialization', () => {
      expect(() => getDatabase()).toThrow('Database not initialized. Call initDatabase() first.');
    });

    it('should close database successfully', async () => {
      await initDatabase();
      
      await closeDatabase();
      
      expect(mockClose).toHaveBeenCalled();
    });

    it('should handle closing database when not initialized', async () => {
      // Should not throw error
      await expect(closeDatabase()).resolves.toBeUndefined();
    });
  });
});