import React from "react";
import { Copy, Check, Server, Database, Layers, Cpu, Code2 } from "lucide-react";

interface Props {
  lang: "vi" | "en";
}

export default function TechStackBoilerplate({ lang }: Props) {
  const [copiedSection, setCopiedSection] = React.useState<string | null>(null);

  const handleCopy = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const schemaCode = `
-- ===================================================
-- DATABASE SCHEMA: ACCOUNT POOLS & PROJECTS MODEL
-- ===================================================

-- 1. Gemini AI API Key Pool
CREATE TABLE gemini_api_keys (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    api_key VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'Active', -- 'Active', 'Inactive', 'Blocked'
    usage_count INT DEFAULT 0,
    error_count INT DEFAULT 0,
    last_used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Flow Image & Video Render Account Pool
CREATE TABLE flow_accounts (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    api_key VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'Active', -- 'Active', 'Exhausted', 'Error'
    credit INT DEFAULT 100,              -- Remaining API render credits
    usage_count INT DEFAULT 0,
    last_used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Projects Management
CREATE TABLE projects (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    industry_id VARCHAR(50),
    content_type VARCHAR(100),
    product_name VARCHAR(150) NOT NULL,
    product_category VARCHAR(100),
    product_info TEXT,
    ai_language VARCHAR(10) DEFAULT 'vi',
    goal TEXT,
    tone VARCHAR(100),
    style VARCHAR(100),
    expert_role VARCHAR(150),
    cta TEXT,
    image_references JSON,               -- Array of image URLs/IDs
    status VARCHAR(50) DEFAULT 'Draft', -- 'Draft', 'Script Ready', 'Assets Ready', 'Completed'
    script_title VARCHAR(255),
    script_content TEXT,
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Script Versions Audit Log
CREATE TABLE script_versions (
    id SERIAL PRIMARY KEY,
    project_id VARCHAR(50) REFERENCES projects(id) ON DELETE CASCADE,
    version INT NOT NULL,
    title VARCHAR(255),
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Scenes Breakdown Details
CREATE TABLE project_scenes (
    id VARCHAR(50) PRIMARY KEY,
    project_id VARCHAR(50) REFERENCES projects(id) ON DELETE CASCADE,
    scene_number INT NOT NULL,
    description_vi TEXT,
    description_en TEXT,
    prompt_image TEXT,
    prompt_video TEXT,
    voice_script_vi TEXT,
    voice_script_en TEXT,
    image_url TEXT,
    video_url TEXT,
    voice_audio_url TEXT,
    status VARCHAR(20) DEFAULT 'Pending', -- 'Pending', 'Generating', 'Completed', 'Failed'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Background Processing Queue Task Logs
CREATE TABLE queue_tasks (
    id VARCHAR(50) PRIMARY KEY,
    project_id VARCHAR(50) REFERENCES projects(id) ON DELETE CASCADE,
    task_type VARCHAR(50) NOT NULL,       -- 'Script', 'Scenes', 'ImageGen', 'VideoGen'
    status VARCHAR(20) DEFAULT 'Pending', -- 'Pending', 'Processing', 'Completed', 'Failed'
    progress INT DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP
);

-- 7. Task Log Append Line Entries
CREATE TABLE queue_task_logs (
    id SERIAL PRIMARY KEY,
    task_id VARCHAR(50) REFERENCES queue_tasks(id) ON DELETE CASCADE,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    level VARCHAR(15) DEFAULT 'info',     -- 'info', 'warn', 'error', 'success'
    message TEXT NOT NULL
);
`;

  const retryCode = `
import { GoogleGenAI } from "@google/genai";

interface ApiKey {
  id: string;
  name: string;
  key: string;
  status: "Active" | "Blocked" | "Inactive";
  errorCount: number;
}

/**
 * Executes a Gemini function with an API Key Pool and custom retry strategy.
 * For each request, it:
 * 1. Checks out an active API Key from the pool.
 * 2. Tries the operation up to 'maxRetries' (default 3) per key.
 * 3. On failure (e.g., ResourceExhausted, InvalidApiKey, or network error):
 *    - Updates the error count in the pool database.
 *    - Temporarily disables/blocks key if it fails with invalid key errors.
 *    - Rotates to the next active API Key in the pool.
 *    - Retries.
 * 4. Logs all actions for real-time visibility.
 */
export async function executeGeminiWithRotationAndRetry(
  prompt: string,
  systemInstruction: string,
  modelName: string = "gemini-3.5-flash",
  keysPool: ApiKey[],
  onLog: (msg: string, type: "info" | "warn" | "error" | "success") => void
): Promise<string> {
  const activeKeys = keysPool.filter(k => k.status === "Active");
  
  if (activeKeys.length === 0) {
    onLog("🚨 No active keys found in the pool! Aborting request.", "error");
    throw new Error("ERR_POOL_EMPTY");
  }

  let lastError: any = null;
  const maxRetries = 3;

  for (let keyIdx = 0; keyIdx < activeKeys.length; keyIdx++) {
    const currentKey = activeKeys[keyIdx];
    onLog(\`🔄 Rotating key Pool: Selected [\${currentKey.name}]\`, "info");

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        onLog(\`📡 Calling \${modelName} [Attempt \${attempt}/\${maxRetries}]...\`, "info");
        
        // Initialize the standard @google/genai client
        const ai = new GoogleGenAI({
          apiKey: currentKey.key,
          httpOptions: { headers: { "User-Agent": "aistudio-build" } }
        });

        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            systemInstruction: systemInstruction,
            temperature: 0.7
          }
        });

        if (response?.text) {
          onLog(\`🎉 Success! Response fetched from \${modelName}\`, "success");
          return response.text;
        } else {
          throw new Error("Empty response returned from Gemini API");
        }
      } catch (err: any) {
        lastError = err;
        const errorDesc = err.message || JSON.stringify(err);
        
        onLog(\`❌ Attempt \${attempt} failed. Error: \${errorDesc.substring(0, 100)}\`, "warn");
        currentKey.errorCount += 1;

        // Auto disable if credentials are majorly invalid
        if (errorDesc.includes("not valid") || errorDesc.includes("403") || errorDesc.includes("unauthorized")) {
          currentKey.status = "Blocked";
          onLog(\`🚫 Key \${currentKey.name} automatically BLOCKED due to Invalid Credentials.\`, "error");
          // Break attempt loop to rotate key immediately
          break;
        }

        // Wait interval before next attempt
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      }
    }
  }

  onLog("🚨 All API keys in the revolving pool have failed!", "error");
  throw lastError || new Error("ALL_KEYS_EXHAUSTED");
}

/**
 * Flow Account rotation logic block for Image/Video rendering
 */
export function rotateFlowAccountCredits(
  accounts: { name: string; credit: number; status: string }[],
  cost: number,
  onLog: (msg: string) => void
) {
  const activeAcc = accounts.find(a => a.status === "Active" && a.credit >= cost);
  if (activeAcc) {
    activeAcc.credit -= cost;
    onLog(\`⚡ [Flow] Account \${activeAcc.name} charged \${cost} credits. New balance: \${activeAcc.credit}\`);
    return activeAcc;
  }
  
  onLog("⚠️ Active Flow Account out of credit! Executing automatic fallback key search...");
  const fallback = accounts.find(a => a.credit >= cost);
  if (fallback) {
    fallback.status = "Active";
    fallback.credit -= cost;
    onLog(\`🛡️ [Flow Key Rotation] Rotated to backup: \${fallback.name}. Charged \${cost} credits.\`);
    return fallback;
  }

  throw new Error("CRITICAL_FLOW_CREDIT_DEPTH_EXHAUSTED");
}
`;

  return (
    <div id="tech-boilerplate" className="bg-[#1e1e24] text-white rounded-xl p-6 border border-gray-800 shadow-2xl max-w-5xl mx-auto my-4">
      {/* Title section */}
      <div className="flex items-center gap-3 border-b border-gray-800 pb-4 mb-6">
        <Code2 className="text-[#34b1b3] w-8 h-8" />
        <div>
          <h2 className="text-xl font-bold tracking-tight">
            {lang === "vi" 
              ? "Đề Xuất Hệ Bản Vẽ Kỹ Thuật (Tech Stack & Pools Architecture)" 
              : "Technical Proposal Stack & Pools Architecture"}
          </h2>
          <p className="text-xs text-gray-400">
            {lang === "vi" 
              ? "Cung cấp Tech Stack chuẩn, Lược đồ database Postgres, và thuật toán Xoay vòng khóa API."
              : "Proposing production-ready Tech Stack, database schemas, and API key rotator script."}
          </p>
        </div>
      </div>

      {/* Recommended Tech Stack Grid */}
      <h3 className="text-sm font-semibold uppercase text-gray-400 mb-3 tracking-wider">
        {lang === "vi" ? "1. ĐỀ XUẤT CÔNG NGHỆ CHUẨN XÁC (SaaS ENTERPRISE)" : "1. RECOMMENDED ENTERPRISE TECH STACK"}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#121216] p-4 rounded-lg border border-gray-850 hover:border-[#34b1b3]/40 transition-all">
          <div className="flex items-center gap-2 mb-2 text-[#34b1b3]">
            <Layers className="w-5 h-5" />
            <h4 className="font-semibold text-sm">Frontend Tier</h4>
          </div>
          <ul className="text-xs text-gray-300 space-y-1.5 list-disc pl-4">
            <li>React 19 + TypeScript 5</li>
            <li>Tailwind CSS v4 Engine</li>
            <li>Motion animations for smoothness</li>
            <li>Recharts for analytic dashboards</li>
          </ul>
        </div>

        <div className="bg-[#121216] p-4 rounded-lg border border-gray-850 hover:border-[#34b1b3]/40 transition-all">
          <div className="flex items-center gap-2 mb-2 text-[#34b1b3]">
            <Server className="w-5 h-5" />
            <h4 className="font-semibold text-sm">Backend Tier</h4>
          </div>
          <ul className="text-xs text-gray-300 space-y-1.5 list-disc pl-4">
            <li>Node.js NestJS (or Express)</li>
            <li>@google/genai SDK Core</li>
            <li>Fastify as engine (Optional)</li>
            <li>Winston highly detailed logging</li>
          </ul>
        </div>

        <div className="bg-[#121216] p-4 rounded-lg border border-gray-850 hover:border-[#34b1b3]/40 transition-all">
          <div className="flex items-center gap-2 mb-2 text-[#34b1b3]">
            <Database className="w-5 h-5" />
            <h4 className="font-semibold text-sm">Database Tier</h4>
          </div>
          <ul className="text-xs text-gray-300 space-y-1.5 list-disc pl-4">
            <li>PostgreSQL for structured data</li>
            <li>Drizzle ORM or Prisma Client</li>
            <li>Redis for session storage</li>
            <li>MinIO/AWS S3 for assets hosting</li>
          </ul>
        </div>

        <div className="bg-[#121216] p-4 rounded-lg border border-gray-850 hover:border-[#34b1b3]/40 transition-all">
          <div className="flex items-center gap-2 mb-2 text-[#34b1b3]">
            <Cpu className="w-5 h-5" />
            <h4 className="font-semibold text-sm">Queue Tier</h4>
          </div>
          <ul className="text-xs text-gray-300 space-y-1.5 list-disc pl-4">
            <li>BullMQ (Node.js fast queue)</li>
            <li>Redis-backed durable streams</li>
            <li>Concurrency tuning: 3 workers</li>
            <li>Webhook callbacks for status updates</li>
          </ul>
        </div>
      </div>

      {/* DB Schema Code Box */}
      <div className="mb-8">
        <div className="flex justify-between items-center bg-[#15151b] px-4 py-2 rounded-t-lg border-t border-x border-gray-800">
          <div className="flex items-center gap-2 text-xs font-mono text-[#34b1b3]">
            <Database className="w-4 h-4" />
            <span>postgresql_schema.sql</span>
          </div>
          <button
            onClick={() => handleCopy(schemaCode, "schema")}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-[#34b1b3] transition-colors"
          >
            {copiedSection === "schema" ? (
              <>
                <Check className="w-3.5 h-3.5 text-green-400" />
                <span className="text-green-400">{lang === "vi" ? "Đã chép" : "Copied"}</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>{lang === "vi" ? "Sao chép" : "Copy"}</span>
              </>
            )}
          </button>
        </div>
        <div className="bg-[#0f0f13] rounded-b-lg border border-gray-800 p-4 max-h-72 overflow-y-auto font-mono text-xs text-green-300 leading-relaxed whitespace-pre scrollbar-thin">
          {schemaCode}
        </div>
      </div>

      {/* Rotating retry boilerplate Code Box */}
      <div>
        <div className="flex justify-between items-center bg-[#15151b] px-4 py-2 rounded-t-lg border-t border-x border-gray-800">
          <div className="flex items-center gap-2 text-xs font-mono text-[#34b1b3]">
            <Cpu className="w-4 h-4" />
            <span>GeminiPoolRetryStrategy.ts</span>
          </div>
          <button
            onClick={() => handleCopy(retryCode, "retry")}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-[#34b1b3] transition-colors"
          >
            {copiedSection === "retry" ? (
              <>
                <Check className="w-3.5 h-3.5 text-green-400" />
                <span className="text-green-400">{lang === "vi" ? "Đã chép" : "Copied"}</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>{lang === "vi" ? "Sao chép" : "Copy"}</span>
              </>
            )}
          </button>
        </div>
        <div className="bg-[#0f0f13] rounded-b-lg border border-gray-800 p-4 max-h-72 overflow-y-auto font-mono text-xs text-yellow-100 leading-relaxed whitespace-pre scrollbar-thin">
          {retryCode}
        </div>
      </div>
    </div>
  );
}
