import * as signalR from '@microsoft/signalr';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  SendMessageRequest,
  TypingIndicatorRequest,
  ReceiveMessageEvent,
  UserTypingEvent,
  MessagesReadEvent,
  UserStatusChangedEvent,
} from '../types/TYPESCRIPT_TYPES';

// ============================================
// SIGNALR CONFIGURATION
// ============================================

// Production SignalR Hub URL
const HUB_URL = 'http://46.8.176.21/chathub';

// For development:
// const HUB_URL = __DEV__
//   ? 'http://10.0.2.2:5000/chathub' // Android emulator
//   : 'http://46.8.176.21/chathub';   // Production

// For iOS simulator use: http://localhost:5000/chathub
// For physical device use your computer's IP: http://192.168.1.100:5000/chathub

export class ChatHubService {
  private connection: signalR.HubConnection | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 5000; // 5 seconds

  // Event handlers
  private onMessageReceivedHandler?: (message: ReceiveMessageEvent) => void;
  private onUserTypingHandler?: (data: UserTypingEvent) => void;
  private onMessagesReadHandler?: (data: MessagesReadEvent) => void;
  private onUserStatusChangedHandler?: (data: UserStatusChangedEvent) => void;
  private onConnectionChangedHandler?: (isConnected: boolean) => void;

  constructor() {
    this.setupConnection();
  }

  // ============================================
  // CONNECTION SETUP
  // ============================================

  private setupConnection() {
    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, {
        accessTokenFactory: async () => {
          const token = await AsyncStorage.getItem('access_token');
          return token || '';
        },
        transport: signalR.HttpTransportType.WebSockets,
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: () => {
          this.reconnectAttempts++;
          if (this.reconnectAttempts > this.maxReconnectAttempts) {
            return null; // Stop reconnecting
          }
          return this.reconnectDelay;
        },
      })
      .configureLogging(signalR.LogLevel.Information)
      .build();

    this.setupEventListeners();
    this.setupConnectionEvents();
  }

  // ============================================
  // EVENT LISTENERS
  // ============================================

  private setupEventListeners() {
    if (!this.connection) return;

    // Receive message event
    this.connection.on('ReceiveMessage', (message: ReceiveMessageEvent) => {
      console.log('Message received:', message);
      if (this.onMessageReceivedHandler) {
        this.onMessageReceivedHandler(message);
      }
    });

    // User typing event
    this.connection.on('UserTyping', (data: UserTypingEvent) => {
      console.log('User typing:', data);
      if (this.onUserTypingHandler) {
        this.onUserTypingHandler(data);
      }
    });

    // Messages read event
    this.connection.on('MessagesRead', (data: MessagesReadEvent) => {
      console.log('Messages read:', data);
      if (this.onMessagesReadHandler) {
        this.onMessagesReadHandler(data);
      }
    });

    // User status changed event
    this.connection.on('UserStatusChanged', (data: UserStatusChangedEvent) => {
      console.log('User status changed:', data);
      if (this.onUserStatusChangedHandler) {
        this.onUserStatusChangedHandler(data);
      }
    });
  }

  private setupConnectionEvents() {
    if (!this.connection) return;

    this.connection.onclose(() => {
      console.log('SignalR connection closed');
      if (this.onConnectionChangedHandler) {
        this.onConnectionChangedHandler(false);
      }
    });

    this.connection.onreconnecting(() => {
      console.log('SignalR reconnecting...');
      if (this.onConnectionChangedHandler) {
        this.onConnectionChangedHandler(false);
      }
    });

    this.connection.onreconnected(() => {
      console.log('SignalR reconnected');
      this.reconnectAttempts = 0;
      if (this.onConnectionChangedHandler) {
        this.onConnectionChangedHandler(true);
      }
    });
  }

  // ============================================
  // CONNECTION MANAGEMENT
  // ============================================

  async start(): Promise<void> {
    if (!this.connection) {
      this.setupConnection();
    }

    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      console.log('Already connected to SignalR');
      return;
    }

    try {
      await this.connection?.start();
      console.log('SignalR connection started');
      this.reconnectAttempts = 0;
      if (this.onConnectionChangedHandler) {
        this.onConnectionChangedHandler(true);
      }
    } catch (error) {
      console.error('Error starting SignalR connection:', error);
      if (this.onConnectionChangedHandler) {
        this.onConnectionChangedHandler(false);
      }
      
      // Retry connection
      setTimeout(() => {
        this.start();
      }, this.reconnectDelay);
    }
  }

  async stop(): Promise<void> {
    try {
      await this.connection?.stop();
      console.log('SignalR connection stopped');
      if (this.onConnectionChangedHandler) {
        this.onConnectionChangedHandler(false);
      }
    } catch (error) {
      console.error('Error stopping SignalR connection:', error);
    }
  }

  isConnected(): boolean {
    return this.connection?.state === signalR.HubConnectionState.Connected;
  }

  // ============================================
  // SEND METHODS
  // ============================================

  async sendMessage(data: SendMessageRequest): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('Not connected to chat hub');
    }

    try {
      await this.connection?.invoke('SendMessage', data);
      console.log('Message sent:', data);
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  async sendTypingIndicator(data: TypingIndicatorRequest): Promise<void> {
    if (!this.isConnected()) {
      console.warn('Not connected to chat hub');
      return;
    }

    try {
      await this.connection?.invoke('SendTypingIndicator', data);
    } catch (error) {
      console.error('Error sending typing indicator:', error);
    }
  }

  async markAsRead(chatRoomId: number): Promise<void> {
    if (!this.isConnected()) {
      console.warn('Not connected to chat hub');
      return;
    }

    try {
      await this.connection?.invoke('MarkAsRead', { chatRoomId });
      console.log('Messages marked as read for room:', chatRoomId);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }

  // ============================================
  // EVENT HANDLER REGISTRATION
  // ============================================

  onMessageReceived(handler: (message: ReceiveMessageEvent) => void) {
    this.onMessageReceivedHandler = handler;
  }

  onUserTyping(handler: (data: UserTypingEvent) => void) {
    this.onUserTypingHandler = handler;
  }

  onMessagesRead(handler: (data: MessagesReadEvent) => void) {
    this.onMessagesReadHandler = handler;
  }

  onUserStatusChanged(handler: (data: UserStatusChangedEvent) => void) {
    this.onUserStatusChangedHandler = handler;
  }

  onConnectionChanged(handler: (isConnected: boolean) => void) {
    this.onConnectionChangedHandler = handler;
  }

  // ============================================
  // CLEANUP
  // ============================================

  cleanup() {
    this.onMessageReceivedHandler = undefined;
    this.onUserTypingHandler = undefined;
    this.onMessagesReadHandler = undefined;
    this.onUserStatusChangedHandler = undefined;
    this.onConnectionChangedHandler = undefined;
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

let chatHubInstance: ChatHubService | null = null;

export const getChatHubService = (): ChatHubService => {
  if (!chatHubInstance) {
    chatHubInstance = new ChatHubService();
  }
  return chatHubInstance;
};

export const destroyChatHubService = async () => {
  if (chatHubInstance) {
    await chatHubInstance.stop();
    chatHubInstance.cleanup();
    chatHubInstance = null;
  }
};

export default getChatHubService;
