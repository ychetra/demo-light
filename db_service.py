import mysql.connector
from mysql.connector import Error

class DatabaseService:
    def __init__(self):
        self.config = {
            'host': '192.167.14.207',
            'user': 'root',
            'password': 'ymswitch',
            'database': 'smart_light',
            'port': 3306,
            'connect_timeout': 10,
            'raise_on_warnings': True
        }

    def connect(self):
        try:
            connection = mysql.connector.connect(**self.config)
            if connection.is_connected():
                print("✅ Successfully connected to MySQL database")
                return connection
        except Error as e:
            print(f"❌ Error connecting to MySQL: {e}")
            return None

    def get_all_device_status(self):
        connection = None
        try:
            connection = self.connect()
            if not connection:
                print("⚠️ No database connection, skipping initial status")
                return []
                
            cursor = connection.cursor(dictionary=True)
            query = "SELECT * FROM device_status"
            cursor.execute(query)
            results = cursor.fetchall()
            print(f"📊 Retrieved {len(results)} device statuses")
            return results
        except Error as e:
            print(f"❌ Error fetching device status: {e}")
            return []
        finally:
            if connection and connection.is_connected():
                cursor.close()
                connection.close()

    def update_device_status(self, device_name, status):
        try:
            connection = self.connect()
            if connection:
                cursor = connection.cursor()
                query = """
                    INSERT INTO device_status (device_name, status) 
                    VALUES (%s, %s)
                    ON DUPLICATE KEY UPDATE status = %s
                """
                cursor.execute(query, (device_name, status, status))
                connection.commit()
                return True
        except Error as e:
            print(f"Error updating device status: {e}")
            return False
        finally:
            if connection and connection.is_connected():
                cursor.close()
                connection.close() 