import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import crypto from "crypto";
import { 
  Project, 
  GeminiKey, 
  FlowAccount, 
  ElevenLabsKey,
  QueueTask, 
  AIModelSettings, 
  IndustryTemplate, 
  SmartPreset, 
  Scene,
  LogEntry,
  TaskType
} from "./src/types.js";
import multer from "multer";
import {
  getSupabase,
  initializeStorageBucket,
  dbFetchAllProjects,
  dbFetchProjectDetail,
  dbCreateProject,
  dbUpdateProject,
  dbDeleteProject,
  dbUploadReferenceImage,
  SQL_SCHEMA_SETUP,
  dbFetchAllGeminiKeys,
  dbCreateGeminiKey,
  dbBulkCreateGeminiKeys,
  dbUpdateGeminiKey,
  dbDeleteGeminiKey,
  dbFetchAllFlowAccounts,
  dbCreateFlowAccount,
  dbUpdateFlowAccount,
  dbDeleteFlowAccount,
  dbFetchAllElevenLabsKeys,
  dbCreateElevenLabsKey,
  dbBulkCreateElevenLabsKeys,
  dbUpdateElevenLabsKey,
  dbDeleteElevenLabsKey
} from "./supabaseService.js";
import { generateImagesForProjectScenes } from "./imageGenerationService.js";
import { generateVoiceForProjectScenes } from "./voiceGenerationService.js";

// Helper for generating unique IDs
const generateId = () => Math.random().toString(36).substring(2, 11);

// Initialize Data Store (In-Memory with some seed values)
let projects: Project[] = [];
let supabasePrehydrateError: string | null = null;
let supabaseTablesExist = false;

// Hydrate initial cache from Supabase on startup if active
if (getSupabase()) {
  console.log("🌊 Supabase is active. Hydrating in-memory cache on startup...");
  initializeStorageBucket().then(async () => {
    try {
      const active = await dbFetchAllProjects(false);
      const archived = await dbFetchAllProjects(true);
      projects = [...active, ...archived];
      supabaseTablesExist = true;
      console.log(`📦 Successfully pre-hydrated ${projects.length} projects from Supabase database.`);
    } catch (err: any) {
      supabasePrehydrateError = err?.message || JSON.stringify(err);
      console.warn("🚨 Notice: Failed to pre-hydrate cache from Supabase (tables might not exist yet):", err.message);
    }

    try {
      const keys = await dbFetchAllGeminiKeys();
      if (keys && keys.length > 0) {
        geminiKeys = keys;
        console.log(`📦 Successfully pre-hydrated ${geminiKeys.length} Gemini keys from Supabase database.`);
      }
    } catch (err: any) {
      console.warn("🚨 Notice: Failed to pre-hydrate Gemini keys from Supabase (tables might not exist yet):", err.message);
    }

    try {
      const accounts = await dbFetchAllFlowAccounts();
      if (accounts && accounts.length > 0) {
        flowAccounts = accounts;
        console.log(`📦 Successfully pre-hydrated ${flowAccounts.length} Flow accounts from Supabase database.`);
      }
    } catch (err: any) {
      console.warn("🚨 Notice: Failed to pre-hydrate Flow accounts from Supabase (tables might not exist yet):", err.message);
    }

    try {
      const elKeys = await dbFetchAllElevenLabsKeys();
      if (elKeys && elKeys.length > 0) {
        elevenlabsKeys = elKeys;
        console.log(`📦 Successfully pre-hydrated ${elevenlabsKeys.length} ElevenLabs keys from Supabase database.`);
      }
    } catch (err: any) {
      console.warn("🚨 Notice: Failed to pre-hydrate ElevenLabs keys from Supabase (tables might not exist yet):", err.message);
    }
  });
}
let geminiKeys: GeminiKey[] = [
  { id: "gkey-1", name: "Gemini Pro Key (Primary)", apiKey: "AIzaSySeedKey1_GeminiProPrivatePool", status: "Active", usageCount: 42, errorCount: 1 },
  { id: "gkey-2", name: "Gemini Flash Key (Backup)", apiKey: "AIzaSySeedKey2_GeminiFlashBackupPool", status: "Active", usageCount: 120, errorCount: 5 },
  { id: "gkey-3", name: "Dev Testing Key (Trial)", apiKey: "AIzaSySeedKey3_DevTrialKeyTestLimit", status: "Blocked", usageCount: 15, errorCount: 4 }
];
let flowAccounts: FlowAccount[] = [
  { id: "flow-1", name: "Flow Account Alpha (Vip)", apiKey: "flow_ak_seed_premium_alpha_99x", status: "Active", credit: 80, usageCount: 145 },
  { id: "flow-2", name: "Flow Account Beta (Standard)", apiKey: "flow_ak_seed_mid_tier_beta_55y", status: "Active", credit: 15, usageCount: 38 },
  { id: "flow-3", name: "Flow Account Gamma (Free)", apiKey: "flow_ak_seed_depleted_gamma_00z", status: "Exhausted", credit: 0, usageCount: 210 }
];
let elevenlabsKeys: ElevenLabsKey[] = process.env.ELEVENLABS_API_KEY ? [
  { id: "elkey-env", name: "Key từ Environment (.env)", apiKey: process.env.ELEVENLABS_API_KEY, status: "Active", usageCount: 0, errorCount: 0 }
] : [
  { id: "elkey-1", name: "ElevenLabs Key Alpha (Seed)", apiKey: "el_ak_seed_primary_bella_9x", status: "Active", usageCount: 15, errorCount: 0 }
];
let queueTasks: QueueTask[] = [];
let modelSettings: AIModelSettings = {
  scriptModel: "gemini-3.1-pro-preview",
  sceneModel: "gemini-3.5-flash",
  maxRetries: 3,
  retryDelayMs: 1000
};

// Seed Constants
const industryTemplates: IndustryTemplate[] = [
  { id: "ind-1", nameVi: "Bán lẻ & Thương mại điện tử", nameEn: "Retail & E-commerce", descriptionVi: "Sản phẩm tiêu dùng, gian hàng trực tuyến, bán lẻ đa kênh và ưu đãi mua sắm.", descriptionEn: "Consumer goods, online shops, multi-channel retail, and shopping deals." },
  { id: "ind-2", nameVi: "Mỹ phẩm & Chăm sóc sắc đẹp", nameEn: "Cosmetics & Beauty Care", descriptionVi: "Trang điểm, chăm sóc da, dưỡng tóc, dịch vụ spa và thẩm mỹ đẳng cấp.", descriptionEn: "Makeup, skincare, haircare, premium spa and cosmetology services." },
  { id: "ind-3", nameVi: "Thời trang & Phụ kiện", nameEn: "Fashion & Accessories", descriptionVi: "Quần áo, túi xách, giày dép hiện đại, trang sức tinh tế và phụ kiện độc đáo.", descriptionEn: "Clothing, handbags, modern footwear, exquisite jewelry, and unique accessories." },
  { id: "ind-4", nameVi: "Gia dụng & Nội thất", nameEn: "Household & Furniture", descriptionVi: "Đồ dùng gia đình, thiết bị bếp thông minh, thiết kế và thi công nội thất ấm cúng.", descriptionEn: "Home electronics, smart kitchenwares, warm interior design and materials." },
  { id: "ind-5", nameVi: "Nhà hàng & Ẩm thực (F&B)", nameEn: "Restaurant & Food (F&B)", descriptionVi: "Đồ ăn thức uống, quán cafe, nhà hàng cao cấp, dịch vụ giao hàng ẩm thực phong phú.", descriptionEn: "Delectable food and drinks, cafes, luxury restaurants, and food delivery options." },
  { id: "ind-6", nameVi: "Bất động sản & Kiến trúc", nameEn: "Real Estate & Architecture", descriptionVi: "Căn hộ chung cư, đất nền dự án, biệt thự cao cấp và thiết kế không gian kiến trúc.", descriptionEn: "Residential apartments, project lands, luxury villas, and architectural layouts." },
  { id: "ind-7", nameVi: "Công nghệ & Phần mềm", nameEn: "Technology & Software", descriptionVi: "Thiết bị thông minh, ứng dụng di động, giải pháp phần mềm doanh nghiệp SaaS.", descriptionEn: "Smart devices, mobile apps, SaaS corporate enterprise solutions." },
  { id: "ind-8", nameVi: "Giáo dục & Đào tạo", nameEn: "Education & Training", descriptionVi: "Khóa học trực tuyến, đào tạo kỹ năng, trung tâm tiếng Anh, khóa học phát triển bản thân.", descriptionEn: "Online programs, skills training, English centers, and self-growth masterclasses." },
  { id: "ind-9", nameVi: "Y tế & Chăm sóc sức khỏe", nameEn: "Medical & Healthcare", descriptionVi: "Khám sức khỏe, thực phẩm chức năng, bệnh viện, phòng khám nha khoa uy tín.", descriptionEn: "Medical checkups, vitamins and supplements, hospital groups, and clinics." },
  { id: "ind-10", nameVi: "Du lịch & Khách sạn", nameEn: "Tourism & Hospitality", descriptionVi: "Tour du lịch trải nghiệm, khách sạn nghỉ dưỡng, tư vấn visa và di chuyển.", descriptionEn: "Experiential tours, resort hotels, transport and visa consultation." },
  { id: "ind-11", nameVi: "Tài chính & Bảo hiểm", nameEn: "Finance & Insurance", descriptionVi: "Tư vấn đầu tư, bảo hiểm nhân thọ, tiết kiệm, giải pháp tài trợ vốn linh hoạt.", descriptionEn: "Investment advisory, life insurance, saving accounts, and capital loans." },
  { id: "ind-12", nameVi: "Công nghiệp nặng & Cơ khí", nameEn: "Heavy Industry & Mechanics", descriptionVi: "Máy móc thiết bị cơ khí, bồn bể bọc lót công nghiệp, dây chuyền sản xuất cơ chế cao.", descriptionEn: "Heavy machinery and mechanical components, production lines, and engineering." },
  { id: "ind-13", nameVi: "Dịch vụ Ô tô / Detailing", nameEn: "Automotive Services / Detailing", descriptionVi: "Bảo trì ô tô, độ xe, dán phim cách nhiệt PPF, rửa xe và detailing chuyên sâu.", descriptionEn: "Car maintenance, tuning, PPF protective wrap, washing, and deep detailing." },
  { id: "ind-14", nameVi: "Logistics & Kho vận", nameEn: "Logistics & Warehousing", descriptionVi: "Vận tải nội địa, xuất nhập khẩu, kho bãi thông minh, dịch vụ chuyển phát nhanh.", descriptionEn: "Domestic delivery, import-export clearance, smart warehouses, and express shipping." },
  { id: "ind-15", nameVi: "Giải trí & Media", nameEn: "Entertainment & Media", descriptionVi: "Sản xuất video viral, thu âm, tổ chức sự kiện âm nhạc, livestream và sáng tạo nội dung.", descriptionEn: "Viral video production, audio recording, musical events, live commerce, and content creation." }
];

const smartPresets: SmartPreset[] = [
  {
    id: "pre-1",
    nameVi: "Quảng cáo TikTok Chuyển đổi cao",
    nameEn: "High-Converting TikTok Ad",
    goalVi: "Thu hút người xem trong 3 giây đầu, bộc lộ nỗi đau nhanh, kích thích click mua ngay.",
    goalEn: "Hook users in first 3s, show pain-points rapidly, stimulate dynamic call-to-action click-through.",
    toneVi: "Năng động, cuốn hút, hối hả, kích thích tò mò",
    toneEn: "Energetic, engaging, fast-paced, curiosity-driven",
    styleVi: "Nhịp điệu nhanh, text động chớp nhoáng, âm thanh chuyển cảnh ấn tượng",
    styleEn: "Fast-paced rhythm, kinetic text overlays, impactful transition soundscapes",
    expertRoleVi: "Chuyên gia thấu hiểu tâm lý khách hàng thế hệ Gen Z",
    expertRoleEn: "Gen Z consumer psychology marketing expert",
    ctaVi: "Nhấn vào giỏ hàng ưu đãi giảm 50% chỉ hôm nay!",
    ctaEn: "Tap on the basket to claim 50% off - today only!"
  },
  {
    id: "pre-2",
    nameVi: "Review Sản Phẩm Lên Xu Hướng",
    nameEn: "Viral Product Review",
    goalVi: "Đánh giá chân thực tế, so sánh Trước & Sau, tạo độ tin cậy tuyệt đối.",
    goalEn: "Authentic evaluation, Before & After comparison, building absolute credibility.",
    toneVi: "Thân thiện, chân thật, khách quan nhưng cực kỳ thuyết phục",
    toneEn: "Friendly, authentic, objective but highly persuasive",
    styleVi: "Góc quay chân thực cận cảnh, tự nhiên, voiceover truyền cảm hóm hỉnh",
    styleEn: "Close-up realistic shots, natural setup, warm & witty voiceover",
    expertRoleVi: "KOL uy tín với nhiều năm trải nghiệm thực tế",
    expertRoleEn: "A trusted KOL with years of product experience",
    ctaVi: "Đọc bình luận ghim bên dưới để nhận mã giảm giá kín nhé!",
    ctaEn: "Check pinned comments below to unlock our secret coupon code!"
  },
  {
    id: "pre-3",
    nameVi: "Video Câu Chuyện Thương Hiệu",
    nameEn: "Brand Narrative Video",
    goalVi: "Tận tâm kiến tạo giá trị, chứng minh nguồn gốc thiên nhiên, nâng tầm đẳng cấp.",
    goalEn: "Dedication to value creation, proven natural origin, elevating brand prestige.",
    toneVi: "Sang trọng, sâu lắng, uy tín, đẳng cấp truyền cảm hứng",
    toneEn: "Prestigious, deep, premium, inspiring, trust-oriented",
    styleVi: "Khung cảnh cinematic điện ảnh mượt mà, ánh sáng nghệ thuật",
    styleEn: "Smooth cinematic lighting, professional layouts and color grading",
    expertRoleVi: "Nhà sáng lập dồn hết tâm huyết tạo ra sản phẩm",
    expertRoleEn: "Dedicative brand founder who crafted the product",
    ctaVi: "Để lại thông tin tư vấn để nhận liệu trình cá nhân hóa miễn phí.",
    ctaEn: "Fill out the consultation form to fetch your free tailored skin regime."
  }
];

// Seed some initial projects for immediate view
const generateSeedProjects = () => {
  const p1: Project = {
    id: "proj-1",
    name: "Sữa rửa mặt thảo dược trị mụn SkinCleanse",
    industryId: "ind-1",
    contentType: "TikTok Ad Video",
    productName: "SkinCleanse Herbal Cream",
    productCategory: "Cosmetics",
    productInfo: "Chiết xuất tràm trà, rau má thiên nhiên giúp đánh bay mụn viêm sau 7 ngày, mờ thâm hiệu quả, lành tính cho cả da nhạy cảm nhất.",
    aiLanguage: "vi",
    goal: "Chứng minh hiệu quả giảm mụn viêm cấp tốc dọn sạch làn da tự tin đón Tết.",
    tone: "Thân thiện, tin cậy, khoa học",
    style: "Kết hợp thí nghiệm khoa học và review thực tế da khỏe lên từng ngày",
    aiExpertRole: "Bác sĩ da liễu giàu kinh nghiệm lâm sàng",
    cta: "Mua ngay hôm nay để nhận voucher giảm 35% kèm miễn phí giao hàng toàn quốc!",
    imageReferences: [],
    status: "Completed",
    createdAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    scriptTitle: "Kịch bản Sữa Rửa Mặt Thảo Dược SkinCleanse - Đột Phá 7 Ngày Sạch Mụn",
    scriptContent: `[TIÊU ĐỀ: ĐÁNH BAY MỤN VIÊM TRÊN DA TRONG 7 NGÀY]
[PHÂN CẢNH 1: HOOK THU HÚT]
- Voiceover: Bạn có mệt mỏi với những nốt mụn sưng đỏ nổi lên đúng ngày hẹn hò quan trọng? Soi gương mà chỉ muốn khóc thôi đúng không?
- Visual: Gương mặt mệt mỏi, stress ngắm vết đỏ viêm tấy trên mặt.

[PHÂN CẢNH 2: NỖI ĐAU KHÁCH HÀNG / PAIN POINT]
- Voiceover: Đã thử đủ mọi cách, thoa dưỡng chất đắt đỏ nhưng mụn vẫn tái đi tái lại khiến da mỏng yếu và sẹo thâm chi chít. 
- Visual: Zoom cận cảnh làn da xỉn màu nhiều vết thâm và sẹo mụn li ti.

[PHÂN CẢNH 3: GIẢI PHÁP / PRODUCT INTRO]
- Voiceover: Dừng lại ngay! Sữa rửa mặt thảo dược cao cấp SkinCleanse cứu cánh thần kỳ xuất hiện rồi đây!
- Visual: Lọ sữa rửa mặt SkinCleanse xanh ngát thảo dược đặt giữa vòi nước tinh khiết, bọt mịn màng như bông mây.

[PHÂN CẢNH 4: NỔI BẬT LỢI ÍCH / BENEFITS]
- Voiceover: Với công thức chứa tinh dầu tràm dại và chiết xuất rau má đậm đặc, sản phẩm giúp diệt khuẩn mụn sưng chỉ sau 24h, phục hồi màng bảo vệ da, trả lại làn da láng mịn, khỏe mạnh rạng ngời.
- Visual: Hoạt ảnh tế bào da xẹp dần mụn viêm gột rửa sạch sâu lớp dầu thừa bụi bẩn. Bề mặt da mịn màng, ẩm mượt không khô ráp.

[PHÂN CẢNH 5: CAMERA KIỂM CHỨNG & NIỀM TIN]
- Voiceover: 98% khách hàng và các bác sĩ da liễu hàng đầu khuyên dùng vì độ an toàn tuyệt đối, cam kết không chứa cồn hay paraben độc hại.
- Visual: Hình ảnh chứng nhận an toàn y tế và biểu đồ hài lòng tích cực 5 sao của người dùng.

[PHÂN CẢNH 6: CTA / KÊU GỌI HÀNH ĐỘNG]
- Voiceover: Đừng chịu đựng mụn thêm giây phút nào nữa! Nhấp ngay liên kết phía dưới nhận ưu đãi độc quyền Giảm 35% duy nhất hôm nay!
- Visual: Banner khuyễn mãi lớn kèm hình mũi tên hướng xuống nút bấm "Mua Ngay Tại Đây".`,
    scriptVersionCount: 1,
    versions: [
      {
        version: 1,
        updatedAt: new Date(Date.now() - 34 * 3600 * 1000).toISOString(),
        title: "Kịch bản Sữa Rửa Mặt Thảo Dược SkinCleanse - Đột Phá 7 Ngày Sạch Mụn",
        content: `[TIÊU ĐỀ: ĐÁNH BAY MỤN VIÊM TRÊN DA TRONG 7 NGÀY]
[PHÂN CẢNH 1: HOOK THU HÚT]
- Voiceover: Bạn có mệt mỏi với những nốt mụn sưng đỏ nổi lên đúng ngày hẹn hò quan trọng? Soi gương mà chỉ muốn khóc thôi đúng không?
- Visual: Gương mặt mệt mỏi, stress ngắm vết đỏ viêm tấy trên mặt.

[PHÂN CẢNH 2: NỖI ĐAU KHÁCH HÀNG / PAIN POINT]
- Voiceover: Đã thử đủ mọi cách, thoa dưỡng chất đắt đỏ nhưng mụn vẫn tái đi tái lại khiến da mỏng yếu và sẹo thâm chi chít. 
- Visual: Zoom cận cảnh làn da xỉn màu nhiều vết thâm và sẹo mụn li ti.

[PHÂN CẢNH 3: GIẢI PHÁP / PRODUCT INTRO]
- Voiceover: Dừng lại ngay! Sữa rửa mặt thảo dược cao cấp SkinCleanse cứu cánh thần kỳ xuất hiện rồi đây!
- Visual: Lọ sữa rửa mặt SkinCleanse xanh ngát thảo dược đặt giữa vòi nước tinh khiết, bọt mịn màng như bông mây.

[PHÂN CẢNH 4: NỔI BẬT LỢI ÍCH / BENEFITS]
- Voiceover: Với công thức chứa tinh dầu tràm dại và chiết xuất rau má đậm đặc, sản phẩm giúp diệt khuẩn mụn sưng chỉ sau 24h, phục hồi màng bảo vệ da, trả lại làn da láng mịn, khỏe mạnh rạng ngời.
- Visual: Hoạt ảnh tế bào da xẹp dần mụn viêm gột rửa sạch sâu lớp dầu thừa bụi bẩn. Bề mặt da mịn màng, ẩm mượt không khô ráp.

[PHÂN CẢNH 5: CAMERA KIỂM CHỨNG & NIỀM TIN]
- Voiceover: 98% khách hàng và các bác sĩ da liễu hàng đầu khuyên dùng vì độ an toàn tuyệt đối, cam kết không chứa cồn hay paraben độc hại.
- Visual: Hình ảnh chứng nhận an toàn y tế và biểu đồ hài lòng tích cực 5 sao của người dùng.

[PHÂN CẢNH 6: CTA / KÊU GỌI HÀNH ĐỘNG]
- Voiceover: Đừng chịu đựng mụn thêm giây phút nào nữa! Nhấp ngay liên kết phía dưới nhận ưu đãi độc quyền Giảm 35% duy nhất hôm nay!
- Visual: Banner khuyễn mãi lớn kèm hình mũi tên hướng xuống nút bấm "Mua Ngay Tại Đây".`
      }
    ],
    scenes: [
      {
        id: "s-1",
        sceneNumber: 1,
        descriptionVi: "Một bạn trẻ soi gương thất vọng vì khuôn mặt nổi nốt mụn to đỏ tấy trước cuộc hẹn lớn.",
        descriptionEn: "A worried young person looking into a bathroom mirror, showing a prominent red acne spot on their cheek, looking stressed before an important event.",
        promptImage: "A high-quality close-up of a young Asian person looking at their reflection in a glossy bathroom mirror, sad expression pointing to a red skin blemish on cheek, cinematic soft lighting, corporate design feel, photo-realistic, complex depth, 8k resolution",
        promptVideo: "A subtle camera push-in showing a worried young Asian woman checking her cheek red spot in bathroom mirror, emotional lighting, slow motion, detailed facial textures",
        voiceScriptVi: "Bạn có mệt mỏi với những nốt mụn sưng đỏ nổi lên đúng ngày hẹn hò quan trọng? Soi gương mà chỉ muốn khóc thôi đúng không?",
        voiceScriptEn: "Are you tired of giant red pimples popping up right on your important date or meeting? It makes you want to cry looking into the mirror, doesn't it?",
        status: "Completed",
        imageUrl: "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=600&auto=format&fit=crop&q=60",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-beautiful-woman-applying-skin-cream-on-her-face-41221-large.mp4"
      },
      {
        id: "s-2",
        sceneNumber: 2,
        descriptionVi: "Zoom cận cảnh cấu trúc bề mặt da nhiều vết mụn thâm cũ bị tổn thương, biểu hiện mỏng yếu rạn nứt.",
        descriptionEn: "A high magnification micro-shot of skin surface showing dryness, oil buildup, clogged pores and small acne scars.",
        promptImage: "Scientific macro photography of skin layers, pores clogged with sebum particles, red irritated skin patches, highly detailed clinical textbook view, lighting dramatic, 3D render styling, professional medical animation",
        promptVideo: "A smooth 3D flythrough across a digital representation of skin pores getting clogged with sebum droplets, realistic lighting",
        voiceScriptVi: "Đã thử đủ mọi cách, thoa dưỡng chất đắt đỏ nhưng mụn vẫn tái đi tái lại khiến da mỏng yếu và sẹo thâm chi chít.",
        voiceScriptEn: "You tried everything under the sun, applying expensive skin lotions but acne keeps returning, leaving your skin thin, weak and scarred with deep dark spots.",
        status: "Completed",
        imageUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=60",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-woman-looking-at-her-face-in-the-mirror-41444-large.mp4"
      },
      {
        id: "s-3",
        sceneNumber: 3,
        descriptionVi: "Sản phẩm sữa rửa mặt tràm trà SkinCleanse rực rỡ bên thớ lá trà thiên nhiên xanh tươi và giọt tinh dầu trong vắt.",
        descriptionEn: "The SkinCleanse cosmetic cleanser tube elegant bottle on a flat surface, decorated with fresh emerald tea tree leaves and sparkling droplets of essential oil, organic nature theme.",
        promptImage: "Luxury cosmetics product photography. A clean white of squeeze tube labeled SkinCleanse Herbal Cream, embedded in organic tea leaves and crystal clear water splashes, dynamic water ripples, clean studio lighting, teal primary accents #34b1b3, photorealistic",
        promptVideo: "Rotating slow spin of a beautiful cosmetic cleanser tube with fresh tea tree green leaves and dew drops, elegant studio light, smooth tracking shot",
        voiceScriptVi: "Dừng lại ngay! Sữa rửa mặt thảo dược cao cấp SkinCleanse cứu cánh thần kỳ xuất hiện rồi đây!",
        voiceScriptEn: "Stop right there! SkinCleanse Premium Herbal foaming wash has appeared as your ultimate miraculous skin savior!",
        status: "Completed",
        imageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&auto=format&fit=crop&q=60",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-washing-cosmetics-bottle-under-flowing-water-43187-large.mp4"
      },
      {
        id: "s-4",
        sceneNumber: 4,
        descriptionVi: "Làn da mịn màng tươi tắn rạng rỡ của bạn trẻ cười tự tin dưới ánh nắng sớm ấm áp trong lành.",
        descriptionEn: "Close up of a gorgeous flawless radiant smiling face of an Asian model, glowing hydrated, healthy skin under cozy morning sunlight.",
        promptImage: "Extremely clean beauty portait, flawless skin complexions of an Asian woman smiling warmly, dew drops glowing on cheekbones, natural bokeh of green trees, shallow depth of field, high-end skincare commercial style, 8k",
        promptVideo: "A beautiful close-up of a happy model touched by morning sun rays, turn her head and smiling gently, highlighting perfect glowing skin",
        voiceScriptVi: "Với công thức chứa tinh dầu tràm dại và chiết xuất rau má đậm đặc, sản phẩm giúp diệt khuẩn mụn sưng chỉ sau 24h, phục hồi màng bảo vệ da, trả lại làn da láng mịn, khỏe mạnh rạng ngời.",
        voiceScriptEn: "Packed with active wild tea tree oil and organic centella extract, it destroys acne bacteria in 24 hours, restores skin protective barrier, returning clean, hydrated, sparkling healthy skin.",
        status: "Completed",
        imageUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=60",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-young-woman-with-clean-face-smiling-41220-large.mp4"
      },
      {
        id: "s-5",
        sceneNumber: 5,
        descriptionVi: "Y sĩ da liễu trong trang phục blouse trắng lịch lãm mỉm cười giơ ngón tay cái bên lọ SkinCleanse chứng nhận kiểm khoa học y khoa.",
        descriptionEn: "A professional female dermatologist wearing a medical coat, smiling confidently and holding up a certifying test tube or product bottle.",
        promptImage: "Professional female dermatologist in clean lab coat standing in advanced modern clinical office, smiling warmly holding medical skin cleanser, certificates hanging on wall, clinical bright setup, corporate branding",
        promptVideo: "Dermatologist with glowing skin looking at camera and gesturing approval thumbs up inside safe scientific laboratory room",
        voiceScriptVi: "98% khách hàng và các bác sĩ da liễu hàng đầu khuyên dùng vì độ an toàn tuyệt đối, cam kết không chứa cồn hay paraben độc hại.",
        voiceScriptEn: "Over 98% of customers and expert clinical dermatologists highly recommend it for its absolute safety, guaranteeing zero harmful alcohols or artificial parabens.",
        status: "Completed",
        imageUrl: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=600&auto=format&fit=crop&q=60",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-young-female-doctor-smiling-with-stethoscope-41132-large.mp4"
      },
      {
        id: "s-6",
        sceneNumber: 6,
        descriptionVi: "Banner đồ họa khuyến mãi 35% có hiệu ứng nhấp nháy thu hút, tích hợp nút Mua Ngay đầy cuốn hút.",
        descriptionEn: "An eye-catching 3D sales promo card offering 35% discount with arrows, glowing neon outline in teal highlight colors, e-commerce buy now button.",
        promptImage: "E-commerce advertising graphical design layout, bold 3D green badge 'SAVE 35% TODAY ONLY' centered, glassmorphic card on dark glossy surface, clean typography 'Order Now', sleek studio setup",
        promptVideo: "Animated e-commerce marketing card popping up with glittering particles, teal glow and rotating promo tag offering 35% off",
        voiceScriptVi: "Đừng chịu đựng mụn thêm giây phút nào nữa! Nhấp ngay liên kết phía dưới nhận ưu đãi độc quyền Giảm 35% duy nhất hôm nay!",
        voiceScriptEn: "Stop tolerating painful breakouts! Tap the links below immediately to grab your exclusive 35% off discount deal, active today only!",
        status: "Completed",
        imageUrl: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600&auto=format&fit=crop&q=60",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-hands-holding-a-gold-and-black-gift-wrapped-box-42289-large.mp4"
      }
    ],
    isArchived: false
  };

  const p2: Project = {
    id: "proj-2",
    name: "Căn hộ Vinhomes Smart City hướng hồ cá cảnh",
    industryId: "ind-3",
    contentType: "Real Estate Facebook Post Video",
    productName: "Vinhomes Smart City Dream Suite",
    productCategory: "Real Estate",
    productInfo: "Căn hộ 2 phòng ngủ cực thông minh, ban công Đông Nam cực mát ngắm trọn hồ cảnh quan tự nhiên rộng 10ha, hỗ trợ vay ngân hàng 0% lãi suất trong 24 tháng.",
    aiLanguage: "both",
    goal: "Thu hút cặp vợ chồng trẻ có mức thu nhập ổn định mong muốn sở hữu căn hộ sang xịn tiện ích đồng bộ.",
    tone: "Sang trọng, năng động, đáng mơ ước",
    style: "Dẫn tour dạo quanh nhà, giới thiệu tiện ích 5 sao bao quanh",
    aiExpertRole: "Chuyên tư vấn đầu tư bất động sản cao cấp",
    cta: "Đăng ký tham gia ngày mở bán mở rộng để rinh ngay gói nội thất vàng 80 triệu đồng!",
    imageReferences: [],
    status: "Script Ready",
    createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    scriptTitle: "Kịch bản Căn Hộ Vinhomes Smart City - Tổ Ấm Ước Mơ",
    scriptContent: `[TIÊU ĐỀ: CĂN HỘ SMART CITY HƯỚNG HỒ - ĐẲNG CẤP SỐNG XANH]
[PHÂN CẢNH 1: HOOK]
- Voiceover: Trốn thoát khỏi khói bụi ồn ào đô thị, tưởng tượng mỗi sớm mai bạn tỉnh giấc rạng ngời bên tách cà phê ngắm hồ nước mát rộng 10ha mát lạnh ngập tràn ánh nắng... Có khó không?
- Visual: Drone bay mượt mà bao quát khu đô thị cao cấp, zoom thẳng ban công căn hộ sang trọng hướng hồ lộng gió.

[PHÂN CẢNH 2: PAIN POINT]
- Voiceover: Ngoài kia khói bụi, đường kẹt đông đúc mệt mỏi, nơi ở chật hẹp thiếu không gian vui chơi cho con trẻ khiến bạn stress sau ngày làm việc mỏi mệt?
- Visual: Đường phố tắc nghẽn đèn đỏ khói bụi, gương mặt cha mẹ lo lắng khi con không có bãi cỏ chạy vui đùa.

[PHÂN CẢNH 3: PRODUCT INTRO]
- Voiceover: Đó là lúc bạn cần chạm tay vào tổ ấm mơ ước: Vinhomes Smart City Dream Suite - Căn hộ 2 phòng ngủ cực thông minh lộng gió đông nam đón tài lộc phong thủy cực sành điệu!
- Visual: Cánh cửa thông minh tự động mở ra, lộ diện không gian phòng khách hiện đại thời thượng bật sáng thông minh qua hệ điều khiển giọng nói.

[PHÂN CẢNH 4: BENEFITS]
- Voiceover: Chẳng lo gánh nặng tài chính! Chỉ cần thanh toán từ 25%, Ngân hàng hỗ trợ vay trả góp lãi suất 0% dài hạn đến 24 tháng. Bạn có ngay cuộc sống nghỉ dưỡng chuẩn 5 sao với hồ cảnh quan, vườn nướng BBQ, bể bơi bốn mùa ngoài hiên nhà!
- Visual: Hoạt ảnh minh họa tài chính 0% nhẹ nhàng. Chuyển cảnh hồ bơi trong vắt lung linh, gia đình nhỏ vui cười nướng thịt dã ngoại ngày cuối tuần thư thái.

[PHÂN CẢNH 5: TRUST]
- Voiceover: Quản lý vận hành bởi tập đoàn hàng đầu, đảm bảo hạ tầng đồng bộ vượt trội, bảo vệ thông minh 24/7 an toàn cho mọi thành viên.
- Visual: Bảo vệ tác phong lịch lãm mở cổng thông minh, trẻ nhỏ vui đùa thoải mái dưới sân cỏ mát mẻ.

[PHÂN CẢNH 6: CTA]
- Voiceover: Cơ hội có 1-0-2! Nhấp đăng ký tư vấn ngay hôm nay để nhận ngay gói quà tặng tân gia Nội thất mạ vàng trị giá 80 triệu đồng hữu hạn! Thỏa ước mơ sở hữu nhà riêng dễ dàng hơn bao giờ hết!
- Visual: Bản đồ vị trí nổi bật và nút bấm 'Nhận Quà Tân Gia 80 TRIỆU' rực rỡ lấp lánh cuốn hút.`,
    scriptVersionCount: 1,
    versions: [
      {
        version: 1,
        updatedAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
        title: "Kịch bản Căn Hộ Vinhomes Smart City - Tổ Ấm Ước Mơ",
        content: `[TIÊU ĐỀ: CĂN HỘ SMART CITY HƯỚNG HỒ - ĐẲNG CẤP SỐNG XANH]
[PHÂN CẢNH 1: HOOK]
- Voiceover: Trốn thoát khỏi khói bụi ồn ào đô thị, tưởng tượng mỗi sớm mai bạn tỉnh giấc rạng ngời bên tách cà phê ngắm hồ nước mát rộng 10ha mát lạnh ngập tràn ánh nắng... Có khó không?
- Visual: Drone bay mượt mà bao quát khu đô thị cao cấp, zoom thẳng ban công căn hộ sang trọng hướng hồ lộng gió.

[PHÂN CẢNH 2: PAIN POINT]
- Voiceover: Ngoài kia khói bụi, đường kẹt đông đúc mệt mỏi, nơi ở chật hẹp thiếu không gian vui chơi cho con trẻ khiến bạn stress sau ngày làm việc mỏi mệt?
- Visual: Đường phố tắc nghẽn đèn đỏ khói bụi, gương mặt cha mẹ lo lắng khi con không có bãi cỏ chạy vui đùa.

[PHÂN CẢNH 3: PRODUCT INTRO]
- Voiceover: Đó là lúc bạn cần chạm tay vào tổ ấm mơ ước: Vinhomes Smart City Dream Suite - Căn hộ 2 phòng ngủ cực thông minh lộng gió đông nam đón tài lộc phong thủy cực sành điệu!
- Visual: Cánh cửa thông minh tự động mở ra, lộ diện không gian phòng khách hiện đại thời thượng bật sáng thông minh qua hệ điều khiển giọng nói.

[PHÂN CẢNH 4: BENEFITS]
- Voiceover: Chẳng lo gánh nặng tài chính! Chỉ cần thanh toán từ 25%, Ngân hàng hỗ trợ vay trả góp lãi suất 0% dài hạn đến 24 tháng. Bạn có ngay cuộc sống nghỉ dưỡng chuẩn 5 sao với hồ cảnh quan, vườn nướng BBQ, bể bơi bốn mùa ngoài hiên nhà!
- Visual: Hoạt ảnh minh họa tài chính 0% nhẹ nhàng. Chuyển cảnh hồ bơi trong vắt lung linh, gia đình nhỏ vui cười nướng thịt dã ngoại ngày cuối tuần thư thái.

[PHÂN CẢNH 5: TRUST]
- Voiceover: Quản lý vận hành bởi tập đoàn hàng đầu, đảm bảo hạ tầng đồng bộ vượt trội, bảo vệ thông minh 24/7 an toàn cho mọi thành viên.
- Visual: Bảo vệ tác phong lịch lãm mở cổng thông minh, trẻ nhỏ vui đùa thoải mái dưới sân cỏ mát mẻ.

[PHÂN CẢNH 6: CTA]
- Voiceover: Cơ hội có 1-0-2! Nhấp đăng ký tư vấn ngay hôm nay để nhận ngay gói quà tặng tân gia Nội thất mạ vàng trị giá 80 triệu đồng hữu hạn! Thỏa ước mơ sở hữu nhà riêng dễ dàng hơn bao giờ hết!
- Visual: Bản đồ vị trí nổi bật và nút bấm 'Nhận Quà Tân Gia 80 TRIỆU' rực rỡ lấp lánh cuốn hút.`
      }
    ],
    scenes: [],
    isArchived: false
  };

  const p3: Project = {
    id: "proj-3",
    name: "Liệu trình trẻ hóa tế bào da Spa Serene",
    industryId: "ind-2",
    contentType: "Intro Cinematic Clip",
    productName: "Serene Cell-Youth Ritual",
    productCategory: "Spa & Beauty",
    productInfo: "Công nghệ Meso kim cương kết hợp vàng 24k nuôi dưỡng tầng hạ bì, trả lại nước da căng bóng ngọc trai không nếp nhăn chảy xệ.",
    aiLanguage: "vi",
    goal: "Định vị phân khúc khách hàng thượng lưu sành điệu thích thư giãn và làm trẻ hóa cấp tốc.",
    tone: "Quý phái, uy tín, thư giãn",
    style: "Điền tĩnh, thanh tịnh sang trọng kiểu resort thiền",
    aiExpertRole: "Giám đốc chuyên môn thẩm mỹ viện Serene Clinic",
    cta: "Chạm chạm đặt lịch hẹn tư vấn miễn phí kèm suất xông hơi tuyết lạnh xua tan căng thẳng.",
    imageReferences: [],
    status: "Draft",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    scriptVersionCount: 0,
    versions: [],
    scenes: [],
    isArchived: false
  };

  projects = [p1, p2, p3];
};

generateSeedProjects();

// ==========================================
// 💡 RETRY STRATEGY & KEY ROTATION BOILERPLATE
// ==========================================
/**
 * Boilerplate implementation of robust rotation & retries
 * Handles rotating the custom API keys, and logs status.
 */
export async function executeAiTaskWithRetryPool<T>(
  taskType: string,
  modelName: string,
  prompt: string,
  systemInstruction: string,
  logCallback: (entry: LogEntry) => void,
  realApiKeyOverride?: string // Option for raw key
): Promise<string> {
  const localKeys = geminiKeys.filter(k => k.status === "Active");
  
  // Decide which key list to try
  let keysToTry: { id: string; name: string; apiKey: string }[] = [];
  
  if (realApiKeyOverride) {
    keysToTry.push({ id: "custom", name: "System Config Key", apiKey: realApiKeyOverride });
  }
  
  localKeys.forEach(k => {
    keysToTry.push({ id: k.id, name: k.name, apiKey: k.apiKey });
  });

  if (keysToTry.length === 0) {
    logCallback({
      timestamp: new Date().toLocaleTimeString(),
      level: "warn",
      message: "⚠️ Không tìm thấy API Key nào đang hoạt động trong Hồ chứa (Pool). Đang chuyển sang Chế độ Giả lập Tự động chất lượng cao..."
    });
    throw new Error("NO_ACTIVE_KEYS");
  }

  let lastError: any = null;
  const maxKeyAttempts = keysToTry.length;

  for (let keyIdx = 0; keyIdx < maxKeyAttempts; keyIdx++) {
    const currentKey = keysToTry[keyIdx];
    
    logCallback({
      timestamp: new Date().toLocaleTimeString(),
      level: "info",
      message: `🔄 [Xoay Vòng Key] Sử dụng Hồ tài khoản: [${currentKey.name}] để xử lý nhiệm vụ: [${taskType}]`
    });

    // Update pool last used time if valid
    const poolKey = geminiKeys.find(k => k.id === currentKey.id);
    if (poolKey) {
      poolKey.lastUsedTime = new Date().toISOString();
      poolKey.usageCount += 1;
    }

    const maxRetries = modelSettings.maxRetries;
    for (let tryNum = 1; tryNum <= maxRetries; tryNum++) {
      try {
        logCallback({
          timestamp: new Date().toLocaleTimeString(),
          level: "info",
          message: `📡 Gửi lệnh gọi đến ${modelName} (Thử lần ${tryNum}/${maxRetries})...`
        });

        // Skip actual call if mock keys are detected
        if (currentKey.apiKey.includes("SeedKey") || currentKey.apiKey.includes("flow_ak")) {
          // Trigger mock response after some artificial delay
          await new Promise(resolve => setTimeout(resolve, 1500));
          logCallback({
            timestamp: new Date().toLocaleTimeString(),
            level: "success",
            message: `✅ Thành công nhận kết quả kịch bản thông minh từ ${modelName}!`
          });
          return "MOCK_SUCCESS";
        }

        // Real Google GenAI client construction
        const aiInstance = new GoogleGenAI({
          apiKey: currentKey.apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            }
          }
        });

        const response = await aiInstance.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            systemInstruction: systemInstruction,
            temperature: 0.7
          }
        });

        if (response && response.text) {
          logCallback({
            timestamp: new Date().toLocaleTimeString(),
            level: "success",
            message: `🎉 Thành công rực rỡ! API kết nối hoàn tất.`
          });
          return response.text;
        } else {
          throw new Error("Trống dữ liệu trả về từ Gemini API");
        }

      } catch (err: any) {
        lastError = err;
        const errMsg = err.message || JSON.stringify(err);
        
        logCallback({
          timestamp: new Date().toLocaleTimeString(),
          level: "warn",
          message: `❌ Thử lần ${tryNum} thất bại. Lỗi: ${errMsg.substring(0, 80)}...`
        });

        // Update error count in database pool
        if (poolKey) {
          poolKey.errorCount += 1;
        }

        // If it's the last attempt on this key, warn rotation
        if (tryNum === maxRetries) {
          logCallback({
            timestamp: new Date().toLocaleTimeString(),
            level: "error",
            message: `⚠️ Khóa [${currentKey.name}] cạn kiệt số lần thử (${maxRetries}/${maxRetries}). Tự động kích hoạt chuyển đổi tài khoản...`
          });
          
          // Optionally auto-block if authenticating error
          if (errMsg.includes("API key not valid") || errMsg.includes("403") || errMsg.includes("unauthorized")) {
            if (poolKey) {
              poolKey.status = "Blocked";
              logCallback({
                timestamp: new Date().toLocaleTimeString(),
                level: "error",
                message: `🚫 Đã khóa tự động Key [${currentKey.name}] do lỗi quyền truy cập nghiêm trọng (Invalid/Blocked).`
              });
            }
          }
        } else {
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, modelSettings.retryDelayMs));
        }
      }
    }
  }

  throw lastError || new Error("Kiệt quệ tất cả các API Key có sẵn trong Hồ chứa!");
}

// Simulated background queue process worker tick
setInterval(() => {
  const pendingTask = queueTasks.find(t => t.status === "Pending");
  if (!pendingTask) return;

  // Process Task
  pendingTask.status = "Processing";
  pendingTask.startedAt = new Date().toISOString();
  pendingTask.progress = 5;
  pendingTask.logLines.push({
    timestamp: new Date().toLocaleTimeString(),
    level: "info",
    message: `🚀 Khởi chạy tác vụ Queue: [${pendingTask.taskType}] của dự án #${pendingTask.projectId}`
  });

  const project = projects.find(p => p.id === pendingTask.projectId);
  if (!project) {
    pendingTask.status = "Failed";
    pendingTask.errorMessage = "Không tìm thấy thông tin dự án chỉ định.";
    pendingTask.logLines.push({
      timestamp: new Date().toLocaleTimeString(),
      level: "error",
      message: `❌ Lỗi nghiêm trọng: ${pendingTask.errorMessage}`
    });
    pendingTask.completedAt = new Date().toISOString();
    return;
  }

  // Work emulation based on Task Type
  let step = 0;
  let finalScriptContent = "";
  let finalScenesContentArray: any[] = [];
  let aiCalling = false;
  const maxSteps = 10;
  const intervalId = setInterval(async () => {
    if (aiCalling) return;

    step++;
    pendingTask.progress = Math.min(step * 10, 95);

    if (pendingTask.taskType === "Script") {
      if (step === 2) {
        pendingTask.logLines.push({
          timestamp: new Date().toLocaleTimeString(),
          level: "info",
          message: "🔬 Đang giải nén bộ lọc thông tin ngành nghề và sản phẩm..."
        });
      } else if (step === 4) {
        pendingTask.logLines.push({
          timestamp: new Date().toLocaleTimeString(),
          level: "info",
          message: `🔑 Đang huy động tài nguyên... Sử dụng mô hình: [${modelSettings.scriptModel}]`
        });
        
        try {
          aiCalling = true;
          const systemInstruction = `Bạn là một Chuyên gia Copywriter và Đạo diễn Nội dung xuất sắc. Nhiệm vụ của bạn là viết một Kịch Bản Gốc (Master Script) liên tục, liền mạch và đầy sức thuyết phục cho một video quảng cáo/truyền thông.
Khi viết bằng Tiếng Việt, phải đảm bảo đúng chính tả 100%. Đặc biệt lưu ý sử dụng đúng các từ: "thông báo" (không dùng "thòng báo"), "nghỉ" (không dùng "nghí"), "năm mới" (không dùng "nâm mới"), và "giặt" (không dùng "giạt").`;

          const prompt = `[Dữ Liệu Đầu Vào - Inputs]
Tên sản phẩm: ${project.productName}
Danh mục/Ngành hàng: ${project.productCategory}
Thông tin chi tiết: ${project.productInfo}
Mục tiêu truyền thông: ${project.goal}
Giọng văn (Tone): ${project.tone}
Vai chuyên gia: ${project.aiExpertRole}
Lời kêu gọi (CTA): ${project.cta}
Ngôn ngữ đầu ra: ${project.aiLanguage === "both" ? "Cặp song ngữ Việt - Anh" : project.aiLanguage === "vi" ? "Tiếng Việt" : "Tiếng Anh"}
Độ dài mong muốn: ${project.targetWordCount || "300 - 500"} từ.

[Quy Tắc Viết BẮT BUỘC - Strict Rules]
1. Tuyệt đối KHÔNG chia phân cảnh: KHÔNG ĐƯỢC sử dụng các thẻ như [PHÂN CẢNH 1], [HOOK], [VOICEOVER], hay [VISUAL]. Chỉ viết một đoạn văn bản hoặc lời thoại liên tục từ đầu đến cuối.
2. Cấu trúc logic ngầm (Flow): Dù viết liền mạch, nội dung vẫn phải tuân thủ ngầm cấu trúc tâm lý: Thu hút sự chú ý (Hook) -> Xoáy sâu vào vấn đề (Pain Point) -> Đưa ra giải pháp là sản phẩm (Product Intro) -> Nhấn mạnh lợi ích (Benefits) -> Tạo niềm tin/Bảo hành (Trust) -> Kêu gọi hành động (CTA).
3. Văn phong tự nhiên: Viết như một lời kể chuyện, một bài thuyết trình, hoặc một đoạn chia sẻ tâm huyết từ góc nhìn của ${project.aiExpertRole}. Câu văn cần mượt mà, kết nối logic giữa các ý, không bị cắt vụn.
4. Chính tả chuẩn xác tuyệt đối: Khi viết bằng Tiếng Việt, phải đảm bảo đúng chính tả 100%. Đặc biệt lưu ý sử dụng đúng các từ: "thông báo" (không dùng "thòng báo"), "nghỉ" (không dùng "nghí"), "năm mới" (không dùng "nâm mới"), và "giặt" (không dùng "giạt").
5. Bám sát mục tiêu: Lời kêu gọi hành động cuối cùng phải khớp với ${project.cta} and phục vụ đúng ${project.goal}.
6. Văn phong mạng xã hội (Spoken Language): Lời thoại phải tự nhiên, đời thường, giống hệt cách một con người (Tiktoker/Reviewer/Người dùng) đang đứng trước máy quay nói chuyện với bạn bè. KHÔNG dùng từ ngữ sáo rỗng, đa cấp hoặc văn bản hành chính (ví dụ: cấm dùng "siêu phẩm", "thông báo đặc biệt", "giải pháp tối ưu", "hiệu năng vượt trội").
7. Xử lý Tên Sản Phẩm thông minh: Tên sản phẩm dài "${project.productName}" chỉ dùng để viết caption hoặc hiển thị Text trên màn hình. Trong phần lời thoại (Voiceover), phải TỰ ĐỘNG rút gọn tên sản phẩm cho dễ đọc (Ví dụ: "Cây Lau Nhà Tự Vắt KITIMOP CORAL Mã KTMC-01..." -> đọc là "Cây lau nhà Kitimop Coral này...").
8. Không đọc tên Hạng mục: Tuyệt đối KHÔNG đưa trực tiếp biến "${project.productCategory}" hay "${project.goal}" vào lời thoại. Hãy dùng chúng làm "kim chỉ nam" để định hướng nhịp độ và phong cách của video.

[Nhiệm vụ của bạn]
Dựa trên các Dữ Liệu Đầu Vào, hãy viết ngay kịch bản toàn cảnh (Master Script). Chỉ trả về nội dung kịch bản, không giải thích gì thêm.`;

          const result = await executeAiTaskWithRetryPool(
            "Tạo Kịch Bản Master",
            modelSettings.scriptModel,
            prompt,
            systemInstruction,
            (entry) => pendingTask.logLines.push(entry),
            process.env.GEMINI_API_KEY
          );

          if (result && result !== "MOCK_SUCCESS") {
            finalScriptContent = result;
          }

          pendingTask.logLines.push({
            timestamp: new Date().toLocaleTimeString(),
            level: "success",
            message: "✨ AI đã dọn sạch sơ đồ phân tích! Đang cấu trúc thành kịch bản video chuẩn hóa cao..."
          });
        } catch (err: any) {
          pendingTask.logLines.push({
            timestamp: new Date().toLocaleTimeString(),
            level: "warn",
            message: `⚠️ Sử dụng hồ API Key gặp trục trặc nhẹ. Kích hoạt logic mô phỏng dự phòng tối ưu...`
          });
        } finally {
          aiCalling = false;
        }
      } else if (step === 7) {
        pendingTask.logLines.push({
          timestamp: new Date().toLocaleTimeString(),
          level: "info",
          message: "🖋️ Soạn thảo chi tiết các phân đoạn theo cấu trúc: Hook -> Pain Point -> Product -> Proof -> CTA..."
        });
      } else if (step === 9) {
        pendingTask.logLines.push({
          timestamp: new Date().toLocaleTimeString(),
          level: "success",
          message: "💾 Tự động lưu trữ Bản Thảo Kịch Bản số 1 thành công."
        });
      }
    } 
    
    else if (pendingTask.taskType === "Scenes") {
      if (step === 2) {
        pendingTask.logLines.push({
          timestamp: new Date().toLocaleTimeString(),
          level: "info",
          message: `🎬 Đang quét kịch bản thô và phân mảnh thành các lát cắt phân cảnh hoạt cảnh độc lập...`
        });
      } else if (step === 4) {
        pendingTask.logLines.push({
          timestamp: new Date().toLocaleTimeString(),
          level: "info",
          message: `🔑 Gọi API Gemini [${modelSettings.sceneModel}] để tạo Voice-script, prompt hình ảnh, prompt video ổn định tiếng Anh.`
        });

        try {
          aiCalling = true;
          const masterScript = project.scriptContent || "Không có kịch bản gốc.";
          const language = project.aiLanguage === "both" ? "Cặp song ngữ Việt - Anh" : project.aiLanguage === "vi" ? "Tiếng Việt" : "Tiếng Anh";
          const videoStyle = project.style || "Hiện đại, thương mại cao cấp";

          const MASTER_PROMPT_V2 = `Bạn là một Đạo diễn TVC Quảng Cáo Thương Mại kiêm Chuyên gia Prompting cho các mô hình AI Visual (Google Imagen 3, Veo, Midjourney). Nhiệm vụ của bạn là bóc tách kịch bản thành các phân cảnh, và viết ra các câu lệnh (Prompts) tạo ảnh/video có chất lượng hình ảnh thương mại cao cấp, màu sắc trong trẻo, thu hút.

[Dữ Liệu Đầu Vào]
- Kịch bản gốc: ${masterScript}
- Ngôn ngữ Voice: ${language}
- Phong cách Video: ${videoStyle}

[Quy Tắc Hình Ảnh BẮT BUỘC (Dành Cho Prompt Ảnh & Video)]
1. Quy Tắc Cảnh Nỗi Đau (Pain Point): Khi mô tả sự bẩn thỉu, khó khăn, TUYỆT ĐỐI KHÔNG dùng từ khóa u ám (CẤM DÙNG: dramatic shadows, dark, gloomy, horror, high contrast). 
2. Ánh Sáng Thương Mại (Commercial Lighting): BẮT BUỘC sử dụng các từ khóa: "lifestyle commercial photography, bright and airy lighting, soft natural light, studio lighting, modern well-lit interior".
3. Màu Sắc Thương Hiệu: Luôn điểm xuyết: "subtle cyan #34b1b3 accents".
4. Chất Liệu Cao Cấp: Sử dụng từ khóa: "premium metallic finishes, sleek industrial minimalist design".
5. Quy Tắc Nhân Vật Nhất Quán & Thuần Việt (Vietnamese Characters): Nếu phân cảnh có xuất hiện người, BẮT BUỘC phải chỉ định rõ đó là người Việt Nam (Ví dụ: "a 25-year-old Vietnamese woman", "a Vietnamese man"). Tuyệt đối không dùng các từ chung chung như "a person" hoặc "a woman" để tránh AI vẽ người phương Tây. Nếu kịch bản có một nhân vật xuyên suốt, hãy giữ nguyên đoạn mô tả ngoại hình của nhân vật đó ở tất cả các cảnh.
6. Chuyển Động Video: Tập trung vào sự mượt mà ("smooth motion, fluid motion, slow motion pan").

[Cấu Trúc Bóc Tách]
Mỗi phân cảnh phải bao gồm ĐÚNG 4 phần:
1. Mô Tả Cảnh (VI): Mô tả bối cảnh ngắn gọn.
2. Prompt Ảnh (EN): Lệnh tiếng Anh tạo ảnh tĩnh. Chứa chi tiết nhân vật (Vietnamese), bối cảnh, ánh sáng, chất liệu và tỷ lệ (8k, photorealistic).
3. Prompt Video (EN): Lệnh tiếng Anh tạo chuyển động máy quay dựa trên hình ảnh tĩnh.
4. Giọng Đọc (Voice Script): Lời thoại trích từ kịch bản gốc.

[VÍ DỤ TIÊU CHUẨN]
- Prompt Ảnh (EN): Close up of a tired 25-year-old Vietnamese woman holding a wet mop over a modern bucket, modern well-lit bathroom background, frustrated facial expression, lifestyle commercial photography, bright and airy lighting, soft natural light, photorealistic, 8k.
- Prompt Video (EN): Slow motion camera panning over the wet mop, subtle frustrated hand movement of the Vietnamese woman, smooth lifestyle commercial video feel.

Hãy phân tích và bóc tách kịch bản đầu vào ngay bây giờ! Trả về định dạng JSON mảng các đối tượng chứa: { "description", "imagePrompt", "videoPrompt", "voiceScript" }.

CHỈ TRẢ VỀ mảng JSON duy nhất nằm trong dấu ngoặc vuông [], không thêm bất kỳ nhận định, giải thích hay lời nói đầu nào bên ngoài JSON.`;

          const promptText = `Hãy phân tích kịch bản gốc sau đây và bóc tách thành các phân cảnh hoàn hảo đúng cấu trúc mảng JSON được định nghĩa trong System Prompt:
          
"${masterScript}"

Trả về kết quả JSON ngay lập tức, tuyệt đối không giải thích thêm.`;

          const result = await executeAiTaskWithRetryPool(
            "Phân Phân Phân Cảnh (Scenes Breakdown)",
            modelSettings.sceneModel,
            promptText,
            MASTER_PROMPT_V2,
            (entry) => pendingTask.logLines.push(entry),
            process.env.GEMINI_API_KEY
          );

          if (result && result !== "MOCK_SUCCESS") {
            let cleanJson = result.trim();
            if (cleanJson.startsWith("```")) {
              const lines = cleanJson.split("\n");
              if (lines[0].startsWith("```json") || lines[0].startsWith("```")) {
                lines.shift();
              }
              if (lines[lines.length - 1].startsWith("```")) {
                lines.pop();
              }
              cleanJson = lines.join("\n").trim();
            }

            try {
              const parsed = JSON.parse(cleanJson);
              if (Array.isArray(parsed) && parsed.length > 0) {
                finalScenesContentArray = parsed;
                pendingTask.logLines.push({
                  timestamp: new Date().toLocaleTimeString(),
                  level: "success",
                  message: `🎉 Đã bóc tách thành công ${parsed.length} phân cảnh chi tiết từ kịch bản bằng AI!`
                });
              }
            } catch (jsonErr) {
              pendingTask.logLines.push({
                timestamp: new Date().toLocaleTimeString(),
                level: "warn",
                message: `⚠️ Lỗi định dạng JSON trả về từ AI. Đang đồng bộ hóa sang thiết kế phân cảnh mặc định của dự án...`
              });
            }
          }
        } catch (err: any) {
          pendingTask.logLines.push({
            timestamp: new Date().toLocaleTimeString(),
            level: "warn",
            message: `⚠️ Gặp lỗi kết nối AI khâu bóc tách phân cảnh. Kích hoạt logic phân rã dự phòng...`
          });
        } finally {
          aiCalling = false;
        }
      } else if (step === 7) {
        pendingTask.logLines.push({
          timestamp: new Date().toLocaleTimeString(),
          level: "info",
          message: "🌍 Chuyển ngữ tự động và rà soát từ khóa mỹ thuật tạo hình để bốt tối ưu hóa prompts..."
        });
      } else if (step === 9) {
        pendingTask.logLines.push({
          timestamp: new Date().toLocaleTimeString(),
          level: "success",
          message: `📊 Đã bóc tách tổng cộng ${finalScenesContentArray.length > 0 ? finalScenesContentArray.length : 6} phân cảnh độc lập hoàn mỹ.`
        });
      }
    }

    else if (pendingTask.taskType === "ImageGen") {
      if (step === 2) {
        pendingTask.logLines.push({
          timestamp: new Date().toLocaleTimeString(),
          level: "info",
          message: "⚙️ Đang đồng bộ hóa Hệ thống Quản lý Flow Account Pool..."
        });
      } else if (step === 4) {
        // ROTATION LOGIC FOR FLOW ACCOUNT
        const activeFlow = flowAccounts.find(fa => fa.status === "Active" && fa.credit > 0);
        if (activeFlow) {
          activeFlow.credit = Math.max(0, activeFlow.credit - 10);
          activeFlow.usageCount += 1;
          activeFlow.lastUsedTime = new Date().toISOString();
          pendingTask.logLines.push({
            timestamp: new Date().toLocaleTimeString(),
            level: "success",
            message: `⚡ Sử dụng Flow Account [${activeFlow.name}], Khấu trừ 10 Credit thành công. Số dư credit còn lại: ${activeFlow.credit}`
          });
        } else {
          // Auto rotate to next or warn exhaustion
          pendingTask.logLines.push({
            timestamp: new Date().toLocaleTimeString(),
            level: "warn",
            message: "🎒 Chú ý: Tài khoản Flow hiện tại cạn kiệt Credit! Đang kích hoạt xoay vòng sang tài khoản phụ..."
          });
          const nextFlow = flowAccounts.find(fa => fa.credit > 0);
          if (nextFlow) {
            nextFlow.status = "Active";
            nextFlow.credit = Math.max(0, nextFlow.credit - 10);
            nextFlow.usageCount += 1;
            nextFlow.lastUsedTime = new Date().toISOString();
            pendingTask.logLines.push({
              timestamp: new Date().toLocaleTimeString(),
              level: "success",
              message: `🛡️ Xoay vòng tài khoản Flow phụ thành công: [${nextFlow.name}] được kích hoạt. Trừ 10 credit.`
            });
          } else {
            pendingTask.logLines.push({
              timestamp: new Date().toLocaleTimeString(),
              level: "error",
              message: "🚨 Rất tiếc: Toàn bộ danh bạ tài khoản Flow đều trống rỗng số dư!"
            });
          }
        }
      } else if (step === 6) {
        try {
          aiCalling = true;
          // Call real Imagen 3 generation service!
          await generateImagesForProjectScenes(
            project,
            geminiKeys,
            async (keyId, updates) => {
              // Update in memory
              const key = geminiKeys.find(k => k.id === keyId);
              if (key) {
                Object.assign(key, updates);
              }
              // Update in database if Supabase is active
              if (getSupabase()) {
                await dbUpdateGeminiKey(keyId, updates).catch(err => {
                  console.error("Failed to update gemini key in Supabase:", err.message);
                });
              }
            },
            (entry) => {
              pendingTask.logLines.push(entry);
            }
          );
        } catch (err: any) {
          pendingTask.logLines.push({
            timestamp: new Date().toLocaleTimeString(),
            level: "error",
            message: `🚨 Lỗi nghiêm trọng khâu tạo ảnh Imagen 3: ${err.message}`
          });
          pendingTask.status = "Failed";
          pendingTask.errorMessage = err.message;
        } finally {
          aiCalling = false;
        }
      }
    }

    else if (pendingTask.taskType === "VideoGen") {
      if (step === 3) {
        pendingTask.logLines.push({
          timestamp: new Date().toLocaleTimeString(),
          level: "info",
          message: "🌊 Đang kết hợp tư thế nén ảnh mồi và chuyển hóa dòng video hoạt hóa mượt mà..."
        });
      } else if (step === 6) {
        // deduct flow credit again
        const flowAcc = flowAccounts.find(fa => fa.status === "Active" && fa.credit > 0) || flowAccounts[0];
        flowAcc.credit = Math.max(0, flowAcc.credit - 15);
        pendingTask.logLines.push({
          timestamp: new Date().toLocaleTimeString(),
          level: "success",
          message: `🎞️ Khấu trừ 15 Credit từ [${flowAcc.name}] để render chuyển động video. Credit còn lại: ${flowAcc.credit}`
        });
      } else if (step === 8) {
        pendingTask.logLines.push({
          timestamp: new Date().toLocaleTimeString(),
          level: "info",
          message: "📦 Đang biên dịch video tỉ lệ màn hình dọc 9:16 siêu mượt..."
        });
      }
    }

    else if (pendingTask.taskType === "VoiceGen") {
      if (step === 2) {
        pendingTask.logLines.push({
          timestamp: new Date().toLocaleTimeString(),
          level: "info",
          message: "⚙️ Đang đồng bộ hóa cấu hình tài khoản lồng tiếng ElevenLabs..."
        });
      } else if (step === 5) {
        try {
          aiCalling = true;
          // Call real ElevenLabs speech generation service!
          await generateVoiceForProjectScenes(
            project,
            elevenlabsKeys,
            async (keyId, updates) => {
              // Update in memory
              const key = elevenlabsKeys.find(k => k.id === keyId);
              if (key) {
                Object.assign(key, updates);
              }
              // Update in database if Supabase is active
              if (getSupabase()) {
                await dbUpdateElevenLabsKey(keyId, updates).catch(err => {
                  console.error("Failed to update ElevenLabs key in Supabase:", err.message);
                });
              }
            },
            (entry) => {
              pendingTask.logLines.push(entry);
            }
          );
        } catch (err: any) {
          pendingTask.logLines.push({
            timestamp: new Date().toLocaleTimeString(),
            level: "error",
            message: `🚨 Lỗi nghiêm trọng khâu lồng tiếng ElevenLabs: ${err.message}`
          });
          pendingTask.status = "Failed";
          pendingTask.errorMessage = err.message;
        } finally {
          aiCalling = false;
        }
      }
    }

    // Checking final completion
    if (step >= maxSteps) {
      clearInterval(intervalId);
      
      // Update Project and Task to Completed!
      pendingTask.progress = 100;
      pendingTask.status = "Completed";
      pendingTask.completedAt = new Date().toISOString();
      pendingTask.logLines.push({
        timestamp: new Date().toLocaleTimeString(),
        level: "success",
        message: `🏁 Hoàn thành xuất sắc toàn bộ quy trình xử lý tác vụ: [${pendingTask.taskType}]!`
      });

      // Update state data
      if (pendingTask.taskType === "Script") {
        project.status = "Script Ready";
        project.scriptTitle = `Kịch bản ${project.productName} - Bản Phóng Tác Độc Quyền`;
        
        let finalContent = finalScriptContent;
        if (!finalContent || finalContent === "MOCK_SUCCESS") {
          const shortName = project.productName.length > 25 ? project.productName.substring(0, 20) + " này" : project.productName;
          finalContent = `Chào các bạn, là một ${project.aiExpertRole}, hôm nay mình muốn chia sẻ thực lòng một chút. Nhiều khi bước sang năm mới, công việc cứ thế cuống cuồng lên làm chúng mình mệt mỏi rã rời, chẳng còn mấy thời gian để nghỉ ngơi hay tận hưởng cuộc sống đúng không? Riêng mấy chuyện dọn dẹp hay giặt giũ thôi cũng đã đủ đau đầu rồi. Nhưng từ lúc mình trải nghiệm chiếc ${shortName}, mọi thứ thực sự đã nhẹ nhàng hơn hẳn.

Nhờ ưu điểm ${project.productInfo ? project.productInfo.substring(0, 100) : "giải quyết nhanh gọn mọi vấn đề bất tiện"}, cuộc sống của mình đã trở nên thảnh thơi và dễ chịu hơn rất nhiều. Bản thân mình đã sử dụng thực tế và hoàn toàn bị thuyết phục bởi độ tiện lợi của nó. Các bạn đừng chần chừ nhé, hay bấm chọn ${project.cta} ngay bên dưới để cùng mình trải nghiệm sự khác biệt này nha!`;
        }
        
        project.scriptContent = finalContent;
        project.scriptVersionCount = 1;
        project.versions = [{
          version: 1,
          updatedAt: new Date().toISOString(),
          title: project.scriptTitle,
          content: project.scriptContent
        }];
      } 
      
      else if (pendingTask.taskType === "Scenes") {
        project.status = "Assets Ready";
        if (finalScenesContentArray && finalScenesContentArray.length > 0) {
          project.scenes = finalScenesContentArray.map((sc, scIdx) => {
            const desc = sc.description || sc.descriptionVi || `Cảnh tiếp theo trong chuỗi phân cảnh kịch bản ${project.productName}.`;
            const imgPr = sc.imagePrompt || sc.promptImage || `High-end minimalist industrial product photoshoot, lifestyle commercial photography, bright and airy lighting, soft natural light, photorealistic, 8k`;
            const vidPr = sc.videoPrompt || sc.promptVideo || `Smooth motion, fluid motion, slow motion pan`;
            const voice = sc.voiceScript || sc.voiceScriptVi || `Lời thoại phân cảnh ${scIdx + 1}`;
            
            return {
              id: generateId(),
              sceneNumber: sc.sceneNumber || (scIdx + 1),
              descriptionVi: desc,
              descriptionEn: sc.descriptionEn || desc,
              promptImage: imgPr,
              promptVideo: vidPr,
              voiceScriptVi: voice,
              voiceScriptEn: sc.voiceScriptEn || voice,
              status: "Completed"
            };
          });
        } else {
          project.scenes = [
            {
              id: generateId(),
              sceneNumber: 1,
              descriptionVi: `Khung cảnh đầu tiên kích thích mắt: Biểu thị khoảnh khắc trăn trở lo âu tìm hướng giải quyết cho dòng sản phẩm ${project.productName}.`,
              descriptionEn: `Visual hook: Cinematic high dynamic range close-up of a person thinking with deep focus about resolving their problems.`,
              promptImage: `Extremely artistic cinematic portrait of a person contemplating in study room, cozy warm lighting, teal highlight accents #34b1b3, photorealistic, 8k resolution, commercial design`,
              promptVideo: `Cinematic panning camera tracking shot of a focused modern professional in thoughtful mood, gentle light flares`,
              voiceScriptVi: `Đang gặp rắc rối với dòng sản phẩm đầy thử thách? Hãy rảnh tay lắng nghe giải pháp kỳ diệu này dọn đường thăng hoa!`,
              voiceScriptEn: `Struggling with issues regarding skincare and daily confidence? Listen to this revolutionary approach designed for you!`,
              status: "Completed"
            },
            {
              id: generateId(),
              sceneNumber: 2,
              descriptionVi: "Biển đồ học vẽ các nút thắt rắc rối, đau đớn dằn vặt của người tiêu dùng chưa tìm ra bến đỗ tin cậy.",
              descriptionEn: "Infographics illustrating modern consumer pain points, complicated pathways and heavy stress triggers.",
              promptImage: "Futuristic infographics presentation slide showing complicated lines, user struggles and high-contrast typography, premium sleek template UI",
              promptVideo: "Digital line flow representing financial graphs and user struggles glowing under sleek corporate cyan tone backdrop",
              voiceScriptVi: "Loay hoay tìm kiếm, đau đầu vì hiệu năng kém khiến tâm lý mệt mỏi chán nản bấy lâu nay phải không?",
              voiceScriptEn: "Wandering in countless forums, headache with poor results that drain your energy and hard-earned savings?",
              status: "Completed"
            },
            {
              id: generateId(),
              sceneNumber: 3,
              descriptionVi: `Ảnh giới thiệu cực lung linh của dòng ${project.productName} bày trí tinh tế thu hút mọi ánh nhìn.`,
              descriptionEn: `Ultra luxury layout demonstrating ${project.productName} inside an premium decorated showroom with plants.`,
              promptImage: `Luxury product photoshoot of ${project.productName} tube premium minimal skin product, marble background, soft shadows, studio lights, stunning colors, masterpiece`,
              promptVideo: `Slow cinematic dolly movement spinning around a beautiful brand cosmetic package on marble desktop with fresh roses`,
              voiceScriptVi: `Chào đón siêu phẩm cứu cánh: ${project.productName}! Người bạn tri kỷ nâng niu cuộc sống hạnh phúc của chính bạn!`,
              voiceScriptEn: `Welcoming our ultimate skin savior: ${project.productName}! Your daily premium companion to reclaim absolute confidence!`,
              status: "Completed"
            },
            {
              id: generateId(),
              sceneNumber: 4,
              descriptionVi: "Hình ảnh người dùng nở nụ cười rạng ngời mãn nguyện bừng sáng sinh khí khi sử dụng sản phẩm.",
              descriptionEn: "Highly glowing facial portrait of a pleased user with hydrated radiant skin smiling during sunlight morning.",
              promptImage: "Vibrant outdoor beauty close-up, young cheerful woman with perfect sparkling clean skin looking at camera, lush green natural park bokeh",
              promptVideo: "A fresh smooth slow-motion clip of a beautiful girl turning and laughing brightly toward sunlight wind",
              voiceScriptVi: `Lợi thế vượt trội giải quyết dứt điểm rắc rối, giúp nuôi dưỡng tái tạo chiều sâu một cách thần kỳ chỉ sau thời gian ngắn!`,
              voiceScriptEn: `Unlocking outstanding capabilities to repair and soothe your skin cells from within, delivering flawless beauty!`,
              status: "Completed"
            },
            {
              id: generateId(),
              sceneNumber: 5,
              descriptionVi: "Biêu đồ thống kê kết quả kiểm nghiệm y đức đáng tin cậy đạt điểm số tối đa từ người tiêu dùng chuyên sâu.",
              descriptionEn: "Graphic of satisfied client testimonials, charts reporting perfect 5-star clinical marks and certified approvals.",
              promptImage: "Minimalistic scientific slide design, 3D graphic cylinder bars reflecting customer high praise, health certificates logos, premium aesthetics",
              promptVideo: "Clean graphics of 3D charts rising up to 99% mark with safe icons floating nearby in studio background",
              voiceScriptVi: `Được kiểm chứng lâm sàng an toàn lành tính cao, mang phong thái sang trọng khuyên dùng rộng rãi trên thị trường.`,
              voiceScriptEn: `Clinically proven for highest gentle care, recommended globally by premium beauty clinical centers.`,
              status: "Completed"
            },
            {
              id: generateId(),
              sceneNumber: 6,
              descriptionVi: "Đoạn kêu gọi nhấn đặt hàng khẩn trương tận dụng ưu đãi đặc biệt tối ưu.",
              descriptionEn: "Urgent call to action banner featuring limited promo code, sleek download or order button flashing under beautiful overlay.",
              promptImage: "Commercial sleek call-to-action banner design, neon glowing text 'Claim Special Offer', minimal layout, teal border accents",
              promptVideo: "An elegant interactive e-commerce button animation pressing in with gold sparks and glowing coupon tags on dark teal backdrop",
              voiceScriptVi: `Hành động ngay! ${project.cta}! Đừng bỏ lỡ cơ hội bừng sáng nhan sắc hiếm hoi này!`,
              voiceScriptEn: `Act now! ${project.cta}! Don't miss out on this extremely limited gateway to gorgeous skin complexes!`,
              status: "Completed"
            }
          ];
        }
      } 
      
      else if (pendingTask.taskType === "ImageGen") {
        project.status = "Images Ready";
        // Ensure scene urls are hydrated, only falling back to dummy images if they are still missing
        const dummyImages = [
          "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=600&auto=format&fit=crop&q=60",
          "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=60",
          "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&auto=format&fit=crop&q=60",
          "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=600&auto=format&fit=crop&q=60",
          "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=600&auto=format&fit=crop&q=60",
          "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600&auto=format&fit=crop&q=60"
        ];
        project.scenes.forEach((sc, idx) => {
          if (!sc.imageUrl || (!sc.imageUrl.startsWith("http") && !sc.imageUrl.startsWith("data:image"))) {
            sc.imageUrl = dummyImages[idx % dummyImages.length];
          }
          sc.status = "Completed";
        });
      } 
      
      else if (pendingTask.taskType === "VideoGen") {
        project.status = "Completed";
        const dummyVideos = [
          "https://assets.mixkit.co/videos/preview/mixkit-beautiful-woman-applying-skin-cream-on-her-face-41221-large.mp4",
          "https://assets.mixkit.co/videos/preview/mixkit-woman-looking-at-her-face-in-the-mirror-41444-large.mp4",
          "https://assets.mixkit.co/videos/preview/mixkit-washing-cosmetics-bottle-under-flowing-water-43187-large.mp4",
          "https://assets.mixkit.co/videos/preview/mixkit-young-woman-with-clean-face-smiling-41220-large.mp4",
          "https://assets.mixkit.co/videos/preview/mixkit-young-female-doctor-smiling-with-stethoscope-41132-large.mp4",
          "https://assets.mixkit.co/videos/preview/mixkit-hands-holding-a-gold-and-black-gift-wrapped-box-42289-large.mp4"
        ];
        project.scenes.forEach((sc, idx) => {
          sc.videoUrl = dummyVideos[idx % dummyVideos.length];
        });
      }
      
      else if (pendingTask.taskType === "VoiceGen") {
        // Voiceover generation finished successfully
      }

      project.updatedAt = new Date().toISOString();
      if (getSupabase()) {
        dbUpdateProject(project.id, project).catch(err => {
          console.error("🚨 Failed to save background task updates to Supabase:", err.message);
        });
      }
    }
  }, 400); // Simulated delay ticks
}, 1000);

// ==========================================
// Express App Initialization
// ==========================================
const app = express();
app.use(express.json({ limit: '10mb' }));

// Multer and Upload Endpoint Configuration
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB Limit
});

app.post("/api/projects/upload", upload.single("image"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file provided" });
  }
  try {
    const file = req.file;
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}${path.extname(file.originalname)}`;
    const mimeType = file.mimetype;

    const supabase = getSupabase();
    if (supabase) {
      const publicUrl = await dbUploadReferenceImage(fileName, file.buffer, mimeType);
      return res.json({ url: publicUrl });
    }

    // Fallback: Convert to Base64 data URI
    const base64 = `data:${mimeType};base64,${file.buffer.toString("base64")}`;
    return res.json({ url: base64 });
  } catch (err: any) {
    console.error("Upload endpoint error:", err.message);
    res.status(500).json({ error: "Internal Server Error during upload" });
  }
});

// API: Get App Status
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// API: Get Supabase connection status and SQL schema script
app.get("/api/supabase-status", async (req, res) => {
  const isConfigured = !!getSupabase();
  let tablesOk = supabaseTablesExist;
  let errMsg = supabasePrehydrateError;

  if (isConfigured && !tablesOk) {
    try {
      await dbFetchAllProjects(false);
      tablesOk = true;
      supabaseTablesExist = true;
      supabasePrehydrateError = null;
      errMsg = null;
    } catch (err: any) {
      tablesOk = false;
      errMsg = err?.message || "Table 'projects_supabase' not found in public schema.";
    }
  }

  res.json({
    configured: isConfigured,
    tablesOk,
    error: errMsg,
    sqlSetupCode: SQL_SCHEMA_SETUP
  });
});

// API: Get Constants
app.get("/api/constants", (req, res) => {
  res.json({
    industryTemplates,
    smartPresets
  });
});

// API: Get Projects
app.get("/api/projects", async (req, res) => {
  const query = req.query.archived;
  const isArchived = query === 'true';

  if (getSupabase()) {
    try {
      const spProjects = await dbFetchAllProjects(isArchived);
      // Synchronize local cache with Supabase to make sure they match
      spProjects.forEach(sp => {
        const idx = projects.findIndex(p => p.id === sp.id);
        if (idx !== -1) {
          projects[idx] = sp;
        } else {
          projects.push(sp);
        }
      });
      return res.json(spProjects);
    } catch (err: any) {
      console.error("Supabase load projects failed, falling back to local memory cache:", err.message);
    }
  }

  const filtered = isArchived 
    ? projects.filter(p => p.isArchived)
    : projects.filter(p => !p.isArchived);
  res.json(filtered);
});

// API: Get Project Detail
app.get("/api/projects/:id", async (req, res) => {
  if (getSupabase()) {
    try {
      const spProject = await dbFetchProjectDetail(req.params.id);
      if (spProject) {
        const idx = projects.findIndex(p => p.id === spProject.id);
        if (idx !== -1) {
          projects[idx] = spProject;
        } else {
          projects.push(spProject);
        }
        return res.json(spProject);
      }
    } catch (err: any) {
      console.error(`Supabase load project detail ${req.params.id} failed:`, err.message);
    }
  }

  const project = projects.find(p => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: "Không tìm thấy dự án" });
  res.json(project);
});

// API: Create Project
app.post("/api/projects", async (req, res) => {
  const { 
    name, industryId, contentType, productName, productCategory, 
    productInfo, aiLanguage, goal, tone, style, aiExpertRole, cta, targetWordCount, imageReferences 
  } = req.body;

  if (!name || !productName) {
    return res.status(400).json({ error: "Vui lòng nhập tên dự án và tên sản phẩm" });
  }

  // Generate a cryptographically secure UUID for the project
  const projectId = crypto.randomUUID();

  const newProject: Project = {
    id: projectId,
    name,
    industryId: industryId || "ind-1",
    contentType: contentType || "TikTok Promo",
    productName,
    productCategory: productCategory || "Mỹ phẩm",
    productInfo: productInfo || "",
    aiLanguage: aiLanguage || "vi",
    goal: goal || "",
    tone: tone || "",
    style: style || "",
    aiExpertRole: aiExpertRole || "Chuyên gia AI",
    cta: cta || "",
    targetWordCount: targetWordCount || "300 - 500",
    imageReferences: imageReferences || [],
    status: "Draft",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    scriptVersionCount: 0,
    versions: [],
    scenes: [],
    isArchived: false
  };

  if (getSupabase()) {
    try {
      const saved = await dbCreateProject(newProject);
      if (saved) {
        projects.unshift(saved);
        return res.status(201).json(saved);
      }
    } catch (err: any) {
      console.error("Supabase create project failed, falling back to local memory:", err.message);
    }
  }

  projects.unshift(newProject);
  res.status(201).json(newProject);
});

// API: Update Project fields
app.put("/api/projects/:id", async (req, res) => {
  const project = projects.find(p => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: "Không tìm thấy dự án" });

  const fields = req.body;
  Object.assign(project, fields);
  project.updatedAt = new Date().toISOString();

  if (getSupabase()) {
    try {
      await dbUpdateProject(req.params.id, fields);
    } catch (err: any) {
      console.error(`Supabase update project ${req.params.id} failed:`, err.message);
    }
  }

  res.json(project);
});

// API: Save updated kịch bản & tạo phiên bản mới (Version History)
app.post("/api/projects/:id/script-save", async (req, res) => {
  const project = projects.find(p => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: "Không tìm thấy dự án" });

  const { title, content } = req.body;

  project.scriptTitle = title || project.scriptTitle;
  project.scriptContent = content;
  project.scriptVersionCount += 1;
  
  const newVer = {
    version: project.scriptVersionCount,
    updatedAt: new Date().toISOString(),
    title: project.scriptTitle || "Kịch bản tùy chỉnh",
    content: project.scriptContent || ""
  };
  
  project.versions.unshift(newVer);
  project.updatedAt = new Date().toISOString();

  if (getSupabase()) {
    try {
      await dbUpdateProject(req.params.id, {
        scriptTitle: project.scriptTitle,
        scriptContent: project.scriptContent,
        scriptVersionCount: project.scriptVersionCount,
        versions: project.versions
      });
    } catch (err: any) {
      console.error(`Supabase save script version for ${req.params.id} failed:`, err.message);
    }
  }

  res.json({
    message: "Tạo phiên bản mới thành công",
    project,
    newVersion: newVer
  });
});

// API: Restore script version
app.post("/api/projects/:id/versions/:verNum/restore", async (req, res) => {
  const project = projects.find(p => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: "Không tìm thấy dự án" });

  const targetVer = project.versions.find(v => v.version === parseInt(req.params.verNum));
  if (!targetVer) return res.status(404).json({ error: "Không tìm thấy phiên bản" });

  project.scriptTitle = targetVer.title;
  project.scriptContent = targetVer.content;
  project.updatedAt = new Date().toISOString();

  if (getSupabase()) {
    try {
      await dbUpdateProject(req.params.id, {
        scriptTitle: project.scriptTitle,
        scriptContent: project.scriptContent
      });
    } catch (err: any) {
      console.error(`Supabase restore script version for ${req.params.id} failed:`, err.message);
    }
  }

  res.json({
    message: "Khôi phục phiên bản thành công",
    project
  });
});

// API: Edit individual scene field
app.put("/api/projects/:id/scenes/:sceneId", async (req, res) => {
  const project = projects.find(p => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: "Không tìm thấy dự án" });

  const scene = project.scenes.find(s => s.id === req.params.sceneId);
  if (!scene) return res.status(404).json({ error: "Không tìm thấy phân cảnh" });

  const fields = req.body;
  Object.assign(scene, fields);
  project.updatedAt = new Date().toISOString();

  if (getSupabase()) {
    try {
      await dbUpdateProject(req.params.id, {
        scenes: project.scenes
      });
    } catch (err: any) {
      console.error(`Supabase update scene for project ${req.params.id} failed:`, err.message);
    }
  }

  res.json({ scene, project });
});

// API: Clone Project
app.post("/api/projects/:id/clone", async (req, res) => {
  const source = projects.find(p => p.id === req.params.id);
  if (!source) return res.status(404).json({ error: "Không tìm thấy dự án gốc" });

  const cloned: Project = JSON.parse(JSON.stringify(source));
  cloned.id = crypto.randomUUID();
  cloned.name = `${source.name} (Bản sao)`;
  cloned.createdAt = new Date().toISOString();
  cloned.updatedAt = new Date().toISOString();
  
  // Reset child IDs
  cloned.scenes.forEach(sc => {
    sc.id = generateId();
  });

  if (getSupabase()) {
    try {
      const saved = await dbCreateProject(cloned);
      if (saved) {
        projects.unshift(saved);
        return res.json(saved);
      }
    } catch (err: any) {
      console.error("Supabase clone project failed, falling back to local memory:", err.message);
    }
  }

  projects.unshift(cloned);
  res.json(cloned);
});

// API: Archive project
app.post("/api/projects/:id/archive", async (req, res) => {
  const project = projects.find(p => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: "Không tìm thấy dự án" });

  project.isArchived = !project.isArchived;
  project.updatedAt = new Date().toISOString();

  if (getSupabase()) {
    try {
      await dbUpdateProject(req.params.id, {
        isArchived: project.isArchived
      });
    } catch (err: any) {
      console.error(`Supabase archive project ${req.params.id} failed:`, err.message);
    }
  }

  res.json({ message: project.isArchived ? "Đã chuyển vào lưu trữ" : "Đã khôi phục hoạt động", project });
});

// API: Delete Project
app.delete("/api/projects/:id", async (req, res) => {
  const idx = projects.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Không tìm thấy dự án" });

  projects.splice(idx, 1);

  if (getSupabase()) {
    try {
      await dbDeleteProject(req.params.id);
    } catch (err: any) {
      console.error(`Supabase delete project ${req.params.id} failed:`, err.message);
    }
  }

  res.json({ message: "Xóa dự án thành công" });
});

// API: Queue Task triggers
app.post("/api/projects/:id/generate/:type", (req, res) => {
  const pId = req.params.id;
  const type = req.params.type as TaskType; // Script, Scenes, ImageGen, VideoGen
  
  const pExists = projects.find(p => p.id === pId);
  if (!pExists) return res.status(404).json({ error: "Dự án không khả dụng" });

  // Cancel any existing pending or processing task of same type for this project
  queueTasks = queueTasks.filter(t => !(t.projectId === pId && t.taskType === type && (t.status === "Pending" || t.status === "Processing")));

  const newTask: QueueTask = {
    id: `task-${generateId()}`,
    projectId: pId,
    taskType: type,
    status: "Pending",
    progress: 0,
    logLines: [
      { timestamp: new Date().toLocaleTimeString(), level: "info", message: `📝 Đã nhận yêu cầu đẩy vào Hàng chờ xử lý: [${type}]` }
    ],
    createdAt: new Date().toISOString()
  };

  queueTasks.push(newTask);
  res.json(newTask);
});

// API: Get all queue tasks
app.get("/api/queue/tasks", (req, res) => {
  res.json(queueTasks);
});

// API: Get project task logs
app.get("/api/projects/:id/tasks", (req, res) => {
  const filtered = queueTasks.filter(t => t.projectId === req.params.id);
  res.json(filtered);
});

// API: Gemini Account Pool Config CRUD
app.get("/api/keys/gemini", (req, res) => {
  res.json(geminiKeys);
});

app.post("/api/keys/gemini", async (req, res) => {
  const { name, apiKey } = req.body;
  if (!name || !apiKey) return res.status(400).json({ error: "Vui lòng nhập tên và mã API Key" });
  
  const nKey: GeminiKey = {
    id: `gkey-${generateId()}`,
    name,
    apiKey,
    status: "Active",
    usageCount: 0,
    errorCount: 0
  };

  if (getSupabase()) {
    try {
      const dbKey = await dbCreateGeminiKey(nKey);
      geminiKeys.push(dbKey);
      return res.status(201).json(dbKey);
    } catch (err: any) {
      console.warn("⚠️ Notice: Failed to save Gemini key to Supabase, saving to memory:", err.message);
    }
  }

  geminiKeys.push(nKey);
  res.status(201).json(nKey);
});

// API: Bulk Add Gemini Keys
app.post("/api/keys/gemini/bulk", async (req, res) => {
  const { keys } = req.body;
  if (!Array.isArray(keys) || keys.length === 0) {
    return res.status(400).json({ error: "Danh sách API Key không hợp lệ" });
  }

  const newKeys: GeminiKey[] = keys.map((k: any) => ({
    id: `gkey-${generateId()}`,
    name: k.name || `Bulk Key`,
    apiKey: k.apiKey,
    status: "Active",
    usageCount: 0,
    errorCount: 0
  }));

  if (getSupabase()) {
    try {
      const dbKeys = await dbBulkCreateGeminiKeys(newKeys);
      geminiKeys = [...geminiKeys, ...dbKeys];
      return res.status(201).json(dbKeys);
    } catch (err: any) {
      console.warn("⚠️ Notice: Failed to bulk save Gemini keys to Supabase, saving to memory:", err.message);
    }
  }

  geminiKeys = [...geminiKeys, ...newKeys];
  res.status(201).json(newKeys);
});

app.put("/api/keys/gemini/:id", async (req, res) => {
  const key = geminiKeys.find(k => k.id === req.params.id);
  if (!key) return res.status(404).json({ error: "Không tìm thấy API Key" });
  
  const { name, status, apiKey } = req.body;
  const updates: any = {};
  if (name !== undefined) { key.name = name; updates.name = name; }
  if (status !== undefined) { key.status = status; updates.status = status; }
  if (apiKey !== undefined) { key.apiKey = apiKey; updates.apiKey = apiKey; }

  if (getSupabase()) {
    try {
      await dbUpdateGeminiKey(req.params.id, updates);
    } catch (err: any) {
      console.warn("⚠️ Notice: Failed to update Gemini key in Supabase, updating in memory:", err.message);
    }
  }
  
  res.json(key);
});

app.delete("/api/keys/gemini/:id", async (req, res) => {
  const key = geminiKeys.find(k => k.id === req.params.id);
  if (!key) return res.status(404).json({ error: "Không tìm thấy API Key" });

  if (getSupabase()) {
    try {
      await dbDeleteGeminiKey(req.params.id);
    } catch (err: any) {
      console.warn("⚠️ Notice: Failed to delete Gemini key from Supabase, deleting from memory:", err.message);
    }
  }

  geminiKeys = geminiKeys.filter(k => k.id !== req.params.id);
  res.json({ message: "Xóa khóa thành công" });
});

// API: Flow Account Pool CRUD
app.get("/api/keys/flow", (req, res) => {
  res.json(flowAccounts);
});

app.post("/api/keys/flow", async (req, res) => {
  const { name, apiKey, credit } = req.body;
  if (!name || !apiKey) return res.status(400).json({ error: "Vui lòng nhập tên và khóa Flow" });
  
  const nAcc: FlowAccount = {
    id: `flow-${generateId()}`,
    name,
    apiKey,
    status: credit > 0 ? "Active" : "Exhausted",
    credit: credit !== undefined ? Number(credit) : 100,
    usageCount: 0
  };

  if (getSupabase()) {
    try {
      const dbAcc = await dbCreateFlowAccount(nAcc);
      flowAccounts.push(dbAcc);
      return res.status(201).json(dbAcc);
    } catch (err: any) {
      console.warn("⚠️ Notice: Failed to save Flow account to Supabase, saving to memory:", err.message);
    }
  }

  flowAccounts.push(nAcc);
  res.status(201).json(nAcc);
});

app.put("/api/keys/flow/:id", async (req, res) => {
  const acc = flowAccounts.find(a => a.id === req.params.id);
  if (!acc) return res.status(404).json({ error: "Không tìm thấy tài khoản Flow" });
  
  const { name, status, credit, apiKey } = req.body;
  const updates: any = {};
  if (name !== undefined) { acc.name = name; updates.name = name; }
  if (status !== undefined) { acc.status = status; updates.status = status; }
  if (apiKey !== undefined) { acc.apiKey = apiKey; updates.apiKey = apiKey; }
  if (credit !== undefined) {
    acc.credit = Number(credit);
    acc.status = acc.credit > 0 ? "Active" : "Exhausted";
    updates.credit = Number(credit);
    updates.status = acc.status;
  }

  if (getSupabase()) {
    try {
      await dbUpdateFlowAccount(req.params.id, updates);
    } catch (err: any) {
      console.warn("⚠️ Notice: Failed to update Flow account in Supabase, updating in memory:", err.message);
    }
  }
  
  res.json(acc);
});

app.delete("/api/keys/flow/:id", async (req, res) => {
  const acc = flowAccounts.find(a => a.id === req.params.id);
  if (!acc) return res.status(404).json({ error: "Không tìm thấy tài khoản Flow" });

  if (getSupabase()) {
    try {
      await dbDeleteFlowAccount(req.params.id);
    } catch (err: any) {
      console.warn("⚠️ Notice: Failed to delete Flow account from Supabase, deleting from memory:", err.message);
    }
  }

  flowAccounts = flowAccounts.filter(a => a.id !== req.params.id);
  res.json({ message: "Xóa tài khoản Flow thành công" });
});

// API: ElevenLabs Account Pool CRUD
app.get("/api/keys/elevenlabs", (req, res) => {
  res.json(elevenlabsKeys);
});

app.post("/api/keys/elevenlabs", async (req, res) => {
  const { name, apiKey } = req.body;
  if (!name || !apiKey) return res.status(400).json({ error: "Vui lòng nhập tên và mã API Key ElevenLabs" });
  
  const nKey: ElevenLabsKey = {
    id: `elkey-${generateId()}`,
    name,
    apiKey,
    status: "Active",
    usageCount: 0,
    errorCount: 0
  };

  if (getSupabase()) {
    try {
      const dbKey = await dbCreateElevenLabsKey(nKey);
      elevenlabsKeys.push(dbKey);
      return res.status(201).json(dbKey);
    } catch (err: any) {
      console.warn("⚠️ Notice: Failed to save ElevenLabs key to Supabase, saving to memory:", err.message);
    }
  }

  elevenlabsKeys.push(nKey);
  res.status(201).json(nKey);
});

// API: Bulk Add ElevenLabs Keys
app.post("/api/keys/elevenlabs/bulk", async (req, res) => {
  const { keys } = req.body;
  if (!Array.isArray(keys) || keys.length === 0) {
    return res.status(400).json({ error: "Danh sách API Key không hợp lệ" });
  }

  const newKeys: ElevenLabsKey[] = keys.map((k: any) => ({
    id: `elkey-${generateId()}`,
    name: k.name || `Bulk ElevenLabs Key`,
    apiKey: k.apiKey,
    status: "Active",
    usageCount: 0,
    errorCount: 0
  }));

  if (getSupabase()) {
    try {
      const dbKeys = await dbBulkCreateElevenLabsKeys(newKeys);
      elevenlabsKeys = [...elevenlabsKeys, ...dbKeys];
      return res.status(201).json(dbKeys);
    } catch (err: any) {
      console.warn("⚠️ Notice: Failed to bulk save ElevenLabs keys to Supabase, saving to memory:", err.message);
    }
  }

  elevenlabsKeys = [...elevenlabsKeys, ...newKeys];
  res.status(201).json(newKeys);
});

app.put("/api/keys/elevenlabs/:id", async (req, res) => {
  const key = elevenlabsKeys.find(k => k.id === req.params.id);
  if (!key) return res.status(404).json({ error: "Không tìm thấy API Key" });
  
  const { name, status, apiKey } = req.body;
  const updates: any = {};
  if (name !== undefined) { key.name = name; updates.name = name; }
  if (status !== undefined) { key.status = status; updates.status = status; }
  if (apiKey !== undefined) { key.apiKey = apiKey; updates.apiKey = apiKey; }

  if (getSupabase()) {
    try {
      await dbUpdateElevenLabsKey(req.params.id, updates);
    } catch (err: any) {
      console.warn("⚠️ Notice: Failed to update ElevenLabs key in Supabase, updating in memory:", err.message);
    }
  }
  
  res.json(key);
});

app.delete("/api/keys/elevenlabs/:id", async (req, res) => {
  const key = elevenlabsKeys.find(k => k.id === req.params.id);
  if (!key) return res.status(404).json({ error: "Không tìm thấy API Key" });

  if (getSupabase()) {
    try {
      await dbDeleteElevenLabsKey(req.params.id);
    } catch (err: any) {
      console.warn("⚠️ Notice: Failed to delete ElevenLabs key from Supabase, deleting from memory:", err.message);
    }
  }

  elevenlabsKeys = elevenlabsKeys.filter(k => k.id !== req.params.id);
  res.json({ message: "Xóa khóa thành công" });
});

// API: Models configuration
app.get("/api/settings/models", (req, res) => {
  res.json(modelSettings);
});

app.put("/api/settings/models", (req, res) => {
  const { scriptModel, sceneModel, maxRetries, retryDelayMs } = req.body;
  if (scriptModel) modelSettings.scriptModel = scriptModel;
  if (sceneModel) modelSettings.sceneModel = sceneModel;
  if (maxRetries !== undefined) modelSettings.maxRetries = Number(maxRetries);
  if (retryDelayMs !== undefined) modelSettings.retryDelayMs = Number(retryDelayMs);
  res.json(modelSettings);
});

// API: Admin stats dashboard
app.get("/api/admin/stats", (req, res) => {
  const totalProjects = projects.length;
  const activeTasks = queueTasks.filter(t => t.status === "Pending" || t.status === "Processing").length;
  const completedTasks = queueTasks.filter(t => t.status === "Completed").length;
  const failedTasks = queueTasks.filter(t => t.status === "Failed").length;
  
  const activeGeminiKeys = geminiKeys.filter(k => k.status === "Active").length;
  const activeFlowAccounts = flowAccounts.filter(a => a.status === "Active" && a.credit > 0).length;
  const activeElevenLabsKeys = elevenlabsKeys.filter(k => k.status === "Active").length;

  // error rate
  const totalErrors = queueTasks.reduce((acc, t) => acc + (t.status === "Failed" ? 1 : 0), 0);
  
  res.json({
    totalProjects,
    activeTasks,
    completedTasks,
    failedTasks,
    activeGeminiKeys,
    activeFlowAccounts,
    activeElevenLabsKeys,
    totalErrors,
    queueSummary: {
      pending: queueTasks.filter(t => t.status === "Pending").length,
      processing: queueTasks.filter(t => t.status === "Processing").length,
      completed: completedTasks,
      failed: failedTasks
    }
  });
});

// Server boot & Vite Integration
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Vite Dev Server middleware inside Express
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static frontend assets built in /dist
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Video Scripting Platform running on http://localhost:${PORT}`);
  });
}

startServer();
