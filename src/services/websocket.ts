type MessageHandler = (data: any) => void;
type ConnectionHandler = (connected: boolean) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private messageHandlers: Set<MessageHandler> = new Set();
  private connectionHandlers: Set<ConnectionHandler> = new Set();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 5;
  private isConnecting = false;

  constructor() {
    console.log('WebSocket service initialized');
    this.connect();
  }

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) {
      return;
    }
    
    this.isConnecting = true;
    
    try {
      const wsHost = window.location.hostname;
      console.log('🔄 Attempting WebSocket connection...');
      this.ws = new WebSocket(`ws://${wsHost}:8765`);

      this.ws.onopen = () => {
        console.log('✅ WebSocket connected successfully');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.connectionHandlers.forEach(handler => handler(true));
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 Received message:', data);
          
          this.messageHandlers.forEach(handler => {
            try {
              handler(data);
            } catch (error) {
              console.error('Handler error:', error);
            }
          });
        } catch (error) {
          console.error('Message processing error:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket closed, attempting reconnect...');
        this.isConnecting = false;
        this.connectionHandlers.forEach(handler => handler(false));
        
        if (this.reconnectAttempts < this.MAX_RECONNECT_ATTEMPTS) {
          this.reconnectTimer = setTimeout(() => {
            this.reconnectAttempts++;
            this.connect();
          }, 1000);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnecting = false;
      };
    } catch (error) {
      console.error('Connection error:', error);
      this.isConnecting = false;
    }
  }

  subscribe(handler: MessageHandler) {
    this.messageHandlers.add(handler);
    return () => {
      this.messageHandlers.delete(handler);
    };
  }

  onConnectionChange(handler: ConnectionHandler) {
    this.connectionHandlers.add(handler);
    if (this.ws?.readyState === WebSocket.OPEN) {
      handler(true);
    }
  }

  offConnectionChange(handler: ConnectionHandler) {
    this.connectionHandlers.delete(handler);
  }
}

export const wsService = new WebSocketService(); 