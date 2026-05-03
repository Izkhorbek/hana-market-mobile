import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from '@microsoft/signalr';
import { MessageTypeString } from '../../constants/appLimits';
import { ChatRoomDto } from '../../types';
import { IMAGE_BASE_URL } from '../api';
import { getAuthToken } from '../auth-bridge';
import { logger } from '@/utils/logger';

// Event names matching backend
export const SignalREvents = {
  UserStatusChanged: 'UserStatusChanged',
  ReceiveMessage: 'ReceiveMessage',
  MessagesRead: 'MessagesRead',
  UserTyping: 'UserTyping',
  Error: 'Error',
} as const;

// SignalR event payloads (matching API documentation - snake_case from backend)
export interface UserStatusPayload {
  user_id: number;
  is_online: boolean;
  last_seen_at: string | null;
}

// Message payload inside ReceiveMessage event
export interface SignalRMessagePayload {
  id: number;
  chat_room_id: number;
  sender_id: number;
  content: string;
  type: MessageTypeString;
  sent_at: string;
  sender_name: string;
  sender_image_url: string | null;
  is_read: boolean;
  is_edited: boolean;
  is_mine: boolean;
}

// Actual ReceiveMessage event payload from backend (wrapped format)
export interface ReceiveMessagePayload {
  message: SignalRMessagePayload;
  chat_room: ChatRoomDto;
}

export interface MessagesReadPayload {
  chat_room_id: number;
  message_ids: number[];
  read_by_user_id: number;
  read_at: string;
}

export interface UserTypingPayload {
  chat_room_id: number;
  user_id: number;
  is_typing: boolean;
}

export interface SignalRError {
  message: string;
  code?: string;
}

// Hub method names (methods we can invoke on the server)
export const HubMethods = {
  SendMessage: 'SendMessage',
  MarkMessagesAsRead: 'MarkMessagesAsRead',
  StartTyping: 'StartTyping',
  StopTyping: 'StopTyping',
  JoinChatRoom: 'JoinChatRoom',
  LeaveChatRoom: 'LeaveChatRoom',
} as const;

// Send message request (matching API format)
export interface SendMessageRequest {
  chat_room_id: number;
  content: string;
  type?: MessageTypeString;
  attachmentUrl?: string;
}

// Mark messages as read request
// NOTE: backend now marks ALL unread messages in the room when called.
export interface MarkMessagesAsReadRequest {
  chat_room_id: number;
}

type EventCallback<T> = (payload: T) => void;

class SignalRService {
  private connection: HubConnection | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 5000;
  private isConnecting = false;
  // Single in-flight connect promise so concurrent callers wait for the same
  // negotiation instead of racing and seeing "Not connected".
  private connectPromise: Promise<void> | null = null;

  // Event listeners
  private userStatusListeners: EventCallback<UserStatusPayload>[] = [];
  private receiveMessageListeners: EventCallback<ReceiveMessagePayload>[] = [];
  private messagesReadListeners: EventCallback<MessagesReadPayload>[] = [];
  private userTypingListeners: EventCallback<UserTypingPayload>[] = [];
  private errorListeners: EventCallback<SignalRError>[] = [];
  private connectionStateListeners: EventCallback<HubConnectionState>[] = [];

  private getHubUrl(): string {
    // SignalR hub URL from API documentation
    return `${IMAGE_BASE_URL}/hubs/chat`;
  }

  /**
   * Initialize and start the SignalR connection.
   * Concurrent callers share the same in-flight promise to avoid races where
   * a second caller proceeds before the first one has finished negotiating.
   */
  connect(): Promise<void> {
    if (this.connection?.state === HubConnectionState.Connected) {
      return Promise.resolve();
    }

    if (this.connectPromise) {
      return this.connectPromise;
    }

    this.connectPromise = this.doConnect().finally(() => {
      this.connectPromise = null;
    });

    return this.connectPromise;
  }

  private async doConnect(): Promise<void> {
    this.isConnecting = true;
    const token = getAuthToken();

    if (!token) {
      console.warn('[SignalR] No auth token available, cannot connect');
      this.isConnecting = false;
      throw new Error('No auth token available for SignalR connection');
    }

    try {
      this.connection = new HubConnectionBuilder()
        .withUrl(this.getHubUrl(), {
          accessTokenFactory: () => token,
        })
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: (retryContext) => {
            // Custom reconnect strategy: 0, 2s, 5s, 10s, 30s
            const delays = [0, 2000, 5000, 10000, 30000];
            return delays[
              Math.min(retryContext.previousRetryCount, delays.length - 1)
            ];
          },
        })
        .configureLogging(LogLevel.Information)
        .build();

      // Set up connection lifecycle handlers
      this.setupConnectionHandlers();

      // Set up event handlers
      this.setupEventHandlers();

      // Start connection
      await this.connection.start();
      console.log('[SignalR] Connected successfully');
      this.reconnectAttempts = 0;
      this.notifyConnectionState(HubConnectionState.Connected);
    } catch (error) {
      console.error('[SignalR] Connection failed:', error);
      logger.error('SIGNALR_CONNECT_FAILED', error);
      this.handleConnectionError();
      throw error;
    } finally {
      this.isConnecting = false;
    }
  }

  /**
   * Disconnect from SignalR hub
   */
  async disconnect(): Promise<void> {
    if (this.connection) {
      try {
        await this.connection.stop();
        console.log('[SignalR] Disconnected');
      } catch (error) {
        console.error('[SignalR] Error disconnecting:', error);
        logger.warn(error, { code: 'SIGNALR_DISCONNECT_FAILED' });
      }
      this.connection = null;
      this.notifyConnectionState(HubConnectionState.Disconnected);
    }
  }

  /**
   * Clear all event listeners (call before re-registering to prevent duplicates)
   */
  clearAllListeners(): void {
    console.log('[SignalR] Clearing all event listeners');
    this.userStatusListeners = [];
    this.receiveMessageListeners = [];
    this.messagesReadListeners = [];
    this.userTypingListeners = [];
    this.errorListeners = [];
    // Note: connectionStateListeners are NOT cleared as they're needed for reconnect handling
  }

  /**
   * Get current connection state
   */
  getConnectionState(): HubConnectionState {
    return this.connection?.state ?? HubConnectionState.Disconnected;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connection?.state === HubConnectionState.Connected;
  }

  // ========== Hub Methods (Invoke on Server) ==========

  /**
   * Send a message
   */
  async sendMessage(
    chatRoomId: number,
    content: string,
    type: MessageTypeString = 'text',
    attachmentUrl?: string,
  ): Promise<void> {
    const request: SendMessageRequest = {
      chat_room_id: chatRoomId,
      content,
      type,
      attachmentUrl,
    };
    await this.invokeMethod(HubMethods.SendMessage, request);
  }

  /**
   * Mark all unread messages in a chat room as read.
   * Backend resolves which messages belong to the caller and flips them.
   */
  async markMessagesAsRead(chatRoomId: number): Promise<void> {
    const request: MarkMessagesAsReadRequest = {
      chat_room_id: chatRoomId,
    };
    await this.invokeMethod(HubMethods.MarkMessagesAsRead, request);
  }

  /**
   * Notify that user started typing
   */
  async startTyping(chatRoomId: number): Promise<void> {
    await this.invokeMethod(HubMethods.StartTyping, chatRoomId);
  }

  /**
   * Notify that user stopped typing
   */
  async stopTyping(chatRoomId: number): Promise<void> {
    await this.invokeMethod(HubMethods.StopTyping, chatRoomId);
  }

  /**
   * Join a chat room to receive real-time updates
   */
  async joinChatRoom(chatRoomId: number): Promise<void> {
    await this.invokeMethod(HubMethods.JoinChatRoom, chatRoomId);
  }

  /**
   * Leave a chat room
   */
  async leaveChatRoom(chatRoomId: number): Promise<void> {
    await this.invokeMethod(HubMethods.LeaveChatRoom, chatRoomId);
  }

  // ========== Event Subscriptions ==========

  onUserStatusChanged(callback: EventCallback<UserStatusPayload>): () => void {
    this.userStatusListeners.push(callback);
    return () => {
      this.userStatusListeners = this.userStatusListeners.filter(
        (cb) => cb !== callback,
      );
    };
  }

  onReceiveMessage(callback: EventCallback<ReceiveMessagePayload>): () => void {
    this.receiveMessageListeners.push(callback);
    return () => {
      this.receiveMessageListeners = this.receiveMessageListeners.filter(
        (cb) => cb !== callback,
      );
    };
  }

  onMessagesRead(callback: EventCallback<MessagesReadPayload>): () => void {
    this.messagesReadListeners.push(callback);
    return () => {
      this.messagesReadListeners = this.messagesReadListeners.filter(
        (cb) => cb !== callback,
      );
    };
  }

  onUserTyping(callback: EventCallback<UserTypingPayload>): () => void {
    this.userTypingListeners.push(callback);
    return () => {
      this.userTypingListeners = this.userTypingListeners.filter(
        (cb) => cb !== callback,
      );
    };
  }

  onError(callback: EventCallback<SignalRError>): () => void {
    this.errorListeners.push(callback);
    return () => {
      this.errorListeners = this.errorListeners.filter((cb) => cb !== callback);
    };
  }

  onConnectionStateChange(
    callback: EventCallback<HubConnectionState>,
  ): () => void {
    this.connectionStateListeners.push(callback);
    return () => {
      this.connectionStateListeners = this.connectionStateListeners.filter(
        (cb) => cb !== callback,
      );
    };
  }

  // ========== Private Methods ==========

  private setupConnectionHandlers(): void {
    if (!this.connection) return;

    this.connection.onreconnecting((error) => {
      console.log('[SignalR] Reconnecting...', error);
      this.notifyConnectionState(HubConnectionState.Reconnecting);
    });

    this.connection.onreconnected((connectionId) => {
      console.log('[SignalR] Reconnected with ID:', connectionId);
      this.reconnectAttempts = 0;
      this.notifyConnectionState(HubConnectionState.Connected);
    });

    this.connection.onclose((error) => {
      console.log('[SignalR] Connection closed', error);
      this.notifyConnectionState(HubConnectionState.Disconnected);
    });
  }

  private setupEventHandlers(): void {
    if (!this.connection) return;

    // UserStatusChanged event
    this.connection.on(
      SignalREvents.UserStatusChanged,
      (payload: UserStatusPayload) => {
        console.log('[SignalR] UserStatusChanged:', payload);
        this.userStatusListeners.forEach((cb) => cb(payload));
      },
    );

    // ReceiveMessage event
    this.connection.on(
      SignalREvents.ReceiveMessage,
      (payload: ReceiveMessagePayload) => {
        console.log('[SignalR] ReceiveMessage:', payload);
        this.receiveMessageListeners.forEach((cb) => cb(payload));
      },
    );

    // MessagesRead event
    this.connection.on(
      SignalREvents.MessagesRead,
      (payload: MessagesReadPayload) => {
        console.log('[SignalR] MessagesRead:', payload);
        this.messagesReadListeners.forEach((cb) => cb(payload));
      },
    );

    // UserTyping event
    this.connection.on(
      SignalREvents.UserTyping,
      (payload: UserTypingPayload) => {
        console.log('[SignalR] UserTyping:', payload);
        this.userTypingListeners.forEach((cb) => cb(payload));
      },
    );

    // Error event
    this.connection.on(SignalREvents.Error, (error: SignalRError) => {
      console.error('[SignalR] Error from server:', error);
      logger.error('SIGNALR_SERVER_ERROR', error?.message ?? 'SignalR server error', {
        extra: { error },
      });
      this.errorListeners.forEach((cb) => cb(error));
    });
  }

  /**
   * Invoke a hub method, ensuring the connection is up first.
   * If a (re)connect is in progress we await it instead of bailing with
   * "Not connected", which is the main cause of dropped sends.
   */
  private async invokeMethod(
    method: string,
    ...args: unknown[]
  ): Promise<void> {
    if (
      !this.connection ||
      this.connection.state !== HubConnectionState.Connected
    ) {
      console.warn(
        `[SignalR] ${method}: connection not ready (state=${this.connection?.state}). Awaiting connect...`,
      );
      try {
        await this.connect();
      } catch (err) {
        console.error(`[SignalR] ${method}: connect attempt failed`, err);
        throw new Error('Not connected to SignalR hub');
      }
      if (!this.isConnected()) {
        throw new Error('Not connected to SignalR hub');
      }
    }

    try {
      await this.connection!.invoke(method, ...args);
    } catch (error) {
      console.error(`[SignalR] Error invoking ${method}:`, error);
      throw error;
    }
  }

  private handleConnectionError(): void {
    this.reconnectAttempts++;
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      console.log(
        `[SignalR] Retrying connection (${this.reconnectAttempts}/${this.maxReconnectAttempts})`,
      );
      setTimeout(() => this.connect(), this.reconnectInterval);
    } else {
      console.error('[SignalR] Max reconnection attempts reached');
    }
  }

  private notifyConnectionState(state: HubConnectionState): void {
    this.connectionStateListeners.forEach((cb) => cb(state));
  }
}

// Export singleton instance
export const signalRService = new SignalRService();
