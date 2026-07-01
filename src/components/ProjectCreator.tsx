import React, { useState, useRef, useEffect } from "react";
import { Sparkles, HelpCircle, Upload, Plus, Trash2, CheckCircle } from "lucide-react";
import { SmartPreset, IndustryTemplate, Project, AIVoice } from "../types";

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
  { value: "photorealistic", labelVi: "Ảnh thực tế thương mại (Photorealistic)", labelEn: "Photorealistic Commercial Style" },
  { value: "3d-pixar", labelVi: "Hoạt hình 3D Pixar (3D Pixar Style)", labelEn: "3D Pixar Animation Style" },
  { value: "2d-anime", labelVi: "Hoạt hình 2D Anime (2D Anime Style)", labelEn: "2D Anime Style" },
  { value: "Hiện đại & Tốc độ nhanh", labelVi: "Hiện đại & Tốc độ nhanh", labelEn: "Modern & Fast-paced" },
  { value: "Tối giản (Minimalist)", labelVi: "Tối giản (Minimalist)", labelEn: "Minimalist" },
  { value: "Đậm chất điện ảnh (Cinematic)", labelVi: "Đậm chất điện ảnh (Cinematic)", labelEn: "Cinematic" },
  { value: "Công nghiệp (Industrial)", labelVi: "Công nghiệp (Industrial)", labelEn: "Industrial Style" },
  { value: "Hoạt hình / Motion Graphics", labelVi: "Hoạt hình / Motion Graphics", labelEn: "Animation / Motion Graphics" },
  { value: "Chân thực & Đời thường (UGC)", labelVi: "Chân thực & Đời thường (UGC)", labelEn: "Authentic & Everyday (UGC)" },
  { value: "Vlog / Tâm tình gần gũi", labelVi: "Vlog / Tâm tình gần gũi", labelEn: "Vlog / Intimate & Personal" },
  { value: "Phóng sự / Review thực tế", labelVi: "Phóng sự / Review thực tế", labelEn: "Documentary / Realistic Review" },
  { value: "Sang trọng & Tinh tế (Luxury)", labelVi: "Sang trọng & Tinh tế (Luxury)", labelEn: "Elegant & Luxury" },
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

export const entertainmentPresets: SmartPreset[] = [
  {
    id: "ent-pre-1",
    nameVi: "Kể chuyện Hài hước / Meme (Viral Comedy)",
    nameEn: "Viral Comedy / Meme Storytelling",
    goalVi: "Giải trí & Gây cười (Entertain & Humor)",
    goalEn: "Entertain & Humor",
    toneVi: "Hài hước & Châm biếm (Sarcastic & Funny)",
    toneEn: "Sarcastic & Funny",
    styleVi: "3d-pixar",
    styleEn: "3d-pixar",
    expertRoleVi: "Đạo diễn phim hài (Comedy Director)",
    expertRoleEn: "Comedy Director",
    ctaVi: "Thả tim & Bình luận ý kiến",
    ctaEn: "Like & Comment thoughts"
  },
  {
    id: "ent-pre-2",
    nameVi: "Phim Ngắn Hoạt Hình 3D (3D Short Film)",
    nameEn: "3D Short Film",
    goalVi: "Giữ chân người xem đến cuối (High Retention)",
    goalEn: "High Retention",
    toneVi: "Kể chuyện mượt mà (Narrative & Engaging)",
    toneEn: "Narrative & Engaging",
    styleVi: "3d-pixar",
    styleEn: "3d-pixar",
    expertRoleVi: "Nhà biên kịch phim hoạt hình (Animation Scriptwriter)",
    expertRoleEn: "Animation Scriptwriter",
    ctaVi: "Đăng ký kênh / Follow ngay",
    ctaEn: "Subscribe / Follow Now"
  },
  {
    id: "ent-pre-3",
    nameVi: "Kể chuyện Cảm động / Chữa lành (Healing Story)",
    nameEn: "Healing Story",
    goalVi: "Truyền cảm hứng / Lấy nước mắt (Inspire & Emotional)",
    goalEn: "Inspire & Emotional",
    toneVi: "Kể chuyện mượt mà (Narrative & Engaging)",
    toneEn: "Narrative & Engaging",
    styleVi: "2d-anime",
    styleEn: "2d-anime",
    expertRoleVi: "Người kể chuyện cổ tích (Fairy Tale Teller)",
    expertRoleEn: "Fairy Tale Teller",
    ctaVi: "Đón xem phần 2 nhé!",
    ctaEn: "Stay tuned for Part 2!"
  },
  {
    id: "ent-pre-4",
    nameVi: "Truyện ngụ ngôn / Bài học cuộc sống (Moral Story)",
    nameEn: "Moral Story",
    goalVi: "Truyền cảm hứng / Lấy nước mắt (Inspire & Emotional)",
    goalEn: "Inspire & Emotional",
    toneVi: "Kể chuyện mượt mà (Narrative & Engaging)",
    toneEn: "Narrative & Engaging",
    styleVi: "storytime",
    styleEn: "storytime",
    expertRoleVi: "Người kể chuyện cổ tích (Fairy Tale Teller)",
    expertRoleEn: "Fairy Tale Teller",
    ctaVi: "(Không dùng CTA - Để kết thúc mở)",
    ctaEn: "(No CTA - Left Open-Ended)"
  }
];

export const entertainmentIndustries = [
  { id: "ent-ind-1", nameVi: "Sáng tạo nội dung (Content Creator / YouTuber)", nameEn: "Content Creator / YouTuber", descriptionVi: "", descriptionEn: "" },
  { id: "ent-ind-2", nameVi: "Kênh Giải trí & Hài hước", nameEn: "Entertainment & Humor Channel", descriptionVi: "", descriptionEn: "" },
  { id: "ent-ind-3", nameVi: "Kênh Hoạt hình Thiếu nhi", nameEn: "Children's Animation Channel", descriptionVi: "", descriptionEn: "" },
  { id: "ent-ind-4", nameVi: "Phim ngắn / Nghệ thuật (Art & Film)", nameEn: "Short Film / Art", descriptionVi: "", descriptionEn: "" }
];

export const entertainmentCategoryOptions = [
  { value: "Hoạt hình 3D Pixar/Disney (Bóng bẩy, mượt mà)", labelVi: "Hoạt hình 3D Pixar/Disney (Bóng bẩy, mượt mà)", labelEn: "3D Pixar/Disney Animation (Sleek & Smooth)" },
  { value: "Hoạt hình 2D Anime/Ghibli (Nghệ thuật, nên thơ)", labelVi: "Hoạt hình 2D Anime/Ghibli (Nghệ thuật, nên thơ)", labelEn: "2D Anime/Ghibli style (Artistic & Poetic)" },
  { value: "Hoạt hình Đất sét / Stop-motion (Độc lạ)", labelVi: "Hoạt hình Đất sét / Stop-motion (Độc lạ)", labelEn: "Claymation / Stop-motion (Unique)" },
  { value: "Video kể chuyện có minh họa (Storytime)", labelVi: "Video kể chuyện có minh họa (Storytime)", labelEn: "Illustrated Storytelling (Storytime)" }
];

export const entertainmentStyleOptions = [
  { value: "3d-pixar", labelVi: "Hoạt hình 3D Pixar/Disney (Bóng bẩy, mượt mà)", labelEn: "3D Pixar/Disney Animation" },
  { value: "2d-anime", labelVi: "Hoạt hình 2D Anime/Ghibli (Nghệ thuật, nên thơ)", labelEn: "2D Anime/Ghibli Style" },
  { value: "clay-stopmotion", labelVi: "Hoạt hình Đất sét / Stop-motion (Độc lạ)", labelEn: "Claymation / Stop-motion" },
  { value: "storytime", labelVi: "Video kể chuyện có minh họa (Storytime)", labelEn: "Illustrated Storytelling" }
];

export const entertainmentGoalOptions = [
  { value: "Giải trí & Gây cười (Entertain & Humor)", labelVi: "Giải trí & Gây cười (Entertain & Humor)", labelEn: "Entertain & Humor" },
  { value: "Truyền cảm hứng / Lấy nước mắt (Inspire & Emotional)", labelVi: "Truyền cảm hứng / Lấy nước mắt (Inspire & Emotional)", labelEn: "Inspire & Emotional" },
  { value: "Giữ chân người xem đến cuối (High Retention)", labelVi: "Giữ chân người xem đến cuối (High Retention)", labelEn: "High Retention" },
  { value: "Tạo trend / Kích thích Share (Viral Sharing)", labelVi: "Tạo trend / Kích thích Share (Viral Sharing)", labelEn: "Viral Sharing" }
];

export const entertainmentToneOptions = [
  { value: "Kể chuyện mượt mà (Narrative & Engaging)", labelVi: "Kể chuyện mượt mà (Narrative & Engaging)", labelEn: "Narrative & Engaging" },
  { value: "Nhí nhảnh & Đáng yêu (Playful & Cute)", labelVi: "Nhí nhảnh & Đáng yêu (Playful & Cute)", labelEn: "Playful & Cute" },
  { value: "Kịch tính & Bí ẩn (Dramatic & Mysterious)", labelVi: "Kịch tính & Bí ẩn (Dramatic & Mysterious)", labelEn: "Dramatic & Mysterious" },
  { value: "Hài hước & Châm biếm (Sarcastic & Funny)", labelVi: "Hài hước & Châm biếm (Sarcastic & Funny)", labelEn: "Sarcastic & Funny" }
];

export const entertainmentExpertOptions = [
  { value: "Nhà biên kịch phim hoạt hình (Animation Scriptwriter)", labelVi: "Nhà biên kịch phim hoạt hình (Animation Scriptwriter)", labelEn: "Animation Scriptwriter" },
  { value: "Đạo diễn phim hài (Comedy Director)", labelVi: "Đạo diễn phim hài (Comedy Director)", labelEn: "Comedy Director" },
  { value: "Người kể chuyện cổ tích (Fairy Tale Teller)", labelVi: "Người kể chuyện cổ tích (Fairy Tale Teller)", labelEn: "Fairy Tale Teller" }
];

export const entertainmentCtaOptions = [
  { value: "Đăng ký kênh / Follow ngay", labelVi: "Đăng ký kênh / Follow ngay", labelEn: "Subscribe / Follow Now" },
  { value: "Đón xem phần 2 nhé!", labelVi: "Đón xem phần 2 nhé!", labelEn: "Stay tuned for Part 2!" },
  { value: "Thả tim & Bình luận ý kiến", labelVi: "Thả tim & Bình luận ý kiến", labelEn: "Like & Comment thoughts" },
  { value: "(Không dùng CTA - Để kết thúc mở)", labelVi: "(Không dùng CTA - Để kết thúc mở)", labelEn: "No CTA - Open-ended" }
];

interface Props {
  lang: "vi" | "en";
  industries: IndustryTemplate[];
  presets: SmartPreset[];
  onCreateProject: (projectData: any) => Promise<void>;
  onUpdateProject?: (id: string, projectData: any) => Promise<void>;
  project?: Project | null;
  onResetProject?: () => void;
  isLoading: boolean;
}

export default function ProjectCreator({ lang, industries, presets, onCreateProject, onUpdateProject, project, onResetProject, isLoading }: Props) {
  const [projectMode, setProjectMode] = useState<"commercial" | "entertainment">("commercial");
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
  const [voiceId, setVoiceId] = useState("EXAVITQu4vr4xnSDxMaL");
  const [includeDialogue, setIncludeDialogue] = useState(false);
  const [images, setImages] = useState<string[]>([
    "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300&auto=format&fit=crop&q=60"
  ]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [voices, setVoices] = useState<AIVoice[]>([]);

  useEffect(() => {
    let active = true;
    const fetchVoices = async () => {
      try {
        const res = await fetch("/api/voices");
        const data = await res.json();
        if (active && Array.isArray(data)) {
          const activeVoices = data.filter(v => v.status);
          setVoices(activeVoices);
          if (!project && activeVoices.length > 0) {
            setVoiceId(activeVoices[0].voiceId);
          }
        }
      } catch (err) {
        console.warn("Could not fetch voices inside ProjectCreator:", err);
      }
    };
    fetchVoices();
    return () => {
      active = false;
    };
  }, [project]);

  useEffect(() => {
    if (project) {
      const isEnt = (
        project.industryId?.startsWith("ent-") ||
        ["Nhà biên kịch phim hoạt hình (Animation Scriptwriter)", "Đạo diễn phim hài (Comedy Director)", "Người kể chuyện cổ tích (Fairy Tale Teller)"].includes(project.aiExpertRole || "") ||
        ["Giải trí & Gây cười (Entertain & Humor)", "Truyền cảm hứng / Lấy nước mắt (Inspire & Emotional)", "Giữ chân người xem đến cuối (High Retention)", "Tạo trend / Kích thích Share (Viral Sharing)"].includes(project.goal || "")
      );
      setProjectMode(isEnt ? "entertainment" : "commercial");
      setName(project.name || "");
      setSelectedIndustry(project.industryId || (isEnt ? "ent-ind-1" : "ind-1"));
      setContentType(project.contentType || "TikTok Video Ad (9:16)");
      setProductName(project.productName || "");
      setProductCategory(project.productCategory || (isEnt ? "Hoạt hình 3D Pixar/Disney (Bóng bẩy, mượt mà)" : "Video Quảng cáo ngắn (TikTok/Reels/Shorts)"));
      setProductInfo(project.productInfo || "");
      setAiLanguage(project.aiLanguage || "vi");
      setTargetWordCount(project.targetWordCount || "300 - 500 từ");
      setGoal(project.goal || (isEnt ? "Giải trí & Gây cười (Entertain & Humor)" : "Tăng nhận diện thương hiệu"));
      setTone(project.tone || (isEnt ? "Kể chuyện mượt mà (Narrative & Engaging)" : "Chuyên nghiệp & Gãy gọn"));
      setStyle(project.style || (isEnt ? "3d-pixar" : "Hiện đại & Tốc độ nhanh"));
      setExpertRole(project.aiExpertRole || (isEnt ? "Nhà biên kịch phim hoạt hình (Animation Scriptwriter)" : "Chuyên gia Marketing"));
      setCta(project.cta || (isEnt ? "Đăng ký kênh / Follow ngay" : "Mua ngay"));
      setVoiceId(project.voiceId || "EXAVITQu4vr4xnSDxMaL");
      setIncludeDialogue(!!project.includeDialogue);
      setImages(project.imageReferences || [
        "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300&auto=format&fit=crop&q=60"
      ]);
    } else {
      setName("");
      setProjectMode("commercial");
      setSelectedIndustry("ind-1");
      setContentType("TikTok Video Ad (9:16)");
      setProductName("");
      setProductCategory("Video Quảng cáo ngắn (TikTok/Reels/Shorts)");
      setProductInfo("");
      setAiLanguage("vi");
      setTargetWordCount("300 - 500 từ");
      setGoal("Tăng nhận diện thương hiệu");
      setTone("Chuyên nghiệp & Gãy gọn");
      setStyle("Hiện đại & Tốc độ nhanh");
      setExpertRole("Chuyên gia Marketing");
      setCta("Mua ngay");
      setVoiceId("EXAVITQu4vr4xnSDxMaL");
      setIncludeDialogue(false);
      setImages([
        "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300&auto=format&fit=crop&q=60"
      ]);
    }
  }, [project]);

  const handleModeChange = (mode: "commercial" | "entertainment") => {
    setProjectMode(mode);
    if (mode === "commercial") {
      setSelectedIndustry("ind-1");
      setProductCategory("Video Quảng cáo ngắn (TikTok/Reels/Shorts)");
      setGoal("Tăng nhận diện thương hiệu");
      setTone("Chuyên nghiệp & Gãy gọn");
      setStyle("Hiện đại & Tốc độ nhanh");
      setExpertRole("Chuyên gia Marketing");
      setCta("Mua ngay");
    } else {
      setSelectedIndustry("ent-ind-1");
      setProductCategory("Hoạt hình 3D Pixar/Disney (Bóng bẩy, mượt mà)");
      setGoal("Giải trí & Gây cười (Entertain & Humor)");
      setTone("Kể chuyện mượt mà (Narrative & Engaging)");
      setStyle("3d-pixar");
      setExpertRole("Nhà biên kịch phim hoạt hình (Animation Scriptwriter)");
      setCta("Đăng ký kênh / Follow ngay");
    }
  };

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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    if (!e.target.files) return;
    const selectedFiles = Array.from(e.target.files) as File[];

    if (images.length + selectedFiles.length > 5) {
      setErrorMsg(
        lang === "vi"
          ? "Thông báo: Bạn chỉ được gửi tối đa 5 ảnh mẫu sản phẩm!"
          : "Notification: You can only upload up to 5 product images!"
      );
      setTimeout(() => setErrorMsg(null), 4000);
      return;
    }

    setIsUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append("image", file);

        const res = await fetch("/api/projects/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          throw new Error(lang === "vi" ? "Tải ảnh thất bại!" : "Failed to upload image!");
        }

        const data = await res.json();
        if (data && data.url) {
          uploadedUrls.push(data.url);
        }
      }

      setImages(prev => [...prev, ...uploadedUrls]);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(lang === "vi" ? `Lỗi tải ảnh: ${err.message}` : `Upload error: ${err.message}`);
      setTimeout(() => setErrorMsg(null), 5000);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, idx) => idx !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !productName) {
      alert(lang === "vi" ? "Vui lòng nhập Tên dự án và Tên sản phẩm chính!" : "Please enter Project Name and Product Name!");
      return;
    }

    const payload = {
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
      imageReferences: images,
      voiceId,
      includeDialogue
    };

    if (project && project.id && onUpdateProject) {
      onUpdateProject(project.id, payload);
    } else {
      onCreateProject(payload);
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl p-6 max-w-4xl mx-auto relative z-10 text-slate-200 font-sans">
      <div className="flex items-center gap-3 border-b border-white/10 pb-4 mb-6">
        <div className="p-2.5 rounded-lg bg-[#34b1b3]/10 text-[#34b1b3] shadow-[0_0_12px_rgba(52,177,179,0.15)]">
          <Sparkles className="w-6 h-6 animate-pulse" />
        </div>
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h2 className="text-xl font-bold text-white font-display">
              {project ? (
                lang === "vi" ? `Chỉnh Sửa Chiến Dịch: ${project.name}` : `Edit Campaign: ${project.name}`
              ) : (
                lang === "vi" ? "Thiết Kế Chiến Dịch Dự Án Mới" : "Design New Campaign Project"
              )}
            </h2>
            {project && onResetProject && (
              <button
                type="button"
                onClick={onResetProject}
                className="text-xs font-bold bg-[#34b1b3]/20 hover:bg-[#34b1b3]/30 border border-[#34b1b3]/30 hover:border-[#34b1b3]/60 text-[#34b1b3] rounded-lg px-3 py-1.5 transition-all cursor-pointer self-start sm:self-auto"
              >
                {lang === "vi" ? "+ Tạo Dự Án Mới" : "+ Create New Project"}
              </button>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {lang === "vi" 
              ? "Cung cấp định hướng thương hiệu, hình ảnh mồi, AI sẽ đảm nhận viết kịch bản." 
              : "Feed brand parameters and image reference, let AI orchestrate the master script."}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Mode Toggle Tabs */}
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 max-w-md mx-auto mb-6">
          <button
            type="button"
            onClick={() => handleModeChange("commercial")}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${projectMode === "commercial" ? "bg-[#34b1b3]/20 border border-[#34b1b3]/30 text-[#34b1b3] shadow-[0_0_12px_rgba(52,177,179,0.15)]" : "text-slate-400 border border-transparent hover:text-slate-200"}`}
          >
            🏢 {lang === "vi" ? "Thương Mại" : "Commercial"}
          </button>
          <button
            type="button"
            onClick={() => handleModeChange("entertainment")}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${projectMode === "entertainment" ? "bg-[#34b1b3]/20 border border-[#34b1b3]/30 text-[#34b1b3] shadow-[0_0_12px_rgba(52,177,179,0.15)]" : "text-slate-400 border border-transparent hover:text-slate-200"}`}
          >
            🎨 {lang === "vi" ? "Hoạt Hình / Giải Trí" : "Animation / Entertainment"}
          </button>
        </div>

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
                  {projectMode === "commercial" ? (
                    industries.map((ind) => (
                      <option key={ind.id} value={ind.id} className="bg-[#0a0f18] text-white">
                        {lang === "vi" ? ind.nameVi : ind.nameEn}
                      </option>
                    ))
                  ) : (
                    entertainmentIndustries.map((ind) => (
                      <option key={ind.id} value={ind.id} className="bg-[#0a0f18] text-white">
                        {lang === "vi" ? ind.nameVi : ind.nameEn}
                      </option>
                    ))
                  )}
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
                  {projectMode === "commercial" ? (
                    <>
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
                    </>
                  ) : (
                    <>
                      {!entertainmentCategoryOptions.some(opt => opt.value === productCategory) && productCategory && (
                        <option value={productCategory} className="bg-[#0a0f18] text-white">
                          {productCategory}
                        </option>
                      )}
                      {entertainmentCategoryOptions.map((opt) => (
                        <option key={opt.value} value={opt.value} className="bg-[#0a0f18] text-white">
                          {lang === "vi" ? opt.labelVi : opt.labelEn}
                        </option>
                      ))}
                    </>
                  )}
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
                {projectMode === "commercial" ? (
                  presets.map((pre) => (
                    <button
                      key={pre.id}
                      type="button"
                      onClick={() => applyPreset(pre)}
                      className="text-xs font-medium bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#34b1b3]/55 transition-all text-slate-200 rounded-md px-3 py-1.5 cursor-pointer"
                    >
                      🚀 {lang === "vi" ? pre.nameVi : pre.nameEn}
                    </button>
                  ))
                ) : (
                  entertainmentPresets.map((pre) => (
                    <button
                      key={pre.id}
                      type="button"
                      onClick={() => applyPreset(pre)}
                      className="text-xs font-medium bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#34b1b3]/55 transition-all text-slate-200 rounded-md px-3 py-1.5 cursor-pointer"
                    >
                      🚀 {lang === "vi" ? pre.nameVi : pre.nameEn}
                    </button>
                  ))
                )}
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
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 font-mono">
                  {lang === "vi" ? "Mục tiêu truyền thông *" : "Video Core Goal *"}
                </label>
                <select
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="w-full text-sm rounded-lg glass-input p-2.5 cursor-pointer hover:border-[#34b1b3]/80 focus:border-[#34b1b3] focus:ring-1 focus:ring-[#34b1b3]/20 font-sans block"
                >
                  {projectMode === "commercial" ? (
                    <>
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
                    </>
                  ) : (
                    <>
                      {!entertainmentGoalOptions.some(opt => opt.value === goal) && goal && (
                        <option value={goal} className="bg-[#0a0f18] text-white">
                          {goal}
                        </option>
                      )}
                      {entertainmentGoalOptions.map((opt) => (
                        <option key={opt.value} value={opt.value} className="bg-[#0a0f18] text-white">
                          {lang === "vi" ? opt.labelVi : opt.labelEn}
                        </option>
                      ))}
                    </>
                  )}
                </select>
              </div>

              <div className="col-span-1">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 font-mono">
                  {lang === "vi" ? "Giọng Văn Thuyết Phục *" : "Voice Tone *"}
                </label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full text-sm rounded-lg glass-input p-2.5 cursor-pointer hover:border-[#34b1b3]/80 focus:border-[#34b1b3] focus:ring-1 focus:ring-[#34b1b3]/20 font-sans block"
                >
                  {projectMode === "commercial" ? (
                    <>
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
                    </>
                  ) : (
                    <>
                      {!entertainmentToneOptions.some(opt => opt.value === tone) && tone && (
                        <option value={tone} className="bg-[#0a0f18] text-white">
                          {tone}
                        </option>
                      )}
                      {entertainmentToneOptions.map((opt) => (
                        <option key={opt.value} value={opt.value} className="bg-[#0a0f18] text-white">
                          {lang === "vi" ? opt.labelVi : opt.labelEn}
                        </option>
                      ))}
                    </>
                  )}
                </select>
              </div>

              <div className="col-span-1">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 font-mono">
                  {lang === "vi" ? "Phong cách *" : "Frame Style *"}
                </label>
                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  className="w-full text-sm rounded-lg glass-input p-2.5 cursor-pointer hover:border-[#34b1b3]/80 focus:border-[#34b1b3] focus:ring-1 focus:ring-[#34b1b3]/20 font-sans block"
                >
                  {projectMode === "commercial" ? (
                    <>
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
                    </>
                  ) : (
                    <>
                      {!entertainmentStyleOptions.some(opt => opt.value === style) && style && (
                        <option value={style} className="bg-[#0a0f18] text-white">
                          {style}
                        </option>
                      )}
                      {entertainmentStyleOptions.map((opt) => (
                        <option key={opt.value} value={opt.value} className="bg-[#0a0f18] text-white">
                          {lang === "vi" ? opt.labelVi : opt.labelEn}
                        </option>
                      ))}
                    </>
                  )}
                </select>
              </div>

              <div className="col-span-1">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 font-mono">
                  {lang === "vi" ? "Vai chuyên gia *" : "AI Expert Role *"}
                </label>
                <select
                  value={expertRole}
                  onChange={(e) => setExpertRole(e.target.value)}
                  className="w-full text-sm rounded-lg glass-input p-2.5 cursor-pointer hover:border-[#34b1b3]/80 focus:border-[#34b1b3] focus:ring-1 focus:ring-[#34b1b3]/20 font-sans block"
                >
                  {projectMode === "commercial" ? (
                    <>
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
                    </>
                  ) : (
                    <>
                      {!entertainmentExpertOptions.some(opt => opt.value === expertRole) && expertRole && (
                        <option value={expertRole} className="bg-[#0a0f18] text-white">
                          {expertRole}
                        </option>
                      )}
                      {entertainmentExpertOptions.map((opt) => (
                        <option key={opt.value} value={opt.value} className="bg-[#0a0f18] text-white">
                          {lang === "vi" ? opt.labelVi : opt.labelEn}
                        </option>
                      ))}
                    </>
                  )}
                </select>
              </div>

              <div className="col-span-1">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 font-mono">
                  {lang === "vi" ? "Nút CTA mong muốn *" : "CTA BUTTON TEXT *"}
                </label>
                <select
                  value={cta}
                  onChange={(e) => setCta(e.target.value)}
                  className="w-full text-sm rounded-lg glass-input p-2.5 cursor-pointer hover:border-[#34b1b3]/80 focus:border-[#34b1b3] focus:ring-1 focus:ring-[#34b1b3]/20 font-sans block"
                >
                  {projectMode === "commercial" ? (
                    <>
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
                    </>
                  ) : (
                    <>
                      {!entertainmentCtaOptions.some(opt => opt.value === cta) && cta && (
                        <option value={cta} className="bg-[#0a0f18] text-white">
                          {cta}
                        </option>
                      )}
                      {entertainmentCtaOptions.map((opt) => (
                        <option key={opt.value} value={opt.value} className="bg-[#0a0f18] text-white">
                          {lang === "vi" ? opt.labelVi : opt.labelEn}
                        </option>
                      ))}
                    </>
                  )}
                </select>
              </div>

              <div className="col-span-1">
                <label className="block text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1.5 font-mono font-bold">
                  {lang === "vi" ? "Giọng Thuyết Minh AI *" : "AI Narrator Voice *"}
                </label>
                <select
                  value={voiceId}
                  onChange={(e) => setVoiceId(e.target.value)}
                  className="w-full text-sm rounded-lg glass-input p-2.5 cursor-pointer border-emerald-500/20 hover:border-emerald-400 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/20 font-sans block text-emerald-300"
                >
                  {voiceId && !voices.some(v => v.voiceId === voiceId) && (
                    <option value={voiceId} className="bg-[#0a0f18] text-white">
                      {lang === "vi" ? `Giọng hiện tại (ID: ${voiceId})` : `Current Voice (ID: ${voiceId})`}
                    </option>
                  )}
                  {voices.map((v) => (
                    <option key={v.id} value={v.voiceId} className="bg-[#0a0f18] text-white">
                      {v.name}
                    </option>
                  ))}
                  {voices.length === 0 && (
                    <option value="" className="bg-[#0a0f18] text-white" disabled>
                      {lang === "vi" ? "Đang tải giọng đọc..." : "Loading voices..."}
                    </option>
                  )}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Google Labs Integration Switch */}
        <div className="bg-[#34b1b3]/5 border border-[#34b1b3]/20 rounded-xl p-4 flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="flex items-center gap-1.5 text-xs font-bold text-white uppercase tracking-wider font-mono">
              <span className="inline-flex items-center justify-center bg-gradient-to-r from-teal-500 to-[#34b1b3] text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase font-sans tracking-wide">
                Google Labs
              </span>
              {lang === "vi" ? "Chế độ Google Labs (Tích hợp lời thoại vào Video Prompt)" : "Google Labs Mode (Integrate speech into Video Prompt)"}
            </span>
            <span className="text-[11px] text-slate-400 mt-1">
              {lang === "vi" 
                ? "Tự động nhúng trực tiếp câu thoại (lip-sync) tiếng Việt vào videoPrompt để hỗ trợ tối ưu các mô hình AI tạo hình người nói." 
                : "Automatically embed spoken dialogue captions into videoPrompt for advanced lip-sync video generators."}
            </span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer select-none">
            <input
              type="checkbox"
              checked={includeDialogue}
              onChange={(e) => setIncludeDialogue(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-[20px] peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#34b1b3]"></div>
          </label>
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
              disabled={images.length >= 5 || isUploading}
              className="flex items-center gap-1.5 text-xs font-bold bg-[#34b1b3] hover:bg-[#2db3b5] active:scale-95 text-white cursor-pointer rounded-lg px-4 py-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 shadow-md shadow-[#34b1b3]/20"
            >
              {isUploading ? (
                <svg className="animate-spin h-3.5 w-3.5 text-white animate-pulse" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <Upload className="w-3.5 h-3.5" />
              )}
              <span>
                {isUploading 
                  ? (lang === "vi" ? "Đang tải..." : "Uploading...")
                  : images.length >= 5 
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

          {images.length === 0 && !isUploading ? (
            <div className="text-center py-6 text-xs text-slate-500">
              {lang === "vi" ? "Chưa có ảnh mẫu nào được gắn kèm. Hãy nhấp 'Tải Ảnh Lên' để bắt đầu." : "No references linked. Click to include image layouts."}
            </div>
          ) : (
            <div className="grid grid-cols-5 gap-3">
              {images.map((img, index) => (
                <div key={index} className="relative group rounded-lg overflow-hidden border border-white/10 hover:border-[#34b1b3] bg-black/30 shadow-md h-24 transition-all duration-200">
                  <img src={img} alt="mock-prod-ref" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
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
              {isUploading && (
                <div className="relative rounded-lg overflow-hidden border border-[#34b1b3]/50 bg-black/30 animate-pulse h-24 flex flex-col items-center justify-center text-[#34b1b3]">
                  <svg className="animate-spin h-5 w-5 text-[#34b1b3] mb-1" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span className="text-[9px] uppercase font-mono">{lang === "vi" ? "Đang lưu..." : "Saving..."}</span>
                </div>
              )}
              {images.length < 5 && !isUploading && (
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
                <span>
                  {project 
                    ? (lang === "vi" ? "Lưu Chỉnh Sửa & Cập Nhật" : "Save Changes & Update")
                    : (lang === "vi" ? "Tạo Kịch Bản Bằng AI" : "Generate Script via AI Queue")
                  }
                </span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
