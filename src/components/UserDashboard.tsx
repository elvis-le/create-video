import React, { useState } from "react";
import { 
  FolderPlus, FileText, Image, Video, Calendar, Search, 
  Trash2, Archive, Copy, ExternalLink, RefreshCw 
} from "lucide-react";
import { Project, ProjectStatus } from "../types";

interface Props {
  lang: "vi" | "en";
  projects: Project[];
  onSelectProject: (id: string) => void;
  onCloneProject: (id: string) => void;
  onArchiveProject: (id: string) => void;
  onDeleteProject: (id: string) => void;
  onNavigateToCreate: () => void;
}

export default function UserDashboard({ 
  lang, projects, onSelectProject, onCloneProject, onArchiveProject, onDeleteProject, onNavigateToCreate 
}: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  // Filter projects
  const filtered = projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.productName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "All" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate Metrics
  const totalProjects = projects.length;
  const scriptReady = projects.filter(p => ["Script Ready", "Assets Ready", "Images Ready", "Videos Ready", "Completed"].includes(p.status)).length;
  const imageReady = projects.filter(p => ["Images Ready", "Videos Ready", "Completed"].includes(p.status)).length;
  const videoReady = projects.filter(p => ["Videos Ready", "Completed"].includes(p.status)).length;

  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case "Draft": return "bg-white/5 text-slate-400 border-white/10";
      case "Script Ready": return "bg-blue-500/15 text-blue-400 border-blue-500/20";
      case "Assets Ready": return "bg-purple-500/15 text-purple-400 border-purple-500/20";
      case "Images Ready": return "bg-[#34b1b3]/15 text-[#34b1b3] border-[#34b1b3]/30";
      case "Videos Ready": return "bg-indigo-500/15 text-indigo-400 border-indigo-500/20";
      case "Completed": return "bg-emerald-500/15 text-emerald-400 border-emerald-500/20";
      case "Failed": return "bg-red-500/15 text-red-400 border-red-500/20";
      default: return "bg-white/5 text-slate-405 border-white/10";
    }
  };

  return (
    <div className="space-y-6 relative z-10 font-sans">
      {/* Overview Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-5 flex items-center gap-3">
          <div className="p-3 bg-[#34b1b3]/10 text-[#34b1b3] rounded-lg shadow-[0_0_12px_rgba(52,177,179,0.1)]">
            <FolderPlus className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
              {lang === "vi" ? "Tổng dự án" : "Total Projects"}
            </span>
            <h4 className="text-xl font-bold text-white">{totalProjects}</h4>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-5 flex items-center gap-3">
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-lg shadow-[0_0_12px_rgba(59,130,246,0.1)]">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
              {lang === "vi" ? "Kịch bản AI" : "AI Scripts"}
            </span>
            <h4 className="text-xl font-bold text-white">{scriptReady}</h4>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-5 flex items-center gap-3">
          <div className="p-3 bg-[#34b1b3]/10 text-[#34b1b3] rounded-lg shadow-[0_0_12px_rgba(52,177,179,0.1)]">
            <Image className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
              {lang === "vi" ? "Ảnh phân cảnh" : "Scene Images"}
            </span>
            <h4 className="text-xl font-bold text-white">{imageReady}</h4>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-5 flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg shadow-[0_0_12px_rgba(16,185,129,0.1)]">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
              {lang === "vi" ? "Bản Render Video" : "Video Renders"}
            </span>
            <h4 className="text-xl font-bold text-white">{videoReady}</h4>
          </div>
        </div>
      </div>

      {/* Control Actions Panel */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-xl">
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          {/* Search Project */}
          <div className="relative">
            <input
              type="text"
              placeholder={lang === "vi" ? "Tìm dự án, sản phẩm..." : "Search project, product..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-sm rounded-lg glass-input pl-9 pr-4 py-2.5 w-full sm:w-64 focus:outline-none"
            />
            <Search className="absolute left-3 top-3.5 text-slate-400 w-4 h-4" />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm rounded-lg glass-input px-3 py-2.5 focus:outline-none cursor-pointer"
          >
            <option value="All" className="bg-[#0a0f18] text-white">{lang === "vi" ? "Tất cả trạng thái" : "All Status"}</option>
            <option value="Draft" className="bg-[#0a0f18] text-white">{lang === "vi" ? "Bản nháp" : "Draft"}</option>
            <option value="Script Ready" className="bg-[#0a0f18] text-white">{lang === "vi" ? "Kịch bản Sẵn sàng" : "Script Ready"}</option>
            <option value="Assets Ready" className="bg-[#0a0f18] text-white">{lang === "vi" ? "Tài nguyên Sẵn sàng" : "Assets Ready"}</option>
            <option value="Images Ready" className="bg-[#0a0f18] text-white">{lang === "vi" ? "Ảnh phân cảnh Hoàn tất" : "Images Ready"}</option>
            <option value="Videos Ready" className="bg-[#0a0f18] text-white">{lang === "vi" ? "Video Hoàn tất" : "Videos Ready"}</option>
            <option value="Completed" className="bg-[#0a0f18] text-white">{lang === "vi" ? "Đã Biên tập Xong" : "Completed"}</option>
            <option value="Failed" className="bg-[#0a0f18] text-white">{lang === "vi" ? "Gặp lỗi" : "Failed"}</option>
          </select>
        </div>

        {/* Buttons */}
        <div className="flex gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={onNavigateToCreate}
            className="flex items-center gap-2 bg-[#34b1b3] text-white hover:bg-[#2db3b5] transition-all rounded-lg px-5 py-2.5 font-bold text-xs cursor-pointer shadow-lg shadow-[#34b1b3]/20"
          >
            <FolderPlus className="w-4 h-4" />
            <span>{lang === "vi" ? "TẠO DỰ ÁN MỚI" : "CREATE NEW PROJECT"}</span>
          </button>
        </div>
      </div>

      {/* Projects Grid List */}
      {filtered.length === 0 ? (
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-12 text-center text-slate-400">
          <p className="text-sm mb-3">{lang === "vi" ? "Chưa tìm thấy chiến dịch phù hợp yêu cầu." : "No matching campaign projects found."}</p>
          <button
            onClick={onNavigateToCreate}
            className="text-xs text-[#34b1b3] hover:underline font-bold"
          >
            + {lang === "vi" ? "Tạo dự án đầu tiên của bạn ngay" : "Create your first project campaign now"}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((proj) => (
            <div 
              key={proj.id} 
              className="bg-white/5 backdrop-blur-md border border-white/10 hover:border-[#34b1b3]/50 transition-all shadow-lg flex flex-col hover:shadow-2xl hover:shadow-[#34b1b3]/5 h-full group rounded-xl"
            >
              {/* Card Header */}
              <div className="p-5 flex-1 space-y-4">
                <div className="flex justify-between items-start gap-2">
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 border rounded-md ${getStatusColor(proj.status)}`}>
                    {proj.status === "Draft" && (lang === "vi" ? "Bản nháp" : "Draft")}
                    {proj.status === "Script Ready" && (lang === "vi" ? "Kịch bản Sẵn sàng" : "Script Ready")}
                    {proj.status === "Assets Ready" && (lang === "vi" ? "Tài nguyên Sẵn sàng" : "Assets Ready")}
                    {proj.status === "Images Ready" && (lang === "vi" ? "Ảnh phân cảnh Sẵn sàng" : "Images Ready")}
                    {proj.status === "Videos Ready" && (lang === "vi" ? "Phân cảnh Video Sẵn sàng" : "Videos Ready")}
                    {proj.status === "Completed" && (lang === "vi" ? "Hoàn thành" : "Completed")}
                    {proj.status === "Failed" && (lang === "vi" ? "Thất bại" : "Failed")}
                  </span>
                  <div className="flex items-center gap-1.5 text-slate-400 text-xs font-mono">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{new Date(proj.createdAt).toLocaleDateString(lang === "vi" ? "vi-VN" : "en-US")}</span>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-white line-clamp-1 pb-1 group-hover:text-[#34b1b3] transition-colors text-sm font-display">
                    {proj.name}
                  </h3>
                  <p className="text-xs text-[#34b1b3] font-semibold mb-2">
                    🏷️ {proj.productName} ({proj.productCategory})
                  </p>
                  <p className="text-xs text-slate-400 line-clamp-2 h-8">
                    {proj.productInfo || (lang === "vi" ? "Chưa có đặc tả sản phẩm." : "No product brief supplied yet.")}
                  </p>
                </div>

                {/* Sub-asset Counters Grid */}
                <div className="grid grid-cols-3 gap-2 bg-black/20 rounded-lg p-2.5 text-center text-[11px] text-slate-300 border border-white/5">
                  <div>
                    <span className="block font-bold text-sm text-white">{proj.scenes.length || 0}</span>
                    <span className="text-[10px] text-slate-400">{lang === "vi" ? "Phân Cảnh" : "Scenes"}</span>
                  </div>
                  <div>
                    <span className="block font-bold text-sm text-white">
                      {proj.scenes.filter(s => s.imageUrl).length}
                    </span>
                    <span className="text-[10px] text-slate-400">{lang === "vi" ? "Ảnh" : "Images"}</span>
                  </div>
                  <div>
                    <span className="block font-bold text-sm text-white">
                      {proj.scenes.filter(s => s.videoUrl).length}
                    </span>
                    <span className="text-[10px] text-slate-400">{lang === "vi" ? "Video" : "Videos"}</span>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="bg-white/[0.03] border-t border-white/10 px-5 py-3 flex items-center justify-between gap-2 rounded-b-xl">
                <button
                  onClick={() => onSelectProject(proj.id)}
                  className="flex items-center gap-1.5 text-xs text-[#34b1b3] font-bold hover:text-[#2db3b5] hover:underline cursor-pointer transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{lang === "vi" ? "Xem & Biên Tập" : "Edit & Compose"}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onCloneProject(proj.id)}
                    title={lang === "vi" ? "Nhân bản" : "Clone Campaign"}
                    className="p-1.5 text-slate-400 hover:bg-white/10 hover:text-white rounded-md transition-colors cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onArchiveProject(proj.id)}
                    title={lang === "vi" ? "Lưu trữ" : "Archive Campaign"}
                    className="p-1.5 text-slate-400 hover:bg-white/10 hover:text-white rounded-md transition-colors cursor-pointer"
                  >
                    <Archive className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteProject(proj.id)}
                    title={lang === "vi" ? "Xóa bỏ" : "Delete Campaign"}
                    className="p-1.5 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-md transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
