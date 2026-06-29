export type Language = "vi" | "en";

export type ProjectStatus =
  | "Draft"
  | "Script Ready"
  | "Assets Ready"
  | "Images Ready"
  | "Videos Ready"
  | "Completed"
  | "Failed";

export interface Scene {
  id: string;
  sceneNumber: number;
  descriptionVi: string;
  descriptionEn: string;
  promptImage: string; // Default English as requested
  promptVideo: string; // Default English as requested
  voiceScriptVi: string;
  voiceScriptEn: string;
  imageUrl?: string;
  videoUrl?: string;
  voiceAudioUrl?: string;
  status: "Pending" | "Generating" | "Completed" | "Failed";
  error?: string;
}

export interface ScriptVersion {
  version: number;
  updatedAt: string;
  title: string;
  content: string;
}

export interface Project {
  id: string;
  name: string;
  industryId: string;
  contentType: string;
  productName: string;
  productCategory: string;
  productInfo: string;
  aiLanguage: "vi" | "en" | "both";
  goal: string;
  tone: string;
  style: string;
  aiExpertRole: string;
  cta: string;
  targetWordCount?: string;
  imageReferences: string[]; // Base64 or local paths
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
  scriptTitle?: string;
  scriptContent?: string;
  scriptVersionCount: number;
  versions: ScriptVersion[];
  scenes: Scene[];
  isArchived: boolean;
  imageSeed?: number;
  voiceId?: string;
}

export interface ElevenLabsKey {
  id: string;
  name: string;
  apiKey: string;
  status: "Active" | "Exhausted" | "Error";
  usageCount: number;
  errorCount: number;
  lastUsedTime?: string;
}

export interface GeminiKey {
  id: string;
  name: string;
  apiKey: string;
  status: "Active" | "Inactive" | "Blocked";
  usageCount: number;
  errorCount: number;
  lastUsedTime?: string;
}

export interface FlowAccount {
  id: string;
  name: string;
  apiKey: string;
  status: "Active" | "Exhausted" | "Error";
  credit: number; // Credit counter (e.g. 100 max)
  usageCount: number;
  lastUsedTime?: string;
}

export type TaskType = "Script" | "Scenes" | "ImageGen" | "VideoGen" | "VoiceGen" | "All";

export interface LogEntry {
  timestamp: string;
  level: "info" | "warn" | "error" | "success";
  message: string;
}

export interface QueueTask {
  id: string;
  projectId: string;
  taskType: TaskType;
  status: "Pending" | "Processing" | "Completed" | "Failed";
  progress: number; // 0 to 100
  logLines: LogEntry[];
  errorMessage?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

export interface AIModelSettings {
  scriptModel: string; // e.g. "gemini-2.1-pro" -> mapped to gemini-3.1-pro-preview
  sceneModel: string;  // e.g. "gemini-2.1-flash" -> mapped to gemini-3.5-flash
  maxRetries: number;
  retryDelayMs: number;
}

export interface IndustryTemplate {
  id: string;
  nameVi: string;
  nameEn: string;
  descriptionVi: string;
  descriptionEn: string;
}

export interface SmartPreset {
  id: string;
  nameVi: string;
  nameEn: string;
  goalVi: string;
  goalEn: string;
  toneVi: string;
  toneEn: string;
  styleVi: string;
  styleEn: string;
  expertRoleVi: string;
  expertRoleEn: string;
  ctaVi: string;
  ctaEn: string;
}

export interface SupabaseStatus {
  configured: boolean;
  tablesOk: boolean;
  error: string | null;
  sqlSetupCode: string;
}
