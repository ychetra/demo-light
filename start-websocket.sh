#!/bin/bash

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Check if required packages are installed
if ! pip freeze | grep -q "websockets"; then
    echo "Installing required packages..."
    pip install websockets paho-mqtt mysql-connector-python
fi

# Start the WebSocket server
echo "Starting WebSocket server..."
python3 websocket_server.py 