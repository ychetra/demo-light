@echo off
echo Starting WebSocket server...

:: Check if virtual environment exists
if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
)

:: Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

:: Install required packages
echo Checking required packages...
pip install websockets paho-mqtt mysql-connector-python

:: Start the WebSocket server
echo Starting WebSocket server...
python websocket_server.py 