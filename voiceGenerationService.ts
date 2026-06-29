import { getSupabase, dbUploadSceneAudio } from "./supabaseService.js";
import { Project, Scene, ElevenLabsKey, LogEntry } from "./src/types.js";

/**
 * Call ElevenLabs Text-to-Speech API to convert text to speech
 * @param text The input text script
 * @param apiKey ElevenLabs API Key
 * @param voiceId ElevenLabs Voice ID
 */
export async function generateElevenLabsSpeech(
  text: string,
  apiKey: string,
  voiceId: string
): Promise<Buffer> {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

  const payload = {
    text: text,
    model_id: "eleven_multilingual_v2", // Required for high quality Vietnamese text-to-speech
    voice_settings: {
      stability: 0.5,
      similarity_boost: 0.75
    }
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "xi-api-key": apiKey
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    let errorDetail = "";
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail?.message || JSON.stringify(errJson);
    } catch {
      errorDetail = `HTTP ${response.status} ${response.statusText}`;
    }
    throw new Error(`ElevenLabs API error: ${errorDetail}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Check if the error indicates a credential issue or quota limit
 */
function isElevenLabsKeyError(errMessage: string): boolean {
  const lowercaseMsg = errMessage.toLowerCase();
  return (
    lowercaseMsg.includes("invalid api key") ||
    lowercaseMsg.includes("unauthorized") ||
    lowercaseMsg.includes("401") ||
    lowercaseMsg.includes("429") ||
    lowercaseMsg.includes("quota exceeded") ||
    lowercaseMsg.includes("character limit reached") ||
    lowercaseMsg.includes("limit")
  );
}

/**
 * Generate high-quality automated audio voiceovers for all scenes of a project with key rotation/retries
 * @param project The active project containing scenes
 * @param elevenlabsKeys Array of available ElevenLabs keys from the pool (can contain backup keys)
 * @param onKeyUpdate Callback to update ElevenLabs key status and usage count in database & memory
 * @param logCallback Callback to push logs to queue
 */
export async function generateVoiceForProjectScenes(
  project: Project,
  elevenlabsKeys: ElevenLabsKey[],
  onKeyUpdate: (keyId: string, updates: Partial<ElevenLabsKey>) => Promise<void> | void,
  logCallback: (entry: LogEntry) => void
): Promise<void> {
  if (!project.scenes || project.scenes.length === 0) {
    logCallback({
      timestamp: new Date().toLocaleTimeString(),
      level: "warn",
      message: "⚠️ Không tìm thấy phân cảnh nào để tạo thuyết minh cho dự án."
    });
    return;
  }

  // Get active voiceId from project or default
  const voiceId = project.voiceId || "EXAVITQu4vr4xnSDxMaL"; // Default is Bella (UGC Female Review style)

  logCallback({
    timestamp: new Date().toLocaleTimeString(),
    level: "info",
    message: `🎙️ Bắt đầu tiến trình lồng tiếng tự động bằng ElevenLabs (Mã Giọng: ${voiceId}) cho ${project.scenes.length} phân cảnh.`
  });

  // Manage active keys pool
  let activeKeys = [...elevenlabsKeys].filter(k => k.status === "Active");
  let currentKeyIndex = 0;

  for (let i = 0; i < project.scenes.length; i++) {
    const scene = project.scenes[i];
    
    // Choose appropriate voice script language
    const voiceScript = project.aiLanguage === "en" 
      ? (scene.voiceScriptEn || scene.voiceScriptVi) 
      : (scene.voiceScriptVi || scene.voiceScriptEn);

    if (!voiceScript || voiceScript.trim() === "") {
      logCallback({
        timestamp: new Date().toLocaleTimeString(),
        level: "warn",
        message: `⚠️ [Phân cảnh ${scene.sceneNumber}] Lời thoại rỗng. Bỏ qua tạo thuyết minh.`
      });
      continue;
    }

    logCallback({
      timestamp: new Date().toLocaleTimeString(),
      level: "info",
      message: `🎬 [Phân cảnh ${scene.sceneNumber}/${project.scenes.length}] Đang lồng tiếng: "${voiceScript.substring(0, 50)}..."`
    });

    let success = false;
    let attempts = 0;

    while (!success) {
      attempts++;
      
      if (activeKeys.length === 0) {
        throw new Error("Không còn ElevenLabs API Key nào 'Active' và hoạt động trong Key Pool!");
      }

      if (currentKeyIndex >= activeKeys.length) {
        currentKeyIndex = 0;
      }

      const currentKeyObj = activeKeys[currentKeyIndex];
      const currentApiKey = currentKeyObj.apiKey;
      const currentKeyName = currentKeyObj.name;

      logCallback({
        timestamp: new Date().toLocaleTimeString(),
        level: "info",
        message: `🔑 Đang sử dụng Key lồng tiếng từ Pool: [${currentKeyName}] (Thử lượt #${attempts})...`
      });

      try {
        // 1. Generate speech buffer via API
        const audioBuffer = await generateElevenLabsSpeech(voiceScript, currentApiKey, voiceId);

        // 2. Upload buffer to Supabase scene_audio bucket
        const fileName = `voice_${project.id}_${scene.id || `sc-${i}`}_${Date.now()}.mp3`;
        logCallback({
          timestamp: new Date().toLocaleTimeString(),
          level: "info",
          message: `📦 Đang tải file thuyết minh MP3 lên Supabase Storage scene_audio...`
        });

        let publicUrl = "";
        if (getSupabase()) {
          publicUrl = await dbUploadSceneAudio(fileName, audioBuffer, "audio/mpeg");
        } else {
          // Fallback if Supabase is offline
          publicUrl = `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3`; // Static audio fallback
          logCallback({
            timestamp: new Date().toLocaleTimeString(),
            level: "warn",
            message: "⚠️ Không phát hiện Supabase. Sử dụng URL nhạc mẫu làm thuyết minh tạm thời."
          });
        }

        // 3. Update scene attributes
        scene.voiceAudioUrl = publicUrl;
        scene.status = "Completed";

        // Increment key usage count
        const updatedUsage = (currentKeyObj.usageCount || 0) + 1;
        await onKeyUpdate(currentKeyObj.id, {
          usageCount: updatedUsage,
          lastUsedTime: new Date().toISOString()
        });

        logCallback({
          timestamp: new Date().toLocaleTimeString(),
          level: "success",
          message: `✅ [Phân cảnh ${scene.sceneNumber}] Tạo giọng đọc thành công với [${currentKeyName}]! URL: ${publicUrl.substring(0, 60)}...`
        });

        success = true;
      } catch (err: any) {
        const errMsg = err.message || "Lỗi lồng tiếng ElevenLabs";
        logCallback({
          timestamp: new Date().toLocaleTimeString(),
          level: "warn",
          message: `❌ Lỗi cuộc gọi ElevenLabs với [${currentKeyName}]: ${errMsg}`
        });

        if (isElevenLabsKeyError(errMsg)) {
          logCallback({
            timestamp: new Date().toLocaleTimeString(),
            level: "error",
            message: `🚫 Key [${currentKeyName}] đã bị lỗi xác thực hoặc hết hạn mức. Đang chuyển trạng thái thành Exhausted!`
          });

          // Mark as Exhausted in DB
          await onKeyUpdate(currentKeyObj.id, { status: "Exhausted" });
          // Remove from local activeKeys
          activeKeys = activeKeys.filter(k => k.id !== currentKeyObj.id);
          // Retry automatically with next key without incrementing currentKeyIndex since we filtered this key out
        } else {
          // Update key error count but keep it active if it's a transient non-auth/non-quota error
          await onKeyUpdate(currentKeyObj.id, { errorCount: (currentKeyObj.errorCount || 0) + 1 });
          currentKeyIndex++;
        }
      }
    }

    if (!success) {
      scene.status = "Failed";
      scene.error = "Không thể sinh giọng thuyết minh cho phân cảnh sau khi thử các Key lồng tiếng.";
      throw new Error(`Thất bại trong việc tạo giọng đọc cho phân cảnh #${scene.sceneNumber}`);
    }
  }

  logCallback({
    timestamp: new Date().toLocaleTimeString(),
    level: "success",
    message: "🏆 Quy trình lồng tiếng tự động bằng ElevenLabs hoàn thành xuất sắc cho dự án!"
  });
}
