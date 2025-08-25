import { LuFile, LuFileVideo, LuFileImage, LuFileText } from 'react-icons/lu';

export const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "0 B";
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
};

export const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
};

export const getFileIcon = (fileType: string | null) => {
    if (!fileType) return LuFile;
    if (fileType.startsWith("video/")) return LuFileVideo;
    if (fileType.startsWith("image/")) return LuFileImage;
    if (fileType.includes("pdf") || fileType.includes("text")) return LuFileText;
    return LuFile;
};