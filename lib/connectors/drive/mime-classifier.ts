export type DriveMimeCategory = 
  | "Document" | "Spreadsheet" | "Presentation" | "Image" 
  | "Audio" | "Video" | "Archive" | "Source Code" 
  | "PDF" | "Executable" | "Folder" | "Shortcut" | "Unknown";

export class DriveMimeClassifier {
  static classify(mimeType: string): DriveMimeCategory {
    if (mimeType === "application/vnd.google-apps.folder") return "Folder";
    if (mimeType === "application/vnd.google-apps.shortcut") return "Shortcut";
    if (mimeType === "application/pdf") return "PDF";
    if (mimeType.startsWith("image/")) return "Image";
    if (mimeType.startsWith("audio/")) return "Audio";
    if (mimeType.startsWith("video/")) return "Video";
    if (mimeType === "application/vnd.google-apps.document") return "Document";
    if (mimeType === "application/vnd.google-apps.spreadsheet") return "Spreadsheet";
    if (mimeType === "application/vnd.google-apps.presentation") return "Presentation";
    if (mimeType === "application/zip" || mimeType === "application/x-rar-compressed") return "Archive";
    if (mimeType === "text/plain" || mimeType.includes("javascript") || mimeType.includes("typescript")) return "Source Code";
    if (mimeType === "application/octet-stream") return "Executable";
    
    return "Unknown";
  }
}
