# Chat Deletion Features Documentation

## Overview

This document describes the chat deletion features implemented in the hanamarket Chat API. The system uses **soft delete** approach for both chat rooms and messages, allowing users to delete their conversations while preserving data until both parties delete it.

---

## Table of Contents

1. [Deletion Strategy](#deletion-strategy)
2. [API Endpoints](#api-endpoints)
3. [Validation Rules](#validation-rules)
4. [Database Changes](#database-changes)
5. [Usage Examples](#usage-examples)

---

## Deletion Strategy

### Soft Delete Approach

The chat system implements a **two-stage soft delete** mechanism:

1. **Stage 1 - User Deletion**: When a user deletes a chat room or message, it's marked as deleted only for that user
2. **Stage 2 - Permanent Deletion**: When BOTH users delete the same chat/message, it's permanently removed from the database

### Why Soft Delete?

- ? **Privacy**: Users can delete their conversations
- ? **Data Integrity**: Other user can still access the chat until they also delete it
- ? **Recovery**: Prevents accidental permanent data loss
- ? **Audit Trail**: Maintains history until both parties confirm deletion

---

## API Endpoints

### 1. Delete Chat Room

**Endpoint**: `DELETE /api/chats/room/{chatRoomId}`

**Description**: Delete a chat room for the current user. If both buyer and seller delete it, the chat room is permanently removed.

**Authentication**: Required (JWT Bearer Token)

**Path Parameters**:
- `chatRoomId` (required): The ID of the chat room to delete

**Request Example**:
```javascript
const response = await fetch(`http://your-api-url/api/chats/room/${chatRoomId}`, {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});
const data = await response.json();
```

**Success Response (200)**:
```json
{
  "data": {},
  "message": "Chat room deleted successfully",
  "code": 200
}
```

**Error Responses**:

**403 Forbidden** - Not a participant:
```json
{
  "data": null,
  "message": "You do not have permission to delete this chat room.",
  "code": 403
}
```

**400 Bad Request** - Deletion failed:
```json
{
  "data": null,
  "message": "Failed to delete chat room.",
  "code": 400
}
```

---

### 2. Delete Message

**Endpoint**: `DELETE /api/chats/room/{chatRoomId}/message/{messageId}`

**Description**: Delete a specific message in a chat room. If both users delete it, the message is permanently removed.

**Authentication**: Required (JWT Bearer Token)

**Path Parameters**:
- `chatRoomId` (required): The ID of the chat room
- `messageId` (required): The ID of the message to delete

**Request Example**:
```javascript
const response = await fetch(
  `http://your-api-url/api/chats/room/${chatRoomId}/message/${messageId}`,
  {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  }
);
const data = await response.json();
```

**Success Response (200)**:
```json
{
  "data": {},
  "message": "Message deleted successfully",
  "code": 200
}
```

**Error Responses**:

**403 Forbidden** - Not a participant:
```json
{
  "data": null,
  "message": "You do not have permission to delete this message.",
  "code": 403
}
```

**400 Bad Request** - Deletion failed:
```json
{
  "data": null,
  "message": "Failed to delete message.",
  "code": 400
}
```

---

## Validation Rules

### Delete Chat Room Validation

The following validations are performed before deleting a chat room:

1. ? **Authentication**: User must be logged in (JWT token required)
2. ? **Participation**: User must be either the buyer OR seller in the chat room
3. ? **Chat Exists**: Chat room must exist and be active
4. ? **Not Already Deleted**: User hasn't already deleted this chat room

**Validation Flow**:
```
User Request
    ก้
Check Authentication (JWT)
    ก้
Check User is Participant (buyer_id OR seller_id)
    ก้
Soft Delete for Current User
    ก้
Check if Both Users Deleted
    ก้
If YES กๆ Permanently Delete (status = 'deleted')
If NO กๆ Keep in Database
```

### Delete Message Validation

The following validations are performed before deleting a message:

1. ? **Authentication**: User must be logged in (JWT token required)
2. ? **Participation**: User must be a participant in the chat room
3. ? **Message Exists**: Message must exist in the specified chat room
4. ? **Not Already Deleted**: User hasn't already deleted this message

**Validation Flow**:
```
User Request
    ก้
Check Authentication (JWT)
    ก้
Check Message Exists
    ก้
Check User is Participant
    ก้
Soft Delete for Current User
    ก้
Check if Both Users Deleted
    ก้
If YES กๆ Permanently Delete Message
         Update Chat Room Last Message
If NO กๆ Keep in Database
```

---

## Database Changes

### Chat Rooms Table

Added columns:
```sql
ALTER TABLE chat_rooms
ADD COLUMN is_deleted_by_buyer BOOLEAN DEFAULT FALSE,
ADD COLUMN is_deleted_by_seller BOOLEAN DEFAULT FALSE;
```

**Column Descriptions**:
- `is_deleted_by_buyer`: TRUE if buyer deleted this chat room
- `is_deleted_by_seller`: TRUE if seller deleted this chat room
- `status`: Set to 'deleted' when both users delete the chat room

### Chat Messages Table

**Existing columns** (already present):
- `is_deleted_by_buyer`: TRUE if buyer deleted this message
- `is_deleted_by_seller`: TRUE if seller deleted this message

### Indexes

For better query performance:
```sql
CREATE INDEX idx_chat_rooms_status_deleted 
ON chat_rooms(status, is_deleted_by_buyer, is_deleted_by_seller);

CREATE INDEX idx_chat_messages_deleted 
ON chat_messages(is_deleted_by_buyer, is_deleted_by_seller);
```

---

## Usage Examples

### React Native Implementation

#### Delete Chat Room

```javascript
const deleteChatRoom = async (chatRoomId) => {
  try {
    const response = await fetch(
      `${API_URL}/api/chats/room/${chatRoomId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    const data = await response.json();

    if (data.code === 200) {
      Alert.alert('Success', 'Chat deleted successfully');
      // Remove from local state
      setChats(prevChats => prevChats.filter(c => c.id !== chatRoomId));
      navigation.goBack();
    } else {
      Alert.alert('Error', data.message);
    }
  } catch (error) {
    console.error('Error deleting chat:', error);
    Alert.alert('Error', 'Failed to delete chat');
  }
};

// Usage in UI
<Button 
  title="Delete Chat"
  onPress={() => {
    Alert.alert(
      'Delete Chat',
      'Are you sure you want to delete this chat?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => deleteChatRoom(chatRoomId)
        }
      ]
    );
  }}
/>
```

#### Delete Message

```javascript
const deleteMessage = async (chatRoomId, messageId) => {
  try {
    const response = await fetch(
      `${API_URL}/api/chats/room/${chatRoomId}/message/${messageId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    const data = await response.json();

    if (data.code === 200) {
      // Remove message from local state
      setMessages(prevMessages => 
        prevMessages.filter(m => m.id !== messageId)
      );
      Toast.show('Message deleted');
    } else {
      Alert.alert('Error', data.message);
    }
  } catch (error) {
    console.error('Error deleting message:', error);
    Alert.alert('Error', 'Failed to delete message');
  }
};

// Usage in UI with long press
<TouchableOpacity
  onLongPress={() => {
    if (message.is_mine) {
      Alert.alert(
        'Delete Message',
        'Are you sure you want to delete this message?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => deleteMessage(chatRoomId, message.id)
          }
        ]
      );
    }
  }}
>
  <Text>{message.content}</Text>
</TouchableOpacity>
```

#### Complete Chat Screen with Delete Options

```javascript
import React, { useState } from 'react';
import { 
  View, 
  FlatList, 
  TouchableOpacity, 
  Alert,
  ActionSheetIOS,
  Platform
} from 'react-native';

const ChatScreen = ({ route, navigation }) => {
  const { chatRoomId } = route.params;
  const [messages, setMessages] = useState([]);

  const showMessageOptions = (message) => {
    if (!message.is_mine) return;

    const options = ['Delete Message', 'Cancel'];
    const destructiveButtonIndex = 0;
    const cancelButtonIndex = 1;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          destructiveButtonIndex,
          cancelButtonIndex,
        },
        (buttonIndex) => {
          if (buttonIndex === 0) {
            confirmDeleteMessage(message);
          }
        }
      );
    } else {
      Alert.alert(
        'Message Options',
        'Choose an action',
        [
          {
            text: 'Delete Message',
            style: 'destructive',
            onPress: () => confirmDeleteMessage(message)
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ]
      );
    }
  };

  const confirmDeleteMessage = (message) => {
    Alert.alert(
      'Delete Message',
      'This message will be deleted. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteMessage(message.id)
        }
      ]
    );
  };

  const deleteMessage = async (messageId) => {
    try {
      const response = await fetch(
        `${API_URL}/api/chats/room/${chatRoomId}/message/${messageId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      const data = await response.json();

      if (data.code === 200) {
        setMessages(prev => prev.filter(m => m.id !== messageId));
      } else {
        Alert.alert('Error', data.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to delete message');
    }
  };

  const deleteChatRoom = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/chats/room/${chatRoomId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      const data = await response.json();

      if (data.code === 200) {
        navigation.goBack();
      } else {
        Alert.alert('Error', data.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to delete chat');
    }
  };

  const showChatOptions = () => {
    Alert.alert(
      'Chat Options',
      'Choose an action',
      [
        {
          text: 'Delete Chat',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Delete Chat',
              'Are you sure you want to delete this entire chat?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: deleteChatRoom
                }
              ]
            );
          }
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Header with options */}
      <TouchableOpacity onPress={showChatOptions}>
        <Text>?</Text>
      </TouchableOpacity>

      {/* Messages list */}
      <FlatList
        data={messages}
        renderItem={({ item }) => (
          <TouchableOpacity
            onLongPress={() => showMessageOptions(item)}
          >
            <View style={item.is_mine ? styles.myMessage : styles.otherMessage}>
              <Text>{item.content}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

export default ChatScreen;
```

---

## Best Practices

### 1. Confirmation Dialogs

Always show confirmation before deleting:
```javascript
Alert.alert(
  'Delete Chat',
  'This action cannot be undone. Are you sure?',
  [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: handleDelete }
  ]
);
```

### 2. Optimistic UI Updates

Update UI immediately, rollback on error:
```javascript
const deleteMessage = async (messageId) => {
  const backup = [...messages];
  
  // Optimistic update
  setMessages(prev => prev.filter(m => m.id !== messageId));
  
  try {
    await api.deleteMessage(messageId);
  } catch (error) {
    // Rollback on error
    setMessages(backup);
    Alert.alert('Error', 'Failed to delete');
  }
};
```

### 3. Error Handling

Handle all possible error scenarios:
```javascript
try {
  const response = await deleteChat(chatRoomId);
  
  if (response.code === 200) {
    // Success
  } else if (response.code === 403) {
    Alert.alert('Forbidden', 'You cannot delete this chat');
  } else if (response.code === 400) {
    Alert.alert('Error', 'Chat not found or already deleted');
  } else {
    Alert.alert('Error', 'Something went wrong');
  }
} catch (error) {
  Alert.alert('Network Error', 'Please check your connection');
}
```

### 4. Loading States

Show loading indicator during deletion:
```javascript
const [isDeleting, setIsDeleting] = useState(false);

const handleDelete = async () => {
  setIsDeleting(true);
  try {
    await deleteChat();
  } finally {
    setIsDeleting(false);
  }
};
```

---

## Security Considerations

1. ? **Authentication Required**: All delete operations require valid JWT token
2. ? **Authorization Check**: Users can only delete chats they participate in
3. ? **Ownership Validation**: Backend validates user is buyer OR seller
4. ? **SQL Injection Prevention**: Uses parameterized queries
5. ? **Audit Logging**: All deletions are logged with user ID and timestamp

---

## Troubleshooting

### Common Issues

**Issue**: "Failed to delete chat room"
- **Cause**: User is not a participant
- **Solution**: Verify user is buyer or seller in the chat room

**Issue**: "You do not have permission"
- **Cause**: Authorization check failed
- **Solution**: Check JWT token is valid and user ID matches

**Issue**: Message not deleted
- **Cause**: Message may have been already deleted or doesn't exist
- **Solution**: Refresh chat and try again

---

## Changelog

### Version 1.0 (Current)
- Initial implementation of soft delete for chat rooms
- Initial implementation of soft delete for messages
- Added validation and authorization checks
- Database migration for delete columns
- API endpoints for deletion

---

**Version**: 1.0  
**Last Updated**: January 2024  
**Author**: Chat Development Team
