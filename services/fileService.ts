import { fileRepository } from './fileRepository';
import {
  FileAttachment,
  FileUploadProgress,
  FileDownloadProgress,
  CreateFileAttachmentPayload,
  isFileSizeValid,
  isMimeTypeAllowed,
  MAX_FILE_SIZE_MB,
  ALLOWED_MIME_TYPES,
} from '@/types/message';

export const fileService = {
  cancelUpload(fileId: string): boolean {
    console.log('[FileService] Cancelling upload:', fileId);
    return fileRepository.cancelUpload(fileId);
  },

  getUploadStatus(): { active: number; queued: number } {
    return {
      active: fileRepository.getActiveUploadsCount(),
      queued: fileRepository.getQueuedUploadsCount(),
    };
  },

  async uploadFile(
    payload: CreateFileAttachmentPayload,
    userId: string,
    onProgress?: (progress: FileUploadProgress) => void
  ): Promise<FileAttachment> {
    console.log('[FileService] Uploading file:', payload.fileName);
    
    if (!isFileSizeValid(payload.fileSize)) {
      throw new Error(`File size exceeds maximum limit of ${MAX_FILE_SIZE_MB}MB`);
    }
    
    if (!isMimeTypeAllowed(payload.mimeType)) {
      throw new Error('File type not allowed. Supported: images, PDF, Word, Excel, ZIP');
    }
    
    return fileRepository.uploadFile(payload, userId, onProgress);
  },

  async downloadFile(
    fileId: string,
    onProgress?: (progress: FileDownloadProgress) => void
  ): Promise<string> {
    console.log('[FileService] Downloading file:', fileId);
    return fileRepository.downloadFile(fileId, onProgress);
  },

  async deleteFile(fileId: string): Promise<void> {
    console.log('[FileService] Deleting file:', fileId);
    return fileRepository.deleteFile(fileId);
  },

  async getFileMetadata(fileId: string): Promise<FileAttachment | null> {
    console.log('[FileService] Getting file metadata:', fileId);
    return fileRepository.getFileMetadata(fileId);
  },

  async getFilesByMessage(messageId: string): Promise<FileAttachment[]> {
    console.log('[FileService] Getting files for message:', messageId);
    return fileRepository.getFilesByMessage(messageId);
  },

  validateFile(fileName: string, fileSize: number, mimeType: string): { valid: boolean; error?: string } {
    if (!isFileSizeValid(fileSize)) {
      return { valid: false, error: `File size exceeds ${MAX_FILE_SIZE_MB}MB limit` };
    }
    
    if (!isMimeTypeAllowed(mimeType)) {
      return { 
        valid: false, 
        error: `File type not supported. Allowed: images, PDF, Word, Excel, ZIP` 
      };
    }
    
    const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.js', '.vbs', '.ps1'];
    const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
    if (dangerousExtensions.includes(extension)) {
      return { valid: false, error: 'This file type is not allowed for security reasons' };
    }
    
    return { valid: true };
  },

  validateFileAccess(userId: string, fileUploaderId: string, hasViewPermission: boolean): boolean {
    if (!hasViewPermission) {
      console.log('[FileService] Access denied: user lacks view_files permission');
      return false;
    }
    return true;
  },

  getSupportedFileTypes(): string[] {
    return ALLOWED_MIME_TYPES;
  },
};
