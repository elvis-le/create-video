import React, { useState, useRef } from "react";
import { Sparkles, HelpCircle, Upload, Plus, Trash2, CheckCircle } from "lucide-react";
import { SmartPreset, IndustryTemplate } from "../types";

export const goalOptions = [
  { value: "Tăng nhận diện thương hiệu", labelVi: "Tăng nhận diện thương hiệu", labelEn: "Brand Awareness" },
  { value: "Chuyển đổi bán hàng / Ra đơn", labelVi: "Chuyển đổi bán hàng / Ra đơn", labelEn: "Sales Conversion" },
  { value: "Giáo dục thị trường", labelVi: "Giáo dục thị trường", labelEn: "Market Education" },
  { value: "Giải trí / Tạo Viral", labelVi: "Giải trí / Tạo Viral", labelEn: "Viral / Entertainment" },
  { value: "Xây dựng niềm tin / Uy tín", labelVi: "Xây dựng niềm tin / Uy tín", labelEn: "Trust / Credibility Builder" },
];

export const toneOptions = [
  { value: "Chuyên nghiệp & Gãy gọn", labelVi: "Chuyên nghiệp & Gãy gọn", labelEn: "Professional & Sharp" },
  { value: "Hài hước & Bắt trend", labelVi: "Hài hước & Bắt trend", labelEn: "Humorous & On-trend" },
  { value: "Kịch tính & Giật gân", labelVi: "Kịch tính & Giật gân", labelEn: "Dramatic & Sensational" },
  { value: "Chân thành & Cảm xúc", labelVi: "Chân thành & Cảm xúc", labelEn: "Sincere & Emotional" },
  { value: "Năng động & Trẻ trung", labelVi: "Năng động & Trẻ trung", labelEn: "Energetic & Youthful" },
];

export const styleOptions = [
  { value: "Hiện đại & Tốc độ nhanh", labelVi: "Hiện đại & Tốc độ nhanh", labelEn: "Modern & Fast-paced" },
  { value: "Tối giản (Minimalist)", labelVi: "Tối giản (Minimalist)", labelEn: "Minimalist" },
  { value: "Đậm chất điện ảnh (Cinematic)", labelVi: "Đậm chất điện ảnh (Cinematic)", labelEn: "Cinematic" },
  { value: "Công nghiệp (Industrial)", labelVi: "Công nghiệp (Industrial)", labelEn: "Industrial Style" },
  { value: "Hoạt hình / Motion Graphics", labelVi: "Hoạt hình / Motion Graphics", labelEn: "Animation / Motion Graphics" },
];

export const expertOptions = [
  { value: "Chuyên gia Marketing", labelVi: "Chuyên gia Marketing", labelEn: "Marketing Expert" },
  { value: "Kỹ sư / Chuyên viên kỹ thuật", labelVi: "Kỹ sư / Chuyên viên kỹ thuật", labelEn: "Engineer / Technical Specialist" },
  { value: "KOL / Reviewer", labelVi: "KOL / Reviewer", labelEn: "KOL / Reviewer" },
  { value: "Người tiêu dùng thực tế", labelVi: "Người tiêu dùng thực tế", labelEn: "Real-world Consumer" },
  { value: "Chủ doanh nghiệp", labelVi: "Chủ doanh nghiệp", labelEn: "Business Owner" },
];

export const ctaOptions = [
  { value: "Mua ngay", labelVi: "Mua ngay", labelEn: "Buy Now" },
  { value: "Tìm hiểu thêm", labelVi: "Tìm hiểu thêm", labelEn: "Learn More" },
  { value: "Nhận báo giá / Tư vấn", labelVi: "Nhận báo giá / Tư vấn", labelEn: "Request Quote / Consultation" },
  { value: "Đăng ký ngay", labelVi: "Đăng ký ngay", labelEn: "Register Now" },
  { value: "Inbox ngay", labelVi: "Inbox ngay", labelEn: "Message Us Now" },
  { value: "Tải ứng dụng", labelVi: "Tải ứng dụng", labelEn: "Download App" },
];

export const categoryOptions = [
  { value: "Video Quảng cáo ngắn (TikTok/Reels/Shorts)", labelVi: "Video Quảng cáo ngắn (TikTok/Reels/Shorts)", labelEn: "Short Video Ads (TikTok/Reels/Shorts)" },
  { value: "Giới thiệu doanh nghiệp / Corporate", labelVi: "Giới thiệu doanh nghiệp / Corporate", labelEn: "Corporate Video Introduction" },
  { value: "Review / Đánh giá sản phẩm", labelVi: "Review / Đánh giá sản phẩm", labelEn: "Product Review / Evaluation" },
  { value: "Đập hộp sản phẩm (Unboxing)", labelVi: "Đập hộp sản phẩm (Unboxing)", labelEn: "Product Unboxing" },
  { value: "Hướng dẫn sử dụng / Tutorial", labelVi: "Hướng dẫn sử dụng / Tutorial", labelEn: "Instruction / Tutorial Guide" },
  { value: "Vlog thực tế / Đời sống", labelVi: "Vlog thực tế / Đời sống", labelEn: "Lifestyle / Reality Vlog" },
  { value: "Phỏng vấn / Podcast Cuts", labelVi: "Phỏng vấn / Podcast Cuts", labelEn: "Interview / Podcast Clips" },
  { value: "Hậu trường (Behind the Scenes)", labelVi: "Hậu trường (Behind the Scenes)", labelEn: "Behind the Scenes (BTS)" },
  { value: "Câu chuyện thương hiệu (Brand Story)", labelVi: "Câu chuyện thương hiệu (Brand Story)", labelEn: "Brand Storyteller Narrative" },
  { value: "Phản hồi khách hàng (Testimonial)", labelVi: "Phản hồi khách hàng (Testimonial)", labelEn: "Customer Review / Testimonial" },
  { value: "Sự kiện / Recap", labelVi: "Sự kiện / Recap", labelEn: "Event / Show Recap Presentation" },
];

interface Props {
  lang: "vi" | "en";
  industries: IndustryTemplate[];
  presets: SmartPreset[];
  onCreateProject: (projectData: any) => Promise<void>;
  isLoading: boolean;
}

export default function ProjectCreator({ lang, industries, presets, onCreateProject, isLoading }: Props) {
  const [name, setName] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState("ind-1");
  const [contentType, setContentType] = useState("TikTok Video Ad (9:16)");
  const [productName, setProductName] = useState("");
  const [productCategory, setProductCategory] = useState("Video Quảng cáo ngắn (TikTok/Reels/Shorts)");
  const [productInfo, setProductInfo] = useState("");
  const [aiLanguage, setAiLanguage] = useState<"vi" | "en" | "both">("vi");
  const [targetWordCount, setTargetWordCount] = useState("300 - 500 từ");
  const [goal, setGoal] = useState("Tăng nhận diện thương hiệu");
  const [tone, setTone] = useState("Chuyên nghiệp & Gãy gọn");
  const [style, setStyle] = useState("Hiện đại & Tốc độ nhanh");
  const [expertRole, setExpertRole] = useState("Chuyên gia Marketing");
  const [cta, setCta] = useState("Mua ngay");
  const [images, setImages] = useState<string[]>([
    "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300&auto=format&fit=crop&q=60"
  ]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const applyPreset = (preset: SmartPreset) => {
    if (lang === "vi") {
      setGoal(preset.goalVi);
      setTone(preset.toneVi);
      setStyle(preset.styleVi);
      setExpertRole(preset.expertRoleVi);
      setCta(preset.ctaVi);
    } else {
      setGoal(preset.goalEn);
      setTone(preset.toneEn);
      setStyle(preset.styleEn);
      setExpertRole(preset.expertRoleEn);
      setCta(preset.ctaEn);
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    if (!e.target.files) return;
    const selectedFiles = Array.from(e.target.files) as File[];

    if (images.length + selectedFiles.length > 5) {
      setErrorMsg(
        lang === "vi"
          ? "Thông báo: Bạn chỉ được gửi tối đa 5 ảnh mẫu sản phẩm!"
          : "Notification: You can only upload up to 5 product images!"
      );
      // Auto-clear error after 4 seconds
      setTimeout(() => setErrorMsg(null), 4000);
      return;
    }

    const newImageUrls = selectedFiles.map(file => URL.createObjectURL(file));
    setImages(prev => [...prev, ...newImageUrls]);
  };

  const removeImage = (index: number) => {
    const targetImg = images[index];
    if (targetImg && targetImg.startsWith("blob:")) {
      URL.revokeObjectURL(targetImg);
    }
    setImages(images.filter((_, idx) => idx !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !productName) {
      alert(lang === "vi" ? "Vui lòng nhập Tên dự án và Tên sản phẩm chính!" : "Please enter Project Name and Product Name!");
      return;
    }

    onCreateProject({
      name,
      industryId: selectedIndustry,
      contentType,
      productName,
      productCategory: productCategory || (lang === "vi" ? "Mỹ phẩm" : "Cosmetics"),
      productInfo,
      aiLanguage,
      goal,
      tone,
      style,
      aiExpertRole: expertRole,
      cta,
      targetWordCount: targetWordCount || "300 - 500",
      imageReferences: images
    });
  };

  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl p-6 max-w-4xl mx-auto relative z-10 text-slate-200 font-sans">
      <div className="flex items-center gap-3 border-b border-white/10 pb-4 mb-6">
        <div className="p-2.5 rounded-lg bg-[#34b1b3]/10 text-[#34b1b3] shadow-[0_0_12px_rgba(52,177,179,0.15)]">
          <Sparkles className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white font-display">
            {lang === "vi" ? "Thiết Kế Chiến Dịch Dự Án Mới" : "Design New Campaign Project"}
          </h2>
          <p className="text-xs text-slate-400">
            {lang === "vi" 
              ? "Cung cấp định hướng thương hiệu, hình ảnh mồi, AI sẽ đảm nhận viết kịch bản." 
              : "Feed brand parameters and image reference, let AI orchestrate the master script."}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Form Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-stretch">
          {/* Col 1 */}
          <div className="flex flex-col space-y-5 justify-between h-full">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 font-mono">
                  {lang === "vi" ? "Tên dự án chiến dịch *" : "Project Campaign Name *"}
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={lang === "vi" ? "Ví dụ: Video Viral Sữa Rửa Mặt Tế Bào Gốc" : "e.g., Viral Cell Foam Wash TikTok Ad"}
                  className="w-full text-sm rounded-lg glass-input p-2.5 font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 font-mono">
                  {lang === "vi" ? "Mẫu Ngành Nghề" : "Industry Template"}
                </label>
                <select
                  value={selectedIndustry}
                  onChange={(e) => setSelectedIndustry(e.target.value)}
                  className="w-full text-sm rounded-lg glass-input p-2.5 cursor-pointer font-sans"
                >
                  {industries.map((ind) => (
                    <option key={ind.id} value={ind.id} className="bg-[#0a0f18] text-white">
                      {lang === "vi" ? ind.nameVi : ind.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 font-mono">
                  {lang === "vi" ? "Tên Sản Phẩm Chính *" : "Core Product Name *"}
                </label>
                <input
                  type="text"
                  required
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder={lang === "vi" ? "Ví dụ: SkinCleanse Gel" : "e.g., SkinCleanse Gel Product"}
                  className="w-full text-sm rounded-lg glass-input p-2.5 font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 font-mono">
                  {lang === "vi" ? "Danh Mục / Thể Loại *" : "Category / Subcategory *"}
                </label>
                <select
                  value={productCategory}
                  onChange={(e) => setProductCategory(e.target.value)}
                  className="w-full text-sm rounded-lg glass-input p-2.5 cursor-pointer hover:border-[#34b1b3]/80 focus:border-[#34b1b3] focus:ring-1 focus:ring-[#34b1b3]/20 font-sans"
                >
                  {!categoryOptions.some(opt => opt.value === productCategory) && productCategory && (
                    <option value={productCategory} className="bg-[#0a0f18] text-white">
                      {productCategory}
                    </option>
                  )}
                  {categoryOptions.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-[#0a0f18] text-white">
                      {lang === "vi" ? opt.labelVi : opt.labelEn}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex-1 flex flex-col mt-4 min-h-[160px] md:min-h-[220px]">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 font-mono">
                {lang === "vi" ? "Thông Tin Chi Tiết Sản Phẩm" : "Detailed Product Description"}
              </label>
              <textarea
                value={productInfo}
                onChange={(e) => setProductInfo(e.target.value)}
                placeholder={lang === "vi" ? "Thành phần, đặc sản khác biệt, hiệu quả kiểm định..." : "Ingredients, unique value proposition, test results..."}
                className="w-full text-sm rounded-lg glass-input p-3 resize-none flex-1 min-h-[120px] font-sans"
              />
            </div>
          </div>

          {/* Col 2 */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 font-mono">
                {lang === "vi" ? "Loại hình nội dung video" : "Video Format Style"}
              </label>
              <input
                type="text"
                value={contentType}
                onChange={(e) => setContentType(e.target.value)}
                placeholder="TikTok Ad, Facebook Short, Cinematic Promo..."
                className="w-full text-sm rounded-lg glass-input p-2.5 hover:border-[#34b1b3]/80 focus:border-[#34b1b3] focus:ring-1 focus:ring-[#34b1b3]/20 font-sans"
              />
            </div>

            <div className="bg-white/[0.03] border border-white/5 rounded-lg p-3">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-widest block mb-2 font-mono">
                ⚡ {lang === "vi" ? "Hộp Thiết Lập Smart Preset" : "Smart Presets Sandbox"}
              </span>
              <div className="flex flex-wrap gap-2">
                {presets.map((pre) => (
                  <button
                    key={pre.id}
                    type="button"
                    onClick={() => applyPreset(pre)}
                    className="text-xs font-medium bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#34b1b3]/55 transition-all text-slate-200 rounded-md px-3 py-1.5 cursor-pointer"
                  >
                    🚀 {lang === "vi" ? pre.nameVi : pre.nameEn}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 font-mono">
                {lang === "vi" ? "Ngôn Ngữ Đầu Ra" : "AI Output Language"}
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setAiLanguage("vi")}
                  className={`text-xs font-semibold border p-2 rounded-lg transition-all cursor-pointer ${aiLanguage === "vi" ? "bg-[#34b1b3]/20 text-white border-[#34b1b3]/30 shadow-[0_0_12px_rgba(52,177,179,0.15)]" : "bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-slate-200"}`}
                >
                  🇻🇳 Tiếng Việt
                </button>
                <button
                  type="button"
                  onClick={() => setAiLanguage("en")}
                  className={`text-xs font-semibold border p-2 rounded-lg transition-all cursor-pointer ${aiLanguage === "en" ? "bg-[#34b1b3]/20 text-white border-[#34b1b3]/30 shadow-[0_0_12px_rgba(52,177,179,0.15)]" : "bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-slate-200"}`}
                >
                  🇺🇸 English
                </button>
                <button
                  type="button"
                  onClick={() => setAiLanguage("both")}
                  className={`text-xs font-semibold border p-2 rounded-lg transition-all cursor-pointer ${aiLanguage === "both" ? "bg-[#34b1b3]/20 text-white border-[#34b1b3]/30 shadow-[0_0_12px_rgba(52,177,179,0.15)]" : "bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-slate-200"}`}
                >
                  🌍 Both/Song ngữ
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#34b1b3] uppercase tracking-wider mb-1.5 font-mono font-bold">
                {lang === "vi" ? "SỐ LƯỢNG TỪ MONG MUỐN" : "TARGET WORD COUNT"}
              </label>
              <input
                type="text"
                value={targetWordCount}
                onChange={(e) => setTargetWordCount(e.target.value)}
                placeholder={lang === "vi" ? "Ví dụ: 300 - 500 từ..." : "e.g., 300 - 500 words..."}
                className="w-full text-sm rounded-lg glass-input p-2.5 hover:border-[#34b1b3]/80 focus:border-[#34b1b3] focus:ring-1 focus:ring-[#34b1b3]/20 font-sans"
              />
            </div>

            {/* Dropdowns fields section - Upgraded to 2 columns and full-width CTA */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-1">
                <label className="block text-xs font-semibold text-slate-330 uppercase tracking-wider mb-1.5 font-mono">
                  {lang === "vi" ? "Mục tiêu truyền thông *" : "Video Core Goal *"}
                </label>
                <select
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="w-full text-sm rounded-lg glass-input p-2.5 cursor-pointer hover:border-[#34b1b3]/80 focus:border-[#34b1b3] focus:ring-1 focus:ring-[#34b1b3]/20 font-sans block"
                >
                  {!goalOptions.some(opt => opt.value === goal) && goal && (
                    <option value={goal} className="bg-[#0a0f18] text-white">
                      {goal}
                    </option>
                  )}
                  {goalOptions.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-[#0a0f18] text-white">
                      {lang === "vi" ? opt.labelVi : opt.labelEn}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-1">
                <label className="block text-xs font-semibold text-slate-330 uppercase tracking-wider mb-1.5 font-mono">
                  {lang === "vi" ? "Giọng Văn Thuyết Phục *" : "Voice Tone *"}
                </label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full text-sm rounded-lg glass-input p-2.5 cursor-pointer hover:border-[#34b1b3]/80 focus:border-[#34b1b3] focus:ring-1 focus:ring-[#34b1b3]/20 font-sans block"
                >
                  {!toneOptions.some(opt => opt.value === tone) && tone && (
                    <option value={tone} className="bg-[#0a0f18] text-white">
                      {tone}
                    </option>
                  )}
                  {toneOptions.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-[#0a0f18] text-white">
                      {lang === "vi" ? opt.labelVi : opt.labelEn}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-1">
                <label className="block text-xs font-semibold text-slate-330 uppercase tracking-wider mb-1.5 font-mono">
                  {lang === "vi" ? "Phong cách *" : "Frame Style *"}
                </label>
                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  className="w-full text-sm rounded-lg glass-input p-2.5 cursor-pointer hover:border-[#34b1b3]/80 focus:border-[#34b1b3] focus:ring-1 focus:ring-[#34b1b3]/20 font-sans block"
                >
                  {!styleOptions.some(opt => opt.value === style) && style && (
                    <option value={style} className="bg-[#0a0f18] text-white">
                      {style}
                    </option>
                  )}
                  {styleOptions.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-[#0a0f18] text-white">
                      {lang === "vi" ? opt.labelVi : opt.labelEn}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-1">
                <label className="block text-xs font-semibold text-slate-330 uppercase tracking-wider mb-1.5 font-mono">
                  {lang === "vi" ? "Vai chuyên gia *" : "AI Expert Role *"}
                </label>
                <select
                  value={expertRole}
                  onChange={(e) => setExpertRole(e.target.value)}
                  className="w-full text-sm rounded-lg glass-input p-2.5 cursor-pointer hover:border-[#34b1b3]/80 focus:border-[#34b1b3] focus:ring-1 focus:ring-[#34b1b3]/20 font-sans block"
                >
                  {!expertOptions.some(opt => opt.value === expertRole) && expertRole && (
                    <option value={expertRole} className="bg-[#0a0f18] text-white">
                      {expertRole}
                    </option>
                  )}
                  {expertOptions.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-[#0a0f18] text-white">
                      {lang === "vi" ? opt.labelVi : opt.labelEn}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-330 uppercase tracking-wider mb-1.5 font-mono">
                  {lang === "vi" ? "Nút CTA mong muốn *" : "CTA BUTTON TEXT *"}
                </label>
                <select
                  value={cta}
                  onChange={(e) => setCta(e.target.value)}
                  className="w-full text-sm rounded-lg glass-input p-2.5 cursor-pointer hover:border-[#34b1b3]/80 focus:border-[#34b1b3] focus:ring-1 focus:ring-[#34b1b3]/20 font-sans block"
                >
                  {!ctaOptions.some(opt => opt.value === cta) && cta && (
                    <option value={cta} className="bg-[#0a0f18] text-white">
                      {cta}
                    </option>
                  )}
                  {ctaOptions.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-[#0a0f18] text-white">
                      {lang === "vi" ? opt.labelVi : opt.labelEn}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Image Reference System uploading mockup 1-5 files */}
        <div id="image-reference-system-container" className="border border-dashed border-white/20 rounded-xl p-5 bg-black/20">
          {/* Hidden HTML input for actual file uploading */}
          <input
            id="hidden-product-image-uploader"
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg, image/webp"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />

          <div className="flex justify-between items-center mb-3">
            <div>
              <span className="block text-[11px] font-bold text-white uppercase tracking-wider font-mono">
                🖼️ {lang === "vi" ? "HỆ THỐNG ẢNH MẪU SẢN PHẨM" : "PRODUCT IMAGE REFERENCE SYSTEM"} (1 - 5)
              </span>
              <span className="text-[11px] text-slate-400">
                {lang === "vi" 
                  ? "Tải lên ảnh thực tế của sản phẩm làm tư liệu để AI phân tích bối cảnh tạo ảnh và chuyển động." 
                  : "Upload authentic product images as core inputs for high-fidelity prompt rendering."}
              </span>
            </div>
            <button
              id="btn-upload-product-image"
              type="button"
              onClick={triggerFileInput}
              disabled={images.length >= 5}
              className="flex items-center gap-1.5 text-xs font-bold bg-[#34b1b3] hover:bg-[#2db3b5] active:scale-95 text-white cursor-pointer rounded-lg px-4 py-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 shadow-md shadow-[#34b1b3]/20"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>
                {images.length >= 5 
                  ? (lang === "vi" ? "Đã đạt giới hạn ảnh" : "Limit reached")
                  : (lang === "vi" ? "Tải Ảnh Lên" : "Upload Image")}
              </span>
            </button>
          </div>

          {/* System notification banner for upload error feedback */}
          {errorMsg && (
            <div id="image-upload-error-alert" className="p-3 mb-3 text-xs bg-red-500/10 border border-red-500/20 text-red-250 rounded-lg flex items-center justify-between animate-pulse">
              <span className="flex items-center gap-1.5 font-medium">
                ⚠️ {errorMsg}
              </span>
              <button
                type="button"
                onClick={() => setErrorMsg(null)}
                className="text-red-400 hover:text-red-300 text-sm font-bold ml-2 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {images.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-500">
              {lang === "vi" ? "Chưa có ảnh mẫu nào được gắn kèm. Hãy nhấp 'Tải Ảnh Lên' để bắt đầu." : "No references linked. Click to include image layouts."}
            </div>
          ) : (
            <div className="grid grid-cols-5 gap-3">
              {images.map((img, index) => (
                <div key={index} className="relative group rounded-lg overflow-hidden border border-white/10 hover:border-[#34b1b3] bg-black/30 shadow-md h-24 transition-all duration-200">
                  <img src={img} alt="mock-prod-ref" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center bg-red-600 hover:bg-red-500 text-white rounded-full opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity cursor-pointer shadow-lg text-[10px] font-bold"
                    title={lang === "vi" ? "Xóa ảnh" : "Remove image"}
                  >
                    ✕
                  </button>
                  <div className="absolute bottom-1 left-1 px-1.5 bg-black/75 rounded text-[9px] text-[#34b1b3] font-bold font-mono">
                    #{index + 1}
                  </div>
                </div>
              ))}
              {images.length < 5 && (
                <button
                  type="button"
                  onClick={triggerFileInput}
                  className="flex flex-col items-center justify-center border border-dashed border-white/15 hover:border-[#34b1b3] hover:text-[#34b1b3] rounded-lg hover:bg-white/5 transition-all h-24 text-slate-400 cursor-pointer"
                >
                  <Plus className="w-5 h-5 transition-colors" />
                  <span className="text-[10px] font-mono mt-1">{images.length}/5</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Submit action */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center justify-center gap-2 cursor-pointer bg-[#34b1b3] text-white font-bold hover:bg-[#2db3b5] transition-all rounded-xl px-7 py-3 w-full sm:w-auto shadow-lg shadow-[#34b1b3]/30"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>{lang === "vi" ? "Đang đẩy vào Queue..." : "Dispatching into Queue Task..."}</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>{lang === "vi" ? "Tạo Kịch Bản Bằng AI" : "Generate Script via AI Queue"}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
