import databaseAdapter from './api/adapter';
import {
  Message,
  MessageThread,
  CreateMessagePayload,
  UpdateMessagePayload,
  FileAttachment,
} from '@/types/message';

const generateId = (): string => `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

let mockMessages: Message[] = [];
let mockThreads: MessageThread[] = [];

export const messageRepository = {
  async getMessages(params?: { projectId?: string; taskId?: string; userId?: string }): Promise<Message[]> {
    console.log('[MessageRepository] Getting messages with params:', params);
    
    try {
      const response = await databaseAdapter.get<Message[]>('/messages', params);
      if (response.error || !response.data) {
        throw new Error(response.error || 'Failed to get messages');
      }
      return response.data;
    } catch {
      console.log('[MessageRepository] API not connected, using local data');
      let filtered = [...mockMessages];
      
      if (params?.projectId) {
        filtered = filtered.filter(m => m.projectId === params.projectId);
      }
      if (params?.taskId) {
        filtered = filtered.filter(m => m.taskId === params.taskId);
      }
      
      return filtered.sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    }
  },

  async getMessageById(messageId: string): Promise<Message | null> {
    console.log('[MessageRepository] Getting message by ID:', messageId);
    
    try {
      const response = await databaseAdapter.get<Message>(`/messages/${messageId}`);
      if (response.error || !response.data) {
        throw new Error(response.error || 'Message not found');
      }
      return response.data;
    } catch {
      console.log('[MessageRepository] API not connected, using local data');
      return mockMessages.find(m => m.id === messageId) || null;
    }
  },

  async getThreads(userId: string): Promise<MessageThread[]> {
    console.log('[MessageRepository] Getting threads for user:', userId);
    
    try {
      const response = await databaseAdapter.get<MessageThread[]>('/messages/threads', { userId });
      if (response.error || !response.data) {
        throw new Error(response.error || 'Failed to get threads');
      }
      return response.data;
    } catch {
      console.log('[MessageRepository] API not connected, using local data');
      return mockThreads.filter(t => t.participants.includes(userId));
    }
  },

  async createMessage(payload: CreateMessagePayload): Promise<Message> {
    console.log('[MessageRepository] Creating message:', payload);
    
    const attachments: FileAttachment[] = (payload.attachments || []).map((att, index) => ({
      id: `att_${Date.now()}_${index}`,
      messageId: '',
      fileName: att.fileName,
      fileType: att.fileType,
      mimeType: att.mimeType,
      fileSize: att.fileSize,
      fileUrl: att.fileUri,
      uploadedAt: new Date().toISOString(),
      uploadedBy: payload.senderId,
    }));

    const messageType = payload.content && attachments.length > 0 
      ? 'mixed' 
      : attachments.length > 0 
        ? 'file' 
        : 'text';

    try {
      const response = await databaseAdapter.post<Message>('/messages', {
        ...payload,
        messageType,
        attachments,
      });
      if (response.error || !response.data) {
        throw new Error(response.error || 'Failed to create message');
      }
      return response.data;
    } catch {
      console.log('[MessageRepository] API not connected, creating locally');
      
      const newMessage: Message = {
        id: generateId(),
        projectId: payload.projectId,
        taskId: payload.taskId,
        senderId: payload.senderId,
        senderName: payload.senderName,
        senderRole: payload.senderRole,
        content: payload.content,
        messageType,
        attachments: attachments.map(att => ({ ...att, messageId: generateId() })),
        isRead: false,
        readBy: [payload.senderId],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      mockMessages.push(newMessage);
      return newMessage;
    }
  },

  async updateMessage(payload: UpdateMessagePayload): Promise<Message> {
    console.log('[MessageRepository] Updating message:', payload);
    
    try {
      const response = await databaseAdapter.put<Message>(`/messages/${payload.id}`, payload);
      if (response.error || !response.data) {
        throw new Error(response.error || 'Failed to update message');
      }
      return response.data;
    } catch {
      console.log('[MessageRepository] API not connected, updating locally');
      
      const index = mockMessages.findIndex(m => m.id === payload.id);
      if (index === -1) {
        throw new Error('Message not found');
      }
      
      mockMessages[index] = {
        ...mockMessages[index],
        ...payload,
        updatedAt: new Date().toISOString(),
      };
      
      return mockMessages[index];
    }
  },

  async deleteMessage(messageId: string): Promise<void> {
    console.log('[MessageRepository] Deleting message:', messageId);
    
    try {
      const response = await databaseAdapter.delete(`/messages/${messageId}`);
      if (response.error) {
        throw new Error(response.error);
      }
    } catch {
      console.log('[MessageRepository] API not connected, deleting locally');
      mockMessages = mockMessages.filter(m => m.id !== messageId);
    }
  },

  async markAsRead(messageId: string, userId: string): Promise<void> {
    console.log('[MessageRepository] Marking message as read:', messageId);
    
    try {
      const response = await databaseAdapter.put(`/messages/${messageId}/read`, { userId });
      if (response.error) {
        throw new Error(response.error);
      }
    } catch {
      console.log('[MessageRepository] API not connected, updating locally');
      
      const message = mockMessages.find(m => m.id === messageId);
      if (message && !message.readBy.includes(userId)) {
        message.readBy.push(userId);
        message.isRead = true;
      }
    }
  },

  async getUnreadCount(userId: string, params?: { projectId?: string; taskId?: string }): Promise<number> {
    console.log('[MessageRepository] Getting unread count for user:', userId);
    
    try {
      const response = await databaseAdapter.get<{ count: number }>('/messages/unread-count', { userId, ...params });
      if (response.error || !response.data) {
        throw new Error(response.error || 'Failed to get unread count');
      }
      return response.data.count;
    } catch {
      console.log('[MessageRepository] API not connected, counting locally');
      
      let filtered = mockMessages.filter(m => !m.readBy.includes(userId));
      
      if (params?.projectId) {
        filtered = filtered.filter(m => m.projectId === params.projectId);
      }
      if (params?.taskId) {
        filtered = filtered.filter(m => m.taskId === params.taskId);
      }
      
      return filtered.length;
    }
  },

  async deleteAttachment(attachmentId: string): Promise<void> {
    console.log('[MessageRepository] Deleting attachment:', attachmentId);
    
    try {
      const response = await databaseAdapter.delete(`/attachments/${attachmentId}`);
      if (response.error) {
        throw new Error(response.error);
      }
    } catch {
      console.log('[MessageRepository] API not connected, deleting locally');
      
      mockMessages = mockMessages.map(m => ({
        ...m,
        attachments: m.attachments.filter(a => a.id !== attachmentId),
      }));
    }
  },

  clearLocalData(): void {
    mockMessages = [];
    mockThreads = [];
  },
};
