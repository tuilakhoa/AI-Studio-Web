// FIX: `ChatMessage` is not an exported member of `@google/genai`. It's a local type.
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { ChatMessage } from '../types';

const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

const base64ToGenerativePart = (base64Data: string, mimeType: string) => {
  const pureBase64 = base64Data.startsWith('data:') ? base64Data.split(',')[1] : base64Data;
  return {
    inlineData: { data: pureBase64, mimeType },
  };
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = error => reject(error);
  });
};

const processGeminiResponse = (response: any): string => {
  const firstPart = response.candidates?.[0]?.content?.parts[0];
  if (firstPart && firstPart.inlineData) {
    return `data:${firstPart.inlineData.mimeType};base64,${firstPart.inlineData.data}`;
  }
  throw new Error("Không có hình ảnh nào được tạo bởi API.");
};

const handleApiError = (error: any, context: string, fallbackMessage: string): never => {
    console.error(`${context}:`, error);
    const errorMessage = typeof error === 'object' && error !== null && 'message' in error ? String(error.message) : JSON.stringify(error);
    
    if (errorMessage.includes("429") || errorMessage.toLowerCase().includes("quota") || errorMessage.toLowerCase().includes("resource_exhausted")) {
        throw new Error("Lỗi giới hạn (429): Bạn đã gửi quá nhiều yêu cầu hoặc có vấn đề về hạn mức. Vui lòng đợi một chút và thử lại, hoặc kiểm tra gói dịch vụ của bạn.");
    }
    
    if (errorMessage.toLowerCase().includes("model") && (errorMessage.toLowerCase().includes("not found") || errorMessage.toLowerCase().includes("permission denied"))) {
        throw new Error("Lỗi cấu hình: Model AI không hợp lệ hoặc không có quyền truy cập. Vui lòng liên hệ quản trị viên.");
    }

    throw new Error(fallbackMessage);
};


export const generateHeadshot = async (imageFile: File, stylePrompt: string, aspectRatio: string): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("Biến môi trường API_KEY chưa được đặt.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const imagePart = await fileToGenerativePart(imageFile);
    const textPart = {
      text: `You are an expert AI portrait photographer. Your primary directive is to flawlessly preserve the identity of the person in the provided photograph while artistically modifying their portrait based on a style prompt.

**INPUT:** An image of a person.
**TASK:** Generate a new, photorealistic, professional headshot of the **SAME PERSON** based on the provided style description.

**CRITICAL INSTRUCTIONS - READ AND FOLLOW EXACTLY:**
1.  **IDENTITY PRESERVATION IS THE #1 PRIORITY:** You MUST, under ALL circumstances, preserve the person's exact facial features, bone structure, ethnicity, skin tone, and approximate age. The final image MUST be unequivocally recognizable as the same individual. Any deviation in facial identity is a complete failure. **DO NOT CHANGE THE PERSON'S FACE.**
2.  **POSE & OBJECT PRESERVATION (DEFAULT BEHAVIOR):**
    *   By default, you MUST preserve the person's original pose, posture, and body position.
    *   You MUST also preserve any objects the person is holding or wearing (e.g., glasses, hats, headphones, jewelry) unless explicitly told to remove them.
    *   **EXCEPTION:** IF AND ONLY IF the Style Prompt below *explicitly describes a new pose* (e.g., "looking over the shoulder," "smiling," "head tilted slightly"), you should then apply that new pose. Otherwise, the original pose is mandatory.
3.  **APPLY STYLE:** Apply the background, lighting, and expression changes described in the style prompt below.
4.  **CONDITIONAL CLOTHING CHANGE:**
    *   **IF AND ONLY IF** the style prompt explicitly describes new clothing, attire, a suit, a dress, a shirt, etc., you MUST change the person's outfit to match that description.
    *   **OTHERWISE**, if the style prompt does NOT mention clothing, you MUST preserve the person's original clothing. You may subtly adjust the lighting and color of the original clothing to match the new background and mood, but do not change the style of the clothing itself.
5.  **PHOTOREALISTIC OUTPUT:** The final image must be a high-quality photograph. Do NOT produce illustrations, cartoons, or paintings unless specifically requested in the style prompt.
6.  **ASPECT RATIO:** The final image MUST have a ${aspectRatio} aspect ratio.

**Style Prompt:** "${stylePrompt}"`,
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [imagePart, textPart],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    return processGeminiResponse(response);
  } catch (error) {
    handleApiError(error, "Lỗi khi tạo headshot với Gemini", "Không thể tạo headshot. Vui lòng thử lại.");
  }
};

export const refineImage = async (base64Image: string, mimeType: string, editPrompt: string): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("Biến môi trường API_KEY chưa được đặt.");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const imagePart = base64ToGenerativePart(base64Image, mimeType);
    const textPart = {
      text: `You are an expert AI photo editor.
**TASK:** Apply a subtle, photorealistic edit to the provided image based on the user's request.
**REQUEST:** "${editPrompt}".

**CRITICAL INSTRUCTIONS:**
1.  **Maintain Identity:** The person's core features and identity MUST remain unchanged.
2.  **Photorealism:** The edit must be seamless and look like a real photograph. Avoid artificial or "photoshopped" looks.
3.  **Subtlety:** The changes should be tasteful and enhance the original image, not completely transform it.
4.  **Output:** The output must be the edited image.`,
    };
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [imagePart, textPart] },
      config: { responseModalities: [Modality.IMAGE] },
    });

    return processGeminiResponse(response);
  } catch (error) {
    handleApiError(error, "Lỗi khi tinh chỉnh ảnh với Gemini", "Không thể tinh chỉnh ảnh. Vui lòng thử lại.");
  }
};

export const editImageWithMask = async (
    base64Image: string,
    mimeType: string,
    maskDataUrl: string,
    editPrompt: string
): Promise<string> => {
    if (!process.env.API_KEY) {
        throw new Error("Biến môi trường API_KEY chưa được đặt.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    try {
        const imagePart = base64ToGenerativePart(base64Image, mimeType);
        const maskPart = base64ToGenerativePart(maskDataUrl, 'image/png'); // Mask is always PNG
        const textPart = {
            text: `You are an expert AI image editor.
**TASK:** Using the provided image and mask, replace ONLY the area of the image corresponding to the white part of the mask.
**INSTRUCTION:** The replacement should be based on the following instruction: "${editPrompt}".

**CRITICAL INSTRUCTIONS:**
1.  **Masked Area Only:** You MUST only modify the pixels within the white area of the mask.
2.  **Seamless Blending:** The final result must be photorealistic and seamlessly blended into the rest of the image.
3.  **Match Atmosphere:** You MUST maintain the original lighting, shadows, and perspective of the original image.`,
        };
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [imagePart, maskPart, textPart] },
            config: { responseModalities: [Modality.IMAGE] },
        });

        return processGeminiResponse(response);
    } catch (error) {
        handleApiError(error, "Lỗi khi chỉnh sửa ảnh với mask", "Không thể chỉnh sửa ảnh. Vui lòng thử lại.");
    }
};

export const removeObjectWithMask = async (
    base64Image: string,
    mimeType: string,
    maskDataUrl: string
): Promise<string> => {
    if (!process.env.API_KEY) {
        throw new Error("Biến môi trường API_KEY chưa được đặt.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    try {
        const imagePart = base64ToGenerativePart(base64Image, mimeType);
        const maskPart = base64ToGenerativePart(maskDataUrl, 'image/png');
        const textPart = {
            text: `You are an expert AI photo restoration tool (inpainting).
**TASK:** Using the provided image and mask, completely remove the object indicated by the white area of the mask.

**CRITICAL INSTRUCTIONS:**
1.  **Complete Removal:** The object within the mask must be entirely gone.
2.  **Realistic Fill:** Fill the space with a realistic background that seamlessly matches the surrounding area.
3.  **Pay Attention to Detail:** You MUST pay close attention to matching textures, lighting, and shadows.
4.  **Output:** The result should be a high-quality, photorealistic image as if the object was never there.`,
        };
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [imagePart, maskPart, textPart] },
            config: { responseModalities: [Modality.IMAGE] },
        });

        return processGeminiResponse(response);
    } catch (error) {
        handleApiError(error, "Lỗi khi xóa vật thể với mask", "Không thể xóa vật thể. Vui lòng thử lại.");
    }
};

export const composeScene = async (subjectFile: File, backgroundFile: File): Promise<string> => {
    if (!process.env.API_KEY) {
        throw new Error("Biến môi trường API_KEY chưa được đặt.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    try {
        const subjectPart = await fileToGenerativePart(subjectFile);
        const backgroundPart = await fileToGenerativePart(backgroundFile);
        const textPart = {
            text: `You are a world-class AI visual effects artist specializing in photorealistic digital compositing.
**MISSION:** Your task is to perform a flawless and undetectable composite, placing the main subject from Image 1 into the environment of Image 2. The final result must look like a single, cohesive photograph taken at the same time and place.

**INPUT ANALYSIS:**
- **Image 1 (Subject):** Contains the person/object to be extracted. Analyze their features, clothing, and original lighting.
- **Image 2 (Background):** The new environment. Analyze its lighting (direction, color, hardness), perspective, depth of field, and overall atmosphere (e.g., sunny, foggy, indoor).

**CORE TASK: SEAMLESS INTEGRATION**

**CRITICAL DIRECTIVES - FOLLOW WITH EXTREME PRECISION:**

1.  **IDENTITY & ESSENCE PRESERVATION:**
    *   The subject's face, identity, ethnicity, and core features are SACROSANCT. They MUST remain unchanged.
    *   Preserve the style of the subject's clothing, but you MUST realistically re-render its lighting and color to match the new scene.

2.  **DYNAMIC POSE & INTERACTION (THE MOST IMPORTANT STEP):**
    *   This is NOT a static cutout. You MUST intelligently and dynamically alter the subject's pose to make them a believable part of the scene.
    *   **Analyze the environment for interaction points.** If there's a chair, make them sit naturally. If there's a wall, make them lean against it. If there's a path, adjust their gait to be walking on it. If they are on a soft surface like grass or sand, their feet should sink in slightly.
    *   **The pose must be natural and physically plausible.** Avoid stiffness. The goal is to create a dynamic composition, as if the person was captured in a moment of action or repose within that environment.

3.  **PHOTOREALISTIC BLENDING & GROUNDING:**
    *   **Lighting & Shading:** The subject MUST be relit to match Image 2's lighting scheme perfectly. This includes matching the direction, color temperature (warm/cool), and quality (hard/soft shadows) of the primary light source. Add subtle bounce light and ambient occlusion where appropriate.
    *   **Shadow Casting:** The subject MUST cast a physically accurate shadow onto the new environment. The shadow's direction, length, and softness must be dictated by the light sources in Image 2. This is critical for grounding the subject.
    *   **Color Harmony:** Perform a final color grade on the subject to match the background's color palette and contrast levels.
    *   **Atmospheric Effects:** If the background has fog, haze, or atmospheric perspective (distant objects are less clear), you MUST apply the same effect to the subject proportionally to their distance from the camera.
    *   **Reflections:** If the subject is near reflective surfaces (water, glass, polished floors), they must cast subtle, accurate reflections.

4.  **TECHNICAL EXECUTION:**
    *   **Scale & Perspective:** The subject's scale and perspective MUST align perfectly with the background.
    *   **Edge Fidelity:** Ensure the edges of the subject are perfectly integrated. No harsh lines or color halos. Use subtle edge blending and light wrap where necessary.
    *   **Focus & Depth of Field:** The subject's sharpness must match the depth of field of the background. If the background is blurry, the subject should be appropriately sharp or blurry based on its position in the scene.

**FINAL OUTPUT:** A single, high-quality, photorealistic image that is visually indistinguishable from a real photograph.`,
        };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [subjectPart, backgroundPart, textPart],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });
        return processGeminiResponse(response);

    } catch (error) {
        handleApiError(error, "Lỗi khi ghép cảnh với Gemini", "Không thể ghép cảnh. Vui lòng thử lại.");
    }
};

export const replaceSubjectInScene = async (
    subjectFile: File,
    backgroundFile: File,
    maskDataUrl: string
): Promise<string> => {
    if (!process.env.API_KEY) {
        throw new Error("Biến môi trường API_KEY chưa được đặt.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    try {
        const subjectPart = await fileToGenerativePart(subjectFile);
        const backgroundPart = await fileToGenerativePart(backgroundFile);
        const maskPart = base64ToGenerativePart(maskDataUrl, 'image/png');

        const textPart = {
            text: `You are a world-class AI visual effects artist specializing in photorealistic digital compositing and object replacement.
**MISSION:** Your task is to perform a flawless replacement. You will take the main subject from the 'Subject Image' and seamlessly integrate it into the 'Background Image' at the precise location indicated by the 'Mask Image'. The final result must look like a single, cohesive photograph.

**INPUT ANALYSIS:**
- **Subject Image:** Contains the new person/object. Analyze their features, clothing, and original lighting.
- **Background Image:** The destination scene. Analyze its lighting, perspective, and atmosphere around the masked area.
- **Mask Image:** The white area dictates the exact placement and general area for the new subject.

**CORE TASK: SEAMLESS REPLACEMENT AND INTEGRATION**

**CRITICAL DIRECTIVES - FOLLOW WITH EXTREME PRECISION:**

1.  **IDENTITY & ESSENCE PRESERVATION:**
    *   The new subject's face, identity, and core features are SACROSANCT. They MUST remain unchanged.
    *   Preserve the style of the subject's clothing/appearance, but you MUST realistically re-render its lighting and color to match the new scene.

2.  **INTELLIGENT PLACEMENT & POSE ADJUSTMENT:**
    *   The new subject MUST be placed within the boundaries of the white area of the mask.
    *   **Crucially, you MUST subtly adjust the subject's pose to interact believably with the immediate surroundings defined by the masked area.** For example, if the mask is on a chair, the subject's pose must be adjusted to look like they are actually sitting on that chair, not just floating on top of it. Their body should conform to the surface.
    *   The goal is a natural, physically plausible interaction with the scene at the point of insertion.

3.  **PHOTOREALISTIC BLENDING & GROUNDING:**
    *   **Lighting & Shading:** The subject MUST be relit to perfectly match the lighting of the area they are being placed into. Pay close attention to local light sources, reflections, and shadows in the Background Image.
    *   **Shadow Casting:** The subject MUST cast physically accurate shadows onto the surfaces immediately around them. The existing lighting in the Background Image determines the shadow properties.
    *   **Contact Shadows:** Add realistic contact shadows where the subject touches surfaces in the background to ground them in the scene.
    *   **Color Harmony:** Perform a final color grade on the subject to match the local color palette and contrast of the background.
    *   **Edge Fidelity:** Ensure the edges of the subject are perfectly integrated with the background. Use subtle light wrap from the background onto the subject's edges to make the composite undetectable.

4.  **TECHNICAL EXECUTION:**
    *   **Scale & Perspective:** The subject's scale and perspective MUST align perfectly with the perspective of the masked area in the background.
    *   **Focus & Depth of Field:** The subject's sharpness must match the sharpness of the background at the point of insertion.

**FINAL OUTPUT:** A single, high-quality, photorealistic image where the replacement is completely undetectable.`,
        };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [subjectPart, backgroundPart, maskPart, textPart],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });
        return processGeminiResponse(response);

    } catch (error) {
        handleApiError(error, "Lỗi khi thay thế chủ thể với Gemini", "Không thể thay thế chủ thể. Vui lòng thử lại.");
    }
};

export const restorePhoto = async (imageFile: File, colorize: boolean, clarityLevel: 'subtle' | 'medium' | 'strong'): Promise<string> => {
    if (!process.env.API_KEY) {
        throw new Error("Biến môi trường API_KEY chưa được đặt.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    try {
        const imagePart = await fileToGenerativePart(imageFile);
        let promptText = `Analyze this image. It is an old, potentially damaged photograph. Please restore it to its former glory. Your task is to: 1. Repair any physical damage such as scratches, tears, creases, and stains. 2. Correct color fading and discoloration, restoring natural and vibrant tones. 3. Reduce noise and grain while preserving important details. The final output should be a clean, high-quality, restored version of the original photograph, maintaining the authenticity and character of the original subjects and scene.`;
        
        if (colorize) {
            promptText += " If the original image is black and white or sepia-toned, please colorize it with historically appropriate and realistic colors.";
        }
        
        switch (clarityLevel) {
            case 'medium':
                promptText += ' Apply a medium amount of sharpening and clarity enhancement to improve details.';
                break;
            case 'strong':
                promptText += ' Apply a strong but realistic sharpening and clarity enhancement to bring out fine details.';
                break;
            case 'subtle':
            default:
                 promptText += ' Enhance the overall clarity and sharpness subtly, without making it look artificial.';
                break;
        }

        const textPart = {
            text: promptText,
        };
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [imagePart, textPart] },
            config: { responseModalities: [Modality.IMAGE] },
        });

        return processGeminiResponse(response);
    } catch (error) {
        handleApiError(error, "Lỗi khi khôi phục ảnh với Gemini", "Không thể khôi phục ảnh. Vui lòng thử lại.");
    }
};

export const generateVideoFromImage = async (
    imageFile: File, 
    prompt: string, 
    onProgress: (message: string) => void
): Promise<string> => {
    onProgress("Đang khởi tạo trình tạo video...");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    try {
        const base64Data = await fileToBase64(imageFile);
        
        let operation = await ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: prompt,
            image: {
                imageBytes: base64Data,
                mimeType: imageFile.type,
            },
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: '1:1' 
            }
        });

        onProgress("Đã gửi yêu cầu. Đang chờ AI xử lý...");

        const pollInterval = 10000; // 10 seconds
        let checks = 0;

        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, pollInterval));
            checks++;
            const progressMessage = checks < 3 
                ? "Đang xử lý... Quá trình này có thể mất vài phút." 
                : "Vẫn đang làm việc, cảm ơn sự kiên nhẫn của bạn.";
            onProgress(progressMessage);

            operation = await ai.operations.getVideosOperation({ operation: operation });
        }
        
        onProgress("Hoàn tất! Đang tải video...");

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadLink) {
            throw new Error("Không tìm thấy link tải video trong phản hồi.");
        }
        
        const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        if (!response.ok) {
            throw new Error(`Tải video thất bại: ${response.statusText}`);
        }

        const videoBlob = await response.blob();
        const videoUrl = URL.createObjectURL(videoBlob);
        
        return videoUrl;

    } catch (error: any) {
        handleApiError(error, "Lỗi khi tạo video với Veo", "Không thể tạo video. Vui lòng thử lại.");
    }
};

export const generateImageFromPrompt = async (
    prompt: string,
    aspectRatio: "1:1" | "3:4" | "4:3" | "9:16" | "16:9"
): Promise<string> => {
    if (!process.env.API_KEY) {
        throw new Error("Biến môi trường API_KEY chưa được đặt.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/jpeg',
                aspectRatio: aspectRatio,
            },
        });

        const base64ImageBytes: string | undefined = response.generatedImages?.[0]?.image?.imageBytes;
        if (!base64ImageBytes) {
            throw new Error("Không có hình ảnh nào được tạo bởi API.");
        }
        
        return `data:image/jpeg;base64,${base64ImageBytes}`;

    } catch (error: any) {
         const errorMessage = typeof error === 'object' && error !== null && 'message' in error ? String(error.message) : JSON.stringify(error);
        if (errorMessage.includes("429") || errorMessage.toLowerCase().includes("quota") || errorMessage.toLowerCase().includes("resource_exhausted")) {
            throw new Error("Lỗi giới hạn (429): Bạn đã gửi quá nhiều yêu cầu hoặc có vấn đề về hạn mức. Vui lòng đợi một chút và thử lại, hoặc kiểm tra gói dịch vụ của bạn.");
        }
        handleApiError(error, "Lỗi khi tạo ảnh từ prompt với Gemini", "Không thể tạo ảnh. Vui lòng thử lại.");
    }
};

export const generateVideoFromPrompt = async (
    prompt: string,
    aspectRatio: "16:9" | "9:16",
    onProgress: (message: string) => void
): Promise<string> => {
    onProgress("Đang khởi tạo trình tạo video...");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    try {
        let operation = await ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: prompt,
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: aspectRatio
            }
        });

        onProgress("Đã gửi yêu cầu. Đang chờ AI xử lý...");

        const pollInterval = 10000; // 10 seconds
        let checks = 0;

        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, pollInterval));
            checks++;
            const progressMessage = checks < 3 
                ? "Đang xử lý... Quá trình này có thể mất vài phút." 
                : "Vẫn đang làm việc, cảm ơn sự kiên nhẫn của bạn.";
            onProgress(progressMessage);

            operation = await ai.operations.getVideosOperation({ operation: operation });
        }
        
        onProgress("Hoàn tất! Đang tải video...");

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadLink) {
            throw new Error("Không tìm thấy link tải video trong phản hồi.");
        }
        
        const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        if (!response.ok) {
            throw new Error(`Tải video thất bại: ${response.statusText}`);
        }

        const videoBlob = await response.blob();
        const videoUrl = URL.createObjectURL(videoBlob);
        
        return videoUrl;

    } catch (error: any) {
        handleApiError(error, "Lỗi khi tạo video từ prompt với Veo", "Không thể tạo video. Vui lòng thử lại.");
    }
};


export const upscaleImage = async (base64Image: string, mimeType: string): Promise<string> => {
    if (!process.env.API_KEY) {
        throw new Error("Biến môi trường API_KEY chưa được đặt.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    try {
        const imagePart = base64ToGenerativePart(base64Image, mimeType);
        const textPart = {
            text: `You are an expert AI image upscaler.
**TASK:** Upscale the provided image, increasing its resolution by 2x.

**CRITICAL INSTRUCTIONS:**
1.  **Enhance Details:** Enhance the details and sharpness while maintaining photorealism.
2.  **Preserve Composition:** Do NOT add, remove, or change any elements in the image. The composition must remain identical.
3.  **High Quality:** The final image must be a high-quality photograph.`,
        };
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [imagePart, textPart] },
            config: { responseModalities: [Modality.IMAGE] },
        });

        return processGeminiResponse(response);
    } catch (error) {
        handleApiError(error, "Lỗi khi nâng cấp ảnh với Gemini", "Không thể nâng cấp ảnh. Vui lòng thử lại.");
    }
};

export const generatePromptFromImage = async (imageFile: File): Promise<string> => {
    if (!process.env.API_KEY) {
        throw new Error("Biến môi trường API_KEY chưa được đặt.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const imagePart = await fileToGenerativePart(imageFile);
        const textPart = {
            text: "Analyze this image in detail. Describe the subject, the setting, the lighting, the composition, and the overall style. Formulate this description into a concise but vivid prompt that could be used by an AI image generator to create a similar image. Provide only the prompt text, in Vietnamese, without any introductory phrases or labels.",
        };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] },
        });

        return response.text.trim();
    } catch (error) {
        handleApiError(error, "Lỗi khi tạo prompt từ ảnh với Gemini", "Không thể tạo prompt. Vui lòng thử lại.");
    }
};

export const extractColorPalette = async (base64Image: string, mimeType: string): Promise<string[]> => {
    if (!process.env.API_KEY) {
        throw new Error("Biến môi trường API_KEY chưa được đặt.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    try {
        const imagePart = base64ToGenerativePart(base64Image, mimeType);
        const textPart = {
            text: "Analyze this image and identify the 5 most dominant colors. Return them as an array of hex color codes in a JSON object.",
        };
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        colors: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.STRING,
                                description: "A hex color code, e.g., '#RRGGBB'",
                            },
                        },
                    },
                    required: ["colors"],
                },
            },
        });
        
        const jsonString = response.text.trim();
        const result = JSON.parse(jsonString);
        
        if (result && Array.isArray(result.colors)) {
            return result.colors;
        } else {
            throw new Error("Phản hồi JSON không hợp lệ từ API.");
        }

    } catch (error) {
        handleApiError(error, "Lỗi khi trích xuất bảng màu với Gemini", "Không thể trích xuất bảng màu. Vui lòng thử lại.");
    }
};

export const blendImages = async (
    imageFiles: File[],
    prompt: string
): Promise<string> => {
    if (!process.env.API_KEY) {
        throw new Error("Biến môi trường API_KEY chưa được đặt.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    try {
        const imageParts = await Promise.all(imageFiles.map(file => fileToGenerativePart(file)));
        const textPart = { text: `You are an expert creative AI compositor.
**INPUTS:** Multiple images are provided.
**TASK:** Blend the provided images together into a single, seamless, and creative composition based on the user's instruction.
**INSTRUCTION:** "${prompt}".

**CRITICAL INSTRUCTIONS:**
1.  **Incorporate All:** You must use elements from ALL provided images in the final composition.
2.  **Follow Instruction:** The final image must accurately reflect the user's instruction for how to blend the images.
3.  **Seamless and Photorealistic:** The composition must be seamless and photorealistic, unless the style instruction specifies otherwise.
4.  **Creative Interpretation:** Interpret the instruction creatively to produce a visually stunning result.` };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [...imageParts, textPart],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });
        return processGeminiResponse(response);

    } catch (error) {
        handleApiError(error, "Lỗi khi ghép ảnh với Gemini", "Không thể ghép ảnh. Vui lòng thử lại.");
    }
};

export const generateBlendSuggestion = async (imageFiles: File[]): Promise<string> => {
    if (!process.env.API_KEY) {
        throw new Error("Biến môi trường API_KEY chưa được đặt.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    try {
        const imageParts = await Promise.all(imageFiles.map(file => fileToGenerativePart(file)));
        const textPart = {
            text: "Hãy phân tích những hình ảnh này. Dựa trên nội dung của chúng, hãy viết một lời nhắc mô tả, sáng tạo bằng tiếng Việt để kết hợp chúng lại thành một hình ảnh duy nhất, mạch lạc. Lời nhắc nên là một câu ngắn gọn, súc tích. Chỉ trả về duy nhất câu nhắc đó mà không có bất kỳ lời giải thích nào khác.",
        };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [...imageParts, textPart],
            },
        });

        return response.text.trim();

    } catch (error) {
        handleApiError(error, "Lỗi khi tạo gợi ý ghép ảnh với Gemini", "Không thể tạo gợi ý. Vui lòng thử lại.");
    }
};

export const generateEnhancedPrompt = async (prompt: string): Promise<string> => {
    if (!process.env.API_KEY) {
        throw new Error("Biến môi trường API_KEY chưa được đặt.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    try {
        const textPart = {
            text: `Take the following user idea for an image and expand it into a detailed, descriptive, and vivid prompt for an AI image generator, in Vietnamese. Add details about composition, lighting, art style, and mood. The output should be only the new prompt, in a single paragraph. Original idea: "${prompt}"`,
        };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [textPart] },
        });

        return response.text.trim();

    } catch (error) {
        handleApiError(error, "Lỗi khi nâng cao prompt với Gemini", "Không thể nâng cao prompt. Vui lòng thử lại.");
    }
};

// --- NEW CREATIVE SUITE FUNCTIONS ---

export const tryOnOutfit = async (
    personFile: File,
    outfitPrompt?: string,
    outfitFile?: File
): Promise<string> => {
    try {
        if (!outfitPrompt && !outfitFile) {
            throw new Error("Phải cung cấp mô tả trang phục hoặc hình ảnh trang phục.");
        }

        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const personPart = await fileToGenerativePart(personFile);
        
        const parts: ( { inlineData: { data: string; mimeType: string; } } | { text: string } )[] = [personPart];
        let textPrompt = "";

        if (outfitFile) {
            const outfitPart = await fileToGenerativePart(outfitFile);
            parts.push(outfitPart);
            textPrompt = `You are an expert AI fashion stylist performing a virtual try-on.
    **INPUTS:**
    - **Image 1 (Person):** The first image provided contains the person who will be wearing the new clothes.
    - **Image 2 (Outfit):** The second image provided shows the outfit to be worn.

    **CRITICAL INSTRUCTIONS:**
    1.  **Transfer Outfit:** Take the outfit from Image 2 and place it onto the person in Image 1.
    2.  **Preserve Person:** The person's face, hair, body shape, and pose from Image 1 MUST remain unchanged.
    3.  **Preserve Background:** The background from Image 1 MUST remain unchanged.
    4.  **Replace Clothing Only:** ONLY the clothing on the person in Image 1 should be replaced.
    5.  **Realism:** The final image must be a seamless, photorealistic composition. The lighting, shadows, and fit of the new clothes should look natural on the person.
    6.  **Output:** The output MUST be the complete scene from Image 1, but with the person wearing the new outfit from Image 2. Do not output only the person, only the outfit, or the original image.`;
        } else if (outfitPrompt) {
            textPrompt = `You are an expert AI fashion stylist. Your task is to take the person in the provided image and digitally dress them in a new outfit.
    **CRITICAL INSTRUCTIONS:**
    1.  **Preserve Identity:** The person's face, hair, body shape, and pose MUST remain exactly the same as in the original image.
    2.  **Preserve Background:** The background of the original image MUST NOT be changed.
    3.  **Replace Clothing Only:** Your ONLY job is to replace the clothing the person is wearing with the new described outfit.
    4.  **Realism:** The new outfit must look completely realistic, with natural folds, lighting, and shadows that match the original image.
    5.  **Output:** The output MUST be a new image of the person wearing the clothes. Do not output just the clothes or the original person.

    **The new outfit is described as:** "${outfitPrompt}"`;
        }
        
        parts.push({ text: textPrompt });

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts },
            config: { responseModalities: [Modality.IMAGE] },
        });
        return processGeminiResponse(response);
    } catch (error) {
        handleApiError(error, "Lỗi khi thử trang phục với Gemini", "Không thể thử trang phục. Vui lòng thử lại.");
    }
};

export const transferPose = async (poseFile: File, personFile: File): Promise<string> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const posePart = await fileToGenerativePart(poseFile);
        const personPart = await fileToGenerativePart(personFile);
        const textPart = { text: `You are an expert in human pose transfer and image generation.

    **INPUTS:**
    - **Image 1 (Pose Source):** The first image provided contains the target pose.
    - **Image 2 (Character Source):** The second image provided contains the person, their clothing, and the background to be used.

    **CRITICAL INSTRUCTIONS:**
    1.  **Analyze Pose:** Extract the exact human body pose from Image 1.
    2.  **Preserve Character:** The person's face, identity, clothing, and all visual characteristics from Image 2 MUST be perfectly preserved.
    3.  **Preserve Background:** The background from Image 2 MUST remain unchanged.
    4.  **Apply Pose:** Redraw the person from Image 2 using the exact pose extracted from Image 1.
    5.  **DO NOT MIX:** Do NOT transfer any features (like face, clothing, or background) from the Pose Source (Image 1). ONLY the pose is to be used.
    6.  **Output:** The final image must be a photorealistic composition showing the character from Image 2 in the pose from Image 1, within the background of Image 2. Do NOT output the original Image 2. The pose MUST be different.` };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [posePart, personPart, textPart] },
            config: { responseModalities: [Modality.IMAGE] },
        });
        return processGeminiResponse(response);
    } catch (error) {
        handleApiError(error, "Lỗi khi chuyển đổi dáng với Gemini", "Không thể chuyển đổi dáng. Vui lòng thử lại.");
    }
};

export const swapBackground = async (subjectFile: File, backgroundFile?: File, backgroundPrompt?: string): Promise<string> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const subjectPart = await fileToGenerativePart(subjectFile);
        const parts: ({ inlineData: { data: string; mimeType: string; } } | { text: string })[] = [subjectPart];
        let textPrompt = `You are an expert at image segmentation and composition.
    **INPUTS:**
    - **Image 1 (Subject):** The image containing the main subject (person, animal, or object) to keep.
    - **New Background:** The new background is described either by an image or a text prompt.

    **TASK:**
    1.  **Isolate Subject:** Perfectly isolate the main subject from Image 1, keeping all its details.
    2.  **Create New Background:** Use the provided new background image or generate a new one based on the prompt.
    3.  **Combine and Blend:** Place the isolated subject onto the new background. You MUST meticulously match the lighting, shadows, color temperature, and grain.
    4.  **Final Result:** The output must be a completely photorealistic composite.`;

        if (backgroundFile) {
            parts.push(await fileToGenerativePart(backgroundFile));
            textPrompt += "\n**BACKGROUND SOURCE:** Use the provided second image as the new background."
        } else if (backgroundPrompt) {
            textPrompt += `\n**BACKGROUND SOURCE:** Generate a new background described as: "${backgroundPrompt}"`;
        } else {
            throw new Error("Bạn phải cung cấp ảnh nền hoặc mô tả nền.");
        }
        parts.push({text: textPrompt});

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: parts },
            config: { responseModalities: [Modality.IMAGE] },
        });
        return processGeminiResponse(response);
    } catch (error) {
        handleApiError(error, "Lỗi khi thay đổi nền với Gemini", "Không thể thay đổi nền. Vui lòng thử lại.");
    }
};


export const swapFaces = async (sourceFaceFile: File, targetImageFile: File): Promise<string> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const sourcePart = await fileToGenerativePart(sourceFaceFile);
        const targetPart = await fileToGenerativePart(targetImageFile);
        const textPart = { text: `You are an expert at digital face replacement.
    **TASK:** Take the face from the first image (the source) and flawlessly transplant it onto the person in the second image (the destination).

    **CRITICAL INSTRUCTIONS:**
    1.  **Preserve Destination Body:** You MUST maintain the original head shape, hair, neck, and body of the destination image.
    2.  **Seamless Blend:** The final image must be photorealistic, with seamless blending of skin tones, lighting, and angle.
    3.  **Undetectable Swap:** The goal is to make the swap completely undetectable.` };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [sourcePart, targetPart, textPart] },
            config: { responseModalities: [Modality.IMAGE] },
        });
        return processGeminiResponse(response);
    } catch (error) {
        handleApiError(error, "Lỗi khi hoán đổi gương mặt với Gemini", "Không thể hoán đổi gương mặt. Vui lòng thử lại.");
    }
};

export const stylizePortrait = async (imageFile: File, stylePrompt: string): Promise<string> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const imagePart = await fileToGenerativePart(imageFile);
        const textPart = { text: `You are an expert AI artist.
    **TASK:** Transform the style of the provided portrait into a new artistic style, while preserving the subject's identity.
    **NEW STYLE:** "${stylePrompt}".

    **CRITICAL INSTRUCTIONS:**
    1.  **Preserve Likeness:** The subject's key facial features and likeness MUST be recognizable in the final artwork.
    2.  **Apply Style Fully:** The artistic style must be applied consistently across the entire image.
    3.  **High Quality:** The result must be a high-quality artistic rendition, not a simple filter.
    4.  **Output:** The output must be the stylized image.` };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [imagePart, textPart] },
            config: { responseModalities: [Modality.IMAGE] },
        });
        return processGeminiResponse(response);
    } catch (error) {
        handleApiError(error, "Lỗi khi tạo chân dung nghệ thuật với Gemini", "Không thể tạo chân dung nghệ thuật. Vui lòng thử lại.");
    }
};

export const morphObject = async (imageFile: File, morphPrompt: string): Promise<string> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const imagePart = await fileToGenerativePart(imageFile);
        const textPart = { text: `You are an expert AI concept artist.
    **TASK:** Creatively transform the main subject (animal or object) in the provided image based on the user's instruction.
    **INSTRUCTION:** "${morphPrompt}".

    **CRITICAL INSTRUCTIONS:**
    1.  **Clear Transformation:** The final image must clearly show the described transformation.
    2.  **Maintain Recognizability:** While transformed, the original subject should still be somewhat recognizable.
    3.  **Seamless & Artistic:** The result should be a fantastical, seamless, and high-quality artistic image.
    4.  **Focus on Subject:** The transformation should primarily apply to the main subject, blending it naturally with the background.` };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [imagePart, textPart] },
            config: { responseModalities: [Modality.IMAGE] },
        });
        return processGeminiResponse(response);
    } catch (error) {
        handleApiError(error, "Lỗi khi biến đổi với Gemini", "Không thể biến đổi. Vui lòng thử lại.");
    }
};

export const outpaintImage = async (
    imageFile: File,
    prompt: string,
    direction: 'up' | 'down' | 'left' | 'right' | 'panoramic'
): Promise<string> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
            const image = new Image();
            image.onload = () => resolve(image);
            image.onerror = reject;
            image.src = URL.createObjectURL(imageFile);
        });
        URL.revokeObjectURL(img.src);

        const { naturalWidth: originalWidth, naturalHeight: originalHeight } = img;

        if (direction === 'panoramic') {
            // STEP 1: Outpaint to the right
            const expandRatio = 0.75;
            const intermediateWidth = originalWidth * (1 + expandRatio);

            const step1Canvas = document.createElement('canvas');
            step1Canvas.width = intermediateWidth;
            step1Canvas.height = originalHeight;
            const step1Ctx = step1Canvas.getContext('2d')!;
            step1Ctx.drawImage(img, 0, 0);

            const step1Mask = document.createElement('canvas');
            step1Mask.width = intermediateWidth;
            step1Mask.height = originalHeight;
            const step1MaskCtx = step1Mask.getContext('2d')!;
            step1MaskCtx.fillStyle = 'black';
            step1MaskCtx.fillRect(0, 0, originalWidth, originalHeight);
            step1MaskCtx.fillStyle = 'white';
            step1MaskCtx.fillRect(originalWidth, 0, intermediateWidth - originalWidth, originalHeight);
            
            const step1Prompt = `You are an expert in photorealistic image outpainting. Your task is to seamlessly extend the provided image into the area marked by the white mask.

**CRITICAL INSTRUCTIONS:**
1.  **SEAMLESS CONTINUATION:** The new area MUST logically and photorealistically continue the content, style, lighting, and perspective of the original image. The transition must be undetectable.
2.  **SUBJECT EXTENSION (TOP PRIORITY):** If a person or object is cut off at the edge, you MUST NATURALLY AND REALISTICALLY EXTEND them into the new area. Continue their body, clothing, and pose logically. For example, if it is a half-body portrait, you must complete the rest of their body as requested. DO NOT change the existing subject.
3.  **CONTEXTUAL FILL:** Fill the new area based on the provided description: "${prompt}". This description should guide the content of the extended scene.
4.  **DIRECTION:** The image is being extended to the right.

**FINAL OUTPUT:** A single, cohesive, high-quality photograph.`;
            
            const step1Response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [
                    base64ToGenerativePart(step1Canvas.toDataURL('image/png'), 'image/png'),
                    base64ToGenerativePart(step1Mask.toDataURL('image/png'), 'image/png'),
                    { text: step1Prompt }
                ] },
                config: { responseModalities: [Modality.IMAGE] },
            });
            const step1ResultUrl = processGeminiResponse(step1Response);
            
            const step1ResultImg = await new Promise<HTMLImageElement>((resolve, reject) => {
                const image = new Image();
                image.onload = () => resolve(image);
                image.onerror = reject;
                image.src = step1ResultUrl;
            });

            // STEP 2: Outpaint to the left
            const finalWidth = step1ResultImg.width + (originalWidth * expandRatio);
            
            const step2Canvas = document.createElement('canvas');
            step2Canvas.width = finalWidth;
            step2Canvas.height = originalHeight;
            const step2Ctx = step2Canvas.getContext('2d')!;
            step2Ctx.drawImage(step1ResultImg, finalWidth - step1ResultImg.width, 0);

            const step2Mask = document.createElement('canvas');
            step2Mask.width = finalWidth;
            step2Mask.height = originalHeight;
            const step2MaskCtx = step2Mask.getContext('2d')!;
            step2MaskCtx.fillStyle = 'black';
            step2MaskCtx.fillRect(finalWidth - step1ResultImg.width, 0, step1ResultImg.width, originalHeight);
            step2MaskCtx.fillStyle = 'white';
            step2MaskCtx.fillRect(0, 0, finalWidth - step1ResultImg.width, originalHeight);

            const step2Prompt = `You are an expert in photorealistic image outpainting. Your task is to seamlessly extend the provided image into the area marked by the white mask.

**CRITICAL INSTRUCTIONS:**
1.  **SEAMLESS CONTINUATION:** The new area MUST logically and photorealistically continue the content, style, lighting, and perspective of the original image. The transition must be undetectable.
2.  **SUBJECT EXTENSION (TOP PRIORITY):** If a person or object is cut off at the edge, you MUST NATURALLY AND REALISTICALLY EXTEND them into the new area. Continue their body, clothing, and pose logically. For example, if it is a half-body portrait, you must complete the rest of their body as requested. DO NOT change the existing subject.
3.  **CONTEXTUAL FILL:** Fill the new area based on the provided description: "${prompt}". This description should guide the content of the extended scene.
4.  **DIRECTION:** The image is being extended to the left.

**FINAL OUTPUT:** A single, cohesive, high-quality photograph.`;

            const finalResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [
                    base64ToGenerativePart(step2Canvas.toDataURL('image/png'), 'image/png'),
                    base64ToGenerativePart(step2Mask.toDataURL('image/png'), 'image/png'),
                    { text: step2Prompt }
                ] },
                config: { responseModalities: [Modality.IMAGE] },
            });

            return processGeminiResponse(finalResponse);
        }
        
        // --- Single direction logic ---
        let newWidth = originalWidth;
        let newHeight = originalHeight;
        let drawX = 0;
        let drawY = 0;
        
        const targetCanvas = document.createElement('canvas');
        const maskCanvas = document.createElement('canvas');
        const targetCtx = targetCanvas.getContext('2d')!;
        const maskCtx = maskCanvas.getContext('2d')!;
        
        const expandRatio = 0.5;
        let maskX = 0;
        let maskY = 0;
        let maskWidth = 0;
        let maskHeight = 0;

        switch (direction) {
            case 'up':
                newHeight = originalHeight * (1 + expandRatio);
                drawY = newHeight - originalHeight;
                maskHeight = drawY;
                maskWidth = newWidth;
                break;
            case 'down':
                newHeight = originalHeight * (1 + expandRatio);
                maskY = originalHeight;
                maskHeight = newHeight - originalHeight;
                maskWidth = newWidth;
                break;
            case 'left':
                newWidth = originalWidth * (1 + expandRatio);
                drawX = newWidth - originalWidth;
                maskWidth = drawX;
                maskHeight = newHeight;
                break;
            case 'right':
                newWidth = originalWidth * (1 + expandRatio);
                maskX = originalWidth;
                maskWidth = newWidth - originalWidth;
                maskHeight = newHeight;
                break;
        }

        targetCanvas.width = newWidth;
        targetCanvas.height = newHeight;
        maskCanvas.width = newWidth;
        maskCanvas.height = newHeight;

        targetCtx.drawImage(img, drawX, drawY);

        maskCtx.fillStyle = 'black';
        maskCtx.fillRect(0, 0, newWidth, newHeight);
        maskCtx.fillStyle = 'white';
        maskCtx.fillRect(maskX, maskY, maskWidth, maskHeight);

        let directionText = '';
        switch (direction) {
            case 'up': directionText = 'upwards'; break;
            case 'down': directionText = 'downwards'; break;
            case 'left': directionText = 'to the left'; break;
            case 'right': directionText = 'to the right'; break;
        }
        
        const textPrompt = `You are an expert in photorealistic image outpainting. Your task is to seamlessly extend the provided image into the area marked by the white mask.

**CRITICAL INSTRUCTIONS:**
1.  **SEAMLESS CONTINUATION:** The new area MUST logically and photorealistically continue the content, style, lighting, and perspective of the original image. The transition must be undetectable.
2.  **SUBJECT EXTENSION (TOP PRIORITY):** If a person or object is cut off at the edge, you MUST NATURALLY AND REALISTICALLY EXTEND them into the new area. Continue their body, clothing, and pose logically. For example, if it is a half-body portrait, you must complete the rest of their body as requested. DO NOT change the existing subject.
3.  **CONTEXTUAL FILL:** Fill the new area based on the provided description: "${prompt}". This description should guide the content of the extended scene.
4.  **DIRECTION:** The image is being extended ${directionText}.

**FINAL OUTPUT:** A single, cohesive, high-quality photograph.`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [
                base64ToGenerativePart(targetCanvas.toDataURL('image/png'), 'image/png'),
                base64ToGenerativePart(maskCanvas.toDataURL('image/png'), 'image/png'),
                { text: textPrompt }
            ] },
            config: { responseModalities: [Modality.IMAGE] },
        });

        return processGeminiResponse(response);

    } catch (error) {
        handleApiError(error, "Lỗi khi vẽ tiếp khung ảnh với Gemini", "Không thể vẽ tiếp khung ảnh. Vui lòng thử lại.");
    }
};

export const generateOutpaintingSuggestion = async (imageFile: File): Promise<string> => {
    if (!process.env.API_KEY) {
        throw new Error("Biến môi trường API_KEY chưa được đặt.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const imagePart = await fileToGenerativePart(imageFile);
        const textPart = {
            text: `You are a creative visual analyst. Your task is to analyze the provided image and generate a highly detailed, multi-sentence outpainting prompt in Vietnamese.

1.  **Analyze:** Scrutinize the subject, setting, mood, lighting, and artistic style.
2.  **Suggest:** Based on your analysis, write a creative and descriptive prompt for what could be outpainted.
3.  **Portrait Rule:** If it's a portrait of a person, your top priority is to suggest completing their body. Describe a plausible outfit, pose, and action that matches the existing image's context and style.
4.  **Landscape Rule:** If it's a landscape, describe how the scene could expand with more details about the environment, weather, and time of day.
5.  **Output:** Return ONLY the detailed prompt text, without any introductory phrases. Be descriptive and inspiring.`,
        };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] },
        });

        return response.text.trim();
    } catch (error) {
        handleApiError(error, "Lỗi khi tạo gợi ý vẽ tiếp", "Không thể tạo gợi ý.");
    }
};

export const summarizeConversationForTitle = async (messages: ChatMessage[]): Promise<string> => {
    if (!process.env.API_KEY) {
        throw new Error("Biến môi trường API_KEY chưa được đặt.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    try {
        const conversationSnippet = messages
            .slice(0, 4) // Take first 4 messages for context
            .map(msg => `${msg.role === 'user' ? 'User' : 'AI'}: ${msg.text}`)
            .join('\n');

        const prompt = `Based on the following conversation snippet, create a very short, concise title (3-5 words) in Vietnamese. Return only the title text, nothing else.\n\nConversation:\n${conversationSnippet}`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
        });

        return response.text.trim().replace(/"/g, ''); // Clean up quotes

    } catch (error) {
        console.error("Lỗi khi tóm tắt cuộc trò chuyện:", error);
        return "Cuộc trò chuyện mới"; // Fallback title
    }
};

export const generateDifferentAngle = async (base64Image: string, mimeType: string, anglePrompt: string): Promise<string> => {
    try {
        if (!process.env.API_KEY) {
            throw new Error("Biến môi trường API_KEY chưa được đặt.");
        }
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

        const imagePart = base64ToGenerativePart(base64Image, mimeType);
        const textPart = {
          text: `You are an expert at creating consistent character images. Using the provided image of a person as a reference for their appearance and clothing, generate a new, photorealistic image showing them from a different angle as described. It is critical to maintain their identity, clothing, and the style of the background. The new angle is: "${anglePrompt}".`,
        };
        
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: { parts: [imagePart, textPart] },
          config: { responseModalities: [Modality.IMAGE] },
        });

        return processGeminiResponse(response);
    } catch (error) {
        handleApiError(error, "Lỗi khi tạo góc nhìn khác với Gemini", "Không thể tạo góc nhìn khác. Vui lòng thử lại.");
    }
};

export const applyColorStyle = async (
    sourceBase64: string,
    sourceMimeType: string,
    styleFile: File
): Promise<string> => {
    try {
        if (!process.env.API_KEY) {
            throw new Error("Biến môi trường API_KEY chưa được đặt.");
        }
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const sourcePart = base64ToGenerativePart(sourceBase64, sourceMimeType);
        const stylePart = await fileToGenerativePart(styleFile);
        const textPart = { text: "You are an expert colorist. Analyze the style, mood, color palette, and lighting of the second image (the 'style reference'). Apply that exact same aesthetic to the first image (the 'source'). The final image must be a photorealistic transformation of the source image, but with the artistic style of the reference image." };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [sourcePart, stylePart, textPart] },
            config: { responseModalities: [Modality.IMAGE] },
        });
        return processGeminiResponse(response);
    } catch (error) {
        handleApiError(error, "Lỗi khi áp dụng phong cách màu", "Không thể áp dụng phong cách màu. Vui lòng thử lại.");
    }
};

export const convertToAnime = async (
    imageFile: File,
    requestQuote: boolean,
    stylePrompt?: string
): Promise<{ imageUrl: string; quote: string | null }> => {
    try {
        if (!process.env.API_KEY) {
            throw new Error("Biến môi trường API_KEY chưa được đặt.");
        }
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

        const imagePart = await fileToGenerativePart(imageFile);
        let imageGenerationPrompt = "Transform the person in this photo into a vibrant, high-quality Japanese anime style. Emphasize large, expressive eyes and clean lines. Maintain the original pose and composition. The output must be an image.";

        if(stylePrompt && stylePrompt !== 'default') {
            imageGenerationPrompt += ` The specific art style should be: "${stylePrompt}".`;
        }

        // Step 1: Generate the anime image
        const imageResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [imagePart, { text: imageGenerationPrompt }] },
            config: { responseModalities: [Modality.IMAGE] },
        });
        
        const imageUrl = processGeminiResponse(imageResponse);
        let quote: string | null = null;

        // Step 2: If requested, generate a quote
        if (requestQuote) {
            const quoteGenerationPrompt = "Based on the mood and expression of the person in the original image, invent a short, impactful, and cool anime-style quote in Vietnamese. Provide only the quote text itself, without any introductory phrases like 'Here is a quote:' or quotation marks around it.";
            
            const quoteResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts: [imagePart, { text: quoteGenerationPrompt }] },
            });

            quote = quoteResponse.text.trim().replace(/"/g, ''); // Clean up quotes just in case
        }
        
        return { imageUrl, quote };

    } catch (error) {
        handleApiError(error, "Lỗi khi chuyển đổi sang anime", "Không thể tạo ảnh anime. Vui lòng thử lại.");
    }
};

export const generateTextureMaps = async (prompt: string): Promise<{ [key: string]: string }> => {
    if (!process.env.API_KEY) {
        throw new Error("Biến môi trường API_KEY chưa được đặt.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const mapTypes = ['albedo', 'normal', 'roughness', 'ambient occlusion'];
    const results: { [key: string]: string } = {};

    try {
        const promises = mapTypes.map(async (mapType) => {
            const mapPrompt = `tileable, seamless, pbr, ${prompt}, ${mapType} texture map, game asset, photorealistic, 8k`;
            const response = await ai.models.generateImages({
                model: 'imagen-4.0-generate-001',
                prompt: mapPrompt,
                config: {
                    numberOfImages: 1,
                    outputMimeType: 'image/jpeg',
                    aspectRatio: '1:1',
                },
            });
            const base64ImageBytes = response.generatedImages?.[0]?.image?.imageBytes;
            if (!base64ImageBytes) {
                throw new Error(`Không thể tạo ${mapType} map.`);
            }
            return { mapType, url: `data:image/jpeg;base64,${base64ImageBytes}` };
        });

        const settledResults = await Promise.all(promises);
        settledResults.forEach(res => {
            results[res.mapType] = res.url;
        });

        return results;
    } catch (error) {
        handleApiError(error, "Lỗi khi tạo texture maps với Gemini", "Không thể tạo texture maps. Vui lòng thử lại.");
    }
};

export const trainStyle = async (
    imageFiles: File[],
    prompt: string
): Promise<string> => {
    if (!process.env.API_KEY) {
        throw new Error("Biến môi trường API_KEY chưa được đặt.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    try {
        const imageParts = await Promise.all(imageFiles.map(file => fileToGenerativePart(file)));
        const textPart = { text: `You are an expert at style and character replication.
**INPUTS:** Multiple reference images are provided to define a specific subject or style.
**TASK:** Generate a new image that perfectly captures the subject/style of the reference images, based on the user's prompt.
**INSTRUCTION:** "${prompt}".

**CRITICAL INSTRUCTIONS:**
1.  **Analyze and Replicate:** Deeply analyze the provided images to understand the key features, colors, textures, and overall aesthetic.
2.  **Follow Prompt:** The final image must incorporate the user's prompt while staying true to the reference style/subject.
3.  **High-Quality Output:** The composition must be seamless and high-quality.` };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [...imageParts, textPart],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });
        return processGeminiResponse(response);

    } catch (error) {
        handleApiError(error, "Lỗi khi tạo ảnh với mô hình đã huấn luyện", "Không thể tạo ảnh. Vui lòng thử lại.");
    }
};

export const generateFromSketch = async (sketchDataUrl: string, prompt: string, guidanceStrength: number): Promise<string> => {
    if (!process.env.API_KEY) {
        throw new Error("Biến môi trường API_KEY chưa được đặt.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const imagePart = base64ToGenerativePart(sketchDataUrl, 'image/png');
        const textPart = {
            text: `You are an expert AI artist.
**TASK:** Use the provided rough sketch as a compositional guide to generate a new, detailed image based on the text prompt.

**CRITICAL INSTRUCTIONS:**
1.  **COMPOSITIONAL GUIDANCE STRENGTH: ${guidanceStrength}/100.** This number dictates how strictly you must follow the sketch. 100 means adhere to the lines and shapes precisely. 0 means use it only for loose inspiration. The placement and general shapes of elements in the final image MUST be influenced by the sketch according to this strength.
2.  **Apply Prompt Details:** Fill in the details, colors, textures, and style according to the text prompt below.
3.  **Creative Interpretation:** Interpret the rough sketch creatively, respecting the guidance strength, to produce a visually stunning and detailed result that matches the text description.

**PROMPT:** "${prompt}"`,
        };
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [imagePart, textPart] },
            config: { responseModalities: [Modality.IMAGE] },
        });

        return processGeminiResponse(response);
    } catch (error) {
        handleApiError(error, "Lỗi khi tạo ảnh từ phác thảo", "Không thể tạo ảnh. Vui lòng thử lại.");
    }
};
