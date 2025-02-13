export const config = {
  mqtt: {
    broker: "192.167.14.207",
    port: 1883,
    username: "mqtt",
    password: "mqtt",
    topic: "switches/#"
  },
  websocket: {
    port: 8765,
    host: "0.0.0.0"
  },
  database: {
    host: "192.167.14.207",
    user: "root",
    password: "ymswitch",
    database: "smart_light",
    port: 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    connectTimeout: 30000,
    dateStrings: true // Force dates to be returned as strings
  }
}; 