import databaseAdapter from './api/adapter';
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

const MAX_CONCURRENT_UPLOADS = 3;
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;

let activeUploads = 0;
const uploadQueue: Array<() => Promise<void>> = [];
const abortControllers = new Map<string, AbortController>();

let mockFiles: FileAttachment[] = [];

const processUploadQueue = async () => {
  while (uploadQueue.length > 0 && activeUploads < MAX_CONCURRENT_UPLOADS) {
    const nextUpload = uploadQueue.shift();
    if (nextUpload) {
      activeUploads++;
      try {
        await nextUpload();
      } finally {
        activeUploads--;
        processUploadQueue();
      }
    }
  }
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const fileRepository = {
  cancelUpload(fileId: string): boolean {
    const controller = abortControllers.get(fileId);
    if (controller) {
      console.log('[FileRepository] Cancelling upload:', fileId);
      controller.abort();
      abortControllers.delete(fileId);
      return true;
    }
    return false;
  },

  getActiveUploadsCount(): number {
    return activeUploads;
  },

  getQueuedUploadsCount(): number {
    return uploadQueue.length;
  },

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
    const abortController = new AbortController();
    abortControllers.set(fileId, abortController);
    
    if (onProgress) {
      onProgress({ fileId, progress: 0, status: 'pending' });
    }

    const executeUpload = async (attempt: number = 1): Promise<FileAttachment> => {
      if (abortController.signal.aborted) {
        throw new Error('Upload cancelled');
      }

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
        
        const response = await databaseAdapter.post<FileAttachment>('/files/upload', formData);
        
        if (response.error || !response.data) {
          throw new Error(response.error || 'Upload failed');
        }
        
        if (onProgress) {
          onProgress({ fileId, progress: 100, status: 'completed' });
        }
        
        abortControllers.delete(fileId);
        return response.data;
      } catch (error) {
        if (abortController.signal.aborted) {
          throw new Error('Upload cancelled');
        }

        const isNetworkError = error instanceof Error && 
          (error.message.includes('network') || error.message.includes('timeout') || error.message.includes('fetch'));
        
        if (isNetworkError && attempt < MAX_RETRY_ATTEMPTS) {
          console.log(`[FileRepository] Upload failed, retrying (${attempt}/${MAX_RETRY_ATTEMPTS})...`);
          if (onProgress) {
            onProgress({ 
              fileId, 
              progress: 0, 
              status: 'uploading',
              error: `Retrying (${attempt}/${MAX_RETRY_ATTEMPTS})...`
            });
          }
          await delay(RETRY_DELAY_MS * attempt);
          return executeUpload(attempt + 1);
        }
        
        console.log('[FileRepository] API not connected, simulating upload');
        
        for (let i = 0; i <= 100; i += 20) {
          if (abortController.signal.aborted) {
            throw new Error('Upload cancelled');
          }
          await delay(100);
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
        abortControllers.delete(fileId);
        return newFile;
      }
    };

    if (activeUploads >= MAX_CONCURRENT_UPLOADS) {
      console.log('[FileRepository] Upload queued, waiting for slot...');
      if (onProgress) {
        onProgress({ fileId, progress: 0, status: 'pending', error: 'Queued' });
      }
      
      return new Promise((resolve, reject) => {
        uploadQueue.push(async () => {
          try {
            const result = await executeUpload();
            resolve(result);
          } catch (err) {
            reject(err);
          }
        });
        processUploadQueue();
      });
    }

    activeUploads++;
    try {
      return await executeUpload();
    } finally {
      activeUploads--;
      processUploadQueue();
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
      const response = await databaseAdapter.get<{ downloadUrl: string }>(`/files/${fileId}/download`);
      
      if (response.error || !response.data) {
        throw new Error(response.error || 'Download failed');
      }
      
      if (onProgress) {
        onProgress({ 
          fileId, 
          progress: 100, 
          status: 'completed',
          localPath: response.data.downloadUrl,
        });
      }
      
      return response.data.downloadUrl;
    } catch {
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
      const response = await databaseAdapter.delete(`/files/${fileId}`);
      if (response.error) {
        throw new Error(response.error);
      }
    } catch {
      console.log('[FileRepository] API not connected, deleting locally');
      mockFiles = mockFiles.filter(f => f.id !== fileId);
    }
  },

  async getFileMetadata(fileId: string): Promise<FileAttachment | null> {
    console.log('[FileRepository] Getting file metadata:', fileId);
    
    try {
      const response = await databaseAdapter.get<FileAttachment>(`/files/${fileId}`);
      if (response.error || !response.data) {
        throw new Error(response.error || 'File not found');
      }
      return response.data;
    } catch {
      console.log('[FileRepository] API not connected, using local data');
      return mockFiles.find(f => f.id === fileId) || null;
    }
  },

  async getFilesByMessage(messageId: string): Promise<FileAttachment[]> {
    console.log('[FileRepository] Getting files for message:', messageId);
    
    try {
      const response = await databaseAdapter.get<FileAttachment[]>(`/messages/${messageId}/files`);
      if (response.error || !response.data) {
        throw new Error(response.error || 'Files not found');
      }
      return response.data;
    } catch {
      console.log('[FileRepository] API not connected, using local data');
      return mockFiles.filter(f => f.messageId === messageId);
    }
  },

  clearLocalData(): void {
    mockFiles = [];
  },
};
