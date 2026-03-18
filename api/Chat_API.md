# Chat API Documentation for React Native

## Overview

This document describes how to implement real-time chat functionality in your React Native mobile application using the hanamarket Chat API. The chat system uses a hybrid approach:

- **REST API**: For fetching chat lists, messages, and managing chat state
- **SignalR WebSocket**: For real-time messaging, typing indicators, and online status

## Table of Contents

1. [Authentication](#authentication)
2. [REST API Endpoints](#rest-api-endpoints)
3. [SignalR Real-Time Connection](#signalr-real-time-connection)
4. [Implementation Guide](#implementation-guide)
5. [Event Reference](#event-reference)
6. [Error Handling](#error-handling)
7. [Best Practices](#best-practices)

---

## Authentication

All chat endpoints require JWT authentication. Include the access token in your requests:

**For REST API requests:**
```javascript
headers: {
  'Authorization': `Bearer ${accessToken}`,
  'Content-Type': 'application/json'
}
```

**For SignalR connection:**
```javascript
const connection = new HubConnectionBuilder()
  .withUrl('http://your-api-url/hubs/chat', {
    accessTokenFactory: () => accessToken
  })
  .build();
```

---

## REST API Endpoints

Base URL: `http://your-api-url/api/chats`

### 1. Get My Chats

**Endpoint**: `GET /api/chats/my-chats`

**Description**: Fetch all chat rooms for the current user with pagination.

**Query Parameters**:
- `page` (optional, default: 1): Page number
- `pageSize` (optional, default: 20, max: 100): Items per page

**Request Example**:
```javascript
const response = await fetch('http://your-api-url/api/chats/my-chats?page=1&pageSize=20', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});
const data = await response.json();
```

**Response**:
```json
{
  "data": {
    "chats": [
      {
        "id": 123,
        "buyer": {
          "id": 456,
          "username": "john_doe",
          "profile_image_url": "http://example.com/profile.jpg",
          "is_online": true,
          "last_seen_at": "2024-01-15T10:30:00Z"
        },
        "seller": {
          "id": 789,
          "username": "jane_seller",
          "profile_image_url": "http://example.com/profile2.jpg",
          "is_online": false,
          "last_seen_at": "2024-01-15T09:15:00Z"
        },
        "product": {
          "id": 101,
          "title": "iPhone 15 Pro",
          "price": "15000000so`m",
          "seller_id": 789,
          "image_url": "http://example.com/product.jpg",
          "status": "active",
          "initial_message": "Salom, bu mahsulot haqida ma'lumot berardingizmi?"
        },
        "created_at": "2024-01-10T14:20:00Z",
        "last_message_at": "2024-01-15T10:30:00Z",
        "last_message": "Ok, rahmat!",
        "unread_count": 3,
        "is_other_user_online": true,
        "other_user_last_seen": "2024-01-15T10:30:00Z"
      }
    ],
    "total_unread_count": 5,
    "total_pages": 2,
    "current_page": 1
  },
  "message": "Success",
  "code": 200
}
```

---

### 2. Create or Get Chat Room

**Endpoint**: `POST /api/chats/create-or-get`

**Description**: Create a new chat room or get existing one with a seller about a product.

**Request Body**:
```json
{
  "seller_id": 789,
  "product_id": 101,
  "initial_message": "Salom, bu mahsulot haqida ma'lumot berardingizmi?"
}
```

**Validation**:
- `seller_id`: Required, cannot be your own user ID
- `product_id`: Required
- `initial_message`: Required, min length: 2, max length: 1000 characters

**Request Example**:
```javascript
const response = await fetch('http://your-api-url/api/chats/create-or-get', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    seller_id: 789,
    product_id: 101,
    initial_message: 'Salom, bu mahsulot haqida ma\'lumot berardingizmi?'
  })
});
const data = await response.json();
```

**Response**: Returns a `ChatRoomDto` object (same structure as in Get My Chats).

---

### 3. Get Chat Messages

**Endpoint**: `GET /api/chats/{chatRoomId}/messages`

**Description**: Fetch messages for a specific chat room with pagination.

**Path Parameters**:
- `chatRoomId`: The ID of the chat room

**Query Parameters**:
- `page` (optional, default: 1): Page number
- `pageSize` (optional, default: 50, max: 100): Items per page

**Request Example**:
```javascript
const chatRoomId = 123;
const response = await fetch(
  `http://your-api-url/api/chats/${chatRoomId}/messages?page=1&pageSize=50`,
  {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  }
);
const data = await response.json();
```

**Response**:
```json
{
  "data": {
    "chat_room": {
      "id": 123,
      "buyer": { },
      "seller": { },
      "product": { },
      "created_at": "2024-01-10T14:20:00Z",
      "last_message_at": "2024-01-15T10:30:00Z",
      "last_message": "Ok, rahmat!",
      "unread_count": 0,
      "is_other_user_online": true,
      "other_user_last_seen": null
    },
    "messages": [
      {
        "id": 501,
        "chat_room_id": 123,
        "sender_id": 456,
        "content": "Salom!",
        "type": "text",
        "sent_at": "2024-01-15T10:25:00Z",
        "sender_name": "john_doe",
        "sender_image_url": "http://example.com/profile.jpg",
        "is_read": true,
        "is_edited": false,
        "is_mine": true
      }
    ],
    "total_pages": 3,
    "current_page": 1,
    "has_more": true
  },
  "message": "Success",
  "code": 200
}
```

---

### 4. Get Unread Count

**Endpoint**: `GET /api/chats/unread-count`

**Description**: Get total unread message count and per-chat breakdown.

**Request Example**:
```javascript
const response = await fetch('http://your-api-url/api/chats/unread-count', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});
const data = await response.json();
```

**Response**:
```json
{
  "data": {
    "total_unread": 7,
    "unread_per_chat": {
      "123": 3,
      "124": 4
    }
  },
  "message": "Success",
  "code": 200
}
```

---

### 5. Mark Messages as Read (HTTP)

**Endpoint**: `POST /api/chats/mark-as-read`

**Description**: Mark specific messages as read. Alternative to SignalR method.

**Request Body**:
```json
{
  "chat_room_id": 123,
  "message_ids": [501, 502, 503]
}
```

**Request Example**:
```javascript
const response = await fetch('http://your-api-url/api/chats/mark-as-read', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    chat_room_id: 123,
    message_ids: [501, 502, 503]
  })
});
```

**Response**:
```json
{
  "data": {},
  "message": "Messages marked as read",
  "code": 200
}
```

---

### 6. Get User Status

**Endpoint**: `GET /api/chats/user-status/{userId}`

**Description**: Check if a user is online and their last seen time.

**Request Example**:
```javascript
const userId = 789;
const response = await fetch(
  `http://your-api-url/api/chats/user-status/${userId}`,
  {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  }
);
const data = await response.json();
```

**Response**:
```json
{
  "data": {
    "isOnline": true,
    "lastSeenAt": "2024-01-15T10:30:00Z"
  },
  "message": "Success",
  "code": 200
}
```

---

### 7. Health Check

**Endpoint**: `GET /api/chats/health`

**Description**: Check if the chat service is running.

**Authentication**: Not required

**Response**:
```json
{
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-15T10:30:00Z",
    "service": "Chat Service"
  },
  "message": "Success",
  "code": 200
}
```

---

## SignalR Real-Time Connection

### Installation

```bash
npm install @microsoft/signalr
```

### Basic Setup

```javascript
import * as signalR from '@microsoft/signalr';

// Create connection
const connection = new signalR.HubConnectionBuilder()
  .withUrl('http://your-api-url/hubs/chat', {
    accessTokenFactory: () => accessToken,
    skipNegotiation: true,
    transport: signalR.HttpTransportType.WebSockets
  })
  .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
  .configureLogging(signalR.LogLevel.Information)
  .build();

// Start connection
const startConnection = async () => {
  try {
    await connection.start();
    console.log('SignalR Connected');
  } catch (err) {
    console.error('SignalR Connection Error:', err);
    setTimeout(startConnection, 5000);
  }
};

startConnection();

// Handle reconnection
connection.onreconnecting((error) => {
  console.log('Reconnecting...', error);
});

connection.onreconnected((connectionId) => {
  console.log('Reconnected:', connectionId);
});

connection.onclose((error) => {
  console.log('Connection closed', error);
  setTimeout(startConnection, 5000);
});
```

---

## SignalR Methods

### 1. Send Message

**Method**: `SendMessage`

**Parameters**:
```javascript
{
  chat_room_id: number,
  content: string,
  type?: 'text' | 'image' | 'file',  // default: 'text'
  attachmentUrl?: string
}
```

**Usage**:
```javascript
await connection.invoke('SendMessage', {
  chat_room_id: 123,
  content: 'Salom!',
  type: 'text'
});
```

**Limits**:
- Max message length: 1000 characters
- Max file size: 1MB

---

### 2. Mark Messages as Read

**Method**: `MarkMessagesAsRead`

**Parameters**:
```javascript
{
  chat_room_id: number,
  message_ids: number[]
}
```

**Usage**:
```javascript
await connection.invoke('MarkMessagesAsRead', {
  chat_room_id: 123,
  message_ids: [501, 502, 503]
});
```

---

### 3. Typing Indicators

**Start Typing**:
```javascript
await connection.invoke('StartTyping', chatRoomId);
```

**Stop Typing**:
```javascript
await connection.invoke('StopTyping', chatRoomId);
```

**Implementation Example**:
```javascript
let typingTimeout;

const handleTextChange = (text, chatRoomId) => {
  // Start typing
  connection.invoke('StartTyping', chatRoomId);
  
  // Clear previous timeout
  clearTimeout(typingTimeout);
  
  // Stop typing after 3 seconds of no input
  typingTimeout = setTimeout(() => {
    connection.invoke('StopTyping', chatRoomId);
  }, 3000);
};
```

---

### 4. Join/Leave Chat Room

**Join**:
```javascript
await connection.invoke('JoinChatRoom', chatRoomId);
```

**Leave**:
```javascript
await connection.invoke('LeaveChatRoom', chatRoomId);
```

**When to use**:
- Call `JoinChatRoom` when user opens a specific chat screen
- Call `LeaveChatRoom` when user leaves the chat screen
- Connection automatically joins all user's chat rooms on connect

---

## Event Reference

### Listen to Events

```javascript
// Receive new message
connection.on('ReceiveMessage', (message) => {
  console.log('New message:', message);
  // Update UI with new message
});

// User status changed (online/offline)
connection.on('UserStatusChanged', (event) => {
  console.log('User status:', event);
  // Update user's online status in UI
});

// Messages marked as read
connection.on('MessagesRead', (event) => {
  console.log('Messages read:', event);
  // Update read status in UI
});

// User typing
connection.on('UserTyping', (event) => {
  console.log('Typing indicator:', event);
  // Show/hide typing indicator
});

// Error from server
connection.on('Error', (error) => {
  console.error('Server error:', error);
  // Show error to user
});
```

---

### Event Payload Structures

#### ReceiveMessage
```javascript
{
  message: {
    id: number,
    chat_room_id: number,
    sender_id: number,
    content: string,
    type: 'text' | 'image' | 'file',
    sent_at: string,  // ISO 8601 format
    sender_name: string,
    sender_image_url: string,
    is_read: boolean,
    is_edited: boolean,
    is_mine: boolean
  },
  chat_room: {
    id: number,
    buyer: ChatUserInfoDto,
    seller: ChatUserInfoDto,
    product: ChatProductInfoDto,
    created_at: string,
    last_message_at: string,
    last_message: string,
    unread_count: number,
    is_other_user_online: boolean,
    other_user_last_seen: string
  }
}
```

#### UserStatusChanged
```javascript
{
  user_id: number,
  is_online: boolean,
  last_seen_at: string  // ISO 8601 format
}
```

#### MessagesRead
```javascript
{
  chat_room_id: number,
  message_ids: number[],
  read_by_user_id: number,
  read_at: string  // ISO 8601 format
}
```

#### UserTyping
```javascript
{
  chat_room_id: number,
  user_id: number,
  is_typing: boolean
}
```

---

## Implementation Guide

### Complete React Native Example

```javascript
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, TextInput, Button, StyleSheet } from 'react-native';
import * as signalR from '@microsoft/signalr';

const ChatScreen = ({ chatRoomId, accessToken, apiUrl }) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const connectionRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    // Initialize SignalR connection
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${apiUrl}/hubs/chat`, {
        accessTokenFactory: () => accessToken,
        skipNegotiation: true,
        transport: signalR.HttpTransportType.WebSockets
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Information)
      .build();

    connectionRef.current = connection;

    // Event listeners
    connection.on('ReceiveMessage', (message) => {
      setMessages((prev) => [...prev, message]);
      
      // Mark as read if not mine
      if (!message.is_mine) {
        connection.invoke('MarkMessagesAsRead', {
          chat_room_id: chatRoomId,
          message_ids: [message.id]
        });
      }
    });

    connection.on('UserTyping', (event) => {
      if (event.chat_room_id === chatRoomId && !event.is_mine) {
        setIsTyping(event.is_typing);
      }
    });

    connection.on('MessagesRead', (event) => {
      if (event.chat_room_id === chatRoomId) {
        setMessages((prev) =>
          prev.map((msg) =>
            event.message_ids.includes(msg.id)
              ? { ...msg, is_read: true }
              : msg
          )
        );
      }
    });

    connection.on('Error', (error) => {
      console.error('SignalR Error:', error);
      alert(error.message || 'An error occurred');
    });

    connection.onreconnecting(() => {
      setIsConnected(false);
    });

    connection.onreconnected(() => {
      setIsConnected(true);
      connection.invoke('JoinChatRoom', chatRoomId);
    });

    // Start connection and join room
    const startConnection = async () => {
      try {
        await connection.start();
        setIsConnected(true);
        await connection.invoke('JoinChatRoom', chatRoomId);
        console.log('Connected to chat');
      } catch (err) {
        console.error('Connection error:', err);
        setIsConnected(false);
      }
    };

    startConnection();

    // Fetch initial messages
    fetchMessages();

    // Cleanup
    return () => {
      if (connection.state === signalR.HubConnectionState.Connected) {
        connection.invoke('LeaveChatRoom', chatRoomId);
        connection.stop();
      }
    };
  }, [chatRoomId]);

  const fetchMessages = async () => {
    try {
      const response = await fetch(
        `${apiUrl}/api/chats/${chatRoomId}/messages?page=1&pageSize=50`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      );
      const data = await response.json();
      if (data.code === 200) {
        setMessages(data.data.messages.reverse());
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const messageContent = inputText.trim();
    setInputText('');

    try {
      await connectionRef.current.invoke('SendMessage', {
        chat_room_id: chatRoomId,
        content: messageContent,
        type: 'text'
      });

      // Stop typing indicator
      await connectionRef.current.invoke('StopTyping', chatRoomId);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
      setInputText(messageContent); // Restore message
    }
  };

  const handleTextChange = (text) => {
    setInputText(text);

    if (!text.trim()) {
      connectionRef.current?.invoke('StopTyping', chatRoomId);
      clearTimeout(typingTimeoutRef.current);
      return;
    }

    // Start typing
    connectionRef.current?.invoke('StartTyping', chatRoomId);

    // Clear previous timeout
    clearTimeout(typingTimeoutRef.current);

    // Stop typing after 3 seconds
    typingTimeoutRef.current = setTimeout(() => {
      connectionRef.current?.invoke('StopTyping', chatRoomId);
    }, 3000);
  };

  const renderMessage = ({ item }) => (
    <View
      style={[
        styles.messageBubble,
        item.is_mine ? styles.myMessage : styles.otherMessage
      ]}
    >
      {!item.is_mine && (
        <Text style={styles.senderName}>{item.sender_name}</Text>
      )}
      <Text style={styles.messageContent}>{item.content}</Text>
      <View style={styles.messageFooter}>
        <Text style={styles.messageTime}>
          {new Date(item.sent_at).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </Text>
        {item.is_mine && (
          <Text style={styles.readReceipt}>
            {item.is_read ? '??' : '?'}
          </Text>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {!isConnected && (
        <View style={styles.connectionBanner}>
          <Text style={styles.connectionText}>Connecting...</Text>
        </View>
      )}

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderMessage}
        inverted={false}
        contentContainerStyle={styles.messageList}
      />
      
      {isTyping && (
        <View style={styles.typingIndicator}>
          <Text style={styles.typingText}>Typing...</Text>
        </View>
      )}

      <View style={styles.inputContainer}>
        <TextInput
          value={inputText}
          onChangeText={handleTextChange}
          placeholder="Type a message..."
          style={styles.textInput}
          multiline
          maxLength={1000}
        />
        <Button 
          title="Send" 
          onPress={handleSendMessage}
          disabled={!inputText.trim() || !isConnected}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5'
  },
  connectionBanner: {
    backgroundColor: '#FFA500',
    padding: 8,
    alignItems: 'center'
  },
  connectionText: {
    color: '#FFF',
    fontWeight: 'bold'
  },
  messageList: {
    padding: 10
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 12,
    marginVertical: 4
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#DCF8C6'
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF'
  },
  senderName: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    fontWeight: 'bold'
  },
  messageContent: {
    fontSize: 16,
    color: '#000'
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 4
  },
  messageTime: {
    fontSize: 10,
    color: '#888',
    marginRight: 4
  },
  readReceipt: {
    fontSize: 10,
    color: '#4FC3F7'
  },
  typingIndicator: {
    padding: 10,
    backgroundColor: '#FFF'
  },
  typingText: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic'
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#DDD',
    alignItems: 'center'
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    maxHeight: 100,
    backgroundColor: '#F9F9F9'
  }
});

export default ChatScreen;
```

---

### Chat List Screen Example

```javascript
import React, { useState, useEffect } from 'react';
import { View, FlatList, TouchableOpacity, Text, Image, StyleSheet } from 'react-native';

const ChatListScreen = ({ accessToken, apiUrl, navigation }) => {
  const [chats, setChats] = useState([]);
  const [totalUnread, setTotalUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChats();
  }, []);

  const fetchChats = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/chats/my-chats?page=1&pageSize=20`, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      const data = await response.json();
      
      if (data.code === 200) {
        setChats(data.data.chats);
        setTotalUnread(data.data.total_unread_count);
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderChatItem = ({ item }) => {
    const otherUser = item.buyer.id === currentUserId ? item.seller : item.buyer;
    
    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => navigation.navigate('Chat', { chatRoomId: item.id })}
      >
        <Image
          source={{ uri: otherUser.profile_image_url }}
          style={styles.avatar}
        />
        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text style={styles.username}>{otherUser.username}</Text>
            {item.last_message_at && (
              <Text style={styles.timestamp}>
                {formatTime(item.last_message_at)}
              </Text>
            )}
          </View>
          <Text style={styles.productTitle} numberOfLines={1}>
            {item.product.title}
          </Text>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.last_message}
          </Text>
        </View>
        {item.unread_count > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{item.unread_count}</Text>
          </View>
        )}
        {otherUser.is_online && (
          <View style={styles.onlineIndicator} />
        )}
      </TouchableOpacity>
    );
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString();
  };

  return (
    <View style={styles.container}>
      {totalUnread > 0 && (
        <View style={styles.unreadHeader}>
          <Text style={styles.unreadHeaderText}>
            {totalUnread} unread message{totalUnread > 1 ? 's' : ''}
          </Text>
        </View>
      )}
      <FlatList
        data={chats}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderChatItem}
        refreshing={loading}
        onRefresh={fetchChats}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF'
  },
  unreadHeader: {
    backgroundColor: '#4FC3F7',
    padding: 10,
    alignItems: 'center'
  },
  unreadHeaderText: {
    color: '#FFF',
    fontWeight: 'bold'
  },
  chatItem: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE'
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12
  },
  chatInfo: {
    flex: 1,
    justifyContent: 'center'
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000'
  },
  timestamp: {
    fontSize: 12,
    color: '#888'
  },
  productTitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4
  },
  lastMessage: {
    fontSize: 14,
    color: '#444'
  },
  unreadBadge: {
    backgroundColor: '#4FC3F7',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6
  },
  unreadText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold'
  },
  onlineIndicator: {
    position: 'absolute',
    top: 18,
    left: 50,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#FFF'
  }
});

export default ChatListScreen;
```

---

## Error Handling

### Common Error Responses

**400 Bad Request**:
```json
{
  "data": null,
  "message": "Cannot create chat with yourself.",
  "code": 400
}
```

**401 Unauthorized**:
```json
{
  "data": null,
  "message": "You are not authorized. Please provide a valid token.",
  "code": 401
}
```

**403 Forbidden**:
```json
{
  "data": null,
  "message": "You do not have permission to access this resource.",
  "code": 403
}
```

**404 Not Found**:
```json
{
  "data": null,
  "message": "Chat room not found.",
  "code": 404
}
```

**500 Server Error**:
```json
{
  "data": null,
  "message": "Something went wrong. Please try again later.",
  "code": 500
}
```

### SignalR Error Events

```javascript
connection.on('Error', (error) => {
  switch (error.message) {
    case 'Access denied':
      // User doesn't have permission
      alert('You do not have access to this chat');
      break;
    case 'Message cannot be empty':
      // Empty message validation
      alert('Please enter a message');
      break;
    case 'Message exceeds maximum length of 1000 characters':
      // Message too long
      alert('Message is too long. Max 1000 characters.');
      break;
    case 'Failed to send message':
      // Server error
      alert('Failed to send message. Please try again.');
      break;
    default:
      console.error('Unknown error:', error);
      alert('An error occurred');
  }
});
```

---

## Best Practices

### 1. Connection Management
- Always use automatic reconnection with exponential backoff
- Store connection reference in a ref, not state
- Clean up connections when components unmount
- Handle connection state changes in UI

### 2. Message Optimization
- Implement pagination for message history
- Use `FlatList` with `inverted` prop for performance
- Cache messages locally using AsyncStorage
- Implement optimistic UI updates for sent messages

### 3. Typing Indicators
- Debounce typing events (3 seconds recommended)
- Always send `StopTyping` when:
  - Message is sent
  - Input is cleared
  - User leaves the chat screen
- Clear typing timeout on component unmount

### 4. Read Receipts
- Mark messages as read when they appear on screen
- Use `onViewableItemsChanged` to track visible messages
- Batch read receipts to avoid excessive API calls
- Update UI optimistically

### 5. Error Handling
- Implement retry logic for failed messages
- Store failed messages locally and retry on reconnection
- Show user-friendly error messages
- Log errors for debugging
- Handle offline scenarios gracefully

### 6. Performance
- Limit message list to recent messages (e.g., 50)
- Load older messages on scroll
- Use `keyExtractor` properly for FlatList
- Memoize components when needed
- Optimize images (use thumbnails for avatars)

### 7. Security
- Never store tokens in plain text
- Use secure storage for sensitive data
- Validate all user inputs
- Handle token expiration
- Implement proper logout

---

## Testing

### Test Connection
```javascript
// Test if SignalR is working
connection.invoke('JoinChatRoom', testChatRoomId)
  .then(() => console.log('? Connection working'))
  .catch((err) => console.error('? Connection failed:', err));
```

### Test Message Sending
```javascript
await connection.invoke('SendMessage', {
  chat_room_id: testChatRoomId,
  content: 'Test message',
  type: 'text'
});
```

### Test REST Endpoints
```javascript
// Test get chats
const testGetChats = async () => {
  try {
    const response = await fetch(`${apiUrl}/api/chats/my-chats`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const data = await response.json();
    console.log('? Get chats working:', data);
  } catch (error) {
    console.error('? Get chats failed:', error);
  }
};
```

---

## Limits & Quotas

- **Max message length**: 1000 characters
- **Max file size**: 1MB
- **Max messages per page**: 100
- **Default messages per page**: 50
- **Max chats per page**: 100
- **Default chats per page**: 20
- **SignalR keep-alive interval**: 15 seconds
- **SignalR client timeout**: 30 seconds
- **Max receive message size**: 1MB

---

## Currency Types

```javascript
const CURRENCY_TYPES = {
  UZS: 1000,  // Uzbek Som
  USD: 1010   // US Dollar
};
```

When displaying prices, check `currency_type`:
```javascript
const formatPrice = (product) => {
  if (product.currency_type === 1000) {
    return `${product.price_uzs?.toLocaleString()} so'm`;
  } else if (product.currency_type === 1010) {
    return `$${product.price_usd}`;
  }
  return 'Price not available';
};
```

---

## Troubleshooting

### Connection Issues

**Problem**: SignalR won't connect
- Check if WebSocket is enabled on server
- Verify token is valid and not expired
- Check network connectivity
- Ensure correct hub URL

**Problem**: Connection drops frequently
- Check network stability
- Verify automatic reconnection is enabled
- Check server-side timeout settings

### Message Issues

**Problem**: Messages not sending
- Check connection state
- Verify user is participant in chat room
- Check message length (max 1000 chars)
- Verify internet connection

**Problem**: Messages not received
- Check if event listener is registered
- Verify user is in the correct chat room group
- Check if messages are filtered on client side

### Performance Issues

**Problem**: Slow message loading
- Implement pagination properly
- Reduce page size
- Cache messages locally
- Optimize images

---

## Support

For additional help:
- Check server logs for detailed error messages
- Use SignalR logging (`LogLevel.Debug`) for debugging
- Test endpoints using Postman or similar tools
- Check network tab in developer tools
- Contact backend team for API issues

---

## Changelog

### Version 1.0 (January 2024)
- Initial release
- REST API endpoints for chat management
- SignalR real-time messaging
- Typing indicators
- Read receipts
- Online/offline status

---

**API Version**: 1.0  
**Last Updated**: January 2024  
**Base URL**: `http://your-api-url`  
**SignalR Hub**: `/hubs/chat`
