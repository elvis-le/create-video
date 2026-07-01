import React, { useState } from "react";
import { 
  ShieldAlert, Database, Cpu, Settings, ToggleLeft, ToggleRight, 
  Trash2, Plus, RefreshCw, Key, HelpCircle, HardDrive, CheckCircle2,
  XCircle, Zap, Terminal, Edit3, Coins
} from "lucide-react";
import { GeminiKey, FlowAccount, ElevenLabsKey, QueueTask, AIModelSettings, AIVoice } from "../types";

interface Props {
  lang: "vi" | "en";
  geminiKeys: GeminiKey[];
  flowAccounts: FlowAccount[];
  elevenlabsKeys: ElevenLabsKey[];
  voices: AIVoice[];
  queueTasks: QueueTask[];
  modelSettings: AIModelSettings;
  onAddGeminiKey: (name: string, key: string) => Promise<void>;
  onAddGeminiKeysBulk: (keys: { name: string; apiKey: string }[]) => Promise<number>;
  onToggleGeminiKey: (id: string, currentStatus: string) => Promise<void>;
  onDeleteGeminiKey: (id: string) => Promise<void>;
  onAddFlowAccount: (name: string, key: string, credit: number) => Promise<void>;
  onUpdateFlowAccountCredit: (id: string, credit: number) => Promise<void>;
  onDeleteFlowAccount: (id: string) => Promise<void>;
  onAddElevenLabsKey: (name: string, key: string) => Promise<void>;
  onAddElevenLabsKeysBulk: (keys: { name: string; apiKey: string }[]) => Promise<number>;
  onToggleElevenLabsKey: (id: string, currentStatus: string) => Promise<void>;
  onDeleteElevenLabsKey: (id: string) => Promise<void>;
  onAddVoice: (name: string, voiceId: string, status?: boolean) => Promise<void>;
  onToggleVoice: (id: string, currentStatus: boolean) => Promise<void>;
  onDeleteVoice: (id: string) => Promise<void>;
  onUpdateModelSettings: (settings: Partial<AIModelSettings>) => Promise<void>;
  onClearQueueLogs: () => void;
}

export default function AdminDashboard({
  lang, geminiKeys, flowAccounts, elevenlabsKeys, voices = [], queueTasks, modelSettings,
  onAddGeminiKey, onAddGeminiKeysBulk, onToggleGeminiKey, onDeleteGeminiKey,
  onAddFlowAccount, onUpdateFlowAccountCredit, onDeleteFlowAccount,
  onAddElevenLabsKey, onAddElevenLabsKeysBulk, onToggleElevenLabsKey, onDeleteElevenLabsKey,
  onAddVoice, onToggleVoice, onDeleteVoice,
  onUpdateModelSettings, onClearQueueLogs
}: Props) {
  const [activeTab, setActiveTab] = useState<"api-pool" | "models" | "queue">("api-pool");

  // Local Form state inputs
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyValue, setNewKeyValue] = useState("");
  
  const [newFlowName, setNewFlowName] = useState("");
  const [newFlowValue, setNewFlowValue] = useState("");
  const [newFlowCredit, setNewFlowCredit] = useState(100);

  const [newElName, setNewElName] = useState("");
  const [newElValue, setNewElValue] = useState("");

  const [newVoiceName, setNewVoiceName] = useState("");
  const [newVoiceId, setNewVoiceId] = useState("");

  // Bulk add modal states
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkTarget, setBulkTarget] = useState<"gemini" | "elevenlabs">("gemini");
  const [bulkKeysText, setBulkKeysText] = useState("");
  const [bulkToast, setBulkToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const handleBulkSubmit = async () => {
    if (!bulkKeysText.trim()) return;

    // Split rows
    const lines = bulkKeysText.split("\n");
    // Trim and filter empty
    const rawKeys = lines.map(k => k.trim()).filter(k => k !== "");
    // Deduplicate
    const uniqueKeys: string[] = Array.from(new Set(rawKeys));

    if (uniqueKeys.length === 0) {
      setBulkToast({
        message: lang === "vi" ? "Không tìm thấy API Key hợp lệ nào!" : "No valid API Keys found!",
        type: "error"
      });
      return;
    }

    // Build array of objects
    const keysToInsert = uniqueKeys.map((keyVal, idx) => ({
      name: bulkTarget === "gemini" 
        ? `Bulk Gemini Key #${idx + 1} (${new Date().toLocaleDateString()})`
        : `Bulk ElevenLabs Key #${idx + 1} (${new Date().toLocaleDateString()})`,
      apiKey: keyVal
    }));

    try {
      let addedCount = 0;
      if (bulkTarget === "gemini") {
        addedCount = await onAddGeminiKeysBulk(keysToInsert);
      } else {
        addedCount = await onAddElevenLabsKeysBulk(keysToInsert);
      }
      
      setBulkToast({
        message: lang === "vi" 
          ? `Đã thêm thành công ${addedCount} API Key mới!` 
          : `Successfully added ${addedCount} new API Keys!`,
        type: "success"
      });
      
      setBulkKeysText("");
      setIsBulkModalOpen(false);

      // Dismiss toast after 5s
      setTimeout(() => {
        setBulkToast(null);
      }, 5000);
    } catch (err: any) {
      setBulkToast({
        message: lang === "vi" ? "Lỗi khi thêm hàng loạt API Key!" : "Error adding bulk API Keys!",
        type: "error"
      });
    }
  };

  // Stats Card Calculations
  const activeKeysCount = geminiKeys.filter(k => k.status === "Active").length;
  const blockedKeysCount = geminiKeys.filter(k => k.status === "Blocked").length;
  const totalFlowCredits = flowAccounts.reduce((acc, f) => acc + f.credit, 0);
  const activeElKeysCount = elevenlabsKeys.filter(k => k.status === "Active").length;

  const handleSubmitKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName || !newKeyValue) return;
    onAddGeminiKey(newKeyName, newKeyValue);
    setNewKeyName("");
    setNewKeyValue("");
  };

  const handleSubmitFlow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFlowName || !newFlowValue) return;
    onAddFlowAccount(newFlowName, newFlowValue, newFlowCredit);
    setNewFlowName("");
    setNewFlowValue("");
    setNewFlowCredit(100);
  };

  const handleSubmitElevenLabs = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newElName || !newElValue) return;
    onAddElevenLabsKey(newElName, newElValue);
    setNewElName("");
    setNewElValue("");
  };

  const handleSubmitVoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVoiceName || !newVoiceId) return;
    onAddVoice(newVoiceName, newVoiceId, true);
    setNewVoiceName("");
    setNewVoiceId("");
  };

  return (
    <div className="space-y-6 relative z-10 font-sans text-slate-200">
      {/* Overview stats for admins */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-xl flex items-center gap-3">
          <div className="p-3 bg-[#34b1b3]/15 text-[#34b1b3] rounded-lg">
            <Key className="w-5 h-5 text-[#34b1b3]" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">
              API Pools (Gemini / 11L)
            </span>
            <h4 className="text-base font-bold text-white font-mono mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span>G: <span className="text-[#34b1b3]">{activeKeysCount}</span></span>
              <span className="text-white/20 font-normal">|</span>
              <span>11L: <span className="text-emerald-400">{activeElKeysCount}</span></span>
              <span className="text-white/20 font-normal">|</span>
              <span>V: <span className="text-amber-400">{voices.filter(v => v.status).length}</span></span>
            </h4>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-xl flex items-center gap-3">
          <div className="p-3 bg-indigo-500/15 text-indigo-400 rounded-lg">
            <Coins className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">
              Total Flow Credits
            </span>
            <h4 className="text-lg font-bold text-white mt-0.5 font-mono">{totalFlowCredits} <span className="text-xs text-slate-400">cr</span></h4>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-xl flex items-center gap-3">
          <div className="p-3 bg-purple-500/15 text-purple-400 rounded-lg">
            <Cpu className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">
              Active Task Queue
            </span>
            <h4 className="text-lg font-bold text-white mt-0.5 font-mono">
              {queueTasks.filter(t => t.status === "Pending" || t.status === "Processing").length} <span className="text-xs text-slate-400">running</span>
            </h4>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-xl flex items-center gap-3">
          <div className="p-3 bg-green-500/15 text-green-400 rounded-lg">
            <CheckCircle2 className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">
              Successful Tasks
            </span>
            <h4 className="text-lg font-bold text-white mt-0.5 font-mono text-emerald-400">
              {queueTasks.filter(t => t.status === "Completed").length} <span className="text-[10px] text-slate-400 font-sans">tasks</span>
            </h4>
          </div>
        </div>
      </div>

      {/* Navigation Sub-tab select */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-2.5 shadow-xl flex flex-wrap gap-2">
        <button
          onClick={() => setActiveTab("api-pool")}
          className={`px-4 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${activeTab === "api-pool" ? "bg-[#34b1b3] text-white shadow-md shadow-[#34b1b3]/25" : "text-slate-400 hover:text-white hover:bg-white/5"}`}
        >
          <Database className="w-4 h-4" />
          <span>{lang === "vi" ? "1. HỒ XOAY VÒNG API KEY (ACCOUNTS POOL)" : "1. REVOLVING API ACCOUNTS POOL"}</span>
        </button>

        <button
          onClick={() => setActiveTab("models")}
          className={`px-4 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${activeTab === "models" ? "bg-[#34b1b3] text-white shadow-md shadow-[#34b1b3]/25" : "text-slate-400 hover:text-white hover:bg-white/5"}`}
        >
          <Settings className="w-4 h-4" />
          <span>{lang === "vi" ? "2. CHỈ ĐỊNH MODEL MANAGER" : "2. MODEL ALLOCATIONS MASTER"}</span>
        </button>

        <button
          onClick={() => setActiveTab("queue")}
          className={`px-4 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${activeTab === "queue" ? "bg-[#34b1b3] text-white shadow-md shadow-[#34b1b3]/25" : "text-slate-400 hover:text-white hover:bg-white/5"}`}
        >
          <Terminal className="w-4 h-4" />
          <span>{lang === "vi" ? "3. GIÁM SÁT QUEUE MANAGER" : "3. REAL-TIME QUEUE MONITOR"}</span>
        </button>
      </div>

      {/* Sub-tab canvas panel */}
      {activeTab === "api-pool" && (
        <div className="space-y-4 animate-fade-in">
          {bulkToast && (
            <div className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 shadow-lg ${
              bulkToast.type === "success" 
                ? "bg-emerald-500/15 border-emerald-500/20 text-emerald-300" 
                : "bg-red-500/15 border-red-500/20 text-red-300"
            }`}>
              <div className="flex items-center gap-2">
                {bulkToast.type === "success" ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <XCircle className="w-4 h-4 text-red-400 shrink-0" />}
                <span className="font-medium">{bulkToast.message}</span>
              </div>
              <button 
                type="button"
                onClick={() => setBulkToast(null)}
                className="text-slate-450 hover:text-white transition-colors cursor-pointer"
              >
                <XCircle className="w-4 h-4 text-slate-400 hover:text-white" />
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Gemini Key Pool List */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-5 shadow-xl space-y-4 col-span-1">
            <div className="flex justify-between items-center pb-2 border-b border-white/10">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-display">
                <Key className="w-4 h-4 text-[#34b1b3]" />
                {lang === "vi" ? "Hộp Kênh Khóa API Gemini" : "Gemini Accounts Pool"}
              </span>
            </div>

            {/* List */}
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {geminiKeys.map((key) => (
                <div key={key.id} className="bg-black/20 rounded-lg p-3 border border-white/5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-white block">{key.name}</span>
                    <span className="font-mono text-[10px] text-slate-400 block mt-0.5">
                      Key: ••••••••••{key.apiKey.substring(Math.max(0, key.apiKey.length - 8))}
                    </span>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1 font-mono">
                      <span>{lang === "vi" ? "Dùng" : "Calls"}: <strong className="text-white">{key.usageCount}</strong></span>
                      <span>•</span>
                      <span className="text-red-400">{lang === "vi" ? "Lỗi" : "Error"}: <strong className="text-red-400 font-bold">{key.errorCount}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onToggleGeminiKey(key.id, key.status)}
                      className={`text-[10px] font-bold px-2 py-1 rounded border transition-all cursor-pointer ${key.status === "Active" ? "bg-green-500/15 text-green-400 border-green-500/20" : key.status === "Blocked" ? "bg-red-500/15 text-red-400 border-red-500/20" : "bg-white/5 text-slate-400 border-white/10"}`}
                    >
                      {key.status === "Active" ? (lang === "vi" ? "Bật" : "Active") : key.status === "Blocked" ? "Blocked" : (lang === "vi" ? "Tắt" : "Inactive")}
                    </button>
                    <button
                      onClick={() => onDeleteGeminiKey(key.id)}
                      className="p-1.5 hover:bg-white/10 rounded cursor-pointer text-slate-400 hover:text-red-400 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-slate-400 hover:text-red-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add form */}
            <form onSubmit={handleSubmitKey} className="bg-black/20 border border-white/5 rounded-lg p-3.5 space-y-2.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block font-mono">
                + {lang === "vi" ? "Bổ sung API Key mới" : "Inject New Key"}
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <input
                  type="text"
                  required
                  placeholder={lang === "vi" ? "Tên đại diện..." : "Identifier name..."}
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="rounded p-2.5 bg-black/30 border border-white/10 focus:outline-none focus:border-[#34b1b3] text-white"
                />
                <input
                  type="password"
                  required
                  placeholder="AIzaSy..."
                  value={newKeyValue}
                  onChange={(e) => setNewKeyValue(e.target.value)}
                  className="rounded p-2.5 bg-black/30 border border-white/10 focus:outline-none focus:border-[#34b1b3] text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="submit"
                  className="bg-[#34b1b3] hover:bg-[#2db3b5] text-white text-xs font-bold rounded py-2 transition-all cursor-pointer shadow-md shadow-[#34b1b3]/25"
                >
                  {lang === "vi" ? "Đưa vào hồ xoay" : "Save Single"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBulkTarget("gemini");
                    setIsBulkModalOpen(true);
                  }}
                  className="bg-transparent hover:bg-white/5 text-[#34b1b3] border border-[#34b1b3]/50 hover:border-[#34b1b3] text-xs font-bold rounded py-2 transition-all cursor-pointer"
                >
                  {lang === "vi" ? "Thêm hàng loạt ⚡" : "Bulk Add ⚡"}
                </button>
              </div>
            </form>
          </div>

          {/* ElevenLabs Key Pool List */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-5 shadow-xl space-y-4 col-span-1">
            <div className="flex justify-between items-center pb-2 border-b border-white/10">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-display">
                <Key className="w-4 h-4 text-emerald-400" />
                {lang === "vi" ? "Hộp Kênh Khóa API ElevenLabs" : "ElevenLabs Accounts Pool"}
              </span>
            </div>

            {/* List */}
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {elevenlabsKeys.map((key) => (
                <div key={key.id} className="bg-black/20 rounded-lg p-3 border border-white/5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-white block">{key.name}</span>
                    <span className="font-mono text-[10px] text-slate-400 block mt-0.5">
                      Key: ••••••••••{key.apiKey.substring(Math.max(0, key.apiKey.length - 8))}
                    </span>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1 font-mono">
                      <span>{lang === "vi" ? "Dùng" : "Calls"}: <strong className="text-white">{key.usageCount || 0}</strong></span>
                      <span>•</span>
                      <span className="text-red-400">{lang === "vi" ? "Lỗi" : "Error"}: <strong className="text-red-400 font-bold">{key.errorCount || 0}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onToggleElevenLabsKey(key.id, key.status)}
                      className={`text-[10px] font-bold px-2 py-1 rounded border transition-all cursor-pointer ${key.status === "Active" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" : "bg-white/5 text-slate-400 border-white/10"}`}
                    >
                      {key.status === "Active" ? (lang === "vi" ? "Bật" : "Active") : (lang === "vi" ? "Tắt" : "Inactive")}
                    </button>
                    <button
                      onClick={() => onDeleteElevenLabsKey(key.id)}
                      className="p-1.5 hover:bg-white/10 rounded cursor-pointer text-slate-400 hover:text-red-400 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-slate-400 hover:text-red-400" />
                    </button>
                  </div>
                </div>
              ))}
              {elevenlabsKeys.length === 0 && (
                <div className="text-center text-slate-500 p-8 font-mono text-[10px]">
                  {lang === "vi" ? "Chưa có API Key ElevenLabs nào." : "No ElevenLabs API Keys found."}
                </div>
              )}
            </div>

            {/* Add form */}
            <form onSubmit={handleSubmitElevenLabs} className="bg-black/20 border border-white/5 rounded-lg p-3.5 space-y-2.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block font-mono">
                + {lang === "vi" ? "Bổ sung API Key ElevenLabs mới" : "Inject New ElevenLabs Key"}
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <input
                  type="text"
                  required
                  placeholder={lang === "vi" ? "Tên đại diện..." : "Identifier name..."}
                  value={newElName}
                  onChange={(e) => setNewElName(e.target.value)}
                  className="rounded p-2.5 bg-black/30 border border-white/10 focus:outline-none focus:border-emerald-500 text-white"
                />
                <input
                  type="password"
                  required
                  placeholder="eleven_key..."
                  value={newElValue}
                  onChange={(e) => setNewElValue(e.target.value)}
                  className="rounded p-2.5 bg-black/30 border border-white/10 focus:outline-none focus:border-emerald-500 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded py-2 transition-all cursor-pointer shadow-md shadow-emerald-500/25"
                >
                  {lang === "vi" ? "Đưa vào hồ xoay" : "Save Single"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBulkTarget("elevenlabs");
                    setIsBulkModalOpen(true);
                  }}
                  className="bg-transparent hover:bg-white/5 text-emerald-400 border border-emerald-500/50 hover:border-emerald-400 text-xs font-bold rounded py-2 transition-all cursor-pointer"
                >
                  {lang === "vi" ? "Thêm hàng loạt ⚡" : "Bulk Add ⚡"}
                </button>
              </div>
            </form>
          </div>

          {/* Flow Account Manager List */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-5 shadow-xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-white/10">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-display">
                <HardDrive className="w-4 h-4 text-purple-400" />
                {lang === "vi" ? "Tài khoản Kết nối Flow render" : "Flow Account Credit Hub"}
              </span>
            </div>

            {/* List */}
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {flowAccounts.map((acc) => (
                <div key={acc.id} className="bg-black/20 rounded-lg p-3 border border-white/5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-white block">{acc.name}</span>
                    <span className="font-mono text-[10px] text-slate-400 block mt-0.5">
                      Token: ••••••••••{acc.apiKey.substring(acc.apiKey.length - 8)}
                    </span>
                    <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-1 font-mono">
                      <span className="flex items-center gap-1">
                        🔑 Credit còn dư: <strong className="text-orange-400 block">{acc.credit} cr</strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onUpdateFlowAccountCredit(acc.id, acc.credit + 50)}
                      className="p-1 px-2 hover:bg-orange-500 hover:text-white transition-all text-[10px] text-orange-400 font-bold border border-orange-500/20 rounded cursor-pointer"
                    >
                      +50 c
                    </button>
                    <button
                      onClick={() => onDeleteFlowAccount(acc.id)}
                      className="p-1.5 hover:bg-white/10 rounded cursor-pointer text-slate-400 hover:text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-slate-400 hover:text-red-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Flow list form */}
            <form onSubmit={handleSubmitFlow} className="bg-black/20 border border-white/5 rounded-lg p-3.5 space-y-2.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block font-mono">
                + {lang === "vi" ? "Kết nối Tài khoản Flow mới" : "Link New Flow Account"}
              </span>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <input
                  type="text"
                  required
                  placeholder="Tên đại diện..."
                  value={newFlowName}
                  onChange={(e) => setNewFlowName(e.target.value)}
                  className="rounded p-2 bg-black/30 border border-white/10 text-white col-span-1 focus:outline-none focus:border-[#34b1b3]"
                />
                <input
                  type="password"
                  required
                  placeholder="flow_ak_..."
                  value={newFlowValue}
                  onChange={(e) => setNewFlowValue(e.target.value)}
                  className="rounded p-2 bg-black/30 border border-white/10 text-white col-span-1 focus:outline-none focus:border-[#34b1b3]"
                />
                <input
                  type="number"
                  required
                  placeholder="Credit..."
                  value={newFlowCredit}
                  onChange={(e) => setNewFlowCredit(parseInt(e.target.value) || 100)}
                  className="rounded p-2 bg-black/30 border border-white/10 text-white col-span-1 focus:outline-none focus:border-[#34b1b3]"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-[#34b1b3] text-white text-xs font-bold rounded py-2 hover:bg-[#2db3b5] transition-all cursor-pointer shadow-md shadow-[#34b1b3]/25"
              >
                {lang === "vi" ? "Lưu tài khoản Flow" : "Save and allocate Flow"}
              </button>
            </form>
          </div>

          {/* AI Voices Manager List */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-5 shadow-xl space-y-4 col-span-1">
            <div className="flex justify-between items-center pb-2 border-b border-white/10">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-display">
                <Zap className="w-4 h-4 text-amber-400" />
                {lang === "vi" ? "Danh sách Giọng đọc AI" : "AI Voices Database"}
              </span>
            </div>

            {/* List */}
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {voices.map((v) => (
                <div key={v.id} className="bg-black/20 rounded-lg p-3 border border-white/5 flex items-center justify-between text-xs">
                  <div className="min-w-0 flex-1 pr-2">
                    <span className="font-bold text-white block truncate">{v.name}</span>
                    <span className="font-mono text-[10px] text-slate-400 block mt-0.5 truncate">
                      ID: {v.voiceId}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onToggleVoice(v.id, v.status)}
                      className={`text-[10px] font-bold px-2 py-1 rounded border transition-all cursor-pointer ${v.status ? "bg-amber-500/15 text-amber-400 border-amber-500/20" : "bg-white/5 text-slate-400 border-white/10"}`}
                    >
                      {v.status ? (lang === "vi" ? "Bật" : "Active") : (lang === "vi" ? "Tắt" : "Inactive")}
                    </button>
                    <button
                      onClick={() => onDeleteVoice(v.id)}
                      className="p-1.5 hover:bg-white/10 rounded cursor-pointer text-slate-400 hover:text-red-400 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-slate-400 hover:text-red-400" />
                    </button>
                  </div>
                </div>
              ))}
              {voices.length === 0 && (
                <div className="text-center text-slate-500 p-8 font-mono text-[10px]">
                  {lang === "vi" ? "Chưa có Giọng đọc AI nào." : "No AI Voices found."}
                </div>
              )}
            </div>

            {/* Add form */}
            <form onSubmit={handleSubmitVoice} className="bg-black/20 border border-white/5 rounded-lg p-3.5 space-y-2.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block font-mono">
                + {lang === "vi" ? "Thêm Giọng đọc AI mới" : "Add New AI Voice"}
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <input
                  type="text"
                  required
                  placeholder={lang === "vi" ? "Tên (Bella - Nữ)..." : "Name (e.g. Bella)..."}
                  value={newVoiceName}
                  onChange={(e) => setNewVoiceName(e.target.value)}
                  className="rounded p-2.5 bg-black/30 border border-white/10 focus:outline-none focus:border-amber-400 text-white"
                />
                <input
                  type="text"
                  required
                  placeholder={lang === "vi" ? "Voice ID ElevenLabs..." : "Voice ID..."}
                  value={newVoiceId}
                  onChange={(e) => setNewVoiceId(e.target.value)}
                  className="rounded p-2.5 bg-black/30 border border-white/10 focus:outline-none focus:border-amber-400 text-white"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded py-2 transition-all cursor-pointer shadow-md shadow-amber-500/25"
              >
                {lang === "vi" ? "Lưu giọng nói vào DB" : "Save Voice to DB"}
              </button>
            </form>
          </div>
        </div>
        </div>
      )}

      {/* Model allocate system */}
      {activeTab === "models" && (
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-5 shadow-xl space-y-6">
          <span className="text-xs font-bold text-white uppercase tracking-wider block pb-2 border-b border-white/10">
            🤖 {lang === "vi" ? "Chỉ định Mô hình cho Tác Vụ" : "Task AI allocations"}
          </span>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-sans">
            {/* Field 1: Script model mapping */}
            <div className="space-y-2 border border-white/5 rounded-lg p-4 bg-black/20">
              <label className="font-bold text-white block text-xs">
                {lang === "vi" ? "Kịch bản (Script Task Model)" : "AI Expert Script Model"}
              </label>
              <span className="text-[10px] text-slate-400 block mb-2 leading-relaxed">
                Chỉ định mô hình bậc cao để nghiên cứu tệp khách hàng mục tiêu, tìm painpoint thầm kín và biên soạn kịch bản.
              </span>
              <select
                value={modelSettings.scriptModel}
                onChange={(e) => onUpdateModelSettings({ scriptModel: e.target.value })}
                className="w-full bg-black/40 border border-white/10 p-2.5 rounded-md text-xs font-semibold focus:outline-none focus:border-[#34b1b3] text-white"
              >
                <option value="gemini-3.1-pro-preview" className="bg-slate-900 text-white">Gemini 3.1 Pro (Bậc cao / Phân tích sâu)</option>
                <option value="gemini-3.5-flash" className="bg-slate-900 text-white">Gemini 3.5 Flash (Tìm nhanh / Toàn bộ rà soát)</option>
                <option value="gemini-3.1-flash-lite" className="bg-slate-900 text-white">Gemini 3.1 Flash Lite (Lite / Tiết kiệm)</option>
              </select>
            </div>

            {/* Field 2: Scene decomp model mapping */}
            <div className="space-y-2 border border-white/5 rounded-lg p-4 bg-black/20">
              <label className="font-bold text-white block text-xs">
                {lang === "vi" ? "Bóc tách phân cảnh (Scene & Prompt Model)" : "Decomposition & prompt Builder"}
              </label>
              <span className="text-[10px] text-slate-400 block mb-2 leading-relaxed">
                Sử dụng các mô hình có độ trễ cực thấp để bóc tách các phân đoạn, thiết kế lời thoại và cấu trúc prompts tiếng Anh.
              </span>
              <select
                value={modelSettings.sceneModel}
                onChange={(e) => onUpdateModelSettings({ sceneModel: e.target.value })}
                className="w-full bg-black/40 border border-white/10 p-2.5 rounded-md text-xs font-semibold focus:outline-none focus:border-[#34b1b3] text-white"
              >
                <option value="gemini-3.5-flash" className="bg-slate-900 text-white">Gemini 3.5 Flash (Tốc độ tối cao / Tiện lợi)</option>
                <option value="gemini-3.1-pro-preview" className="bg-slate-900 text-white">Gemini 3.1 Pro (Sáng tạo chi tiết lớn)</option>
                <option value="gemini-3.1-flash-lite" className="bg-slate-900 text-white">Gemini 3.1 Flash Lite (Siêu gọn / Tự động)</option>
              </select>
            </div>
          </div>

          {/* Retry parameters configuration */}
          <div className="border border-white/5 rounded-lg p-4 bg-black/20 text-xs">
            <span className="font-bold text-white block mb-3">🛠️ Parameters & Retry Rotations Strategy</span>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1 font-mono">Max Retry attempts</label>
                <input
                  type="number"
                  value={modelSettings.maxRetries}
                  onChange={(e) => onUpdateModelSettings({ maxRetries: parseInt(e.target.value) || 3 })}
                  className="w-full bg-black/30 border border-white/10 focus:outline-none focus:border-[#34b1b3] rounded p-2 text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1 font-mono">Retry Interval Delay (ms)</label>
                <input
                  type="number"
                  value={modelSettings.retryDelayMs}
                  onChange={(e) => onUpdateModelSettings({ retryDelayMs: parseInt(e.target.value) || 1000 })}
                  className="w-full bg-black/30 border border-white/10 focus:outline-none focus:border-[#34b1b3] rounded p-2 text-white font-mono"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Queue Task logs viewer */}
      {activeTab === "queue" && (
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-white/10">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-display">
              <Terminal className="w-4 h-4 text-[#34b1b3]" />
              {lang === "vi" ? "Kiểm tra tiến trình hàng chờ (Simulated Database)" : "Background Task Table monitor"}
            </span>
            <button
              onClick={onClearQueueLogs}
              className="text-[10px] font-bold text-red-400 hover:text-red-300 hover:underline flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              <span>{lang === "vi" ? "Xóa lịch sử tasks" : "Clear task logs catalog"}</span>
            </button>
          </div>

          <div className="overflow-x-auto text-xs">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-white/[0.02] text-slate-400 border-b border-white/10 font-bold text-[10px] uppercase tracking-wider">
                  <th className="p-3">Task ID</th>
                  <th className="p-3">Project</th>
                  <th className="p-3">{lang === "vi" ? "Công việc" : "Task Type"}</th>
                  <th className="p-3">{lang === "vi" ? "Trạng thái" : "Status"}</th>
                  <th className="p-3">{lang === "vi" ? "Tiến độ" : "Progress"}</th>
                  <th className="p-3">{lang === "vi" ? "Thời lượng" : "Timing"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {queueTasks.map((t) => (
                  <tr key={t.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-3 font-mono text-[10px] font-semibold text-slate-400">#{t.id}</td>
                    <td className="p-3 font-semibold text-white font-mono">proj-{t.projectId}</td>
                    <td className="p-3">
                      <span className="bg-blue-500/15 text-blue-300 px-2.5 py-1 border border-blue-500/20 rounded text-[10px] font-bold uppercase font-mono">
                        {t.taskType}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${t.status === "Completed" ? "bg-green-500/15 text-green-400 border border-green-500/20" : t.status === "Processing" ? "bg-yellow-500/15 text-yellow-400 border border-yellow-500/20 animate-pulse" : t.status === "Failed" ? "bg-red-500/15 text-red-400 border border-red-500/20" : "bg-white/5 text-slate-400"}`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-white font-mono">{t.progress}%</td>
                    <td className="p-3 text-slate-400 text-[10px] font-mono">
                      {new Date(t.createdAt).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
                {queueTasks.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center text-slate-450 p-8 font-sans">
                      {lang === "vi" ? "Chưa có tác vụ nào chạy trong Hàng chờ hệ thống." : "Humble queues are vacant today."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bulk Add Modal */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-[#121214] border border-white/10 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-[#34b1b3]" />
                <span>{lang === "vi" ? "Thêm Hàng Loạt API Key" : "Bulk Add Gemini API Keys"}</span>
              </h3>
              <button 
                onClick={() => setIsBulkModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              {lang === "vi" 
                ? "Nhập danh sách API Key của bạn bên dưới, mỗi dòng một key. Hệ thống sẽ tự động tách dòng, làm sạch khoảng trắng và loại bỏ các khóa trùng lặp."
                : "Enter your list of API Keys below, one key per line. The system will split, trim, and deduplicate them automatically."}
            </p>

            <textarea
              rows={8}
              value={bulkKeysText}
              onChange={(e) => setBulkKeysText(e.target.value)}
              placeholder={lang === "vi" 
                ? "Nhập danh sách API Key, mỗi key một dòng...\nAIzaSyB...\nAIzaSyC..." 
                : "Enter list of API Keys, one per line...\nAIzaSyB...\nAIzaSyC..."}
              className="w-full rounded-xl p-3 bg-black/40 border border-white/10 text-xs font-mono focus:outline-none focus:border-[#34b1b3] text-white placeholder-slate-500 overflow-y-auto scrollbar-thin"
            />

            <div className="flex justify-end gap-2 text-xs font-semibold pt-2">
              <button
                onClick={() => {
                  setBulkKeysText("");
                  setIsBulkModalOpen(false);
                }}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-slate-300 hover:text-white cursor-pointer transition-all"
              >
                {lang === "vi" ? "Hủy bỏ" : "Cancel"}
              </button>
              <button
                onClick={handleBulkSubmit}
                disabled={!bulkKeysText.trim()}
                className={`px-4 py-2 bg-[#34b1b3] hover:bg-[#2db3b5] text-white rounded-lg cursor-pointer transition-all flex items-center gap-1.5 shadow-md shadow-[#34b1b3]/20 ${!bulkKeysText.trim() ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{lang === "vi" ? "Xác nhận thêm" : "Confirm and Add"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
