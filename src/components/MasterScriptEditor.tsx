import React, { useState, useEffect, useRef } from "react";
import { 
  FileText, History, Terminal, Save, Copy, Check, RotateCcw, 
  Sparkles, Undo2, Redo2, HelpCircle, ArrowRight, X 
} from "lucide-react";
import { Project, LogEntry } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface Props {
  lang: "vi" | "en";
  project: Project;
  logs: LogEntry[];
  onSaveScript: (title: string, content: string) => Promise<void>;
  onRestoreVersion: (versionNum: number) => Promise<void>;
  onTriggerBreakdown: () => Promise<void>;
  onRegenerateScript: () => Promise<void>;
  isLoading: boolean;
}

interface LocalScriptVersion {
  id: string;
  content: string;
  timestamp: string;
  wordCount: number;
}

export default function MasterScriptEditor({
  lang, project, logs, onSaveScript, onRestoreVersion, onTriggerBreakdown, onRegenerateScript, isLoading
}: Props) {
  const [editorTitle, setEditorTitle] = useState(project.scriptTitle || "");
  const [editorContent, setEditorContent] = useState(project.scriptContent || "");
  const [copied, setCopied] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [savingStatus, setSavingStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [localVersions, setLocalVersions] = useState<LocalScriptVersion[]>([]);
  const [toast, setToast] = useState<{ message: string; type: "success" | "info" } | null>(null);

  // Undo/Redo Stacks
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  const isUpdatingValue = useRef(false);

  // Persistence tracking references
  const lastSavedContent = useRef("");
  const lastSavedTitle = useRef("");
  const typingTimer = useRef<NodeJS.Timeout | null>(null);
  const prevScriptContent = useRef("");

  // Helper trigger to display toast
  const showToast = (message: string, type: "success" | "info" = "success") => {
    setToast({ message, type });
  };

  // Close toast automatically
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Load and swap local draft when project changes
  useEffect(() => {
    if (!project?.id) return;

    const draft = localStorage.getItem(`scriptDraft_${project.id}`);
    const title = localStorage.getItem(`scriptTitle_${project.id}`);

    if (draft !== null) {
      setEditorContent(draft);
      lastSavedContent.current = draft;
    } else {
      setEditorContent(project.scriptContent || "");
      lastSavedContent.current = project.scriptContent || "";
    }

    if (title !== null) {
      setEditorTitle(title);
      lastSavedTitle.current = title;
    } else {
      setEditorTitle(project.scriptTitle || "");
      lastSavedTitle.current = project.scriptTitle || "";
    }

    // Initialize versions history from local storage or from API fallback
    const savedVersJson = localStorage.getItem(`scriptVersions_${project.id}`);
    if (savedVersJson) {
      setLocalVersions(JSON.parse(savedVersJson));
    } else {
      const initVers = project.versions?.map((v) => ({
        id: `ver-${v.version}-${new Date(v.updatedAt).getTime()}`,
        content: v.content,
        timestamp: v.updatedAt,
        wordCount: v.content ? v.content.trim().split(/\s+/).filter(Boolean).length : 0
      })) || [];
      setLocalVersions(initVers);
      localStorage.setItem(`scriptVersions_${project.id}`, JSON.stringify(initVers));
    }

    setUndoStack([]);
    setRedoStack([]);
    prevScriptContent.current = project.scriptContent || "";
  }, [project.id]);

  // Sync background AI generations with the viewer draft
  useEffect(() => {
    if (project.scriptContent && project.scriptContent !== prevScriptContent.current) {
      setEditorContent(project.scriptContent);
      setEditorTitle(project.scriptTitle || (lang === "vi" ? "Kịch bản AI" : "AI Generated Script"));

      localStorage.setItem(`scriptDraft_${project.id}`, project.scriptContent);
      localStorage.setItem(`scriptTitle_${project.id}`, project.scriptTitle || (lang === "vi" ? "Kịch bản AI" : "AI Generated Script"));

      // Auto capture newly generated script as a version
      const newVer: LocalScriptVersion = {
        id: `ver-${Date.now()}`,
        content: project.scriptContent,
        timestamp: new Date().toISOString(),
        wordCount: project.scriptContent.trim().split(/\s+/).filter(Boolean).length
      };

      setLocalVersions((prev) => {
        const updated = [newVer, ...prev];
        localStorage.setItem(`scriptVersions_${project.id}`, JSON.stringify(updated));
        return updated;
      });

      lastSavedContent.current = project.scriptContent;
      lastSavedTitle.current = project.scriptTitle || "";
      prevScriptContent.current = project.scriptContent;

      showToast(lang === "vi" ? "Đã cập nhật kịch bản AI thành công!" : "Gemini AI Script generated successfully!");
    }
  }, [project.scriptContent, project.id]);

  // 10 second Auto Save check trigger on text changes
  useEffect(() => {
    const timer = setInterval(() => {
      if (editorContent !== lastSavedContent.current || editorTitle !== lastSavedTitle.current) {
        // Live save draft states to browser localStorage instantly
        localStorage.setItem(`scriptDraft_${project.id}`, editorContent);
        localStorage.setItem(`scriptTitle_${project.id}`, editorTitle);

        // Sync to backend DB replicas
        onSaveScript(editorTitle || (lang === "vi" ? "Kịch bản tự chỉnh" : "Custom Script"), editorContent);

        lastSavedContent.current = editorContent;
        lastSavedTitle.current = editorTitle;

        setSavingStatus("saved");
        showToast(lang === "vi" ? "Đã tự động lưu nháp kịch bản thành công" : "Script draft auto-saved successfully");
        setTimeout(() => setSavingStatus("idle"), 1500);
      }
    }, 10000);

    return () => clearInterval(timer);
  }, [editorContent, editorTitle, project.id, lang, onSaveScript]);

  // Handle typing change & debounce undo steps grouping
  const handleContentChange = (val: string) => {
    // Write directly to local storage to absolutely prevent loss on reload
    localStorage.setItem(`scriptDraft_${project.id}`, val);

    if (!isUpdatingValue.current) {
      if (typingTimer.current) {
        clearTimeout(typingTimer.current);
      }

      const backupContent = editorContent;
      typingTimer.current = setTimeout(() => {
        setUndoStack((prev) => {
          if (prev.length > 0 && prev[prev.length - 1] === backupContent) return prev;
          return [...prev, backupContent];
        });
        setRedoStack([]);
      }, 700);
    }
    setEditorContent(val);
  };

  const handleTitleChange = (val: string) => {
    setEditorTitle(val);
    localStorage.setItem(`scriptTitle_${project.id}`, val);
  };

  // Manual save handler
  const handleManualSave = async () => {
    setSavingStatus("saving");
    try {
      // Sync on express server replica
      await onSaveScript(editorTitle || (lang === "vi" ? "Kịch bản tự chỉnh" : "Custom Script"), editorContent);

      // Persist locally
      localStorage.setItem(`scriptDraft_${project.id}`, editorContent);
      localStorage.setItem(`scriptTitle_${project.id}`, editorTitle);

      const newVer: LocalScriptVersion = {
        id: `ver-${Date.now()}`,
        content: editorContent,
        timestamp: new Date().toISOString(),
        wordCount: editorContent ? editorContent.trim().split(/\s+/).filter(Boolean).length : 0
      };

      const updated = [newVer, ...localVersions];
      setLocalVersions(updated);
      localStorage.setItem(`scriptVersions_${project.id}`, JSON.stringify(updated));

      lastSavedContent.current = editorContent;
      lastSavedTitle.current = editorTitle;

      setSavingStatus("saved");
      showToast(lang === "vi" ? "Đã lưu kịch bản thành công" : "Script saved successfully");
      setTimeout(() => setSavingStatus("idle"), 2000);
    } catch (err) {
      console.error(err);
      setSavingStatus("idle");
      showToast(lang === "vi" ? "Không thể kết nối lưu kịch bản" : "Failed to save script", "info");
    }
  };

  // Restore dynamic version
  const handleRestoreLocalVersion = (ver: LocalScriptVersion) => {
    if (editorContent) {
      setUndoStack(prev => [...prev, editorContent]);
    }
    setRedoStack([]);

    setEditorContent(ver.content);
    localStorage.setItem(`scriptDraft_${project.id}`, ver.content);

    showToast(lang === "vi" ? "Đã khôi phục kịch bản thành công!" : "Script restored successfully!");
  };

  // Undo action trigger
  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setRedoStack((prevRedo) => [...prevRedo, editorContent]);

    isUpdatingValue.current = true;
    setEditorContent(prev);
    localStorage.setItem(`scriptDraft_${project.id}`, prev);
    setUndoStack(undoStack.slice(0, -1));
    isUpdatingValue.current = false;
  };

  // Redo action trigger
  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const nextVal = redoStack[redoStack.length - 1];
    setUndoStack((prevUndo) => [...prevUndo, editorContent]);

    isUpdatingValue.current = true;
    setEditorContent(nextVal);
    localStorage.setItem(`scriptDraft_${project.id}`, nextVal);
    setRedoStack(redoStack.slice(0, -1));
    isUpdatingValue.current = false;
  };

  // Stats calculation
  const wordCount = editorContent ? editorContent.trim().split(/\s+/).filter(Boolean).length : 0;
  const charCount = editorContent ? editorContent.length : 0;
  const durationSec = Math.ceil((wordCount / 130) * 60);

  const handleCopy = () => {
    navigator.clipboard.writeText(editorContent);
    setCopied(true);
    showToast(lang === "vi" ? "Đã sao chép kịch bản vào bộ nhớ tạm!" : "Script copied to clipboard!", "info");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10 font-sans text-slate-200">
      
      {/* Toast Overlay */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`fixed top-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-lg shadow-2xl border backdrop-blur-md text-xs font-semibold ${
              toast.type === "success" 
                ? "bg-[#091f24]/90 border-[#34b1b3] text-[#34b1b3]" 
                : "bg-[#181124]/90 border-purple-500 text-purple-300"
            }`}
          >
            <div className="flex-1 font-sans">{toast.message}</div>
            <button 
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-white ml-2 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Col 1 & 2: Editor and Stats */}
      <div className="lg:col-span-2 space-y-4">
        {/* Statistics Header */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-xl flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider font-mono">
                {lang === "vi" ? "Độ dài từ" : "Word Count"}
              </span>
              <span className="text-sm font-bold text-white font-mono">{wordCount}</span>
            </div>
            <div className="border-l border-white/10 pl-4 font-mono">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                {lang === "vi" ? "Ký tự" : "Characters"}
              </span>
              <span className="text-sm font-bold text-white pr-1">{charCount}</span>
            </div>
            <div className="border-l border-white/10 pl-4 font-mono">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                {lang === "vi" ? "Thời lượng ước tính" : "Est. Duration"}
              </span>
              <span className="text-sm font-extrabold text-[#34b1b3]">
                {durationSec} {lang === "vi" ? "giây (s)" : "seconds (s)"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            {savingStatus === "saving" && (
              <span className="text-amber-400 animate-pulse font-medium">
                ⏳ {lang === "vi" ? "Đang lưu..." : "Saving..."}
              </span>
            )}
            {savingStatus === "saved" && (
              <span className="text-[#34b1b3] font-semibold">
                ✓ {lang === "vi" ? "Đã sao lưu" : "AutoSaved"}
              </span>
            )}
            {savingStatus === "idle" && (
              <span className="text-slate-400">{lang === "vi" ? "Tự động sao lưu" : "AutoSaved idle"}</span>
            )}
          </div>
        </div>

        {/* Script Editor Canvas */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl shadow-xl overflow-hidden flex flex-col h-[520px]">
          {/* Editor Header Toolset */}
          <div className="bg-white/[0.04] px-4 py-2.5 border-b border-white/10 flex items-center justify-between gap-4">
            <input
              type="text"
              value={editorTitle}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder={lang === "vi" ? "Nhập tiêu đề kịch bản..." : "Enter script title..."}
              className="bg-transparent font-bold text-white text-sm focus:outline-none border-b border-dotted border-white/20 w-1/2 focus:border-[#34b1b3] transition-colors"
            />

            {/* Editing buttons panel */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Undo / Redo */}
              <button
                type="button"
                onClick={handleUndo}
                disabled={undoStack.length === 0}
                title={lang === "vi" ? "Hoàn tác (Undo)" : "Undo"}
                className="p-1.5 hover:bg-white/10 disabled:opacity-30 rounded-lg text-slate-300 hover:text-white transition-all cursor-pointer"
              >
                <Undo2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleRedo}
                disabled={redoStack.length === 0}
                title={lang === "vi" ? "Làm lại (Redo)" : "Redo"}
                className="p-1.5 hover:bg-white/10 disabled:opacity-30 rounded-lg text-slate-300 hover:text-white transition-all cursor-pointer"
              >
                <Redo2 className="w-4 h-4" />
              </button>

              <div className="w-px h-4 bg-white/10 mx-1" />

              {/* Copy */}
              <button
                type="button"
                onClick={handleCopy}
                className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-all flex items-center gap-1 text-xs font-semibold cursor-pointer"
                title={lang === "vi" ? "Sao chép" : "Copy to clipboard"}
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span className="hidden sm:inline">{copied ? (lang === "vi" ? "Đã chép" : "Copied") : (lang === "vi" ? "Sao chép" : "Copy")}</span>
              </button>

              {/* Manual Save Button */}
              <button
                type="button"
                onClick={handleManualSave}
                disabled={isLoading}
                title={lang === "vi" ? "Lưu kịch bản" : "Save Script"}
                className="p-1.5 px-3 bg-[#34b1b3] hover:bg-[#34b1b3]/85 text-white shadow-md shadow-[#34b1b3]/20 rounded-lg transition-all flex items-center gap-1 text-xs font-bold cursor-pointer shrink-0"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{lang === "vi" ? "Lưu" : "Save"}</span>
              </button>

              {/* Regenerate Script through task pool */}
              <button
                type="button"
                onClick={onRegenerateScript}
                disabled={isLoading}
                title={lang === "vi" ? "Tạo lại kịch bản quảng cáo" : "Regenerate complete creative draft"}
                className="p-1.5 px-3 bg-[#34b1b3]/15 hover:bg-[#34b1b3]/25 border border-[#34b1b3]/20 rounded-lg text-[#34b1b3] hover:border-[#34b1b3] transition-all flex items-center gap-1 text-xs font-bold cursor-pointer shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{lang === "vi" ? "Tạo lại" : "Regen"}</span>
              </button>
            </div>
          </div>

          {/* Text Editor Core */}
          {!project.scriptContent && !editorContent ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400 bg-black/10">
              <FileText className="w-12 h-12 text-[#34b1b3] mb-4 opacity-50 animate-pulse" />
              <h5 className="font-bold text-white font-display mb-1">{lang === "vi" ? "Kịch bản chưa được khởi tạo" : "No script initialized yet"}</h5>
              <p className="text-xs max-w-sm mt-1 mb-5">{lang === "vi" ? "Hãy nhấp bên dưới để chạy AI xử lý và dệt nên kịch bản quảng cáo vàng đầu tiên." : "Start custom AI scripting to construct a high converting master outline."}</p>
              <button
                onClick={onRegenerateScript}
                disabled={isLoading}
                className="bg-[#34b1b3] hover:bg-[#2db3b5] text-white font-bold text-xs rounded-lg px-5 py-2.5 transition-all shadow-lg shadow-[#34b1b3]/25 cursor-pointer"
              >
                🚀 {lang === "vi" ? "Nhận Kịch Bản AI Ngay" : "Generate AI Script Outline"}
              </button>
            </div>
          ) : (
            <textarea
              value={editorContent}
              onChange={(e) => handleContentChange(e.target.value)}
              className="flex-1 p-5 text-sm text-slate-100 focus:outline-none border-none font-mono leading-relaxed bg-black/25 overflow-y-auto resize-none"
              placeholder="[...] Viết kịch bản tại đây..."
            />
          )}

          {/* Footer Action to trigger Scenes breakdown */}
          <div className="px-5 py-3.5 bg-white/[0.03] border-t border-white/10 flex justify-between items-center">
            <span className="text-[11px] text-slate-400 font-semibold font-mono">
              💡 {lang === "vi" ? "Đã lưu bản thảo tự động. Sẵn sàng bóc tách hoạt cảnh." : "Auto saved. Ready to extract scene templates."}
            </span>
            <button
              onClick={onTriggerBreakdown}
              disabled={isLoading || (!project.scriptContent && !editorContent)}
              className="flex items-center gap-1.5 cursor-pointer bg-[#34b1b3] text-white font-bold text-xs hover:bg-[#2db3b5] transition-all rounded-lg px-5 py-2.5 disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-[#34b1b3]/25 font-sans"
            >
              <span>{lang === "vi" ? "BÓC TÁCH PHÂN CẢNH & TÀI NGUYÊN" : "GENERATE SCENES & ASSETS"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Col 3: Side Panel and Metadata Analytics / Version control / Logs */}
      <div className="space-y-4">
        {/* Premium Brand Target Audience Analysis Dashboard */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-xl space-y-3">
          <span className="text-xs font-bold text-[#34b1b3] uppercase tracking-wide flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 animate-spin-slow" />
            {lang === "vi" ? "Bản phân tích khán giả mục tiêu" : "AI Brand Angle Analysis"}
          </span>
          <div className="text-[11px] space-y-3.5 leading-relaxed text-slate-300 block">
            <div>
              <strong className="text-white">🎯 {lang === "vi" ? "Khách hàng mục tiêu" : "Target Audience"}:</strong>
              <p className="pl-3 mt-0.5 text-slate-400">{lang === "vi" ? "Tiêu dùng sành điệu, có mức thu nhập ổn định, chú trọng trải nghiệm và mong muốn kết quả sắc đẹp/ tiện ích vượt mong đợi." : "Smart premium consumers focused on visible results, beauty, skin hygiene and ease of mind."}</p>
            </div>
            <div>
              <strong className="text-red-400 font-semibold">⚡ {lang === "vi" ? "Điểm nhức nhối (Pain Point)" : "Pain Points"}:</strong>
              <p className="pl-3 mt-0.5 text-slate-405">{lang === "vi" ? "Dùng nhiều giải pháp lãng phí nhưng không hiệu quả, thiếu sự tư vấn chuyên khoa và sợ lừa dối." : "Spent too much on useless products, worry about chemical damages, recurring breakouts or poor ROI."}</p>
            </div>
            <div>
              <strong className="text-emerald-400 font-semibold">🌟 {lang === "vi" ? "Góc bán hàng chủ đạo (Sales Angle)" : "Core Selling Point"}:</strong>
              <p className="pl-3 mt-0.5 text-slate-405">{project.productInfo ? project.productInfo.substring(0, 150) + "..." : "Authentic organic skin repairs combined with doctor verification certificates."}</p>
            </div>
          </div>
        </div>

        {/* Version Audit Logs sidebar toggle */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl shadow-xl overflow-hidden">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full px-4 py-3 bg-white/[0.03] flex justify-between items-center border-b border-white/10 hover:bg-white/[0.06] transition-all cursor-pointer text-white"
          >
            <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <History className="w-4 h-4 text-purple-400" />
              {lang === "vi" ? "Lịch sử kịch bản" : "Version History"} ({localVersions?.length || 0})
            </span>
            <span className="text-xs text-[#34b1b3] font-bold">
              {showHistory ? (lang === "vi" ? "Thu gọn" : "Collapse") : (lang === "vi" ? "Mở rộng" : "Expand")}
            </span>
          </button>

          {(showHistory || localVersions?.length > 0) && (
            <div className="p-3 max-h-56 overflow-y-auto space-y-2 bg-black/10 scrollbar-thin">
              {localVersions?.map((ver) => (
                <div 
                  key={ver.id} 
                  className={`flex flex-col text-xs bg-black/20 border rounded-lg p-2.5 transition-colors ${
                    editorContent === ver.content 
                      ? "border-[#34b1b3] bg-[#34b1b3]/10" 
                      : "border-white/5 hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5 mb-1">
                    <span className="font-extrabold text-white text-[11px] block font-mono">
                      {ver.wordCount} {lang === "vi" ? "từ" : "words"}
                    </span>
                    <button
                      onClick={() => handleRestoreLocalVersion(ver)}
                      className="text-[10px] font-bold text-[#34b1b3] hover:text-[#34b1b3]/80 cursor-pointer transition-colors"
                    >
                      {lang === "vi" ? "Khôi phục" : "Restore"}
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(ver.timestamp).toLocaleString("vi-VN")}
                  </span>
                  <p className="text-[10px] text-slate-400 font-mono mt-1 line-clamp-2 leading-relaxed">
                    {ver.content}
                  </p>
                </div>
              ))}
              {(!localVersions || localVersions.length === 0) && (
                <div className="text-center text-xs text-slate-500 py-4">
                  {lang === "vi" ? "Chưa lưu phiên bản mẫu nào." : "No saved versions list yet."}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Generation Logs realtime console display */}
        <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl p-4 overflow-hidden flex flex-col h-72">
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/10">
            <Terminal className="text-green-400 w-4 h-4 animate-pulse" />
            <span className="text-[11px] font-bold text-green-400 uppercase tracking-wider font-mono">
              {lang === "vi" ? "Bảng Theo Dõi Gemini Logs" : "Gemini Generation Pool Logs"}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 font-mono text-[10px] text-slate-300 leading-relaxed scrollbar-thin">
            {logs.map((log, index) => (
              <div key={index} className="flex gap-1.5 items-start">
                <span className="text-slate-500 shrink-0">[{log.timestamp}]</span>
                <span className={`
                  ${log.level === "error" ? "text-red-400 font-bold" : ""}
                  ${log.level === "warn" ? "text-yellow-400" : ""}
                  ${log.level === "success" ? "text-green-400 font-semibold" : ""}
                  ${log.level === "info" ? "text-cyan-300" : ""}
                `}>
                  {log.message}
                </span>
              </div>
            ))}
            {logs.length === 0 && (
              <div className="text-slate-500 text-center py-12 font-sans">
                {lang === "vi" ? "Hộp logs trống rỗng. Hãy kích thích AI tạo kịch bản." : "Console idle. Trigger an AI generation task."}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
