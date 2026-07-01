import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Load environment variables
const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_ANON_KEY || "";

let supabase: SupabaseClient | null = null;

if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log("🌐 Connected to Supabase Client successfully.");
  } catch (err) {
    console.warn("⚠️ Notice: Could not initialize Supabase client:", err);
  }
} else {
  console.log("⚠️ Supabase environment variables not defined. Falling back to in-memory persistence.");
}

export function getSupabase() {
  return supabase;
}

// SQL helper for the user to copy/paste in their Supabase SQL Editor
export const SQL_SCHEMA_SETUP = `-- ====================================================================
-- CHẠY TRUY VẤN NÀY TRONG SUPABASE SQL EDITOR ĐỂ KHỞI TẠO BẢNG & PHÂN QUYỀN RLS
-- ====================================================================

-- 1. Tạo bảng projects_supabase (Sử dụng cột image_references JSONB lưu danh sách ảnh mẫu)
CREATE TABLE IF NOT EXISTS projects_supabase (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_name VARCHAR(255) NOT NULL,
  industry VARCHAR(255),
  category VARCHAR(255),
  product_details TEXT,
  word_count VARCHAR(50),
  goal TEXT,
  tone VARCHAR(100),
  style VARCHAR(100),
  expert_role VARCHAR(255),
  cta TEXT,
  status VARCHAR(50) DEFAULT 'Draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Các trường mở rộng khác phục vụ lưu trạng thái ứng dụng
  content_type VARCHAR(255),
  product_name VARCHAR(255),
  ai_language VARCHAR(50),
  script_title TEXT,
  script_content TEXT,
  script_version_count INT DEFAULT 0,
  versions JSONB DEFAULT '[]'::jsonb,
  scenes JSONB DEFAULT '[]'::jsonb,
  is_archived BOOLEAN DEFAULT FALSE,
  image_references JSONB DEFAULT '[]'::jsonb,
  image_seed INT,
  voice_id VARCHAR(100) DEFAULT 'EXAVITQu4vr4xnSDxMaL',
  include_dialogue BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Bật tính năng Row Level Security (RLS) cho bảng projects_supabase
ALTER TABLE projects_supabase ENABLE ROW LEVEL SECURITY;

-- 3. Tạo các chính sách bảo mật (Policies) cho phép thao tác vô danh công khai (Public/Anonymous)
DROP POLICY IF EXISTS "Allow public select" ON projects_supabase;
CREATE POLICY "Allow public select" ON projects_supabase 
  FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Allow public insert" ON projects_supabase;
CREATE POLICY "Allow public insert" ON projects_supabase 
  FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update" ON projects_supabase;
CREATE POLICY "Allow public update" ON projects_supabase 
  FOR UPDATE TO public USING (true);

DROP POLICY IF EXISTS "Allow public delete" ON projects_supabase;
CREATE POLICY "Allow public delete" ON projects_supabase 
  FOR DELETE TO public USING (true);

-- 4. Tạo thư mục lưu trữ Storage Bucket 'reference_images' nếu chưa tồn tại
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('reference_images', 'reference_images', true, 5242880)
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 5242880;

-- 5. Cấp quyền upload và đọc công khai cho Storage Bucket 'reference_images'
DROP POLICY IF EXISTS "Allow public select on reference_images" ON storage.objects;
CREATE POLICY "Allow public select on reference_images" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'reference_images');

DROP POLICY IF EXISTS "Allow public insert on reference_images" ON storage.objects;
CREATE POLICY "Allow public insert on reference_images" ON storage.objects
  FOR INSERT TO public WITH CHECK (bucket_id = 'reference_images');

DROP POLICY IF EXISTS "Allow public update on reference_images" ON storage.objects;
CREATE POLICY "Allow public update on reference_images" ON storage.objects
  FOR UPDATE TO public USING (bucket_id = 'reference_images');

DROP POLICY IF EXISTS "Allow public delete on reference_images" ON storage.objects;
CREATE POLICY "Allow public delete on reference_images" ON storage.objects
  FOR DELETE TO public USING (bucket_id = 'reference_images');

-- 6. Tạo bảng gemini_accounts quản lý pool API key
CREATE TABLE IF NOT EXISTS gemini_accounts (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  api_key TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'Active',
  usage_count INT DEFAULT 0,
  error_count INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Bật RLS cho gemini_accounts
ALTER TABLE gemini_accounts ENABLE ROW LEVEL SECURITY;

-- Tạo chính sách cho gemini_accounts
DROP POLICY IF EXISTS "Allow public select on gemini_accounts" ON gemini_accounts;
CREATE POLICY "Allow public select on gemini_accounts" ON gemini_accounts FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Allow public insert on gemini_accounts" ON gemini_accounts;
CREATE POLICY "Allow public insert on gemini_accounts" ON gemini_accounts FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update on gemini_accounts" ON gemini_accounts;
CREATE POLICY "Allow public update on gemini_accounts" ON gemini_accounts FOR UPDATE TO public USING (true);

DROP POLICY IF EXISTS "Allow public delete on gemini_accounts" ON gemini_accounts;
CREATE POLICY "Allow public delete on gemini_accounts" ON gemini_accounts FOR DELETE TO public USING (true);

-- 7. Tạo bảng flow_accounts quản lý pool Flow tokens
CREATE TABLE IF NOT EXISTS flow_accounts (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  api_key TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'Active',
  credit INT DEFAULT 100,
  usage_count INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Bật RLS cho flow_accounts
ALTER TABLE flow_accounts ENABLE ROW LEVEL SECURITY;

-- Tạo chính sách cho flow_accounts
DROP POLICY IF EXISTS "Allow public select on flow_accounts" ON flow_accounts;
CREATE POLICY "Allow public select on flow_accounts" ON flow_accounts FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Allow public insert on flow_accounts" ON flow_accounts;
CREATE POLICY "Allow public insert on flow_accounts" ON flow_accounts FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update on flow_accounts" ON flow_accounts;
CREATE POLICY "Allow public update on flow_accounts" ON flow_accounts FOR UPDATE TO public USING (true);

DROP POLICY IF EXISTS "Allow public delete on flow_accounts" ON flow_accounts;
CREATE POLICY "Allow public delete on flow_accounts" ON flow_accounts FOR DELETE TO public USING (true);

-- 8. Tạo bảng elevenlabs_accounts quản lý pool API key lồng tiếng
CREATE TABLE IF NOT EXISTS elevenlabs_accounts (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  api_key TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'Active',
  usage_count INT DEFAULT 0,
  error_count INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Bật RLS cho elevenlabs_accounts
ALTER TABLE elevenlabs_accounts ENABLE ROW LEVEL SECURITY;

-- Tạo chính sách cho elevenlabs_accounts
DROP POLICY IF EXISTS "Allow public select on elevenlabs_accounts" ON elevenlabs_accounts;
CREATE POLICY "Allow public select on elevenlabs_accounts" ON elevenlabs_accounts FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Allow public insert on elevenlabs_accounts" ON elevenlabs_accounts;
CREATE POLICY "Allow public insert on elevenlabs_accounts" ON elevenlabs_accounts FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update on elevenlabs_accounts" ON elevenlabs_accounts;
CREATE POLICY "Allow public update on elevenlabs_accounts" ON elevenlabs_accounts FOR UPDATE TO public USING (true);

DROP POLICY IF EXISTS "Allow public delete on elevenlabs_accounts" ON elevenlabs_accounts;
CREATE POLICY "Allow public delete on elevenlabs_accounts" ON elevenlabs_accounts FOR DELETE TO public USING (true);
`;

/**
 * Ensure Storage Bucket exists on startup if Supabase is active
 */
export async function initializeStorageBucket() {
  if (!supabase) return;
  try {
    const { data: buckets, error: getError } = await supabase.storage.listBuckets();
    if (getError) {
      console.warn("Could not list buckets (possibly lack of permissions):", getError.message);
      return;
    }
    const exists = buckets?.some(b => b.name === "reference_images");
    if (!exists) {
      console.log("🔨 Creating 'reference_images' storage bucket...");
      const { error: createError } = await supabase.storage.createBucket("reference_images", {
        public: true,
        fileSizeLimit: 5242880, // 5MB limit
      });
      if (createError) {
        console.warn("⚠️ Notice: Error creating 'reference_images' bucket:", createError.message);
      } else {
        console.log("🎉 'reference_images' storage bucket created successfully!");
      }
    }
  } catch (err) {
    console.warn("⚠️ Notice: Failed to initialize Supabase storage bucket:", err);
  }
}

/**
 * Mapper: DB Row to app-compatible Project type
 */
function mapRowToProject(row: any): any {
  return {
    id: row.id,
    name: row.project_name || "",
    industryId: row.industry || "ind-1",
    contentType: row.content_type || "TikTok Promo",
    productName: row.product_name || "",
    productCategory: row.category || "Mỹ phẩm",
    productInfo: row.product_details || "",
    aiLanguage: row.ai_language || "vi",
    goal: row.goal || "",
    tone: row.tone || "",
    style: row.style || "",
    aiExpertRole: row.expert_role || "",
    cta: row.cta || "",
    targetWordCount: row.word_count || "300 - 500",
    imageReferences: row.image_references || [],
    status: row.status || "Draft",
    createdAt: row.created_at,
    updatedAt: row.updated_at || row.created_at,
    scriptTitle: row.script_title,
    scriptContent: row.script_content,
    scriptVersionCount: row.script_version_count || 0,
    versions: row.versions || [],
    scenes: row.scenes || [],
    isArchived: !!row.is_archived,
    imageSeed: row.image_seed,
    voiceId: row.voice_id || "EXAVITQu4vr4xnSDxMaL",
    includeDialogue: !!row.include_dialogue
  };
}

/**
 * Fetch all projects from Supabase with their associated images (now nested in row JSONB)
 */
export async function dbFetchAllProjects(archived: boolean = false): Promise<any[]> {
  if (!supabase) return [];
  try {
    const { data: rows, error: selectErr } = await supabase
      .from("projects_supabase")
      .select("*")
      .eq("is_archived", archived)
      .order("created_at", { ascending: false });

    if (selectErr) {
      console.warn("⚠️ Notice: Error fetching projects from Supabase:", selectErr.message);
      throw selectErr;
    }

    if (!rows || rows.length === 0) return [];

    return rows.map(row => mapRowToProject(row));
  } catch (err) {
    console.warn("⚠️ Notice: dbFetchAllProjects Error:", err);
    throw err;
  }
}

/**
 * Fetch a single project detail by ID
 */
export async function dbFetchProjectDetail(id: string): Promise<any> {
  if (!supabase) return null;
  try {
    const { data: row, error: selectErr } = await supabase
      .from("projects_supabase")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (selectErr) {
      console.error(`Error fetching project ${id} from Supabase:`, selectErr.message);
      throw selectErr;
    }

    if (!row) return null;

    return mapRowToProject(row);
  } catch (err) {
    console.error(`dbFetchProjectDetail Error for ID ${id}:`, err);
    throw err;
  }
}

/**
 * Create a new project in Supabase
 */
export async function dbCreateProject(projData: any): Promise<any> {
  if (!supabase) return null;
  try {
    const rowPayload = {
      id: projData.id,
      project_name: projData.name,
      industry: projData.industryId || "ind-1",
      category: projData.productCategory || "Mỹ phẩm",
      product_details: projData.productInfo || "",
      word_count: projData.targetWordCount || "300 - 500",
      goal: projData.goal || "",
      tone: projData.tone || "",
      style: projData.style || "",
      expert_role: projData.aiExpertRole || "Chuyên gia AI",
      cta: projData.cta || "",
      status: projData.status || "Draft",
      content_type: projData.contentType || "TikTok Promo",
      product_name: projData.productName || "",
      ai_language: projData.aiLanguage || "vi",
      script_title: projData.scriptTitle || null,
      script_content: projData.scriptContent || null,
      script_version_count: projData.scriptVersionCount || 0,
      versions: projData.versions || [],
      scenes: projData.scenes || [],
      is_archived: !!projData.isArchived,
      image_references: projData.imageReferences || [],
      image_seed: projData.imageSeed || null,
      voice_id: projData.voiceId || "EXAVITQu4vr4xnSDxMaL",
      include_dialogue: !!projData.includeDialogue
    };

    // Insert project
    const { data: row, error: insertErr } = await supabase
      .from("projects_supabase")
      .insert(rowPayload)
      .select()
      .single();

    if (insertErr) {
      console.error("Error creating project in Supabase:", insertErr.message);
      throw insertErr;
    }

    return mapRowToProject(row);
  } catch (err) {
    console.error("dbCreateProject Error:", err);
    throw err;
  }
}

/**
 * Update an existing project in Supabase
 */
export async function dbUpdateProject(id: string, projData: Partial<any>): Promise<any> {
  if (!supabase) return null;
  try {
    const updatePayload: any = {};
    if (projData.name !== undefined) updatePayload.project_name = projData.name;
    if (projData.industryId !== undefined) updatePayload.industry = projData.industryId;
    if (projData.productCategory !== undefined) updatePayload.category = projData.productCategory;
    if (projData.productInfo !== undefined) updatePayload.product_details = projData.productInfo;
    if (projData.targetWordCount !== undefined) updatePayload.word_count = projData.targetWordCount;
    if (projData.goal !== undefined) updatePayload.goal = projData.goal;
    if (projData.tone !== undefined) updatePayload.tone = projData.tone;
    if (projData.style !== undefined) updatePayload.style = projData.style;
    if (projData.aiExpertRole !== undefined) updatePayload.expert_role = projData.aiExpertRole;
    if (projData.cta !== undefined) updatePayload.cta = projData.cta;
    if (projData.status !== undefined) updatePayload.status = projData.status;
    if (projData.contentType !== undefined) updatePayload.content_type = projData.contentType;
    if (projData.productName !== undefined) updatePayload.product_name = projData.productName;
    if (projData.aiLanguage !== undefined) updatePayload.ai_language = projData.aiLanguage;
    if (projData.scriptTitle !== undefined) updatePayload.script_title = projData.scriptTitle;
    if (projData.scriptContent !== undefined) updatePayload.script_content = projData.scriptContent;
    if (projData.scriptVersionCount !== undefined) updatePayload.script_version_count = projData.scriptVersionCount;
    if (projData.versions !== undefined) updatePayload.versions = projData.versions;
    if (projData.scenes !== undefined) updatePayload.scenes = projData.scenes;
    if (projData.isArchived !== undefined) updatePayload.is_archived = !!projData.isArchived;
    if (projData.imageReferences !== undefined) updatePayload.image_references = projData.imageReferences;
    if (projData.imageSeed !== undefined) updatePayload.image_seed = projData.imageSeed;
    if (projData.voiceId !== undefined) updatePayload.voice_id = projData.voiceId;
    if (projData.includeDialogue !== undefined) updatePayload.include_dialogue = !!projData.includeDialogue;
    
    updatePayload.updated_at = new Date().toISOString();

    const { data: updatedRow, error: updateErr } = await supabase
      .from("projects_supabase")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (updateErr) {
      console.error("Error updating project in Supabase:", updateErr.message);
      throw updateErr;
    }

    return mapRowToProject(updatedRow);
  } catch (err) {
    console.error("dbUpdateProject Error:", err);
    throw err;
  }
}

/**
 * Delete a project from Supabase
 */
export async function dbDeleteProject(id: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from("projects_supabase").delete().eq("id", id);
    if (error) {
      console.error(`Error deleting project ${id}:`, error.message);
      throw error;
    }
    return true;
  } catch (err) {
    console.error("dbDeleteProject Error:", err);
    throw err;
  }
}

/**
 * Upload a file to reference_images bucket
 */
export async function dbUploadReferenceImage(
  fileName: string,
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  if (!supabase) {
    throw new Error("Supabase is not configured");
  }

  try {
    const { data, error } = await supabase.storage
      .from("reference_images")
      .upload(fileName, buffer, {
        contentType: mimeType,
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      console.error("Supabase Storage upload error:", error.message);
      throw error;
    }

    // Retrieve public URL
    const { data: publicUrlData } = supabase.storage
      .from("reference_images")
      .getPublicUrl(data.path);

    if (!publicUrlData || !publicUrlData.publicUrl) {
      throw new Error("Failed to get public URL from Supabase storage");
    }

    return publicUrlData.publicUrl;
  } catch (err) {
    console.error("dbUploadReferenceImage Error:", err);
    throw err;
  }
}

/**
 * Upload an audio file to scene_audio bucket
 */
export async function dbUploadSceneAudio(
  fileName: string,
  buffer: Buffer,
  mimeType: string = "audio/mpeg"
): Promise<string> {
  if (!supabase) {
    throw new Error("Supabase is not configured");
  }

  try {
    const { data, error } = await supabase.storage
      .from("scene_audio")
      .upload(fileName, buffer, {
        contentType: mimeType,
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      console.error("Supabase Storage audio upload error:", error.message);
      throw error;
    }

    // Retrieve public URL
    const { data: publicUrlData } = supabase.storage
      .from("scene_audio")
      .getPublicUrl(data.path);

    if (!publicUrlData || !publicUrlData.publicUrl) {
      throw new Error("Failed to get public URL from Supabase storage for audio");
    }

    return publicUrlData.publicUrl;
  } catch (err) {
    console.error("dbUploadSceneAudio Error:", err);
    throw err;
  }
}

/**
 * Gemini Accounts db functions
 */
export async function dbFetchAllGeminiKeys(): Promise<any[]> {
  if (!supabase) return [];
  try {
    const { data: rows, error } = await supabase
      .from("gemini_accounts")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (rows || []).map(r => ({
      id: r.id,
      name: r.name,
      apiKey: r.api_key,
      status: r.status,
      usageCount: r.usage_count || 0,
      errorCount: r.error_count || 0
    }));
  } catch (err) {
    console.warn("⚠️ Notice: dbFetchAllGeminiKeys error:", err);
    throw err;
  }
}

export async function dbCreateGeminiKey(keyData: any): Promise<any> {
  if (!supabase) return null;
  const payload = {
    id: keyData.id,
    name: keyData.name,
    api_key: keyData.apiKey,
    status: keyData.status || "Active",
    usage_count: keyData.usageCount || 0,
    error_count: keyData.errorCount || 0
  };
  const { data, error } = await supabase
    .from("gemini_accounts")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return {
    id: data.id,
    name: data.name,
    apiKey: data.api_key,
    status: data.status,
    usageCount: data.usage_count,
    errorCount: data.error_count
  };
}

export async function dbBulkCreateGeminiKeys(keysArray: any[]): Promise<any[]> {
  if (!supabase) return [];
  const payloads = keysArray.map(k => ({
    id: k.id,
    name: k.name,
    api_key: k.apiKey,
    status: k.status || "Active",
    usage_count: k.usageCount || 0,
    error_count: k.errorCount || 0
  }));
  const { data, error } = await supabase
    .from("gemini_accounts")
    .insert(payloads)
    .select();
  if (error) throw error;
  return (data || []).map(r => ({
    id: r.id,
    name: r.name,
    apiKey: r.api_key,
    status: r.status,
    usageCount: r.usage_count,
    errorCount: r.error_count
  }));
}

export async function dbUpdateGeminiKey(id: string, updates: Partial<any>): Promise<any> {
  if (!supabase) return null;
  const payload: any = {};
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.apiKey !== undefined) payload.api_key = updates.apiKey;
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.usageCount !== undefined) payload.usage_count = updates.usageCount;
  if (updates.errorCount !== undefined) payload.error_count = updates.errorCount;
  
  const { data, error } = await supabase
    .from("gemini_accounts")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return {
    id: data.id,
    name: data.name,
    apiKey: data.api_key,
    status: data.status,
    usageCount: data.usage_count,
    errorCount: data.error_count
  };
}

export async function dbDeleteGeminiKey(id: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from("gemini_accounts").delete().eq("id", id);
  if (error) throw error;
  return true;
}

/**
 * Flow Accounts db functions
 */
export async function dbFetchAllFlowAccounts(): Promise<any[]> {
  if (!supabase) return [];
  try {
    const { data: rows, error } = await supabase
      .from("flow_accounts")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (rows || []).map(r => ({
      id: r.id,
      name: r.name,
      apiKey: r.api_key,
      status: r.status,
      credit: r.credit || 100,
      usageCount: r.usage_count || 0
    }));
  } catch (err) {
    console.warn("⚠️ Notice: dbFetchAllFlowAccounts error:", err);
    throw err;
  }
}

export async function dbCreateFlowAccount(accData: any): Promise<any> {
  if (!supabase) return null;
  const payload = {
    id: accData.id,
    name: accData.name,
    api_key: accData.apiKey,
    status: accData.status || "Active",
    credit: accData.credit || 100,
    usage_count: accData.usageCount || 0
  };
  const { data, error } = await supabase
    .from("flow_accounts")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return {
    id: data.id,
    name: data.name,
    apiKey: data.api_key,
    status: data.status,
    credit: data.credit,
    usageCount: data.usage_count
  };
}

export async function dbUpdateFlowAccount(id: string, updates: Partial<any>): Promise<any> {
  if (!supabase) return null;
  const payload: any = {};
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.apiKey !== undefined) payload.api_key = updates.apiKey;
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.credit !== undefined) payload.credit = updates.credit;
  if (updates.usageCount !== undefined) payload.usage_count = updates.usageCount;

  const { data, error } = await supabase
    .from("flow_accounts")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return {
    id: data.id,
    name: data.name,
    apiKey: data.api_key,
    status: data.status,
    credit: data.credit,
    usageCount: data.usage_count
  };
}

export async function dbDeleteFlowAccount(id: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from("flow_accounts").delete().eq("id", id);
  if (error) throw error;
  return true;
}

/**
 * ElevenLabs Accounts db functions
 */
export async function dbFetchAllElevenLabsKeys(): Promise<any[]> {
  if (!supabase) return [];
  try {
    const { data: rows, error } = await supabase
      .from("elevenlabs_accounts")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (rows || []).map(r => ({
      id: r.id,
      name: r.name,
      apiKey: r.api_key,
      status: r.status,
      usageCount: r.usage_count || 0,
      errorCount: r.error_count || 0
    }));
  } catch (err) {
    console.warn("⚠️ Notice: dbFetchAllElevenLabsKeys error:", err);
    throw err;
  }
}

export async function dbCreateElevenLabsKey(keyData: any): Promise<any> {
  if (!supabase) return null;
  const payload = {
    id: keyData.id,
    name: keyData.name,
    api_key: keyData.apiKey,
    status: keyData.status || "Active",
    usage_count: keyData.usageCount || 0,
    error_count: keyData.errorCount || 0
  };
  const { data, error } = await supabase
    .from("elevenlabs_accounts")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return {
    id: data.id,
    name: data.name,
    apiKey: data.api_key,
    status: data.status,
    usageCount: data.usage_count,
    errorCount: data.error_count
  };
}

export async function dbBulkCreateElevenLabsKeys(keysArray: any[]): Promise<any[]> {
  if (!supabase) return [];
  const payloads = keysArray.map(k => ({
    id: k.id,
    name: k.name,
    api_key: k.apiKey,
    status: k.status || "Active",
    usage_count: k.usageCount || 0,
    error_count: k.errorCount || 0
  }));
  const { data, error } = await supabase
    .from("elevenlabs_accounts")
    .insert(payloads)
    .select();
  if (error) throw error;
  return (data || []).map(r => ({
    id: r.id,
    name: r.name,
    apiKey: r.api_key,
    status: r.status,
    usageCount: r.usage_count,
    errorCount: r.error_count
  }));
}

export async function dbUpdateElevenLabsKey(id: string, updates: Partial<any>): Promise<any> {
  if (!supabase) return null;
  const payload: any = {};
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.apiKey !== undefined) payload.api_key = updates.apiKey;
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.usageCount !== undefined) payload.usage_count = updates.usageCount;
  if (updates.errorCount !== undefined) payload.error_count = updates.errorCount;
  
  const { data, error } = await supabase
    .from("elevenlabs_accounts")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return {
    id: data.id,
    name: data.name,
    apiKey: data.api_key,
    status: data.status,
    usageCount: data.usage_count,
    errorCount: data.error_count
  };
}

export async function dbDeleteElevenLabsKey(id: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from("elevenlabs_accounts").delete().eq("id", id);
  if (error) throw error;
  return true;
}
