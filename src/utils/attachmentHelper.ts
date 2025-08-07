/**
 * Simple utilities for handling attachments with S3 support
 */

interface Attachment {
  file_name: string;
  file_path: string;
}

/**
 * Gets the correct URL for displaying an attachment
 * Works with both S3 URLs and local server files
 */
export const getAttachmentUrl = (attachment: Attachment): string => {
  // S3 URLs start with https://
  if (attachment.file_path?.startsWith('https://')) {
    return attachment.file_path;
  }
  
  // Fall back to local server
  return `http://localhost:4700/attachments/${attachment.file_name}`;
};

/**
 * Gets an emoji icon for a file based on its extension
 */
export const getFileIcon = (filename: string): string => {
  const ext = filename.split(".").pop()?.toLowerCase();
  
  switch (ext) {
    case "pdf": return "📄";
    case "docx": case "doc": return "📝";
    case "xlsx": case "xls": case "pptx": case "ppt": return "📊";
    case "png": case "jpg": case "jpeg": case "gif": case "webp": return "🖼️";
    case "mp4": case "avi": case "mov": return "🎥";
    case "mp3": case "wav": case "flac": return "🎵";
    case "zip": case "rar": case "7z": return "📦";
    case "txt": case "md": return "📃";
    default: return "📎";
  }
};

/**
 * Checks if a file is an image
 */
export const isImageFile = (fileName: string): boolean => {
  const ext = fileName.split(".").pop()?.toLowerCase();
  const imageExts = ["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp"];
  return imageExts.includes(ext || "");
};

/**
 * Checks if a file can be previewed
 */
export const canPreview = (fileName: string): boolean => {
  const ext = fileName.split(".").pop()?.toLowerCase();
  const previewExts = [
    "txt", "md", "json", "csv", "xml", "html", 
    "js", "css", "py", "java", "cpp", "c",
    "png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "pdf"
  ];
  return previewExts.includes(ext || "");
};

/**
 * Formats file size in human readable format
 */
export const formatFileSize = (bytes: number | null | undefined): string => {
  if (!bytes || bytes === 0) return "";
  
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = Math.round((bytes / Math.pow(1024, i)) * 100) / 100;
  
  return `${size} ${sizes[i]}`;
};