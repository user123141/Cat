// src/utils/FirebaseLogger.ts

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'success' | 'warn' | 'error';
  message: string;
}

export class FirebaseLogger {
  private static logs: LogEntry[] = [];
  private static listeners: ((logs: LogEntry[]) => void)[] = [];

  static log(level: 'info' | 'success' | 'warn' | 'error', message: string) {
    const timestamp = new Date().toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    
    const emoji = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : level === 'success' ? '✅' : '📡';
    console.log(`${emoji} [FirebaseLogger ${timestamp}] ${message}`);
    
    const entry: LogEntry = { timestamp, level, message };
    this.logs.unshift(entry);
    
    if (this.logs.length > 200) {
      this.logs.pop();
    }

    this.listeners.forEach((listener) => {
      try {
        listener([...this.logs]);
      } catch (e) {
        console.error('Error in FirebaseLogger listener:', e);
      }
    });
  }

  static getLogs(): LogEntry[] {
    return this.logs;
  }

  static addListener(listener: (logs: LogEntry[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  static clear() {
    this.logs = [];
    this.listeners.forEach((listener) => listener([]));
  }
}
