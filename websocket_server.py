import asyncio
import websockets
import json
import paho.mqtt.client as mqtt
from datetime import datetime
from db_service import DatabaseService

# Initialize services
db_service = DatabaseService()
connections = set()

# MQTT settings
MQTT_BROKER = "192.167.12.132"
MQTT_PORT = 1883
MQTT_USERNAME = "mqtt"
MQTT_PASSWORD = "mqtt"
MQTT_TOPIC = "switches/#"

# Create event loop for async operations
loop = asyncio.new_event_loop()
asyncio.set_event_loop(loop)

def log_message(msg, prefix="INFO"):
    timestamp = datetime.now().strftime("%H:%M:%S")
    print(f"[{timestamp}] {prefix}: {msg}")

# MQTT callbacks
def on_connect(client, userdata, flags, rc):
    log_message(f"Connected to MQTT broker with result code: {rc}", "MQTT")
    client.subscribe(MQTT_TOPIC)
    log_message(f"Subscribed to topic: {MQTT_TOPIC}", "MQTT")

def on_disconnect(client, userdata, rc):
    log_message(f"Disconnected from MQTT broker with result code: {rc}", "MQTT")

def on_subscribe(client, userdata, mid, granted_qos):
    log_message(f"Subscribed successfully. Message ID: {mid}", "MQTT")

# MQTT callback when message is received
def on_message(client, userdata, msg):
    try:
        print("\n" + "="*50)
        print("🔵 MQTT MESSAGE RECEIVED")
        payload = msg.payload.decode()
        print(f"Topic: {msg.topic}")
        print(f"Payload: {payload}")
        
        data = json.loads(payload)
        print("\n🔍 Parsed Data:")
        print(json.dumps(data, indent=2))
        
        if 'device_name' in data:
            device_key = data['device_name'].lower()
            status = data.get(device_key)
            
            # Update database
            if db_service.update_device_status(data['device_name'], status):
                print(f"✅ Database updated for {data['device_name']}")
            
            # Broadcast to WebSocket clients
            client_count = len(connections)
            print(f"\n📡 Broadcasting to {client_count} WebSocket clients")
            asyncio.run_coroutine_threadsafe(broadcast(payload), loop)
            print("="*50 + "\n")
        else:
            print("⚠️ No device_name in message")
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")

async def broadcast(message):
    if connections:
        try:
            # Create tasks for each connection
            tasks = []
            for connection in connections.copy():  # Use copy to avoid modification during iteration
                try:
                    await connection.send(message)
                    print(f"✅ Message sent to {connection.remote_address}")
                except websockets.exceptions.ConnectionClosed:
                    connections.remove(connection)
                    print(f"❌ Removed closed connection")
                except Exception as e:
                    print(f"❌ Error sending to client: {e}")
        except Exception as e:
            print(f"❌ Broadcast error: {e}")
    else:
        print("⚠️ No WebSocket clients connected!")

async def send_initial_status(websocket):
    try:
        device_status = db_service.get_all_device_status()
        if device_status:
            for status in device_status:
                message = {
                    'device_name': status['device_name'],
                    status['device_name'].lower(): status['status'].lower(),
                    'time': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    'source': 'database'
                }
                await websocket.send(json.dumps(message))
                print(f"✅ Sent initial status for {status['device_name']}")
    except Exception as e:
        print(f"❌ Error sending initial status: {e}")

async def handler(websocket):
    remote = websocket.remote_address
    print(f"🔌 New WebSocket client connected from {remote}")
    
    try:
        # Add to connections set
        connections.add(websocket)
        print(f"Total connections: {len(connections)}")
        
        # Send initial status from database
        device_status = db_service.get_all_device_status()
        if device_status:
            for status in device_status:
                try:
                    message = {
                        'device_name': status['device_name'],
                        status['device_name'].lower(): status['status'].lower(),
                        'time': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                        'source': 'database'
                    }
                    await websocket.send(json.dumps(message))
                    print(f"✅ Sent status for {status['device_name']}")
                except Exception as e:
                    print(f"⚠️ Error sending status for {status['device_name']}: {e}")
                    continue
        else:
            print("ℹ️ No initial device status to send")
        
        # Keep connection alive
        while True:
            try:
                message = await websocket.recv()
                print(f"📩 Received from client {remote}: {message}")
            except websockets.exceptions.ConnectionClosedOK:
                print(f"ℹ️ Client {remote} closed connection normally")
                break
            except websockets.exceptions.ConnectionClosedError as e:
                print(f"⚠️ Client {remote} connection lost: {e}")
                break
            except Exception as e:
                print(f"❌ Error handling message: {e}")
                break
                
    except Exception as e:
        print(f"❌ Handler error for {remote}: {e}")
    finally:
        if websocket in connections:
            connections.remove(websocket)
            print(f"👋 Client {remote} disconnected. {len(connections)} clients remaining")

async def main():
    # Setup MQTT client
    client = mqtt.Client()
    client.username_pw_set(MQTT_USERNAME, MQTT_PASSWORD)
    
    # Set up callbacks
    client.on_connect = on_connect
    client.on_disconnect = on_disconnect
    client.on_message = on_message
    client.on_subscribe = on_subscribe
    
    try:
        print(f"🔄 Connecting to MQTT broker at {MQTT_BROKER}:{MQTT_PORT}")
        client.connect(MQTT_BROKER, MQTT_PORT, 60)
        client.loop_start()
    except Exception as e:
        print(f"❌ Failed to connect to MQTT broker: {e}")
        return

    # Start WebSocket server
    try:
        async with websockets.serve(
            handler, 
            "0.0.0.0", 
            8765,
            # Add these extra_headers
            extra_headers={
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': '*'
            }
        ):
            print("✅ WebSocket server started on ws://0.0.0.0:8765")
            await asyncio.Future()  # run forever
    except Exception as e:
        print(f"❌ WebSocket server error: {e}")
    finally:
        print("🔄 Shutting down MQTT client")
        client.loop_stop()
        client.disconnect()

if __name__ == "__main__":
    print("🚀 Starting WebSocket-MQTT bridge...")
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n👋 Shutting down server...")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")