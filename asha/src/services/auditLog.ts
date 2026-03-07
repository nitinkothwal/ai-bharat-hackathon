import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  event: string;
  category: 'auth' | 'data' | 'security' | 'sync' | 'user_action';
  severity: 'info' | 'warning' | 'error' | 'critical';
  userId?: string;
  sessionId?: string;
  details: any;
  deviceInfo: {
    platform: string;
    version?: string;
    userAgent?: string;
  };
  location?: {
    latitude: number;
    longitude: number;
  };
}

class AuditLogService {
  private readonly AUDIT_LOG_KEY = 'audit_logs';
  private readonly MAX_LOG_ENTRIES = 1000; // Keep last 1000 entries
  private readonly LOG_RETENTION_DAYS = 30; // Keep logs for 30 days
  private sessionId: string;

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Log an authentication event
   */
  async logAuthEvent(
    event: string,
    severity: 'info' | 'warning' | 'error' | 'critical',
    details: any,
    userId?: string
  ): Promise<void> {
    await this.logEvent({
      event,
      category: 'auth',
      severity,
      details,
      userId,
    });
  }

  /**
   * Log a data access event
   */
  async logDataEvent(
    event: string,
    severity: 'info' | 'warning' | 'error' | 'critical',
    details: any,
    userId?: string
  ): Promise<void> {
    await this.logEvent({
      event,
      category: 'data',
      severity,
      details,
      userId,
    });
  }

  /**
   * Log a security event
   */
  async logSecurityEvent(
    event: string,
    severity: 'info' | 'warning' | 'error' | 'critical',
    details: any,
    userId?: string
  ): Promise<void> {
    await this.logEvent({
      event,
      category: 'security',
      severity,
      details,
      userId,
    });
  }

  /**
   * Log a sync event
   */
  async logSyncEvent(
    event: string,
    severity: 'info' | 'warning' | 'error' | 'critical',
    details: any,
    userId?: string
  ): Promise<void> {
    await this.logEvent({
      event,
      category: 'sync',
      severity,
      details,
      userId,
    });
  }

  /**
   * Log a user action event
   */
  async logUserAction(
    event: string,
    details: any,
    userId?: string
  ): Promise<void> {
    await this.logEvent({
      event,
      category: 'user_action',
      severity: 'info',
      details,
      userId,
    });
  }

  /**
   * Log a generic event
   */
  private async logEvent(eventData: {
    event: string;
    category: AuditLogEntry['category'];
    severity: AuditLogEntry['severity'];
    details: any;
    userId?: string;
    location?: { latitude: number; longitude: number };
  }): Promise<void> {
    try {
      const logEntry: AuditLogEntry = {
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        event: eventData.event,
        category: eventData.category,
        severity: eventData.severity,
        userId: eventData.userId,
        sessionId: this.sessionId,
        details: this.sanitizeDetails(eventData.details),
        deviceInfo: {
          platform: Platform.OS,
          version: Platform.Version?.toString(),
        },
        location: eventData.location,
      };

      await this.storeLogEntry(logEntry);

      // Log to console in development
      if (__DEV__) {
        console.log(`[AUDIT] ${logEntry.severity.toUpperCase()}: ${logEntry.event}`, logEntry.details);
      }
    } catch (error) {
      console.error('Error logging audit event:', error);
    }
  }

  /**
   * Store log entry in local storage
   */
  private async storeLogEntry(logEntry: AuditLogEntry): Promise<void> {
    try {
      const existingLogs = await this.getStoredLogs();
      const updatedLogs = [logEntry, ...existingLogs];

      // Keep only the most recent entries
      const trimmedLogs = updatedLogs.slice(0, this.MAX_LOG_ENTRIES);

      // Remove old entries based on retention policy
      const retentionDate = new Date();
      retentionDate.setDate(retentionDate.getDate() - this.LOG_RETENTION_DAYS);
      
      const filteredLogs = trimmedLogs.filter(log => 
        new Date(log.timestamp) > retentionDate
      );

      await AsyncStorage.setItem(this.AUDIT_LOG_KEY, JSON.stringify(filteredLogs));
    } catch (error) {
      console.error('Error storing audit log entry:', error);
    }
  }

  /**
   * Get stored audit logs
   */
  private async getStoredLogs(): Promise<AuditLogEntry[]> {
    try {
      const logsJson = await AsyncStorage.getItem(this.AUDIT_LOG_KEY);
      return logsJson ? JSON.parse(logsJson) : [];
    } catch (error) {
      console.error('Error retrieving audit logs:', error);
      return [];
    }
  }

  /**
   * Sanitize sensitive details before logging
   */
  private sanitizeDetails(details: any): any {
    if (!details || typeof details !== 'object') {
      return details;
    }

    const sanitized = { ...details };
    const sensitiveFields = ['password', 'token', 'otp', 'aadhaar', 'biometric', 'signature'];

    // Recursively sanitize sensitive fields
    const sanitizeObject = (obj: any): any => {
      if (Array.isArray(obj)) {
        return obj.map(item => sanitizeObject(item));
      }

      if (obj && typeof obj === 'object') {
        const sanitizedObj: any = {};
        
        for (const [key, value] of Object.entries(obj)) {
          const lowerKey = key.toLowerCase();
          
          if (sensitiveFields.some(field => lowerKey.includes(field))) {
            sanitizedObj[key] = '[REDACTED]';
          } else {
            sanitizedObj[key] = sanitizeObject(value);
          }
        }
        
        return sanitizedObj;
      }

      return obj;
    };

    return sanitizeObject(sanitized);
  }

  /**
   * Get audit logs with filtering options
   */
  async getAuditLogs(options?: {
    category?: AuditLogEntry['category'];
    severity?: AuditLogEntry['severity'];
    userId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<AuditLogEntry[]> {
    try {
      let logs = await this.getStoredLogs();

      // Apply filters
      if (options?.category) {
        logs = logs.filter(log => log.category === options.category);
      }

      if (options?.severity) {
        logs = logs.filter(log => log.severity === options.severity);
      }

      if (options?.userId) {
        logs = logs.filter(log => log.userId === options.userId);
      }

      if (options?.startDate) {
        logs = logs.filter(log => new Date(log.timestamp) >= options.startDate!);
      }

      if (options?.endDate) {
        logs = logs.filter(log => new Date(log.timestamp) <= options.endDate!);
      }

      // Apply limit
      if (options?.limit) {
        logs = logs.slice(0, options.limit);
      }

      return logs;
    } catch (error) {
      console.error('Error retrieving filtered audit logs:', error);
      return [];
    }
  }

  /**
   * Get audit log statistics
   */
  async getAuditStats(): Promise<{
    totalEntries: number;
    entriesByCategory: Record<string, number>;
    entriesBySeverity: Record<string, number>;
    oldestEntry?: string;
    newestEntry?: string;
  }> {
    try {
      const logs = await this.getStoredLogs();
      
      const stats = {
        totalEntries: logs.length,
        entriesByCategory: {} as Record<string, number>,
        entriesBySeverity: {} as Record<string, number>,
        oldestEntry: logs.length > 0 ? logs[logs.length - 1].timestamp : undefined,
        newestEntry: logs.length > 0 ? logs[0].timestamp : undefined,
      };

      // Count by category
      logs.forEach(log => {
        stats.entriesByCategory[log.category] = (stats.entriesByCategory[log.category] || 0) + 1;
        stats.entriesBySeverity[log.severity] = (stats.entriesBySeverity[log.severity] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Error getting audit stats:', error);
      return {
        totalEntries: 0,
        entriesByCategory: {},
        entriesBySeverity: {},
      };
    }
  }

  /**
   * Clear audit logs (for privacy/storage management)
   */
  async clearAuditLogs(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.AUDIT_LOG_KEY);
      await this.logSecurityEvent('audit_logs_cleared', 'warning', {
        action: 'clear_audit_logs',
        reason: 'manual_clear',
      });
    } catch (error) {
      console.error('Error clearing audit logs:', error);
    }
  }

  /**
   * Export audit logs for analysis or compliance
   */
  async exportAuditLogs(): Promise<string> {
    try {
      const logs = await this.getStoredLogs();
      return JSON.stringify(logs, null, 2);
    } catch (error) {
      console.error('Error exporting audit logs:', error);
      return '[]';
    }
  }

  /**
   * Start a new session (call on app start or login)
   */
  startNewSession(): void {
    this.sessionId = this.generateSessionId();
  }

  /**
   * Get current session ID
   */
  getCurrentSessionId(): string {
    return this.sessionId;
  }
}

export const auditLog = new AuditLogService();