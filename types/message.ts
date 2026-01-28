export type MessageType = 'text' | 'file' | 'mixed';

export type FileType = 'image' | 'pdf' | 'word' | 'excel' | 'zip' | 'other';

export interface FileAttachment {
  id: string;
  messageId: string;
  fileName: string;
  fileType: FileType;
  mimeType: string;
  fileSize: number;
  fileUrl: string;
  thumbnailUrl?: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface Message {
  id: string;
  projectId?: string;
  taskId?: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  content: string;
  messageType: MessageType;
  attachments: FileAttachment[];
  isRead: boolean;
  readBy: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateMessagePayload {
  projectId?: string;
  taskId?: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  content: string;
  attachments?: CreateFileAttachmentPayload[];
}

export interface CreateFileAttachmentPayload {
  fileName: string;
  fileType: FileType;
  mimeType: string;
  fileSize: number;
  fileUri: string;
}

export interface UpdateMessagePayload {
  id: string;
  content?: string;
  isRead?: boolean;
}

export interface MessageThread {
  id: string;
  projectId?: string;
  taskId?: string;
  participants: string[];
  lastMessage?: Message;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface FileUploadProgress {
  fileId: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  error?: string;
}

export interface FileDownloadProgress {
  fileId: string;
  progress: number;
  status: 'pending' | 'downloading' | 'completed' | 'failed';
  localPath?: string;
  error?: string;
}

export const FILE_TYPE_CONFIG: Record<FileType, { label: string; icon: string; color: string; extensions: string[] }> = {
  image: { 
    label: 'Image', 
    icon: 'image', 
    color: '#4CAF50',
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp']
  },
  pdf: { 
    label: 'PDF', 
    icon: 'file-text', 
    color: '#E53935',
    extensions: ['.pdf']
  },
  word: { 
    label: 'Word', 
    icon: 'file-text', 
    color: '#2196F3',
    extensions: ['.doc', '.docx']
  },
  excel: { 
    label: 'Excel', 
    icon: 'table', 
    color: '#4CAF50',
    extensions: ['.xls', '.xlsx', '.csv']
  },
  zip: { 
    label: 'Archive', 
    icon: 'archive', 
    color: '#FF9800',
    extensions: ['.zip', '.rar', '.7z', '.tar', '.gz']
  },
  other: { 
    label: 'File', 
    icon: 'file', 
    color: '#757575',
    extensions: []
  },
};

export const MAX_FILE_SIZE_MB = 25;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'application/zip',
  'application/x-rar-compressed',
  'application/x-7z-compressed',
];

export function getFileTypeFromMime(mimeType: string): FileType {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'word';
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet') || mimeType === 'text/csv') return 'excel';
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z') || mimeType.includes('tar')) return 'zip';
  return 'other';
}

export function getFileTypeFromExtension(fileName: string): FileType {
  const ext = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
  for (const [type, config] of Object.entries(FILE_TYPE_CONFIG)) {
    if (config.extensions.includes(ext)) {
      return type as FileType;
    }
  }
  return 'other';
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function isFileSizeValid(bytes: number): boolean {
  return bytes <= MAX_FILE_SIZE_BYTES;
}

export function isMimeTypeAllowed(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.includes(mimeType) || mimeType.startsWith('image/');
}
