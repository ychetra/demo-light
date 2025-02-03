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
      this.pool = mysql.createPool({
        ...config.database,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        connectTimeout: 10000,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0
      });

      // Test the connection
      const connection = await this.pool.getConnection();
      console.log('✅ Successfully connected to MySQL database');
      connection.release();
    } catch (error) {
      console.error(`❌ Failed to connect to MySQL: ${error.message}`);
      this.pool = null;
      
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        console.log(`🔄 Retrying connection in ${this.retryDelay/1000} seconds... (Attempt ${this.retryCount}/${this.maxRetries})`);
        setTimeout(() => this.createPool(), this.retryDelay);
      } else {
        console.error('❌ Max retry attempts reached. Please check database connection settings.');
      }
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
}

export const dbService = new DatabaseService(); 