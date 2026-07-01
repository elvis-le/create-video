import React, { useState, useEffect, useRef } from "react";
import { 
  FolderPlus, FileText, Clapperboard, Sparkles, Terminal, BookOpen, 
  Settings, Languages, RefreshCw, Layers, CheckCircle2, AlertCircle, Database, HelpCircle 
} from "lucide-react";
import UserDashboard from "./components/UserDashboard";
import ProjectCreator from "./components/ProjectCreator";
import MasterScriptEditor from "./components/MasterScriptEditor";
import ScenesBreakdown from "./components/ScenesBreakdown";
import ImageVideoGenerator from "./components/ImageVideoGenerator";
import AdminDashboard from "./components/AdminDashboard";
import TechStackBoilerplate from "./components/TechStackBoilerplate";
import { Project, GeminiKey, FlowAccount, ElevenLabsKey, QueueTask, AIModelSettings, LogEntry, IndustryTemplate, SmartPreset, Scene, SupabaseStatus, AIVoice } from "./types";

export default function App() {
  const [lang, setLang] = useState<"vi" | "en">("vi");
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Core database replicas
  const [projects, setProjects] = useState<Project[]>([]);
  const [geminiKeys, setGeminiKeys] = useState<GeminiKey[]>([]);
  const [flowAccounts, setFlowAccounts] = useState<FlowAccount[]>([]);
  const [elevenlabsKeys, setElevenlabsKeys] = useState<ElevenLabsKey[]>([]);
  const [voices, setVoices] = useState<AIVoice[]>([]);
  const [queueTasks, setQueueTasks] = useState<QueueTask[]>([]);
  const [modelSettings, setModelSettings] = useState<AIModelSettings | null>(null);
  const [industries, setIndustries] = useState<IndustryTemplate[]>([]);
  const [presets, setPresets] = useState<SmartPreset[]>([]);
  const [supabaseStatus, setSupabaseStatus] = useState<SupabaseStatus | null>(null);

  // Task processing control
  const [activeTaskLogs, setActiveTaskLogs] = useState<LogEntry[]>([]);
  const [isTaskRunning, setIsTaskRunning] = useState(false);
  const pollerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch initial system database tables
  const fetchAllData = async () => {
    try {
      const resConst = await fetch("/api/constants");
      const dataConst = await resConst.json();
      setIndustries(dataConst.industryTemplates || []);
      setPresets(dataConst.smartPresets || []);

      // Fetch status first
      try {
        const resSupa = await fetch("/api/supabase-status");
        const dataSupa = await resSupa.json();
        setSupabaseStatus(dataSupa);
      } catch (e) {
        console.warn("Could not load Supabase status:", e);
      }

      const resProj = await fetch("/api/projects");
      const dataProj = await resProj.json();
      setProjects(dataProj);

      const resKeys = await fetch("/api/keys/gemini");
      const dataKeys = await resKeys.json();
      setGeminiKeys(dataKeys);

      const resFlow = await fetch("/api/keys/flow");
      const dataFlow = await resFlow.json();
      setFlowAccounts(dataFlow);

      const resElevenLabs = await fetch("/api/keys/elevenlabs");
      const dataElevenLabs = await resElevenLabs.json();
      setElevenlabsKeys(dataElevenLabs);

      try {
        const resVoices = await fetch("/api/voices");
        const dataVoices = await resVoices.json();
        setVoices(dataVoices || []);
      } catch (e) {
        console.warn("Could not load voices:", e);
      }

      const resTasks = await fetch("/api/queue/tasks");
      const dataTasks = await resTasks.json();
      setQueueTasks(dataTasks);

      const resSettings = await fetch("/api/settings/models");
      const dataSettings = await resSettings.json();
      setModelSettings(dataSettings);
    } catch (err) {
      console.error("Error connecting to Express backend:", err);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Poll for Active task status if one triggers
  const startPoller = (taskId: string) => {
    if (pollerRef.current) clearInterval(pollerRef.current);
    setIsTaskRunning(true);

    pollerRef.current = setInterval(async () => {
      try {
        const resTasks = await fetch("/api/queue/tasks");
        const allTasks: QueueTask[] = await resTasks.json();
        setQueueTasks(allTasks);

        const currentTask = allTasks.find(t => t.id === taskId);
        if (currentTask) {
          setActiveTaskLogs(currentTask.logLines);
          
          if (currentTask.status === "Completed" || currentTask.status === "Failed") {
            setIsTaskRunning(false);
            if (pollerRef.current) clearInterval(pollerRef.current);
            fetchAllData(); // reload complete states
          }
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 600);
  };

  useEffect(() => {
    return () => {
      if (pollerRef.current) clearInterval(pollerRef.current);
    };
  }, []);

  const activeProject = projects.find(p => p.id === selectedProjectId);

  // ==========================================
  // API Core Action Dispatchers
  // ==========================================
  const handleSelectProject = (id: string) => {
    setSelectedProjectId(id);
    const proj = projects.find(p => p.id === id);
    if (proj) {
      // route to the right stage based on project status
      if (proj.status === "Draft") setActiveTab("script");
      else if (proj.status === "Script Ready") setActiveTab("storyboard");
      else if (proj.status === "Assets Ready" || proj.status === "Images Ready" || proj.status === "Videos Ready" || proj.status === "Completed") {
        setActiveTab("studio");
      }
    }
  };

  const handleCreateProject = async (pData: any) => {
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pData)
      });
      const newProj: Project = await res.json();
      setProjects([newProj, ...projects]);
      setSelectedProjectId(newProj.id);
      
      // Auto trigger script task
      handleTriggerTask(newProj.id, "Script");
      setActiveTab("script");
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateProject = async (id: string, pData: any) => {
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pData)
      });
      const updatedProj: Project = await res.json();
      setProjects(projects.map(p => p.id === id ? updatedProj : p));
      setSelectedProjectId(updatedProj.id);
      
      // Auto trigger script task with updated details
      handleTriggerTask(updatedProj.id, "Script");
      setActiveTab("script");
    } catch (err) {
      console.error(err);
    }
  };

  const handleTriggerTask = async (projId: string, type: "Script" | "Scenes" | "ImageGen" | "VideoGen" | "VoiceGen") => {
    try {
      const res = await fetch(`/api/projects/${projId}/generate/${type}`, {
        method: "POST"
      });
      const task: QueueTask = await res.json();
      setActiveTaskLogs(task.logLines);
      startPoller(task.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveScript = async (title: string, content: string) => {
    if (!selectedProjectId) return;
    try {
      await fetch(`/api/projects/${selectedProjectId}/script-save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content })
      });
      // Silent refresh variables
      const resProj = await fetch("/api/projects");
      const dataProj = await resProj.json();
      setProjects(dataProj);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRestoreVersion = async (versionNum: number) => {
    if (!selectedProjectId) return;
    try {
      const res = await fetch(`/api/projects/${selectedProjectId}/versions/${versionNum}/restore`, {
        method: "POST"
      });
      const data = await res.json();
      setProjects(projects.map(p => p.id === selectedProjectId ? data.project : p));
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateScene = async (sceneId: string, fields: Partial<Scene>) => {
    if (!selectedProjectId) return;
    try {
      const res = await fetch(`/api/projects/${selectedProjectId}/scenes/${sceneId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields)
      });
      const data = await res.json();
      setProjects(projects.map(p => p.id === selectedProjectId ? data.project : p));
    } catch (err) {
      console.error(err);
    }
  };

  const handleCloneProject = async (id: string) => {
    try {
      const res = await fetch(`/api/projects/${id}/clone`, { method: "POST" });
      const cloned = await res.json();
      setProjects([cloned, ...projects]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleArchiveProject = async (id: string) => {
    try {
      const res = await fetch(`/api/projects/${id}/archive`, { method: "POST" });
      const data = await res.json();
      setProjects(projects.map(p => p.id === id ? data.project : p));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProject = async (id: string) => {
    const confirmation = window.confirm(lang === "vi" ? "Bạn chắc chắn muốn xóa chiến dịch này chứ? Toàn bộ tài nguyên sẽ mất." : "Are you sure you want to delete this campaign project? All rendered files will clear.");
    if (!confirmation) return;
    try {
      await fetch(`/api/projects/${id}`, { method: "DELETE" });
      setProjects(projects.filter(p => p.id !== id));
      if (selectedProjectId === id) setSelectedProjectId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateSceneMedia = async (sceneId: string, type: "image" | "video", url: string) => {
    await handleUpdateScene(sceneId, type === "image" ? { imageUrl: url, status: "Completed" } : { videoUrl: url });
  };

  // ==========================================
  // Admin & Settings API Handlers
  // ==========================================
  const handleAddGeminiKey = async (name: string, apiKey: string) => {
    try {
      const res = await fetch("/api/keys/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, apiKey })
      });
      const nKey = await res.json();
      setGeminiKeys([...geminiKeys, nKey]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddGeminiKeysBulk = async (keys: { name: string; apiKey: string }[]) => {
    try {
      const res = await fetch("/api/keys/gemini/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keys })
      });
      const newKeys = await res.json();
      setGeminiKeys([...geminiKeys, ...newKeys]);
      return newKeys.length;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const handleToggleGeminiKey = async (id: string, currentStatus: string) => {
    try {
      const targetStatus = currentStatus === "Active" ? "Inactive" : "Active";
      const res = await fetch(`/api/keys/gemini/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: targetStatus })
      });
      const updated = await res.json();
      setGeminiKeys(geminiKeys.map(k => k.id === id ? updated : k));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteGeminiKey = async (id: string) => {
    try {
      await fetch(`/api/keys/gemini/${id}`, { method: "DELETE" });
      setGeminiKeys(geminiKeys.filter(k => k.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddFlowAccount = async (name: string, apiKey: string, credit: number) => {
    try {
      const res = await fetch("/api/keys/flow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, apiKey, credit })
      });
      const nAcc = await res.json();
      setFlowAccounts([...flowAccounts, nAcc]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateFlowAccountCredit = async (id: string, credit: number) => {
    try {
      const res = await fetch(`/api/keys/flow/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credit })
      });
      const updated = await res.json();
      setFlowAccounts(flowAccounts.map(a => a.id === id ? updated : a));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteFlowAccount = async (id: string) => {
    try {
      await fetch(`/api/keys/flow/${id}`, { method: "DELETE" });
      setFlowAccounts(flowAccounts.filter(a => a.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddElevenLabsKey = async (name: string, apiKey: string) => {
    try {
      const res = await fetch("/api/keys/elevenlabs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, apiKey })
      });
      const nKey = await res.json();
      setElevenlabsKeys([...elevenlabsKeys, nKey]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddElevenLabsKeysBulk = async (keys: { name: string; apiKey: string }[]) => {
    try {
      const res = await fetch("/api/keys/elevenlabs/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keys })
      });
      const newKeys = await res.json();
      setElevenlabsKeys([...elevenlabsKeys, ...newKeys]);
      return newKeys.length;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const handleToggleElevenLabsKey = async (id: string, currentStatus: string) => {
    try {
      const targetStatus = currentStatus === "Active" ? "Inactive" : "Active";
      const res = await fetch(`/api/keys/elevenlabs/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: targetStatus })
      });
      const updated = await res.json();
      setElevenlabsKeys(elevenlabsKeys.map(k => k.id === id ? updated : k));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteElevenLabsKey = async (id: string) => {
    try {
      await fetch(`/api/keys/elevenlabs/${id}`, { method: "DELETE" });
      setElevenlabsKeys(elevenlabsKeys.filter(k => k.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddVoice = async (name: string, voiceId: string, status = true) => {
    try {
      const res = await fetch("/api/voices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, voiceId, status })
      });
      const nVoice = await res.json();
      setVoices([...voices, nVoice]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleVoice = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/voices/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: !currentStatus })
      });
      const updated = await res.json();
      setVoices(voices.map(v => v.id === id ? updated : v));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteVoice = async (id: string) => {
    try {
      await fetch(`/api/voices/${id}`, { method: "DELETE" });
      setVoices(voices.filter(v => v.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateModelSettings = async (settings: Partial<AIModelSettings>) => {
    try {
      const res = await fetch("/api/settings/models", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings)
      });
      const updated = await res.json();
      setModelSettings(updated);
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearQueueLogs = () => {
    setQueueTasks([]);
    setActiveTaskLogs([]);
  };

  return (
    <div id="saas-system-wrapper" className="min-h-screen bg-[#0a0f18] text-slate-200 flex flex-col font-sans select-none antialiased relative overflow-x-hidden">
      
      {/* Background decorations - Frosted Glass ambient glows */}
      <div id="ambient-glowing-blobs" className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-[#34b1b3]/12 rounded-full blur-[140px]" />
        <div className="absolute top-1/3 -right-60 w-[700px] h-[700px] bg-blue-600/8 rounded-full blur-[160px]" />
        <div className="absolute -bottom-40 left-1/4 w-[500px] h-[500px] bg-purple-600/8 rounded-full blur-[150px]" />
      </div>

      {/* Visual Identity Premium Navigation Brand Bar */}
      <header className="sticky top-0 bg-black/30 backdrop-blur-md border-b border-white/10 z-30 px-6 py-4 flex items-center justify-between relative">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#34b1b3] flex items-center justify-center text-white shadow-lg shadow-[#34b1b3]/30">
            <Sparkles className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-1.5 font-display">
              <span>SaaS AI Video Automation System</span>
              <span className="h-2 w-2 rounded-full bg-green-400 block animate-pulse" />
            </h1>
            <p className="text-[10px] text-slate-400 font-bold tracking-wide uppercase">
              {lang === "vi" ? "Nền tảng Tự động hóa kịch bản" : "AI Production Orchestrator"}
            </p>
          </div>
        </div>

        {/* Action controllers */}
        <div className="flex items-center gap-3">
          {/* Active Campaign tracker if selected */}
          {activeProject && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs font-semibold text-slate-300">
              <span className="text-[#34b1b3] font-bold">⚡ {lang === "vi" ? "Dự án:" : "Active:"}</span>
              <span className="truncate max-w-[150px]">{activeProject.name}</span>
            </div>
          )}

          {/* Lang Toggle */}
          <button
            onClick={() => setLang(lang === "vi" ? "en" : "vi")}
            className="flex items-center gap-1.5 text-xs font-bold border border-white/10 hover:border-[#34b1b3]/60 text-slate-200 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 backdrop-blur-sm transition-all cursor-pointer"
          >
            <Languages className="w-3.5 h-3.5 text-[#34b1b3]" />
            <span>{lang === "vi" ? "🇺🇸 English" : "🇻🇳 Tiếng Việt"}</span>
          </button>
        </div>
      </header>

      {/* Primary tab bar layout with #34b1b3 active indicators */}
      <div className="bg-black/15 backdrop-blur-md border-b border-white/10 px-6 py-2.5 flex overflow-x-auto gap-1.5 scrollbar-none relative z-20">
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`px-4 py-2.5 text-xs font-bold rounded-lg transition-all border flex items-center gap-1.5 cursor-pointer shrink-0 ${activeTab === "dashboard" ? "bg-[#34b1b3]/20 text-white border-[#34b1b3]/30 shadow-[0_0_12px_rgba(52,177,179,0.15)]" : "border-transparent text-slate-400 hover:bg-white/5 hover:text-slate-200"}`}
        >
          <Database className="w-4 h-4" />
          <span>{lang === "vi" ? "Dự Án Tổng Quan" : "Project Dashboard"}</span>
        </button>

        <button
          onClick={() => { setSelectedProjectId(null); setActiveTab("create"); }}
          className={`px-4 py-2.5 text-xs font-bold rounded-lg transition-all border flex items-center gap-1.5 cursor-pointer shrink-0 ${activeTab === "create" ? "bg-[#34b1b3]/20 text-white border-[#34b1b3]/30 shadow-[0_0_12px_rgba(52,177,179,0.15)]" : "border-transparent text-slate-400 hover:bg-white/5 hover:text-slate-200"}`}
        >
          <FolderPlus className="w-4 h-4" />
          <span>{lang === "vi" ? "Thiết Kế Dự Án" : "Create Core"}</span>
        </button>

        {/* Stages locked depending on selected item */}
        <button
          onClick={() => activeProject && setActiveTab("script")}
          disabled={!activeProject}
          className={`px-4 py-2.5 text-xs font-bold rounded-lg transition-all border flex items-center gap-1.5 shrink-0 ${!activeProject ? "opacity-35 cursor-not-allowed text-slate-500 border-transparent" : "cursor-pointer"} ${activeTab === "script" ? "bg-[#34b1b3]/20 text-white border-[#34b1b3]/30 shadow-[0_0_12px_rgba(52,177,179,0.15)]" : "border-transparent text-slate-400 hover:bg-white/5 hover:text-slate-200"}`}
        >
          <FileText className="w-4 h-4" />
          <span>{lang === "vi" ? "Kịch Bản Master" : "Master Script"}</span>
        </button>

        <button
          onClick={() => activeProject && activeProject.scenes?.length > 0 && setActiveTab("storyboard")}
          disabled={!activeProject || !activeProject.scenes || activeProject.scenes.length === 0}
          className={`px-4 py-2.5 text-xs font-bold rounded-lg transition-all border flex items-center gap-1.5 shrink-0 ${(!activeProject || !activeProject.scenes || activeProject.scenes.length === 0) ? "opacity-35 cursor-not-allowed text-slate-500 border-transparent" : "cursor-pointer"} ${activeTab === "storyboard" ? "bg-[#34b1b3]/20 text-white border-[#34b1b3]/30 shadow-[0_0_12px_rgba(52,177,179,0.15)]" : "border-transparent text-slate-400 hover:bg-white/5 hover:text-slate-200"}`}
        >
          <Clapperboard className="w-4 h-4" />
          <span>{lang === "vi" ? "Phân Cảnh Prompts" : "Storyboard"}</span>
        </button>

        <button
          onClick={() => activeProject && activeProject.scenes?.length > 0 && setActiveTab("studio")}
          disabled={!activeProject || !activeProject.scenes || activeProject.scenes.length === 0}
          className={`px-4 py-2.5 text-xs font-bold rounded-lg transition-all border flex items-center gap-1.5 shrink-0 ${(!activeProject || !activeProject.scenes || activeProject.scenes.length === 0) ? "opacity-35 cursor-not-allowed text-slate-500 border-transparent" : "cursor-pointer"} ${activeTab === "studio" ? "bg-[#34b1b3]/20 text-white border-[#34b1b3]/30 shadow-[0_0_12px_rgba(52,177,179,0.15)]" : "border-transparent text-slate-400 hover:bg-white/5 hover:text-slate-200"}`}
        >
          <Sparkles className="w-4 h-4" />
          <span>{lang === "vi" ? "Tạo Ảnh & Video" : "Studio Render"}</span>
        </button>

        <button
          onClick={() => setActiveTab("admin")}
          className={`px-4 py-2.5 text-xs font-bold rounded-lg transition-all border flex items-center gap-1.5 cursor-pointer shrink-0 ${activeTab === "admin" ? "bg-[#34b1b3]/20 text-white border-[#34b1b3]/30 shadow-[0_0_12px_rgba(52,177,179,0.15)]" : "border-transparent text-slate-400 hover:bg-white/5 hover:text-slate-200"}`}
        >
          <Settings className="w-4 h-4 text-[#34b1b3]" />
          <span>{lang === "vi" ? "Bảng Admin" : "Admin Panel"}</span>
        </button>

        <button
          onClick={() => setActiveTab("tech")}
          className={`px-4 py-2.5 text-xs font-bold rounded-lg transition-all border flex items-center gap-1.5 cursor-pointer shrink-0 ${activeTab === "tech" ? "bg-[#34b1b3]/20 text-white border-[#34b1b3]/30 shadow-[0_0_12px_rgba(52,177,179,0.15)]" : "border-transparent text-slate-400 hover:bg-white/5 hover:text-slate-200"}`}
        >
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span>{lang === "vi" ? "Tech Spec" : "Tech Spec Logs"}</span>
        </button>
      </div>

      {/* Task Queue Global Floating Progress Alert if processing */}
      {isTaskRunning && (
        <div className="bg-black/40 backdrop-blur-xl border-y border-white/10 border-l-4 border-[#34b1b3] text-white px-6 py-4.5 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 z-40 animate-slide-in relative">
          <div className="flex items-center gap-3">
            <RefreshCw className="animate-spin text-[#34b1b3] w-5 h-5 shrink-0" />
            <div>
              <span className="text-xs font-extrabold tracking-wider text-white uppercase block">
                🔄 {lang === "vi" ? "HỆ THỐNG ĐANG XỬ LÝ NHIỆM VỤ HÀNG CHỜ" : "BACKGROUND TASK QUEUE ACTIVE"}
              </span>
              <span className="text-[11px] text-slate-400 font-mono block mt-0.5 max-w-xl truncate">
                {activeTaskLogs[activeTaskLogs.length - 1]?.message || "Analyzing system schemas..."}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-4 shrink-0 justify-between sm:justify-end">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Progress:</span>
              <div className="w-24 bg-white/10 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-[#34b1b3] h-full transition-all duration-300 shadow-[0_0_8px_#34b1b3]" 
                  style={{ width: `${queueTasks.find(t => t.status === "Processing")?.progress || 35}%` }}
                />
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-[#34b1b3] bg-[#34b1b3]/10 px-2 py-0.5 rounded border border-[#34b1b3]/20">
              {queueTasks.find(t => t.status === "Processing")?.progress || 35}%
            </span>
          </div>
        </div>
      )}

      {/* Real Application Timeline / Stepper on Detailed project view */}
      {activeProject && ["script", "storyboard", "studio"].includes(activeTab) && (
        <div className="bg-black/10 backdrop-blur-xs border-b border-white/10 py-3.5 px-6 flex justify-center items-center text-xs text-slate-400 gap-2 md:gap-4 select-none relative z-10">
          <div className="flex items-center gap-1.5">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${activeProject.scriptContent ? "bg-emerald-500 text-white" : "bg-white/5 border border-white/10 text-slate-500"}`}>1</span>
            <span className={activeProject.scriptContent ? "font-bold text-white" : ""}>{lang === "vi" ? "Kịch bản" : "Script"}</span>
          </div>
          <div className="w-6 h-px bg-white/10" />
          <div className="flex items-center gap-1.5">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${activeProject.scenes?.length > 0 ? "bg-emerald-500 text-white" : "bg-white/5 border border-white/10 text-slate-500"}`}>2</span>
            <span className={activeProject.scenes?.length > 0 ? "font-bold text-white" : ""}>{lang === "vi" ? "Phân cảnh" : "Storyboard"}</span>
          </div>
          <div className="w-6 h-px bg-white/10" />
          <div className="flex items-center gap-1.5">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${activeProject.scenes?.some(s => s.imageUrl) ? "bg-emerald-500 text-white" : "bg-white/5 border border-white/10 text-slate-500"}`}>3</span>
            <span className={activeProject.scenes?.some(s => s.imageUrl) ? "font-bold text-white" : ""}>{lang === "vi" ? "Tạo Ảnh" : "Images"}</span>
          </div>
          <div className="w-6 h-px bg-white/10" />
          <div className="flex items-center gap-1.5">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${activeProject.scenes?.some(s => s.videoUrl) ? "bg-emerald-500 text-white" : "bg-white/5 border border-white/10 text-slate-500"}`}>4</span>
            <span className={activeProject.scenes?.some(s => s.videoUrl) ? "font-bold text-white" : ""}>{lang === "vi" ? "Tạo Video" : "Video"}</span>
          </div>
        </div>
      )}

      {/* Main Canvas Container */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto relative z-10">
        
        {supabaseStatus && supabaseStatus.configured && !supabaseStatus.tablesOk && (
          <div className="mb-6 bg-amber-500/10 border border-amber-500/30 text-amber-200 px-5 py-3 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs shadow-lg shadow-amber-500/5 relative z-10 animate-pulse">
            <div className="flex items-start md:items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 md:mt-0" />
              <div>
                <span className="font-bold">
                  {lang === "vi" ? "Yêu cầu cấu hình Supabase:" : "Supabase Setup Required:"}
                </span>{" "}
                {lang === "vi" 
                  ? "Kết nối Supabase đã kích hoạt, nhưng các bảng dữ liệu chưa được khởi tạo. Vui lòng chạy tập lệnh SQL cài đặt." 
                  : "Supabase connection is active, but required tables are missing. Please run the SQL setup script."}
              </div>
            </div>
            <div className="flex items-center gap-2.5 shrink-0 self-end md:self-auto">
              <button
                onClick={() => setActiveTab("tech")}
                className="bg-amber-500/25 hover:bg-amber-500/35 active:scale-95 text-amber-100 font-bold px-3 py-1.5 rounded-lg border border-amber-500/30 transition-all cursor-pointer"
              >
                {lang === "vi" ? "Xem Script SQL & Cài Đặt" : "View SQL Script & Setup"}
              </button>
              <button
                onClick={fetchAllData}
                className="bg-white/5 hover:bg-white/10 active:scale-95 text-slate-300 font-bold px-3 py-1.5 rounded-lg border border-white/10 transition-all flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{lang === "vi" ? "Kiểm tra lại" : "Verify Connection"}</span>
              </button>
            </div>
          </div>
        )}
        {activeTab === "dashboard" && (
          <UserDashboard
            lang={lang}
            projects={projects}
            onSelectProject={handleSelectProject}
            onCloneProject={handleCloneProject}
            onArchiveProject={handleArchiveProject}
            onDeleteProject={handleDeleteProject}
            onNavigateToCreate={() => {
              setSelectedProjectId(null);
              setActiveTab("create");
            }}
          />
        )}

        {activeTab === "create" && (
          <ProjectCreator
            lang={lang}
            industries={industries}
            presets={presets}
            onCreateProject={handleCreateProject}
            onUpdateProject={handleUpdateProject}
            project={activeProject}
            onResetProject={() => setSelectedProjectId(null)}
            isLoading={isTaskRunning}
          />
        )}

        {activeTab === "script" && activeProject && (
          <MasterScriptEditor
            lang={lang}
            project={activeProject}
            logs={activeTaskLogs}
            onSaveScript={handleSaveScript}
            onRestoreVersion={handleRestoreVersion}
            onTriggerBreakdown={async () => {
              await handleTriggerTask(activeProject.id, "Scenes");
              setActiveTab("storyboard");
            }}
            onRegenerateScript={() => handleTriggerTask(activeProject.id, "Script")}
            isLoading={isTaskRunning}
          />
        )}

        {activeTab === "storyboard" && activeProject && (
          <ScenesBreakdown
            lang={lang}
            project={activeProject}
            logs={activeTaskLogs}
            onUpdateScene={handleUpdateScene}
            onTriggerImageGen={async () => {
              await handleTriggerTask(activeProject.id, "ImageGen");
              setActiveTab("studio");
            }}
            isLoading={isTaskRunning}
          />
        )}

        {activeTab === "studio" && activeProject && (
          <ImageVideoGenerator
            lang={lang}
            project={activeProject}
            logs={activeTaskLogs}
            onTriggerImageGen={() => handleTriggerTask(activeProject.id, "ImageGen")}
            onTriggerVideoGen={() => handleTriggerTask(activeProject.id, "VideoGen")}
            onTriggerVoiceGen={() => handleTriggerTask(activeProject.id, "VoiceGen")}
            onUpdateSceneMedia={handleUpdateSceneMedia}
            isLoading={isTaskRunning}
          />
        )}

        {activeTab === "admin" && modelSettings && (
          <AdminDashboard
            lang={lang}
            geminiKeys={geminiKeys}
            flowAccounts={flowAccounts}
            elevenlabsKeys={elevenlabsKeys}
            voices={voices}
            queueTasks={queueTasks}
            modelSettings={modelSettings}
            onAddGeminiKey={handleAddGeminiKey}
            onAddGeminiKeysBulk={handleAddGeminiKeysBulk}
            onToggleGeminiKey={handleToggleGeminiKey}
            onDeleteGeminiKey={handleDeleteGeminiKey}
            onAddFlowAccount={handleAddFlowAccount}
            onUpdateFlowAccountCredit={handleUpdateFlowAccountCredit}
            onDeleteFlowAccount={handleDeleteFlowAccount}
            onAddElevenLabsKey={handleAddElevenLabsKey}
            onAddElevenLabsKeysBulk={handleAddElevenLabsKeysBulk}
            onToggleElevenLabsKey={handleToggleElevenLabsKey}
            onDeleteElevenLabsKey={handleDeleteElevenLabsKey}
            onAddVoice={handleAddVoice}
            onToggleVoice={handleToggleVoice}
            onDeleteVoice={handleDeleteVoice}
            onUpdateModelSettings={handleUpdateModelSettings}
            onClearQueueLogs={handleClearQueueLogs}
          />
        )}

        {activeTab === "tech" && (
          <TechStackBoilerplate 
            lang={lang} 
            supabaseStatus={supabaseStatus} 
            onRefreshStatus={fetchAllData} 
          />
        )}

      </main>

      {/* Styled SaaS Footer */}
      <footer className="bg-black/30 backdrop-blur-md border-t border-white/10 py-6 px-8 text-center text-xs text-slate-400 select-none flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10 mt-auto">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#34b1b3] shadow-[0_0_8px_rgba(52,177,179,0.6)]" />
          <span className="font-bold text-slate-200">Enterprise AI Video Platform v1.2</span>
        </div>
        <div>
          <span>© 2026 AI Studio Build. {lang === "vi" ? "Lớp phủ thiết kế Frosted Glass" : "Frosted Glass premium design overlay."}</span>
        </div>
      </footer>

    </div>
  );
}
