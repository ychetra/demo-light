import { useState, useEffect } from 'react';
import { wsService } from '../services/websocket';

interface Message {
  timestamp: string;
  data: any;
}

export const DebugPanel = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    console.log('🔄 Setting up DebugPanel');
    
    const handleMessage = (data: any) => {
      console.log('📝 Debug panel received message:', data);
      setMessages(prev => [
        {
          timestamp: new Date().toLocaleTimeString(),
          data
        },
        ...prev.slice(0, 9)
      ]);
    };

    wsService.onConnectionChange((connected) => {
      console.log(`🔌 WebSocket ${connected ? 'connected' : 'disconnected'}`);
      setIsConnected(connected);
    });
    
    const unsubscribe = wsService.subscribe(handleMessage);
    return () => {
      unsubscribe();
      console.log('🔄 DebugPanel cleanup');
    };
  }, []);

  return (
    <div className="debug-panel">
      <div className="debug-header">
        <h3>Panel</h3>
        <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
          {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
        </div>
      </div>
      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="message">
            <span className="timestamp">No messages yet</span>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className="message">
              <span className="timestamp">{msg.timestamp}</span>
              <pre>{JSON.stringify(msg.data, null, 2)}</pre>
            </div>
          ))
        )}
      </div>
    </div>
  );
}; 