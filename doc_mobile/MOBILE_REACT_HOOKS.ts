import { useCallback, useEffect, useState } from 'react';
import type {
  ChatListResponse,
  ChatMessagesResponse,
  ComplaintResponse,
  ComplaintTypeInfo
} from '../types/TYPESCRIPT_TYPES';


// ============================================
// CHAT HOOKS
// ============================================

export const useChats = (page: number = 1, pageSize: number = 20) => {
  const [data, setData] = useState<ChatListResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchChats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await chatApi.getMyChats(page, pageSize);
      if (response.success && response.data) {
        setData(response.data);
      } else {
        setError(response.errors.join(', ') || 'Failed to fetch chats');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  return { data, loading, error, refetch: fetchChats };
};

export const useChatMessages = (chatRoomId: number, page: number = 1, pageSize: number = 50) => {
  const [data, setData] = useState<ChatMessagesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMessages = useCallback(async () => {
    if (!chatRoomId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await chatApi.getMessages(chatRoomId, page, pageSize);
      if (response.success && response.data) {
        setData(response.data);
      } else {
        setError(response.errors.join(', ') || 'Failed to fetch messages');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [chatRoomId, page, pageSize]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  return { data, loading, error, refetch: fetchMessages };
};

export const useUnreadCount = () => {
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCount = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await chatApi.getUnreadCount();
      if (response.success && response.data) {
        setCount(response.data.unread_count);
      } else {
        setError(response.errors.join(', ') || 'Failed to fetch unread count');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCount();
  }, [fetchCount]);

  return { count, loading, error, refetch: fetchCount };
};

// ============================================
// COMPLAINTS HOOKS
// ============================================

export const useMyComplaints = (page: number = 1, pageSize: number = 20) => {
  const [complaints, setComplaints] = useState<ComplaintResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await complaintsApi.getMyComplaints(page, pageSize);
      if (response.success && response.data) {
        setComplaints(response.data);
      } else {
        setError(response.errors.join(', ') || 'Failed to fetch complaints');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  return { complaints, loading, error, refetch: fetchComplaints };
};

export const useComplaintTypes = () => {
  const [types, setTypes] = useState<ComplaintTypeInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTypes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await complaintsApi.getTypes();
      if (response.success && response.data) {
        setTypes(response.data);
      } else {
        setError(response.errors.join(', ') || 'Failed to fetch complaint types');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTypes();
  }, [fetchTypes]);

  return { types, loading, error, refetch: fetchTypes };
};
