import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
  RefreshControl,
} from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Send,
  MessageCircle,
  AlertCircle,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { PermissionGate } from '@/components/PermissionGate';
import { FilePicker, PendingFilePreview, FileAttachmentView, CancelableUpload } from '@/components/FileAttachment';
import { messageService } from '@/services/messageService';
import { fileService } from '@/services/fileService';
import {
  Message,
  CreateMessagePayload,
  CreateFileAttachmentPayload,
  FileUploadProgress,
} from '@/types/message';

export default function MessagesScreen() {
  const { projectId, taskId, title } = useLocalSearchParams<{ 
    projectId?: string; 
    taskId?: string;
    title?: string;
  }>();
  const { user, hasPermission } = useAuth();
  const { t, isRTL } = useLanguage();
  const { addLocalNotification } = useNotifications();
  const queryClient = useQueryClient();
  const flatListRef = useRef<FlatList>(null);
  
  const [messageText, setMessageText] = useState('');
  const [pendingFiles, setPendingFiles] = useState<CreateFileAttachmentPayload[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, FileUploadProgress>>({});
  const [fadeAnim] = useState(new Animated.Value(0));

  const canSendMessage = hasPermission('send_message');
  const canSendFiles = hasPermission('send_files');
  const canViewFiles = hasPermission('view_files');
  const canDeleteFiles = hasPermission('delete_files');
  const canDeleteMessages = hasPermission('delete_messages');

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const messagesQuery = useQuery({
    queryKey: ['messages', projectId, taskId],
    queryFn: () => messageService.getMessages({ projectId, taskId, userId: user?.id }),
    enabled: !!user?.id,
    refetchInterval: 10000,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (payload: CreateMessagePayload) => {
      if (payload.attachments && payload.attachments.length > 0) {
        const uploadedFiles = await Promise.all(
          payload.attachments.map(async (file, index) => {
            const progressKey = `pending_${index}`;
            const uploaded = await fileService.uploadFile(
              file,
              user?.id || '',
              (progress) => {
                setUploadProgress(prev => ({ ...prev, [progressKey]: progress }));
              }
            );
            return {
              ...file,
              fileUri: uploaded.fileUrl,
            };
          })
        );
        payload.attachments = uploadedFiles;
      }
      return messageService.sendMessage(payload);
    },
    onSuccess: (newMessage) => {
      queryClient.invalidateQueries({ queryKey: ['messages', projectId, taskId] });
      setMessageText('');
      setPendingFiles([]);
      setUploadProgress({});
      
      if (newMessage.attachments && newMessage.attachments.length > 0) {
        addLocalNotification({
          type: 'message_sent',
          title: t('messaging.newFileReceived'),
          message: `${newMessage.senderName} sent ${newMessage.attachments.length} file(s)`,
          data: { messageId: newMessage.id, projectId, taskId },
          recipientId: user?.id || '',
        });
      }
      
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    },
    onError: (error: Error) => {
      setUploadProgress({});
      Alert.alert(t('common.error'), error.message);
    },
  });

  const deleteMessageMutation = useMutation({
    mutationFn: (messageId: string) => messageService.deleteMessage(messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', projectId, taskId] });
    },
    onError: (error: Error) => {
      Alert.alert(t('common.error'), error.message);
    },
  });

  const deleteAttachmentMutation = useMutation({
    mutationFn: (attachmentId: string) => messageService.deleteAttachment(attachmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', projectId, taskId] });
    },
    onError: (error: Error) => {
      Alert.alert(t('common.error'), error.message);
    },
  });

  const handleSend = useCallback(() => {
    if (!user) return;
    if (!messageText.trim() && pendingFiles.length === 0) return;
    if (!canSendMessage && !canSendFiles) return;

    const payload: CreateMessagePayload = {
      projectId,
      taskId,
      senderId: user.id,
      senderName: user.name,
      senderRole: user.role,
      content: messageText.trim(),
      attachments: canSendFiles ? pendingFiles : undefined,
    };

    console.log('[MessagesScreen] Sending message:', payload);
    sendMessageMutation.mutate(payload);
  }, [user, messageText, pendingFiles, projectId, taskId, canSendMessage, canSendFiles, sendMessageMutation]);

  const handleFileSelected = useCallback((file: CreateFileAttachmentPayload) => {
    console.log('[MessagesScreen] File selected:', file.fileName);
    setPendingFiles(prev => [...prev, file]);
  }, []);

  const handleRemoveFile = useCallback((index: number) => {
    const progressKey = `pending_${index}`;
    const progress = uploadProgress[progressKey];
    
    if (progress?.status === 'uploading' && progress.fileId) {
      fileService.cancelUpload(progress.fileId);
    }
    
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
    setUploadProgress(prev => {
      const updated = { ...prev };
      delete updated[progressKey];
      return updated;
    });
  }, [uploadProgress]);

  const handleDeleteMessage = useCallback((messageId: string) => {
    Alert.alert(
      t('messaging.deleteMessage'),
      t('messaging.confirmDeleteMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => deleteMessageMutation.mutate(messageId),
        },
      ]
    );
  }, [deleteMessageMutation, t]);

  const handleDeleteAttachment = useCallback((attachmentId: string) => {
    deleteAttachmentMutation.mutate(attachmentId);
  }, [deleteAttachmentMutation]);

  const formatMessageTime = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('dashboard.justNow');
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    
    return date.toLocaleDateString();
  }, [t]);

  const messages = messagesQuery.data || [];
  const isLoading = messagesQuery.isLoading;
  const isSending = sendMessageMutation.isPending;

  const renderMessage = useCallback(({ item }: { item: Message }) => {
    const isOwnMessage = item.senderId === user?.id;
    
    return (
      <View style={[
        styles.messageWrapper,
        isOwnMessage ? styles.ownMessageWrapper : styles.otherMessageWrapper,
      ]}>
        {!isOwnMessage && (
          <View style={styles.senderInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {item.senderName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text style={[styles.senderName, isRTL && styles.textRTL]}>
              {item.senderName}
            </Text>
          </View>
        )}
        
        <View style={[
          styles.messageBubble,
          isOwnMessage ? styles.ownBubble : styles.otherBubble,
        ]}>
          {item.content ? (
            <Text style={[
              styles.messageText,
              isOwnMessage ? styles.ownMessageText : styles.otherMessageText,
              isRTL && styles.textRTL,
            ]}>
              {item.content}
            </Text>
          ) : null}
          
          {item.attachments && item.attachments.length > 0 && (
            <View style={styles.attachmentsContainer}>
              {item.attachments.map((attachment) => (
                <FileAttachmentView
                  key={attachment.id}
                  attachment={attachment}
                  canView={canViewFiles}
                  canDelete={canDeleteFiles && isOwnMessage}
                  onDelete={handleDeleteAttachment}
                  compact
                />
              ))}
            </View>
          )}
          
          <Text style={[
            styles.messageTime,
            isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime,
          ]}>
            {formatMessageTime(item.createdAt)}
          </Text>
        </View>
        
        {canDeleteMessages && isOwnMessage && (
          <TouchableOpacity
            style={styles.deleteMessageBtn}
            onPress={() => handleDeleteMessage(item.id)}
            activeOpacity={0.7}
          >
            <Text style={styles.deleteMessageText}>×</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }, [user?.id, canViewFiles, canDeleteFiles, canDeleteMessages, isRTL, handleDeleteAttachment, handleDeleteMessage, formatMessageTime]);

  const screenTitle = title || (projectId ? t('messaging.projectChat') : taskId ? t('messaging.taskChat') : t('messaging.title'));

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Stack.Screen
        options={{
          title: screenTitle,
          headerStyle: { backgroundColor: '#1A1A1A' },
          headerTintColor: '#fff',
        }}
      />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {messages.length === 0 && !isLoading ? (
          <View style={styles.emptyState}>
            <MessageCircle size={64} color="#DDD" />
            <Text style={[styles.emptyTitle, isRTL && styles.textRTL]}>
              {t('messaging.noMessages')}
            </Text>
            <Text style={[styles.emptySubtitle, isRTL && styles.textRTL]}>
              {t('messaging.startConversation')}
            </Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isLoading}
                onRefresh={() => messagesQuery.refetch()}
                tintColor="#1A1A1A"
              />
            }
            onContentSizeChange={() => {
              if (messages.length > 0) {
                flatListRef.current?.scrollToEnd({ animated: false });
              }
            }}
          />
        )}

        {pendingFiles.length > 0 && (
          <View style={styles.pendingFilesContainer}>
            {pendingFiles.map((file, index) => (
              <PendingFilePreview
                key={`pending_${index}`}
                file={file}
                onRemove={() => handleRemoveFile(index)}
                uploadProgress={uploadProgress[`pending_${index}`]}
              />
            ))}
          </View>
        )}

        <View style={[styles.inputContainer, isRTL && styles.inputContainerRTL]}>
          <PermissionGate permission="send_files">
            <FilePicker
              onFileSelected={handleFileSelected}
              disabled={isSending}
            />
          </PermissionGate>

          <TextInput
            style={[
              styles.textInput,
              isRTL && styles.textInputRTL,
              !canSendMessage && styles.textInputDisabled,
            ]}
            value={messageText}
            onChangeText={setMessageText}
            placeholder={canSendMessage ? t('messaging.typeMessage') : t('messaging.noSendPermission')}
            placeholderTextColor="#999"
            multiline
            maxLength={2000}
            editable={canSendMessage}
            textAlign={isRTL ? 'right' : 'left'}
          />

          <TouchableOpacity
            style={[
              styles.sendButton,
              (!messageText.trim() && pendingFiles.length === 0) && styles.sendButtonDisabled,
              isSending && styles.sendButtonSending,
            ]}
            onPress={handleSend}
            disabled={(!messageText.trim() && pendingFiles.length === 0) || isSending || (!canSendMessage && !canSendFiles)}
            activeOpacity={0.7}
          >
            <Send size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  keyboardView: {
    flex: 1,
  },
  messagesList: {
    padding: 16,
    paddingBottom: 8,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#333',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    textAlign: 'center' as const,
  },
  messageWrapper: {
    marginBottom: 16,
  },
  ownMessageWrapper: {
    alignItems: 'flex-end',
  },
  otherMessageWrapper: {
    alignItems: 'flex-start',
  },
  senderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#fff',
  },
  senderName: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: '#666',
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: 18,
    padding: 12,
    paddingBottom: 8,
  },
  ownBubble: {
    backgroundColor: '#1A1A1A',
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  ownMessageText: {
    color: '#fff',
  },
  otherMessageText: {
    color: '#1A1A1A',
  },
  messageTime: {
    fontSize: 11,
    marginTop: 6,
  },
  ownMessageTime: {
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'right' as const,
  },
  otherMessageTime: {
    color: '#999',
  },
  attachmentsContainer: {
    marginTop: 8,
  },
  deleteMessageBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  deleteMessageText: {
    fontSize: 16,
    color: '#999',
    fontWeight: '600' as const,
  },
  pendingFilesContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    backgroundColor: '#F5F5F5',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
    gap: 10,
  },
  inputContainerRTL: {
    flexDirection: 'row-reverse',
  },
  textInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: '#F5F5F5',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1A1A1A',
  },
  textInputRTL: {
    textAlign: 'right' as const,
  },
  textInputDisabled: {
    backgroundColor: '#F0F0F0',
    color: '#999',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#CCC',
  },
  sendButtonSending: {
    backgroundColor: '#666',
  },
  textRTL: {
    textAlign: 'right' as const,
  },
});
