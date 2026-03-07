import { Platform } from 'react-native';

// Platform-specific database implementation
let SQLite: any = null;
let database: any = null;

const DATABASE_NAME = 'asha_app.db';
const DATABASE_VERSION = '1.0';
const DATABASE_DISPLAYNAME = 'ASHA Mobile App Database';
const DATABASE_SIZE = 200000;

// Mock database interface for web platform
interface MockDatabase {
  executeSql: (query: string, params?: any[]) => Promise<any[]>;
  close: () => Promise<void>;
}

// Initialize SQLite only on native platforms
if (Platform.OS !== 'web') {
  try {
    SQLite = require('react-native-sqlite-storage');
    SQLite.DEBUG(true);
    SQLite.enablePromise(true);
  } catch (error) {
    console.warn('SQLite not available:', error);
  }
}

export const initDatabase = async (): Promise<any> => {
  if (Platform.OS === 'web') {
    // For web, use a mock database with localStorage
    console.log('Using web storage instead of SQLite');
    database = {
      executeSql: async (query: string, params?: any[]) => {
        console.log('Mock SQL:', query, params);
        // Return mock result structure that matches SQLite
        return [{ 
          rows: { 
            length: 0, 
            item: (index: number) => null,
            _array: []
          } 
        }];
      },
      close: async () => {
        console.log('Mock database closed');
      },
    } as MockDatabase;
    
    // Initialize mock tables in localStorage if needed
    await initMockTables();
    return database;
  }

  if (!SQLite) {
    throw new Error('SQLite not available on this platform');
  }

  try {
    database = await SQLite.openDatabase({
      name: DATABASE_NAME,
      version: DATABASE_VERSION,
      displayName: DATABASE_DISPLAYNAME,
      size: DATABASE_SIZE,
    });

    console.log('Database opened successfully');
    await createTables();
    return database;
  } catch (error) {
    console.error('Error opening database:', error);
    throw error;
  }
};

const initMockTables = async () => {
  // Initialize mock data structure in localStorage for web platform
  const mockTables = ['patients', 'referrals', 'audio_files', 'sync_queue', 'follow_ups'];
  
  mockTables.forEach(tableName => {
    const existingData = localStorage.getItem(`mock_${tableName}`);
    if (!existingData) {
      localStorage.setItem(`mock_${tableName}`, JSON.stringify([]));
    }
  });
  
  console.log('Mock tables initialized in localStorage');
};

const createTables = async () => {
  if (Platform.OS === 'web') {
    // Tables are already initialized in localStorage for web
    console.log('Mock tables ready for web platform');
    return;
  }

  try {
    // Patients table
    await database.executeSql(`
      CREATE TABLE IF NOT EXISTS patients (
        id TEXT PRIMARY KEY,
        patient_id TEXT UNIQUE NOT NULL,
        full_name TEXT NOT NULL,
        age INTEGER NOT NULL,
        gender TEXT NOT NULL,
        mobile_number TEXT,
        village_code TEXT,
        village_name TEXT,
        address TEXT,
        aadhaar_number TEXT,
        created_by_asha_id TEXT,
        created_by_asha_name TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        is_synced INTEGER DEFAULT 0,
        is_deleted INTEGER DEFAULT 0
      )
    `);

    // Referrals table
    await database.executeSql(`
      CREATE TABLE IF NOT EXISTS referrals (
        id TEXT PRIMARY KEY,
        referral_id TEXT UNIQUE,
        patient_id TEXT NOT NULL,
        patient_name TEXT,
        patient_age INTEGER,
        patient_gender TEXT,
        referral_type TEXT NOT NULL,
        form_data TEXT NOT NULL,
        risk_score REAL,
        risk_level TEXT,
        risk_factors TEXT,
        ai_summary TEXT,
        recommendations TEXT,
        asha_id TEXT NOT NULL,
        asha_name TEXT,
        asha_mobile TEXT,
        phc_code TEXT,
        phc_name TEXT,
        village_code TEXT,
        village_name TEXT,
        status TEXT DEFAULT 'submitted',
        status_history TEXT,
        geolocation TEXT,
        audio_file_keys TEXT,
        pdf_s3_key TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        completed_at INTEGER,
        completion_data TEXT,
        is_synced INTEGER DEFAULT 0,
        is_deleted INTEGER DEFAULT 0,
        FOREIGN KEY (patient_id) REFERENCES patients (patient_id)
      )
    `);

    // Audio files table
    await database.executeSql(`
      CREATE TABLE IF NOT EXISTS audio_files (
        id TEXT PRIMARY KEY,
        referral_id TEXT,
        patient_id TEXT,
        field_name TEXT NOT NULL,
        local_path TEXT NOT NULL,
        s3_key TEXT,
        file_size INTEGER NOT NULL,
        duration INTEGER,
        transcription TEXT,
        confidence_score REAL,
        language_code TEXT,
        created_at INTEGER NOT NULL,
        is_synced INTEGER DEFAULT 0,
        is_deleted INTEGER DEFAULT 0
      )
    `);

    // Sync queue table
    await database.executeSql(`
      CREATE TABLE IF NOT EXISTS sync_queue (
        id TEXT PRIMARY KEY,
        item_type TEXT NOT NULL,
        item_id TEXT NOT NULL,
        data TEXT NOT NULL,
        priority INTEGER DEFAULT 1,
        retry_count INTEGER DEFAULT 0,
        last_attempt INTEGER,
        status TEXT DEFAULT 'pending',
        error_message TEXT,
        created_at INTEGER NOT NULL
      )
    `);

    // Follow-ups table
    await database.executeSql(`
      CREATE TABLE IF NOT EXISTS follow_ups (
        id TEXT PRIMARY KEY,
        follow_up_id TEXT UNIQUE,
        referral_id TEXT NOT NULL,
        patient_id TEXT NOT NULL,
        patient_name TEXT,
        asha_id TEXT NOT NULL,
        scheduled_date INTEGER NOT NULL,
        status TEXT DEFAULT 'pending',
        completed_date INTEGER,
        outcome_notes TEXT,
        outcome_status TEXT,
        next_action_required INTEGER DEFAULT 0,
        next_follow_up_date INTEGER,
        completed_by_user_id TEXT,
        reminder_sent_at INTEGER,
        reminder_count INTEGER DEFAULT 0,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        is_synced INTEGER DEFAULT 0
      )
    `);

    // Create indexes for better performance
    await database.executeSql('CREATE INDEX IF NOT EXISTS idx_patients_asha_id ON patients (created_by_asha_id)');
    await database.executeSql('CREATE INDEX IF NOT EXISTS idx_patients_village ON patients (village_code)');
    await database.executeSql('CREATE INDEX IF NOT EXISTS idx_referrals_patient_id ON referrals (patient_id)');
    await database.executeSql('CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals (status)');
    await database.executeSql('CREATE INDEX IF NOT EXISTS idx_referrals_risk_score ON referrals (risk_score DESC)');
    await database.executeSql('CREATE INDEX IF NOT EXISTS idx_referrals_created_at ON referrals (created_at DESC)');
    await database.executeSql('CREATE INDEX IF NOT EXISTS idx_sync_queue_priority ON sync_queue (priority DESC, created_at ASC)');
    await database.executeSql('CREATE INDEX IF NOT EXISTS idx_follow_ups_scheduled_date ON follow_ups (scheduled_date)');

    console.log('All tables created successfully');
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  }
};

export const getDatabase = (): any => {
  if (!database) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return database;
};

export const closeDatabase = async (): Promise<void> => {
  if (database) {
    if (Platform.OS === 'web') {
      console.log('Mock database closed');
    } else {
      await database.close();
      console.log('Database closed');
    }
    database = null;
  }
};

export default {
  initDatabase,
  getDatabase,
  closeDatabase,
};