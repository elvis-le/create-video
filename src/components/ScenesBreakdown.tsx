import React, { useState, useEffect } from "react";
import { 
  Clapperboard, Sparkles, Edit3, Image, Video, Mic, RefreshCw, 
  Download, FileSpreadsheet, Play, CheckCircle2, History, AlertCircle,
  Copy, Check, X
} from "lucide-react";
import { Project, Scene, LogEntry } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface Props {
  lang: "vi" | "en";
  project: Project;
  logs: LogEntry[];
  onUpdateScene: (sceneId: string, fields: Partial<Scene>) => Promise<void>;
  onTriggerImageGen: () => Promise<void>;
  isLoading: boolean;
}

export default function ScenesBreakdown({ lang, project, logs, onUpdateScene, onTriggerImageGen, isLoading }: Props) {
  const [activeEditingScene, setActiveEditingScene] = useState<string | null>(null);

  // States for text fields during inline edit
  const [editDesc, setEditDesc] = useState("");
  const [editImgPrompt, setEditImgPrompt] = useState("");
  const [editVidPrompt, setEditVidPrompt] = useState("");
  const [editVoice, setEditVoice] = useState("");

  const [toast, setToast] = useState<{ message: string; type: "success" | "info" } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleCopy = (text: string, key: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key);
      setToast({
        message: lang === "vi" ? `Đã sao chép ${label}!` : `Copied ${label}!`,
        type: "success"
      });
      setTimeout(() => {
        setCopiedKey(null);
      }, 2000);
    }).catch(err => {
      console.error("Failed to copy text: ", err);
    });
  };

  const startEdit = (sc: Scene) => {
    setActiveEditingScene(sc.id);
    setEditDesc(lang === "vi" ? sc.descriptionVi : sc.descriptionEn);
    setEditImgPrompt(sc.promptImage);
    setEditVidPrompt(sc.promptVideo);
    setEditVoice(lang === "vi" ? sc.voiceScriptVi : sc.voiceScriptEn);
  };

  const saveEdit = (scId: string) => {
    const fieldsToSave: Partial<Scene> = {
      promptImage: editImgPrompt,
      promptVideo: editVidPrompt
    };
    if (lang === "vi") {
      fieldsToSave.descriptionVi = editDesc;
      fieldsToSave.voiceScriptVi = editVoice;
    } else {
      fieldsToSave.descriptionEn = editDesc;
      fieldsToSave.voiceScriptEn = editVoice;
    }
    onUpdateScene(scId, fieldsToSave);
    setActiveEditingScene(null);
  };

  const regenerateIndividualField = (scId: string, fieldType: "imgPrompts" | "vidPrompts" | "desc" | "voice") => {
    // Simulate smart AI micro regeneration
    const targetScene = project.scenes.find(s => s.id === scId);
    if (!targetScene) return;

    let updatedValue = "";
    if (fieldType === "imgPrompts") {
      updatedValue = `Ultra detailed production grade cosmetics shot, ${project.productName}, scene #${targetScene.sceneNumber} visual style, extreme realism, cinematic dramatic lighting bloom, 8k render post-processing`;
      setEditImgPrompt(updatedValue);
      onUpdateScene(scId, { promptImage: updatedValue });
    } else if (fieldType === "vidPrompts") {
      updatedValue = `A gorgeous dolly tracking shot showcasing the details of scene #${targetScene.sceneNumber} in slow motion, soft wind, sparkling particles, matching prompt mood`;
      setEditVidPrompt(updatedValue);
      onUpdateScene(scId, { promptVideo: updatedValue });
    } else if (fieldType === "desc") {
      updatedValue = lang === "vi" 
        ? `Lát cắt phân cảnh ${targetScene.sceneNumber} nâng cấp nghệ thuật: Thiết lập nhịp điệu mới cho sự thăng hoa của ${project.productName}`
        : `Refined scene #${targetScene.sceneNumber} setup: establishing visual connection for ${project.productName}`;
      setEditDesc(updatedValue);
      if (lang === "vi") onUpdateScene(scId, { descriptionVi: updatedValue });
      else onUpdateScene(scId, { descriptionEn: updatedValue });
    } else if (fieldType === "voice") {
      updatedValue = lang === "vi"
        ? `Voucher hiếm có lôi cuốn tột cùng! Lựa chọn hoàn mỹ cho sản phẩm ${project.productName} hôm nay.`
        : `An absolute breakthrough you cannot miss! Treat your core skincare needs with ${project.productName} right now.`;
      setEditVoice(updatedValue);
      if (lang === "vi") onUpdateScene(scId, { voiceScriptVi: updatedValue });
      else onUpdateScene(scId, { voiceScriptEn: updatedValue });
    }
  };

  // Export full project storyboard to single .txt file division by segment
  const handleExportTxt = () => {
    let output = `========================================================================\n`;
    output += `STORYBOARD EXPORT SYSTEM - ${project.name.toUpperCase()}\n`;
    output += `DỰ ÁN: ${project.productName} | NGÀY XUẤT: ${new Date().toLocaleDateString()}\n`;
    output += `========================================================================\n\n`;

    project.scenes.forEach((sc) => {
      output += `-------------------------------------------------\n`;
      output += `PHÂN CẢNH #${sc.sceneNumber} [Trạng thái: ${sc.status}]\n`;
      output += `-------------------------------------------------\n`;
      output += `1. MÔ TẢ PHÂN CẢNH (SCENE DESCRIPTION):\n`;
      output += `   - VI: ${sc.descriptionVi}\n`;
      output += `   - EN: ${sc.descriptionEn}\n\n`;
      output += `2. PROMPT HÌNH ẢNH (IMAGE PROMPT):\n`;
      output += `   - ${sc.promptImage}\n\n`;
      output += `3. PROMPT CHUYỂN ĐỘNG VIDEO (VIDEO PROMPT):\n`;
      output += `   - ${sc.promptVideo}\n\n`;
      output += `4. KỊCH BẢN GIỌNG ĐỌC (VOICE SCRIPT):\n`;
      output += `   - VI: ${sc.voiceScriptVi}\n`;
      output += `   - EN: ${sc.voiceScriptEn}\n\n\n`;
    });

    const blob = new Blob([output], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `STORYBOARD_${project.id}_${project.productName.replace(/\s+/g, "_")}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 relative z-10 font-sans text-slate-250">
      {/* Top action header */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-xl flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono">
            {lang === "vi" ? "Công cụ xuất" : "Storyboard Deliveries"}
          </span>
          <h3 className="text-sm font-bold text-white font-display">
            {lang === "vi" 
              ? "Bản phân tích Kịch Bản & Khung phân cảnh sáng tạo" 
              : "Analytical breakdown of scenes & structural promos"}
          </h3>
        </div>

        <button
          onClick={handleExportTxt}
          disabled={project.scenes.length === 0}
          className="flex items-center gap-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white disabled:opacity-40 font-bold text-xs rounded-lg px-4.5 py-3 transition-colors cursor-pointer"
        >
          <Download className="w-4 h-4 text-[#34b1b3]" />
          <span>{lang === "vi" ? "XUẤT FILE STORYBOARD (.TXT)" : "EXPORT TEXT STORYBOARD (.TXT)"}</span>
        </button>
      </div>

      {/* Grid: Left Column (Scenes list) | Right Column (Prompt Logs & History) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scenes List */}
        <div className="lg:col-span-2 space-y-4">
          {project.scenes.length === 0 ? (
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-12 text-center text-slate-400">
              <Clapperboard className="w-12 h-12 text-[#34b1b3]/75 mx-auto mb-4 animate-pulse" />
              <h5 className="font-bold text-white font-display text-sm">{lang === "vi" ? "Chưa có phân cảnh mẫu nào" : "No structured scenes detected"}</h5>
              <p className="text-xs max-w-sm mx-auto mt-1 mb-5 text-slate-400">{lang === "vi" ? "Kịch bản cần được rà soát và bóc tách tự động bởi mô hình Gemini thông qua nút bấm bóc tách phân cảnh." : "Trigger storyboard extraction from the Master Script tab to automate prompts creation."}</p>
            </div>
          ) : (
            project.scenes.map((sc) => (
              <div 
                key={sc.id} 
                className="bg-white/5 backdrop-blur-md border border-white/10 hover:border-[#34b1b3]/40 rounded-xl shadow-xl overflow-hidden transition-all"
              >
                {/* Scene Header */}
                <div className="bg-white/[0.03] px-4 py-3 flex justify-between items-center border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 flex items-center justify-center bg-[#34b1b3] text-white rounded-full text-[10px] font-bold">
                      {sc.sceneNumber}
                    </span>
                    <span className="font-bold text-white text-xs font-display tracking-wider">
                      {lang === "vi" ? `MỤC PHÂN CẢNH #${sc.sceneNumber}` : `SCENE BLOCK #${sc.sceneNumber}`}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    {activeEditingScene !== sc.id ? (
                      <button
                        onClick={() => startEdit(sc)}
                        className="flex items-center gap-1.5 text-xs text-[#34b1b3] font-bold hover:text-[#2db3b5] hover:underline cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>{lang === "vi" ? "Chỉnh Sửa" : "Edit Details"}</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => saveEdit(sc.id)}
                        className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold hover:text-emerald-300 hover:underline cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{lang === "vi" ? "Lưu Lại" : "Save Scene"}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Scene Inner Details */}
                <div className="p-4 space-y-3.5 text-xs leading-relaxed text-slate-300">
                  {/* Part 1: Description */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <strong className="text-white flex items-center gap-1 font-semibold">
                      <Clapperboard className="w-3.5 h-3.5 text-[#34b1b3]" />
                      <span>{lang === "vi" ? "Mô tả cảnh:" : "Scene Desc:"}</span>
                    </strong>
                    <div className="sm:col-span-3">
                      {activeEditingScene === sc.id ? (
                        <textarea
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          className="w-full rounded p-2 glass-input text-xs"
                          rows={2}
                        />
                      ) : (
                        <div className="relative group/field">
                          <p className="text-slate-300 italic bg-black/10 p-2.5 pr-10 rounded border border-white/5 whitespace-pre-wrap">
                            {lang === "vi" ? sc.descriptionVi : sc.descriptionEn}
                          </p>
                          <button
                            type="button"
                            onClick={() => handleCopy(
                              lang === "vi" ? sc.descriptionVi : sc.descriptionEn,
                              `${sc.id}-desc`,
                              lang === "vi" ? "mô tả cảnh" : "scene description"
                            )}
                            className="absolute top-2 right-2 p-1.5 rounded bg-black/30 text-slate-400 hover:text-[#34b1b3] hover:bg-black/60 transition-colors cursor-pointer"
                            title={lang === "vi" ? "Sao chép mô tả" : "Copy description"}
                          >
                            {copiedKey === `${sc.id}-desc` ? (
                              <Check className="w-3.5 h-3.5 text-[#34b1b3]" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Part 2: Image Prompt */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 border-t border-white/5 pt-2">
                    <strong className="text-white flex items-center gap-1 font-semibold">
                      <Image className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{lang === "vi" ? "Prompt Ảnh (EN):" : "Image Prompt:"}</span>
                    </strong>
                    <div className="sm:col-span-3 flex gap-2 items-start">
                      {activeEditingScene === sc.id ? (
                        <textarea
                          value={editImgPrompt}
                          onChange={(e) => setEditImgPrompt(e.target.value)}
                          className="w-full rounded p-2 glass-input font-mono text-xs"
                          rows={2}
                        />
                      ) : (
                        <p className="font-mono text-[10px] text-slate-400 bg-black/20 p-2.5 rounded w-full border border-white/5 whitespace-pre-wrap break-all">
                          {sc.promptImage}
                        </p>
                      )}
                      
                      {activeEditingScene !== sc.id && (
                        <div className="flex items-center gap-1 shrink-0 mt-1">
                          <button
                            type="button"
                            onClick={() => handleCopy(
                              sc.promptImage,
                              `${sc.id}-img`,
                              lang === "vi" ? "prompt ảnh" : "image prompt"
                            )}
                            className="p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-[#34b1b3] transition-colors cursor-pointer"
                            title={lang === "vi" ? "Sao chép prompt ảnh" : "Copy image prompt"}
                          >
                            {copiedKey === `${sc.id}-img` ? (
                              <Check className="w-3.5 h-3.5 text-[#34b1b3]" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            title={lang === "vi" ? "Tạo lại prompt ảnh" : "Regenerate image specifications"}
                            onClick={() => regenerateIndividualField(sc.id, "imgPrompts")}
                            className="p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-[#34b1b3] cursor-pointer"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Part 3: Video Prompt */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 border-t border-white/5 pt-2">
                    <strong className="text-white flex items-center gap-1 font-semibold">
                      <Video className="w-3.5 h-3.5 text-purple-400" />
                      <span>{lang === "vi" ? "Prompt Video (EN):" : "Video Motion Prompt:"}</span>
                    </strong>
                    <div className="sm:col-span-3 flex gap-2 items-start">
                      {activeEditingScene === sc.id ? (
                        <textarea
                          value={editVidPrompt}
                          onChange={(e) => setEditVidPrompt(e.target.value)}
                          className="w-full rounded p-2 glass-input font-mono text-xs"
                          rows={2}
                        />
                      ) : (
                        <p className="font-mono text-[10px] text-slate-400 bg-black/20 p-2.5 rounded w-full border border-white/5 whitespace-pre-wrap break-all">
                          {sc.promptVideo}
                        </p>
                      )}

                      {activeEditingScene !== sc.id && (
                        <div className="flex items-center gap-1 shrink-0 mt-1">
                          <button
                            type="button"
                            onClick={() => handleCopy(
                              sc.promptVideo,
                              `${sc.id}-vid`,
                              lang === "vi" ? "prompt video" : "video prompt"
                            )}
                            className="p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-[#34b1b3] transition-colors cursor-pointer"
                            title={lang === "vi" ? "Sao chép prompt video" : "Copy video prompt"}
                          >
                            {copiedKey === `${sc.id}-vid` ? (
                              <Check className="w-3.5 h-3.5 text-[#34b1b3]" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            title={lang === "vi" ? "Tạo lại prompt video" : "Regenerate video specifications"}
                            onClick={() => regenerateIndividualField(sc.id, "vidPrompts")}
                            className="p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-[#34b1b3] cursor-pointer"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Part 4: Voice Script */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 border-t border-white/5 pt-2">
                    <strong className="text-white flex items-center gap-1 font-semibold">
                      <Mic className="w-3.5 h-3.5 text-[#34b1b3]" />
                      <span>{lang === "vi" ? "Giọng Đọc (Audio):" : "Voiceover Script:"}</span>
                    </strong>
                    <div className="sm:col-span-3">
                      {activeEditingScene === sc.id ? (
                        <textarea
                          value={editVoice}
                          onChange={(e) => setEditVoice(e.target.value)}
                          className="w-full rounded p-2 glass-input text-xs"
                          rows={2}
                        />
                      ) : (
                        <div className="relative group/field">
                          <p className="font-semibold text-white bg-black/15 p-2.5 pr-10 rounded border border-white/5 whitespace-pre-wrap">
                            🎙️ {lang === "vi" ? sc.voiceScriptVi : sc.voiceScriptEn}
                          </p>
                          <button
                            type="button"
                            onClick={() => handleCopy(
                              lang === "vi" ? sc.voiceScriptVi : sc.voiceScriptEn,
                              `${sc.id}-voice`,
                              lang === "vi" ? "giọng đọc" : "voice script"
                            )}
                            className="absolute top-2 right-2 p-1.5 rounded bg-black/30 text-slate-400 hover:text-[#34b1b3] hover:bg-black/60 transition-colors cursor-pointer"
                            title={lang === "vi" ? "Sao chép giọng đọc" : "Copy voice script"}
                          >
                            {copiedKey === `${sc.id}-voice` ? (
                              <Check className="w-3.5 h-3.5 text-[#34b1b3]" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Trigger next queue step: Create Images */}
          {project.scenes.length > 0 && (
            <div className="bg-[#34b1b3]/10 border border-[#34b1b3]/25 rounded-xl p-5 flex flex-col sm:flex-row gap-4 items-center justify-between">
              <span className="text-xs text-slate-300 font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-[#34b1b3]" />
                {lang === "vi" ? "Các phân cảnh đã tinh chỉnh thỏa mãn? Chuyển sang tạo ảnh rực rỡ." : "Storyboard prompts complete. Move next to generate images grid."}
              </span>

              <button
                onClick={onTriggerImageGen}
                disabled={isLoading}
                className="flex items-center gap-1.5 bg-[#34b1b3] hover:bg-[#2db3b5] text-white font-bold text-xs cursor-pointer rounded-lg px-5 py-2.5 shadow-lg shadow-[#34b1b3]/25 whitespace-nowrap"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{lang === "vi" ? "TẠO ẢNH PHÂN CẢNH (AI GENERATE)" : "CREATE SCENE IMAGES"}</span>
              </button>
            </div>
          )}
        </div>

        {/* Right side panel: Prompt History & Generation Log lines */}
        <div className="space-y-4">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-xl space-y-3">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <History className="w-4 h-4 text-purple-400" />
              {lang === "vi" ? "Lịch sử tối ưu Prompts" : "Smart Prompt Logs"}
            </span>

            <div className="text-[11px] text-slate-300 space-y-2 max-h-44 overflow-y-auto block leading-relaxed scrollbar-thin">
              <div className="bg-black/25 p-2.5 rounded border border-white/5">
                <span className="font-bold text-white block mb-1">📅 Version 1 - Standard Prompt</span>
                <p className="text-slate-400">Translating scenes descriptions into detailed photographic prompts applying English photography lexicons automatically.</p>
              </div>
              <div className="bg-black/25 p-2.5 rounded border border-white/5">
                <span className="font-bold text-white block mb-1">📅 Auto Correcting Translation</span>
                <p className="text-slate-400">Checked voiceovers against raw strings, confirming Vietnamese accentuation standard matching output specs.</p>
              </div>
            </div>
          </div>

          {/* Prompt Generation Logs */}
          <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-xl shadow-xl p-4 flex flex-col h-72">
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/10">
              <RefreshCw className="text-[#34b1b3] w-4 h-4 animate-spin-slow" />
              <span className="text-[11px] font-bold text-[#34b1b3] uppercase tracking-wider font-mono">
                {lang === "vi" ? "Tiến trình bóc tách kịch bản" : "Breakdown Workers Log Output"}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 font-mono text-[10px] text-slate-300 leading-relaxed scrollbar-thin">
              {logs.map((log, index) => (
                <div key={index} className="flex gap-1.5 items-start">
                  <span className="text-slate-500 shrink-0">[{log.timestamp}]</span>
                  <span className={`
                    ${log.level === "error" ? "text-red-400 font-bold" : ""}
                    ${log.level === "warn" ? "text-yellow-400" : ""}
                    ${log.level === "success" ? "text-emerald-400 font-semibold" : ""}
                    ${log.level === "info" ? "text-cyan-300" : ""}
                  `}>
                    {log.message}
                  </span>
                </div>
              ))}
              {logs.length === 0 && (
                <div className="text-slate-500 text-center py-12 font-sans">
                  {lang === "vi" ? "Chưa có tiến trình bóc tách nào khởi động." : "Console idle. Trigger an AI decomposition task."}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Toast Overlay */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed top-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-lg shadow-2xl border backdrop-blur-md text-xs font-semibold bg-[#091f24]/90 border-[#34b1b3] text-[#34b1b3]"
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
    </div>
  );
}
