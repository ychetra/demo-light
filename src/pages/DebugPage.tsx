import { useState, useEffect } from 'react';
import '../styles/debug.css';

interface DebugMessage {
  timestamp: string;
  device_name: string;
  status: string;
}

export const DebugPage = () => {
  const [messages, setMessages] = useState<DebugMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Simplified date formatting function
  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) {
        console.error('Invalid timestamp:', isoString);
        return 'Invalid Date';
      }
      // Convert to Cambodia time (UTC+7)
      const options: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Phnom_Penh',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      };
      return date.toLocaleString('en-US', options);
    } catch (err) {
      console.error('Error formatting date:', err);
      return 'Invalid Date';
    }
  };

  useEffect(() => {
    // Update WebSocket URL to match your server configuration
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.hostname}:8765`;
    
    let ws: WebSocket;
    let reconnectTimer: number;

    const connectWebSocket = () => {
      try {
        console.log('Attempting to connect to:', wsUrl);
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log('WebSocket Connected');
          setLoading(false);
          setError(null);
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            console.log('Received message:', message); // Add this for debugging
            setMessages(prev => [message, ...prev].slice(0, 100));
          } catch (err) {
            console.error('Error parsing message:', err);
          }
        };

        ws.onerror = (error) => {
          console.error('WebSocket Error:', error);
          setError('Failed to connect to debug stream');
          setLoading(false);
        };

        ws.onclose = () => {
          console.log('WebSocket Disconnected - Retrying in 5s...');
          // Attempt to reconnect after 5 seconds
          reconnectTimer = setTimeout(connectWebSocket, 5000);
        };
      } catch (err) {
        console.error('WebSocket connection error:', err);
        setError('Failed to establish WebSocket connection');
        setLoading(false);
      }
    };

    connectWebSocket();

    // Cleanup function
    return () => {
      if (ws) {
        ws.close();
      }
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
    };
  }, []);

  if (loading) {
    return <div className="debug-loading">Connecting to debug stream...</div>;
  }

  if (error) {
    return (
      <div className="page">
        <div className="debug-page">
          <h2>Debug Information</h2>
          <div className="debug-container">
            <div className="debug-error">
              {error}
              <div className="error-details">
                Make sure the WebSocket server is running and accessible.
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="debug-page">
        <h2>Debug Information</h2>
        <div className="debug-container">
          <div className="message-list">
            {messages.length === 0 ? (
              <div className="no-messages">No messages yet</div>
            ) : (
              messages.map((msg, index) => (
                <div key={index} className="debug-message">
                  <span className="timestamp">{formatDate(msg.timestamp)}</span>
                  <span className="device">{msg.device_name}</span>
                  <span className="status">{msg.status}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
