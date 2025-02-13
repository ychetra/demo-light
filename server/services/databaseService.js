import mysql from 'mysql2/promise';
import { config } from '../config/config.js';

class DatabaseService {
  constructor() {
    this.pool = null;
    this.isConnecting = false;
    this.retryCount = 0;
    this.maxRetries = 5;
    this.retryDelay = 5000; // 5 seconds
  }

  async createPool() {
    if (this.pool) return;

    try {
      console.log('Creating database pool with config:', {
        host: config.database.host,
        user: config.database.user,
        database: config.database.database,
        port: config.database.port
      });

      this.pool = await mysql.createPool({
        ...config.database,
        waitForConnections: true,
        connectionLimit: 10
      });

      // Test the connection
      const connection = await this.pool.getConnection();
      console.log('✅ Database connection successful');
      connection.release();
      
      return this.pool;
    } catch (error) {
      console.error('❌ Failed to create database pool:', error);
      this.pool = null;
      throw error;
    }
  }

  async getAllDeviceStatus() {
    if (!this.pool && !this.isConnecting) {
      this.isConnecting = true;
      await this.createPool();
      this.isConnecting = false;
    }

    try {
      if (!this.pool) {
        console.log('⚠️ No database connection available');
        return [];
      }

      // Get only the latest status for each device
      const query = `
        SELECT ds1.* 
        FROM device_status ds1
        INNER JOIN (
          SELECT device_name, MAX(id) as max_id
          FROM device_status
          GROUP BY device_name
        ) ds2 
        ON ds1.device_name = ds2.device_name 
        AND ds1.id = ds2.max_id
        ORDER BY ds1.device_name
      `;

      const [rows] = await this.pool.query(query);
      console.log(`📊 Retrieved ${rows.length} device statuses:`, rows);
      return rows;
    } catch (error) {
      console.error('❌ Error fetching device status:', error.message);
      return [];
    }
  }

  async updateDeviceStatus(deviceName, status) {
    if (!this.pool && !this.isConnecting) {
      this.isConnecting = true;
      await this.createPool();
      this.isConnecting = false;
    }

    try {
      if (!this.pool) {
        console.log('⚠️ No database connection available');
        return false;
      }

      const query = `
        INSERT INTO device_status (device_name, status, timestamp) 
        VALUES (?, ?, NOW())
      `;
      await this.pool.query(query, [deviceName, status]);
      console.log(`✅ Database updated for ${deviceName}`);
      return true;
    } catch (error) {
      console.error('❌ Error updating device status:', error.message);
      return false;
    }
  }

  // Optional: Add method to get history for a specific device
  async getDeviceHistory(deviceName, limit = 10) {
    if (!this.pool) {
      console.log('⚠️ No database connection available');
      return [];
    }

    try {
      const query = `
        SELECT * FROM device_status 
        WHERE device_name = ? 
        ORDER BY id DESC 
        LIMIT ?
      `;
      const [rows] = await this.pool.query(query, [deviceName, limit]);
      return rows;
    } catch (error) {
      console.error('❌ Error fetching device history:', error.message);
      return [];
    }
  }

  async getDailyUsageReports() {
    try {
      if (!this.pool) {
        console.log('Creating new database pool...');
        await this.createPool();
      }

      const connection = await this.pool.getConnection();
      console.log('Got database connection');

      try {
        const query = `
          SELECT 
            DATE_FORMAT(timestamp, '%Y-%m-%d') as date,
            COUNT(*) as count
          FROM device_status 
          WHERE timestamp >= DATE_SUB(CURRENT_DATE, INTERVAL 31 DAY)
          GROUP BY DATE(timestamp)
          ORDER BY date DESC
        `;

        console.log('Executing query:', query);
        const [rows] = await connection.query(query);
        console.log('Raw query results:', rows);

        if (!Array.isArray(rows)) {
          throw new Error('Database returned invalid format');
        }

        const formattedResults = rows.map(row => ({
          date: row.date,
          count: parseInt(row.count, 10)
        }));

        console.log('Formatted results:', formattedResults);
        return formattedResults;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Database error:', error);
      throw error;
    }
  }
}

export const dbService = new DatabaseService(); 