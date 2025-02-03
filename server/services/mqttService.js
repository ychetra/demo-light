import mqtt from 'mqtt';
import { config } from '../config/config.js';

class MQTTService {
  constructor(messageCallback) {
    this.client = null;
    this.messageCallback = messageCallback;
  }

  connect() {
    const { broker, port, username, password } = config.mqtt;
    const url = `mqtt://${broker}:${port}`;

    this.client = mqtt.connect(url, {
      username,
      password,
      reconnectPeriod: 5000
    });

    this.client.on('connect', () => {
      console.log('✅ Connected to MQTT broker');
      this.client.subscribe(config.mqtt.topic, (err) => {
        if (!err) {
          console.log(`📥 Subscribed to ${config.mqtt.topic}`);
        }
      });
    });

    this.client.on('message', (topic, message) => {
      try {
        console.group('📨 MQTT Message Received');
        console.log('Topic:', topic);
        console.log('Raw message:', message.toString());
        
        const payload = JSON.parse(message.toString());
        console.log('Parsed payload:', payload);
        console.log('Source IP:', this.client.options.host);
        console.log('Timestamp:', new Date().toISOString());
        
        // Add validation
        if (!this.isValidMessage(payload)) {
          console.log('⚠️ Invalid message format, skipping');
          console.groupEnd();
          return;
        }

        this.messageCallback(payload);
        console.groupEnd();
      } catch (error) {
        console.error('❌ Error processing MQTT message:', error);
        console.groupEnd();
      }
    });

    this.client.on('error', (error) => {
      console.error('❌ MQTT error:', error);
    });
  }

  isValidMessage(payload) {
    // Check if message has required fields
    if (!payload.device_name) {
      console.log('Missing device_name');
      return false;
    }

    // Check if device name follows expected format
    const deviceNamePattern = /^L\d+R\d+_B1$/;
    if (!deviceNamePattern.test(payload.device_name)) {
      console.log('Invalid device_name format');
      return false;
    }

    // Check if status exists and is valid
    const deviceKey = payload.device_name.toLowerCase();
    const status = payload[deviceKey];
    if (!status || !['on', 'off'].includes(status.toLowerCase())) {
      console.log('Invalid status');
      return false;
    }

    return true;
  }

  disconnect() {
    if (this.client) {
      this.client.end();
    }
  }
}

export default MQTTService; 