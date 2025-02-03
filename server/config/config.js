export const config = {
  mqtt: {
    broker: "192.167.12.132",
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
    host: "192.167.7.130",
    user: "root",
    password: "ymswitch",
    database: "smart_light",
    port: 3306
  }
}; 