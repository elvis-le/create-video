import React, { useState } from "react";
import { 
  Image, Video, Sparkles, Download, RefreshCw, Layers, Check, 
  Play, Pause, HardDrive, Cpu, AlertTriangle, Eye 
} from "lucide-react";
import { Project, Scene, LogEntry } from "../types";

interface Props {
  lang: "vi" | "en";
  project: Project;
  logs: LogEntry[];
  onTriggerImageGen: () => Promise<void>;
  onTriggerVideoGen: () => Promise<void>;
  onUpdateSceneMedia: (sceneId: string, type: "image" | "video", url: string) => Promise<void>;
  isLoading: boolean;
}

export default function ImageVideoGenerator({ 
  lang, project, logs, onTriggerImageGen, onTriggerVideoGen, onUpdateSceneMedia, isLoading 
}: Props) {
  const [activeTab, setActiveTab] = useState<"image" | "video">("image");
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);

  const triggerSingleSceneRegen = (scId: string, type: "image" | "video") => {
    // Simulated regeneration with premium Unsplash and Mixkit links
    const cosmeticImages = [
      "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=600&auto=format&fit=crop&q=60",
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=60",
      "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&auto=format&fit=crop&q=60",
      "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600&auto=format&fit=crop&q=60",
      "https://images.unsplash.com/photo-1590156221122-c241e047ca3a?w=600&auto=format&fit=crop&q=60"
    ];

    const realEstateImages = [
      "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&auto=format&fit=crop&q=60",
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&auto=format&fit=crop&q=60",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&auto=format&fit=crop&q=60"
    ];

    const currentCollection = project.productCategory.toLowerCase().includes("estate") ? realEstateImages : cosmeticImages;
    const randomUrl = currentCollection[Math.floor(Math.random() * currentCollection.length)];

    onUpdateSceneMedia(scId, type, randomUrl);
  };

  const downloadSceneAsset = (url: string, prefix: string) => {
    // Let the asset be fetched/downloaded in browser
    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.download = `${prefix}_${project.id}.mp4`;
    link.click();
  };

  return (
    <div className="space-y-6 relative z-10 font-sans text-slate-200">
      {/* Tab toggle */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 p-2 rounded-xl shadow-xl flex max-w-md mx-auto">
        <button
          onClick={() => setActiveTab("image")}
          className={`flex-1 py-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${activeTab === "image" ? "bg-[#34b1b3] text-white shadow-lg shadow-[#34b1b3]/25" : "text-slate-400 hover:text-white"}`}
        >
          <Image className="w-4 h-4 text-[#34b1b3]" />
          <span>{lang === "vi" ? "1. TẠO ẢNH PHÂN CẢNH" : "1. SCENE IMAGE CANVAS"}</span>
        </button>
        <button
          onClick={() => setActiveTab("video")}
          className={`flex-1 py-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${activeTab === "video" ? "bg-[#34b1b3] text-white shadow-lg shadow-[#34b1b3]/25" : "text-slate-400 hover:text-white"}`}
        >
          <Video className="w-4 h-4 text-purple-400" />
          <span>{lang === "vi" ? "2. TẠO HOẠT ẢNH VIDEO" : "2. SCENE VIDEO RENDERER"}</span>
        </button>
      </div>

      {/* Main Grid: Grid of assets (left) | Flow queue monitor (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Core content block */}
        <div className="lg:col-span-2 space-y-4">
          {project.scenes.length === 0 ? (
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-12 text-center text-slate-400 shadow-xl">
              <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4 animate-bounce" />
              <h5 className="font-bold text-white font-display text-sm">{lang === "vi" ? "Dự án chưa bóc tách phân cảnh" : "Storyboard required"}</h5>
              <p className="text-xs max-w-sm mx-auto mt-1 text-slate-400">{lang === "vi" ? "Hãy chuyển qua bước bóc tách kịch bản lớn thành các lát cắt phân cảnh trước." : "Kindly split the script into separate scenes from the Storyboard tab first."}</p>
            </div>
          ) : activeTab === "image" ? (
            /* ==========================================
               Tab Content: IMAGE GENERATOR
               ========================================== */
            <div className="space-y-6">
              {/* Image Grid library */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {project.scenes.map((sc) => (
                  <div key={sc.id} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl shadow-xl overflow-hidden flex flex-col h-72">
                    {/* Scene banner preview info */}
                    <div className="bg-white/[0.03] px-3 py-2 flex justify-between items-center border-b border-white/10">
                      <span className="text-[10px] font-bold text-white font-mono">
                        🎬 {lang === "vi" ? `Phân Cảnh ${sc.sceneNumber}` : `Scene ${sc.sceneNumber}`}
                      </span>
                      {sc.imageUrl && (
                        <span className="text-[10px] text-green-400 font-bold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          <span>Ready</span>
                        </span>
                      )}
                    </div>

                    {/* Canvas picture holder */}
                    <div className="flex-1 bg-black/20 relative flex items-center justify-center overflow-hidden group">
                      {sc.imageUrl ? (
                        <>
                          <img src={sc.imageUrl} alt="scene-ai-canvas" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2">
                             <button
                              onClick={() => triggerSingleSceneRegen(sc.id, "image")}
                              className="p-2.5 bg-white/20 hover:bg-[#34b1b3] text-white hover:scale-110 rounded-full transition-all cursor-pointer"
                              title={lang === "vi" ? "Tự động Vẽ lại" : "Regenerate Image"}
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => downloadSceneAsset(sc.imageUrl!, "img")}
                              className="p-2.5 bg-white/20 hover:bg-[#34b1b3] text-white hover:scale-110 rounded-full transition-all cursor-pointer"
                              title={lang === "vi" ? "Tải xuống máy" : "Download raw file"}
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="text-center p-4">
                          <Image className="w-8 h-8 text-slate-400 mx-auto mb-2 animate-pulse" />
                          <span className="text-[10px] text-slate-400 block max-w-[200px] font-mono leading-tight">
                            {sc.promptImage.substring(0, 70)}...
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Footer individual trigger */}
                    <div className="p-3 bg-white/[0.02] border-t border-white/10 flex justify-between items-center">
                      <span className="text-[10px] text-slate-400 max-w-[150px] truncate leading-tight block">
                        <strong>Prompt:</strong> {sc.promptImage}
                      </span>
                      <button
                        onClick={() => triggerSingleSceneRegen(sc.id, "image")}
                        className="text-[10px] font-bold text-[#34b1b3] border border-[#34b1b3]/30 hover:bg-[#34b1b3]/15 px-2.5 py-1.5 rounded transition-all cursor-pointer"
                      >
                        {sc.imageUrl ? (lang === "vi" ? "Vẽ lại" : "Regen") : (lang === "vi" ? "Tạo ảnh" : "Generate")}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Multi render bottom action */}
              <div className="bg-[#34b1b3]/10 border border-[#34b1b3]/25 p-5 rounded-xl flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">
                    🌟 {lang === "vi" ? "Duyệt ảnh mồi đã xong?" : "Images generated successfully?"}
                  </span>
                  <span className="text-[11px] text-slate-300 block mt-0.5">
                    {lang === "vi" 
                      ? "Tiến hành hoạt hóa hoạt cảnh video mượt mà, chuyển đổi tỉ lệ chuẩn nét." 
                      : "Start animating layout motion segments to build the final high quality video clips."}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={onTriggerImageGen}
                    disabled={isLoading}
                    className="flex items-center gap-1.5 border border-[#34b1b3]/30 bg-white/5 hover:bg-white/15 text-white font-bold text-xs cursor-pointer rounded-lg px-4 py-2.5 transition-all"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>{lang === "vi" ? "Tạo lại tất cả ảnh" : "Regenerate All"}</span>
                  </button>

                  <button
                    onClick={() => {
                      onTriggerVideoGen();
                      setActiveTab("video");
                    }}
                    disabled={isLoading}
                    className="flex items-center gap-1.5 bg-[#34b1b3] text-white hover:bg-[#2c989a] font-bold text-xs cursor-pointer rounded-lg px-5 py-2.5 shadow-lg shadow-[#34b1b3]/20 transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{lang === "vi" ? "CHUYỂN TIẾP TẠO VIDEO" : "GO RENDER VIDEOS"}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* ==========================================
               Tab Content: VIDEO GENERATOR
               ========================================== */
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {project.scenes.map((sc) => (
                  <div key={sc.id} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl shadow-xl overflow-hidden flex flex-col h-72">
                    <div className="bg-white/[0.03] px-3 py-2 flex justify-between items-center border-b border-white/10">
                      <span className="text-[10px] font-bold text-white font-mono">
                        🎬 {lang === "vi" ? `Phân Cảnh ${sc.sceneNumber}` : `Scene ${sc.sceneNumber}`}
                      </span>
                      {sc.videoUrl && (
                        <span className="text-[10px] text-purple-400 font-bold flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" />
                          <span>Playable</span>
                        </span>
                      )}
                    </div>

                    {/* Video Player Holder */}
                    <div className="flex-1 bg-black/40 relative flex items-center justify-center overflow-hidden">
                      {sc.videoUrl ? (
                        <>
                          <video
                            src={sc.videoUrl}
                            className="w-full h-full object-cover"
                            controls={playingVideoId === sc.id}
                            playsInline
                            loop
                          />
                          {playingVideoId !== sc.id && (
                            <button
                              onClick={() => setPlayingVideoId(sc.id)}
                              className="absolute p-3 bg-white/20 hover:bg-white text-white hover:text-gray-900 rounded-full transition-all z-10 shadow-lg cursor-pointer"
                            >
                              <Play className="w-6 h-6 fill-current" />
                            </button>
                          )}
                        </>
                      ) : (
                        <div className="text-center p-4 text-slate-400">
                          <Video className="w-8 h-8 mx-auto mb-2 opacity-50 animate-pulse text-purple-400" />
                          <span className="text-[10px] block font-mono">
                            {sc.promptVideo.substring(0, 75)}...
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Video footer */}
                    <div className="p-3 bg-white/[0.02] border-t border-white/10 flex justify-between items-center">
                      <span className="text-[10px] text-slate-400 truncate max-w-[150px] block text-left">
                        <strong>Motion:</strong> {sc.promptVideo}
                      </span>
                      <div className="flex gap-1.5">
                        {sc.videoUrl && (
                          <button
                            onClick={() => downloadSceneAsset(sc.videoUrl!, "vid")}
                            className="p-1.5 px-2 border border-white/10 hover:bg-white/10 text-white rounded cursor-pointer transition-all"
                            title={lang === "vi" ? "Tải video" : "Download Video"}
                          >
                            <Download className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          onClick={() => triggerSingleSceneRegen(sc.id, "video")}
                          className="text-[10px] font-bold text-[#34b1b3] border border-[#34b1b3]/30 hover:bg-[#34b1b3]/15 px-2.5 py-1 rounded transition-colors cursor-pointer"
                        >
                          {sc.videoUrl ? (lang === "vi" ? "Tạo lại" : "Regen") : (lang === "vi" ? "Render Video" : "Render")}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Batch Render bottom action */}
              <div className="bg-[#34b1b3]/10 border border-[#34b1b3]/25 p-5 rounded-xl flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">
                    🎬 {lang === "vi" ? "Kiểm duyệt Trực quan Dự Án Hoàn Tất!" : "Complete Video Storytelling!"}
                  </span>
                  <span className="text-[11px] text-slate-300 block mt-0.5">
                    {lang === "vi" 
                      ? "Xem lại tất cả khung phân cảnh video đã hoàn tất mượt mà chuẩn bị cho đợt phân phối quảng cáo lớn." 
                      : "Ready to launch beautiful cinematic campaigns based on rotated account pools."}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={onTriggerVideoGen}
                    disabled={isLoading}
                    className="flex items-center gap-1.5 bg-[#34b1b3] hover:bg-[#2db3b5] text-white font-bold text-xs cursor-pointer rounded-lg px-5 py-2.5 shadow-lg shadow-[#34b1b3]/25 transition-all"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>{lang === "vi" ? "Đồng loạt Tạo lại Video" : "Render All Videos"}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right column: Flow Credits & Operations console */}
        <div className="space-y-4">
          {/* Credits remaining manager display */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-xl space-y-3">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-[#34b1b3]" />
              {lang === "vi" ? "Thống kê Flow Account Pool" : "Flow Render Pool Health"}
            </span>

            <div className="text-[11px] text-slate-300 space-y-2.5 leading-relaxed font-mono">
              <div className="flex justify-between border-b border-white/5 pb-1.5">
                <span className="font-semibold text-slate-400">Pool Status:</span>
                <span className="text-emerald-400 font-bold">Online</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1.5">
                <span className="font-semibold text-slate-400">Avg Rendering duration:</span>
                <span className="text-white">~ 1.8s / frame</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-400">Cost per Scene:</span>
                <span className="text-[#34b1b3] font-bold">10 Credits</span>
              </div>
            </div>
          </div>

          {/* Flow Generation logs */}
          <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-xl shadow-xl p-4 flex flex-col h-80">
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/10">
              <HardDrive className="text-purple-400 w-4 h-4 animate-pulse" />
              <span className="text-[11px] font-bold text-[#34b1b3] uppercase tracking-wider font-mono">
                {lang === "vi" ? "Nhật ký Render Flow Pool" : "Flow Render Engine Logs"}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 font-mono text-[10px] text-slate-300 leading-relaxed scrollbar-thin">
              {logs.map((log, index) => (
                <div key={index} className="flex gap-1.5 items-start">
                  <span className="text-slate-500 shrink-0">[{log.timestamp}]</span>
                  <span className={`
                    ${log.level === "error" ? "text-red-400 font-semibold" : ""}
                    ${log.level === "warn" ? "text-yellow-400" : ""}
                    ${log.level === "success" ? "text-emerald-400 font-bold" : ""}
                    ${log.level === "info" ? "text-cyan-300" : ""}
                  `}>
                    {log.message}
                  </span>
                </div>
              ))}
              {logs.length === 0 && (
                <div className="text-slate-500 text-center py-12 font-sans text-xs">
                  {lang === "vi" ? "Logs trống rỗng. Hãy chạy kích hoạt 'Tạo ảnh' hoặc 'Tạo Video'." : "Console idle. Trigger an image or video generation action."}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
