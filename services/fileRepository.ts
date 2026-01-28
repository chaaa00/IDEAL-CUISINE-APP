import { apiAdapter } from './api/adapter';
import {
  FileAttachment,
  FileUploadProgress,
  FileDownloadProgress,
  CreateFileAttachmentPayload,
  getFileTypeFromMime,
  isFileSizeValid,
  isMimeTypeAllowed,
  MAX_FILE_SIZE_MB,
} from '@/types/message';

const generateId = (): string => `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

let mockFiles: FileAttachment[] = [];

export const fileRepository = {
  async uploadFile(
    payload: CreateFileAttachmentPayload,
    userId: string,
    onProgress?: (progress: FileUploadProgress) => void
  ): Promise<FileAttachment> {
    console.log('[FileRepository] Uploading file:', payload.fileName);
    
    if (!isFileSizeValid(payload.fileSize)) {
      throw new Error(`File size exceeds maximum limit of ${MAX_FILE_SIZE_MB}MB`);
    }
    
    if (!isMimeTypeAllowed(payload.mimeType)) {
      throw new Error('File type not allowed');
    }
    
    const fileId = generateId();
    
    if (onProgress) {
      onProgress({ fileId, progress: 0, status: 'uploading' });
    }
    
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: payload.fileUri,
        name: payload.fileName,
        type: payload.mimeType,
      } as unknown as Blob);
      
      const response = await apiAdapter.post<FileAttachment>('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      if (onProgress) {
        onProgress({ fileId, progress: 100, status: 'completed' });
      }
      
      return response;
    } catch (error) {
      console.log('[FileRepository] API not connected, simulating upload');
      
      for (let i = 0; i <= 100; i += 20) {
        await new Promise(resolve => setTimeout(resolve, 100));
        if (onProgress) {
          onProgress({ 
            fileId, 
            progress: i, 
            status: i < 100 ? 'uploading' : 'completed' 
          });
        }
      }
      
      const newFile: FileAttachment = {
        id: fileId,
        messageId: '',
        fileName: payload.fileName,
        fileType: payload.fileType || getFileTypeFromMime(payload.mimeType),
        mimeType: payload.mimeType,
        fileSize: payload.fileSize,
        fileUrl: payload.fileUri,
        uploadedAt: new Date().toISOString(),
        uploadedBy: userId,
      };
      
      mockFiles.push(newFile);
      return newFile;
    }
  },

  async downloadFile(
    fileId: string,
    onProgress?: (progress: FileDownloadProgress) => void
  ): Promise<string> {
    console.log('[FileRepository] Downloading file:', fileId);
    
    if (onProgress) {
      onProgress({ fileId, progress: 0, status: 'downloading' });
    }
    
    try {
      const response = await apiAdapter.get<{ downloadUrl: string }>(`/files/${fileId}/download`);
      
      if (onProgress) {
        onProgress({ 
          fileId, 
          progress: 100, 
          status: 'completed',
          localPath: response.downloadUrl,
        });
      }
      
      return response.downloadUrl;
    } catch (error) {
      console.log('[FileRepository] API not connected, simulating download');
      
      for (let i = 0; i <= 100; i += 25) {
        await new Promise(resolve => setTimeout(resolve, 100));
        if (onProgress) {
          onProgress({ 
            fileId, 
            progress: i, 
            status: i < 100 ? 'downloading' : 'completed' 
          });
        }
      }
      
      const file = mockFiles.find(f => f.id === fileId);
      if (!file) {
        throw new Error('File not found');
      }
      
      if (onProgress) {
        onProgress({ 
          fileId, 
          progress: 100, 
          status: 'completed',
          localPath: file.fileUrl,
        });
      }
      
      return file.fileUrl;
    }
  },

  async deleteFile(fileId: string): Promise<void> {
    console.log('[FileRepository] Deleting file:', fileId);
    
    try {
      await apiAdapter.delete(`/files/${fileId}`);
    } catch (error) {
      console.log('[FileRepository] API not connected, deleting locally');
      mockFiles = mockFiles.filter(f => f.id !== fileId);
    }
  },

  async getFileMetadata(fileId: string): Promise<FileAttachment | null> {
    console.log('[FileRepository] Getting file metadata:', fileId);
    
    try {
      const response = await apiAdapter.get<FileAttachment>(`/files/${fileId}`);
      return response;
    } catch (error) {
      console.log('[FileRepository] API not connected, using local data');
      return mockFiles.find(f => f.id === fileId) || null;
    }
  },

  async getFilesByMessage(messageId: string): Promise<FileAttachment[]> {
    console.log('[FileRepository] Getting files for message:', messageId);
    
    try {
      const response = await apiAdapter.get<FileAttachment[]>(`/messages/${messageId}/files`);
      return response;
    } catch (error) {
      console.log('[FileRepository] API not connected, using local data');
      return mockFiles.filter(f => f.messageId === messageId);
    }
  },

  clearLocalData(): void {
    mockFiles = [];
  },
};
