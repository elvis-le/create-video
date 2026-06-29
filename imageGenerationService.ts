import { 
  getSupabase, 
  dbUploadReferenceImage, 
  dbUpdateGeminiKey 
} from "./supabaseService.js";
import { Scene, GeminiKey, LogEntry, Project } from "./src/types.js";

/**
 * Call Google Imagen 3 REST API to generate an image
 * @param prompt English prompt for the image
 * @param apiKey Gemini API key to use
 * @param seed Optional random seed integer for style consistency
 */
export async function generateImagen3Image(prompt: string, apiKey: string, seed?: number): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`;

  const payload = {
    instances: [
      {
        prompt: prompt
      }
    ],
    parameters: {
      sampleCount: 1,
      aspectRatio: "9:16",
      outputMimeType: "image/jpeg",
      ...(seed !== undefined ? { seed } : {})
    }
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const responseData = await response.json();

    if (!response.ok) {
      // Wrap as a response error to support the specified error structures
      const responseError: any = new Error(responseData.error?.message || `HTTP error ${response.status}`);
      responseError.response = { data: responseData };
      throw responseError;
    }

    // Google Imagen returns base64 inside predictions array
    const base64Data = responseData.predictions?.[0]?.bytesBase64Encoded || 
                       responseData.predictions?.[0]?.bytes || 
                       responseData.predictions?.[0]?.image?.imageBytes;

    if (!base64Data) {
      throw new Error("Không tìm thấy dữ liệu ảnh Base64 trong kết quả trả về từ Gemini Imagen API.");
    }

    return base64Data;
  } catch (error: any) {
    console.error("CHI TIẾT LỖI GEMINI IMAGE:", error.response?.data || error);
    const deepErrorMessage = error.response?.data?.error?.message || error.message || "Lỗi tạo ảnh không xác định";
    throw new Error(deepErrorMessage);
  }
}

/**
 * Helper to check if an error is a credential or rate limit error
 */
function isKeyError(errMessage: string): boolean {
  const lowercaseMsg = errMessage.toLowerCase();
  return (
    lowercaseMsg.includes("api key not valid") ||
    lowercaseMsg.includes("invalid api key") ||
    lowercaseMsg.includes("key expired") ||
    lowercaseMsg.includes("unauthorized") ||
    lowercaseMsg.includes("403") ||
    lowercaseMsg.includes("400") || // Bad request with key errors
    lowercaseMsg.includes("429") || // Rate limit
    lowercaseMsg.includes("quota exceeded") ||
    lowercaseMsg.includes("limit")
  );
}

/**
 * Generate images for all scenes of a project with automatic key rotation and retries
 * @param project The active project containing scenes
 * @param keys Array of available Gemini keys from Account Pool
 * @param onKeyUpdate Callback to synchronize key modifications in memory and database
 * @param logCallback Callback to push live queue log lines
 */
export async function generateImagesForProjectScenes(
  project: Project,
  keys: GeminiKey[],
  onKeyUpdate: (keyId: string, updates: Partial<GeminiKey>) => Promise<void> | void,
  logCallback: (entry: LogEntry) => void
): Promise<void> {
  if (!project.scenes || project.scenes.length === 0) {
    logCallback({
      timestamp: new Date().toLocaleTimeString(),
      level: "warn",
      message: "⚠️ Không tìm thấy phân cảnh nào để tạo ảnh cho dự án này."
    });
    return;
  }

  // Ensure project has an image seed for consistency
  if (project.imageSeed === undefined || project.imageSeed === null) {
    project.imageSeed = Math.floor(Math.random() * 1000000);
    logCallback({
      timestamp: new Date().toLocaleTimeString(),
      level: "info",
      message: `🌱 Đã sinh ngẫu nhiên số Seed nhất quán cho dự án: ${project.imageSeed}`
    });
  } else {
    logCallback({
      timestamp: new Date().toLocaleTimeString(),
      level: "info",
      message: `🌱 Sử dụng số Seed nhất quán hiện tại của dự án: ${project.imageSeed}`
    });
  }

  logCallback({
    timestamp: new Date().toLocaleTimeString(),
    level: "info",
    message: `🎨 Khởi động tiến trình dệt ảnh bằng Imagen 3 cho ${project.scenes.length} phân cảnh.`
  });

  // Keep track of active keys locally for rotation within this job
  let activeKeys = keys.filter(k => k.status === "Active");

  if (activeKeys.length === 0) {
    throw new Error("Không tìm thấy API Key nào ở trạng thái 'Active' trong Account Pool!");
  }

  let currentKeyIndex = 0;

  for (let i = 0; i < project.scenes.length; i++) {
    const scene = project.scenes[i];
    const scenePrompt = scene.promptImage || 
      `High-end professional cinematic studio shot of ${project.productName}, clean background, commercial product photography, 8k resolution, photorealistic`;

    logCallback({
      timestamp: new Date().toLocaleTimeString(),
      level: "info",
      message: `🎬 [Phân cảnh ${scene.sceneNumber}/${project.scenes.length}] Bắt đầu tạo ảnh với prompt: "${scenePrompt.substring(0, 60)}..."`
    });

    let success = false;
    let attempts = 0;
    const maxAttempts = activeKeys.length; // Can try other keys in pool

    while (!success && attempts < maxAttempts) {
      if (currentKeyIndex >= activeKeys.length) {
        currentKeyIndex = 0; // wrap around active keys
      }

      const currentKey = activeKeys[currentKeyIndex];
      if (!currentKey) {
        throw new Error("Tất cả các API Key hoạt động đã bị cạn kiệt trong lượt xử lý.");
      }

      logCallback({
        timestamp: new Date().toLocaleTimeString(),
        level: "info",
        message: `🔑 Đang sử dụng Key: [${currentKey.name}] để render ảnh...`
      });

      try {
        // 1. Generate via REST API
        const base64Data = await generateImagen3Image(scenePrompt, currentKey.apiKey, project.imageSeed);

        // 2. Convert base64 to Buffer
        const imageBuffer = Buffer.from(base64Data, "base64");

        // 3. Upload to Supabase Storage Bucket reference_images
        const fileName = `scene_${project.id}_${scene.id || `sc-${i}`}_${Date.now()}.jpg`;
        logCallback({
          timestamp: new Date().toLocaleTimeString(),
          level: "info",
          message: `📦 Đang chuyển đổi Base64 và tải ảnh lên Supabase Storage Bucket reference_images...`
        });

        let publicUrl = "";
        if (getSupabase()) {
          publicUrl = await dbUploadReferenceImage(fileName, imageBuffer, "image/jpeg");
        } else {
          // Fallback mockup local URL in case Supabase is completely unavailable
          publicUrl = `data:image/jpeg;base64,${base64Data.substring(0, 100)}...[mock-upload-fallback]`;
          logCallback({
            timestamp: new Date().toLocaleTimeString(),
            level: "warn",
            message: "⚠️ Không phát hiện kết nối Supabase, sử dụng chuỗi nội dung tạm thời cho URL ảnh."
          });
        }

        // 4. Update the Scene attributes
        scene.imageUrl = publicUrl;
        scene.status = "Completed";

        // 5. Update success tracking for current Key
        const updatedUsage = (currentKey.usageCount || 0) + 1;
        await onKeyUpdate(currentKey.id, { 
          usageCount: updatedUsage,
          lastUsedTime: new Date().toISOString() 
        });

        logCallback({
          timestamp: new Date().toLocaleTimeString(),
          level: "success",
          message: `✅ [Phân cảnh ${scene.sceneNumber}] Tạo ảnh và lưu trữ thành công! URL: ${publicUrl.substring(0, 50)}...`
        });

        success = true;
      } catch (err: any) {
        attempts++;
        const errMsg = err.message || "Lỗi không xác định";
        logCallback({
          timestamp: new Date().toLocaleTimeString(),
          level: "warn",
          message: `❌ Thử nghiệm với Key [${currentKey.name}] thất bại. Lý do: ${errMsg}`
        });

        // If API key is invalid/expired/blocked/rate-limited, mark it as 'Blocked' in pool
        if (isKeyError(errMsg)) {
          logCallback({
            timestamp: new Date().toLocaleTimeString(),
            level: "error",
            message: `🚫 API Key [${currentKey.name}] gặp lỗi nghiêm trọng (Hết hạn/Quyền truy cập/Hạn ngạch). Đang đánh dấu trạng thái 'Blocked' trong hồ chứa!`
          });

          const updatedErrorCount = (currentKey.errorCount || 0) + 1;
          await onKeyUpdate(currentKey.id, { 
            status: "Blocked", 
            errorCount: updatedErrorCount 
          });

          // Remove from active keys for current run
          activeKeys = activeKeys.filter(k => k.id !== currentKey.id);
          // Don't advance index since we removed the element
        } else {
          // Increment error count but keep active for temporary failures
          const updatedErrorCount = (currentKey.errorCount || 0) + 1;
          await onKeyUpdate(currentKey.id, { errorCount: updatedErrorCount });
          currentKeyIndex++; // advance to next key
        }

        if (activeKeys.length === 0) {
          throw new Error("Hệ thống cực kỳ xin lỗi: Toàn bộ API Key trong Account Pool của bạn đều đã bị chặn hoặc lỗi!");
        }
      }
    }

    if (!success) {
      scene.status = "Failed";
      scene.error = "Không thể tạo ảnh cho phân cảnh sau khi thử tất cả các Key có sẵn.";
      throw new Error(`Thất bại trong việc tạo ảnh cho phân cảnh #${scene.sceneNumber}`);
    }
  }

  logCallback({
    timestamp: new Date().toLocaleTimeString(),
    level: "success",
    message: "🏆 Quy trình tạo ảnh tự động hoàn thành xuất sắc cho toàn bộ kịch bản!"
  });
}
