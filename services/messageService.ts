import { messageRepository } from './messageRepository';
import {
  Message,
  MessageThread,
  CreateMessagePayload,
  UpdateMessagePayload,
} from '@/types/message';

export const messageService = {
  async getMessages(params?: { projectId?: string; taskId?: string; userId?: string }): Promise<Message[]> {
    console.log('[MessageService] Getting messages');
    return messageRepository.getMessages(params);
  },

  async getMessageById(messageId: string): Promise<Message | null> {
    console.log('[MessageService] Getting message by ID:', messageId);
    return messageRepository.getMessageById(messageId);
  },

  async getThreads(userId: string): Promise<MessageThread[]> {
    console.log('[MessageService] Getting threads for user:', userId);
    return messageRepository.getThreads(userId);
  },

  async sendMessage(payload: CreateMessagePayload): Promise<Message> {
    console.log('[MessageService] Sending message');
    
    if (!payload.content?.trim() && (!payload.attachments || payload.attachments.length === 0)) {
      throw new Error('Message must have content or attachments');
    }
    
    return messageRepository.createMessage(payload);
  },

  async updateMessage(payload: UpdateMessagePayload): Promise<Message> {
    console.log('[MessageService] Updating message:', payload.id);
    return messageRepository.updateMessage(payload);
  },

  async deleteMessage(messageId: string): Promise<void> {
    console.log('[MessageService] Deleting message:', messageId);
    return messageRepository.deleteMessage(messageId);
  },

  async markAsRead(messageId: string, userId: string): Promise<void> {
    console.log('[MessageService] Marking as read:', messageId);
    return messageRepository.markAsRead(messageId, userId);
  },

  async getUnreadCount(userId: string, params?: { projectId?: string; taskId?: string }): Promise<number> {
    console.log('[MessageService] Getting unread count');
    return messageRepository.getUnreadCount(userId, params);
  },

  async deleteAttachment(attachmentId: string): Promise<void> {
    console.log('[MessageService] Deleting attachment:', attachmentId);
    return messageRepository.deleteAttachment(attachmentId);
  },
};
