import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import {
  Paperclip,
  X,
  Download,
  Image as ImageIcon,
  FileText,
  Table,
  Archive,
  File,
  Trash2,
} from 'lucide-react-native';
import { useMutation } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';
import { fileService } from '@/services/fileService';
import {
  FileAttachment as FileAttachmentType,
  FileUploadProgress,
  FileDownloadProgress,
  CreateFileAttachmentPayload,
  getFileTypeFromMime,
  formatFileSize,
  FILE_TYPE_CONFIG,
  FileType,
} from '@/types/message';

interface FileAttachmentProps {
  attachment: FileAttachmentType;
  canView: boolean;
  canDelete: boolean;
  onDelete?: (attachmentId: string) => void;
  compact?: boolean;
}

export function FileAttachmentView({ 
  attachment, 
  canView, 
  canDelete, 
  onDelete,
  compact = false,
}: FileAttachmentProps) {
  const { t, isRTL } = useLanguage();
  const [downloadProgress, setDownloadProgress] = useState<FileDownloadProgress | null>(null);

  const downloadMutation = useMutation({
    mutationFn: () => fileService.downloadFile(attachment.id, setDownloadProgress),
    onSuccess: async (url) => {
      console.log('[FileAttachment] Download completed:', url);
      if (Platform.OS === 'web') {
        window.open(url, '_blank');
      } else {
        try {
          await Linking.openURL(url);
        } catch {
          Alert.alert(t('common.error'), t('messaging.cannotOpenFile'));
        }
      }
    },
    onError: (error: Error) => {
      Alert.alert(t('common.error'), error.message);
    },
  });

  const getFileIcon = useCallback((fileType: FileType) => {
    const config = FILE_TYPE_CONFIG[fileType];
    const iconProps = { size: compact ? 20 : 24, color: config.color };
    
    switch (fileType) {
      case 'image':
        return <ImageIcon {...iconProps} />;
      case 'pdf':
      case 'word':
        return <FileText {...iconProps} />;
      case 'excel':
        return <Table {...iconProps} />;
      case 'zip':
        return <Archive {...iconProps} />;
      default:
        return <File {...iconProps} />;
    }
  }, [compact]);

  const { mutate: download } = downloadMutation;

  const handleDownload = useCallback(() => {
    if (!canView) {
      Alert.alert(t('common.error'), t('messaging.noViewPermission'));
      return;
    }
    download();
  }, [canView, download, t]);

  const handleDelete = useCallback(() => {
    if (!canDelete) return;
    
    Alert.alert(
      t('messaging.deleteFile'),
      t('messaging.confirmDeleteFile'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => onDelete?.(attachment.id),
        },
      ]
    );
  }, [canDelete, onDelete, attachment.id, t]);

  const isDownloading = downloadMutation.isPending || downloadProgress?.status === 'downloading';

  return (
    <View style={[
      styles.attachmentContainer, 
      compact && styles.attachmentCompact,
      isRTL && styles.rowRTL
    ]}>
      <View style={[styles.fileIconContainer, { backgroundColor: `${FILE_TYPE_CONFIG[attachment.fileType].color}15` }]}>
        {getFileIcon(attachment.fileType)}
      </View>
      
      <View style={[styles.fileInfo, isRTL && styles.fileInfoRTL]}>
        <Text style={[styles.fileName, isRTL && styles.textRTL]} numberOfLines={1}>
          {attachment.fileName}
        </Text>
        <Text style={[styles.fileSize, isRTL && styles.textRTL]}>
          {formatFileSize(attachment.fileSize)}
        </Text>
        
        {isDownloading && downloadProgress && (
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { width: `${downloadProgress.progress}%` }]} />
          </View>
        )}
      </View>
      
      <View style={[styles.fileActions, isRTL && styles.rowRTL]}>
        {canView && (
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={handleDownload}
            disabled={isDownloading}
            activeOpacity={0.7}
          >
            {isDownloading ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <Download size={18} color="#000" />
            )}
          </TouchableOpacity>
        )}
        
        {canDelete && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.deleteBtn]}
            onPress={handleDelete}
            activeOpacity={0.7}
          >
            <Trash2 size={18} color="#E53935" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

interface FilePickerProps {
  onFileSelected: (file: CreateFileAttachmentPayload) => void;
  disabled?: boolean;
}

export function FilePicker({ onFileSelected, disabled }: FilePickerProps) {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);

  const handlePickFile = useCallback(async () => {
    if (disabled) return;
    
    setIsLoading(true);
    console.log('[FilePicker] Opening document picker');
    
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });
      
      if (result.canceled) {
        console.log('[FilePicker] User cancelled');
        return;
      }
      
      const file = result.assets[0];
      console.log('[FilePicker] File selected:', file.name);
      
      const validation = fileService.validateFile(
        file.name,
        file.size || 0,
        file.mimeType || 'application/octet-stream'
      );
      
      if (!validation.valid) {
        Alert.alert(t('common.error'), validation.error || t('messaging.invalidFile'));
        return;
      }
      
      const filePayload: CreateFileAttachmentPayload = {
        fileName: file.name,
        fileType: getFileTypeFromMime(file.mimeType || 'application/octet-stream'),
        mimeType: file.mimeType || 'application/octet-stream',
        fileSize: file.size || 0,
        fileUri: file.uri,
      };
      
      onFileSelected(filePayload);
    } catch (error) {
      console.error('[FilePicker] Error:', error);
      Alert.alert(t('common.error'), t('messaging.filePickerError'));
    } finally {
      setIsLoading(false);
    }
  }, [disabled, onFileSelected, t]);

  return (
    <TouchableOpacity
      style={[styles.pickerButton, disabled && styles.pickerDisabled]}
      onPress={handlePickFile}
      disabled={disabled || isLoading}
      activeOpacity={0.7}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color="#666" />
      ) : (
        <Paperclip size={22} color={disabled ? '#CCC' : '#666'} />
      )}
    </TouchableOpacity>
  );
}

interface PendingFilePreviewProps {
  file: CreateFileAttachmentPayload;
  onRemove: () => void;
  uploadProgress?: FileUploadProgress;
}

export function PendingFilePreview({ file, onRemove, uploadProgress }: PendingFilePreviewProps) {
  const { isRTL } = useLanguage();
  
  const getFileIcon = useCallback((fileType: FileType) => {
    const config = FILE_TYPE_CONFIG[fileType];
    const iconProps = { size: 20, color: config.color };
    
    switch (fileType) {
      case 'image':
        return <ImageIcon {...iconProps} />;
      case 'pdf':
      case 'word':
        return <FileText {...iconProps} />;
      case 'excel':
        return <Table {...iconProps} />;
      case 'zip':
        return <Archive {...iconProps} />;
      default:
        return <File {...iconProps} />;
    }
  }, []);

  const isUploading = uploadProgress?.status === 'uploading';

  return (
    <View style={[styles.pendingFile, isRTL && styles.rowRTL]}>
      <View style={[styles.pendingFileIcon, { backgroundColor: `${FILE_TYPE_CONFIG[file.fileType].color}15` }]}>
        {getFileIcon(file.fileType)}
      </View>
      
      <View style={[styles.pendingFileInfo, isRTL && styles.fileInfoRTL]}>
        <Text style={[styles.pendingFileName, isRTL && styles.textRTL]} numberOfLines={1}>
          {file.fileName}
        </Text>
        <Text style={[styles.pendingFileSize, isRTL && styles.textRTL]}>
          {formatFileSize(file.fileSize)}
        </Text>
        
        {isUploading && uploadProgress && (
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { width: `${uploadProgress.progress}%` }]} />
          </View>
        )}
      </View>
      
      <TouchableOpacity
        style={isUploading ? styles.cancelButton : styles.removeButton}
        onPress={onRemove}
        activeOpacity={0.7}
      >
        <X size={16} color={isUploading ? '#E53935' : '#666'} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  attachmentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    gap: 12,
  },
  attachmentCompact: {
    padding: 8,
    gap: 8,
  },
  fileIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileInfo: {
    flex: 1,
  },
  fileInfoRTL: {
    alignItems: 'flex-end',
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#1A1A1A',
    marginBottom: 2,
  },
  fileSize: {
    fontSize: 12,
    color: '#666',
  },
  progressContainer: {
    height: 3,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginTop: 6,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 2,
  },
  fileActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    backgroundColor: '#FFF5F5',
  },
  pickerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerDisabled: {
    opacity: 0.5,
  },
  pendingFile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    gap: 10,
  },
  pendingFileIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingFileInfo: {
    flex: 1,
  },
  pendingFileName: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: '#1A1A1A',
  },
  pendingFileSize: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFE5E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowRTL: {
    flexDirection: 'row-reverse' as const,
  },
  textRTL: {
    textAlign: 'right' as const,
  },
});

export function CancelableUpload() {
  return null;
}
