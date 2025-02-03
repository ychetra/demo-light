type MessageHandler = (data: any) => void;
type ConnectionHandler = (connected: boolean) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private messageHandlers: Set<MessageHandler> = new Set();
  private connectionHandlers: Set<ConnectionHandler> = new Set();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 30;
  private readonly RECONNECT_DELAY = 2000; // 2 seconds between attempts
  private isConnecting = false;
  private pingInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    console.log('WebSocket service initialized');
    this.connect();

    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
    window.addEventListener('focus', this.handleFocus.bind(this));
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
  }

  private handleOnline() {
    console.log('🌐 Network connection restored');
    this.reconnectAttempts = 0;
    this.connect();
  }

  private handleOffline() {
    console.log('🔴 Network connection lost');
    this.connectionHandlers.forEach(handler => handler(false));
  }

  private handleFocus() {
    console.log('📱 Window focused, checking connection...');
    this.checkConnection();
  }

  private handleVisibilityChange() {
    if (document.visibilityState === 'visible') {
      console.log('📱 Page became visible, checking connection...');
      this.checkConnection();
    }
  }

  private checkConnection() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.log('🔄 Connection check failed, attempting reconnect...');
      this.reconnectAttempts = 0;
      this.connect();
    }
  }

  private startPingInterval() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }
    this.pingInterval = setInterval(() => {
      this.checkConnection();
    }, 30000);
  }

  private stopPingInterval() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private reconnect() {
    console.log(`Reconnecting... Attempt ${this.reconnectAttempts + 1}/${this.MAX_RECONNECT_ATTEMPTS}`);
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnecting = false;
    
    if (this.reconnectAttempts < this.MAX_RECONNECT_ATTEMPTS) {
      this.reconnectTimer = setTimeout(() => {
        this.reconnectAttempts++;
        this.connect();
      }, this.RECONNECT_DELAY);
    } else {
      console.log('Max reconnection attempts reached');
    }
  }

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) {
      return;
    }
    
    this.isConnecting = true;
    this.stopPingInterval();
    
    try {
      const wsHost = window.location.hostname === 'localhost' 
        ? 'localhost' 
        : window.location.hostname;
      // Try explicit IP if hostname fails
      const wsUrl = `ws://${wsHost}:8765`;
      console.log('🔄 Attempting WebSocket connection to:', wsUrl);
      
      this.ws = new WebSocket(wsUrl);
      console.log('WebSocket instance created');

      this.ws.onopen = () => {
        console.log('✅ WebSocket connected successfully');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.connectionHandlers.forEach(handler => handler(true));
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
        this.startPingInterval();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'pong') {
            return;
          }
          this.messageHandlers.forEach(handler => handler(data));
        } catch (error) {
          console.error('Message processing error:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log(`WebSocket closed (${event.code}): ${event.reason}`);
        this.isConnecting = false;
        this.connectionHandlers.forEach(handler => handler(false));
        this.stopPingInterval();
        this.reconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        console.log('WebSocket readyState:', this.ws?.readyState);
        this.isConnecting = false;
        this.connectionHandlers.forEach(handler => handler(false));
        this.reconnect();
      };
    } catch (error) {
      console.error('Connection error:', error);
      this.isConnecting = false;
      this.reconnect();
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
    return () => {
      this.connectionHandlers.delete(handler);
    };
  }
}

export const wsService = new WebSocketService();