import { GoogleGenAI, Type, Schema } from "@google/genai";
import { DocumentDesign } from "../types";

// --- Configuration ---
const CHUNK_SIZE = 1000; // User requested batch size

// --- System Instructions ---

const DESIGN_SYSTEM_INSTRUCTION = `
You are an expert Visual Designer.
Your task is to analyze the "Style Request" and "Content Sample" to generate a JSON "Design System" (CSS classes).

Rules:
1. Return strictly a JSON object matching the 'DocumentDesign' schema.
2. Use valid Tailwind CSS v3 utility classes.
3. **Visual Style**:
   - **WeChat/Social**: Decorative H2s (pills, borders), relaxed leading.
   - **Tech**: Dark/Gradient themes, mono fonts.
   - **Classic**: Serif fonts, paper textures.
4. **H2 Styling**: Be creative (gradients, capsules, borders) as this is the main visual anchor.
`;

const CONTENT_SYSTEM_INSTRUCTION = `
You are a Senior Content Editor.
Your task is to ENHANCE the input text segment to match a specific style (e.g., WeChat Official Account, Tech Blog).

Rules:
1. **Output strictly Markdown**. No JSON. No wrapping text like "Here is the rewritten text".
2. **Formatting**:
   - Auto-generate **H2 (##)** titles if the text lacks structure.
   - Add **relevant Emojis** to headers (e.g., "## 🚀 Title").
   - Use **bolding** for key phrases.
   - Ensure paragraphs are readable (short & punchy).
3. **Context Awareness**:
   - This is part of a larger document.
   - If 'Previous Context' is provided, ensure flow continuity.
   - Do NOT add a document main H1 title unless it is the very first segment.
`;

// --- Helper: Text Splitter ---
function splitTextIntoChunks(text: string, maxChars: number): string[] {
  const paragraphs = text.split('\n');
  const chunks: string[] = [];
  let currentChunk = '';

  for (const para of paragraphs) {
    // If adding this paragraph exceeds limit AND we have some content, push current chunk
    if ((currentChunk.length + para.length) > maxChars && currentChunk.length > 0) {
      chunks.push(currentChunk);
      currentChunk = '';
    }
    currentChunk += para + '\n';
  }
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk);
  }
  return chunks;
}

// --- Schemas ---

const designSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    themeName: { type: Type.STRING },
    layoutType: { type: Type.STRING, enum: ["card", "flat", "multi-card"] },
    pageBackground: { type: Type.STRING },
    containerBackground: { type: Type.STRING },
    containerShadow: { type: Type.STRING },
    containerMaxWidth: { type: Type.STRING },
    containerPadding: { type: Type.STRING },
    containerBorderRadius: { type: Type.STRING },
    fontFamily: { type: Type.STRING },
    baseFontSize: { type: Type.STRING },
    lineHeight: { type: Type.STRING },
    textColor: { type: Type.STRING },
    titleSize: { type: Type.STRING },
    heading1: { type: Type.STRING },
    heading2: { type: Type.STRING },
    paragraph: { type: Type.STRING },
    blockquote: { type: Type.STRING },
    highlightColor: { type: Type.STRING },
    dividerStyle: { type: Type.STRING }
  },
  required: ['themeName', 'layoutType', 'pageBackground', 'containerBackground', 'heading2', 'textColor']
};

// --- Main Service ---

export const generateLayoutFromPrompt = async (
  stylePrompt: string, 
  fullContent: string,
  preferredLayout: 'auto' | 'card' | 'flat' | 'multi-card' = 'auto',
  onProgress?: (type: 'design' | 'content', data: any) => void
): Promise<{ design: DocumentDesign; content: string }> => {
  
  // Directly check and use process.env.API_KEY as per guidelines
  if (!process.env.API_KEY) throw new Error("API Key is missing.");
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // 1. Generate Design (using first chunk as sample)
  const sampleContent = fullContent.slice(0, 800);
  const designPrompt = `
    STYLE REQUEST: ${stylePrompt}
    LAYOUT PREFERENCE: ${preferredLayout}
    CONTENT SAMPLE: ${sampleContent}
  `;

  let design: DocumentDesign;
  
  try {
    const designResp = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: designPrompt,
      config: {
        systemInstruction: DESIGN_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: designSchema
      }
    });

    if (!designResp.text) throw new Error("Failed to generate design JSON");
    design = JSON.parse(designResp.text) as DocumentDesign;
    
    // Notify UI about design ready
    if (onProgress) onProgress('design', design);

  } catch (e) {
    console.error("Design Generation Error", e);
    throw new Error("Design generation failed.");
  }

  // 2. Batch Process Content
  const chunks = splitTextIntoChunks(fullContent, CHUNK_SIZE);
  let finalContent = "";
  let previousContext = "";

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const isFirstChunk = i === 0;

    const rewritePrompt = `
      STYLE REQUEST: ${stylePrompt}
      PREVIOUS CONTEXT (End of last segment): "${previousContext.slice(-300)}"
      IS START OF DOCUMENT: ${isFirstChunk}
      
      TEXT SEGMENT TO REWRITE:
      ${chunk}
    `;

    try {
      const contentResp = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: rewritePrompt,
        config: {
          systemInstruction: CONTENT_SYSTEM_INSTRUCTION,
          // No JSON schema here, we want raw Markdown text
        }
      });

      const enhancedSegment = contentResp.text || chunk; // Fallback to original if fail
      
      // Accumulate
      finalContent += enhancedSegment + "\n\n";
      previousContext = enhancedSegment;

      // Notify UI about partial content update
      if (onProgress) onProgress('content', finalContent);

    } catch (e) {
      console.error(`Chunk ${i} processing error`, e);
      finalContent += chunk + "\n\n"; // Fallback
      if (onProgress) onProgress('content', finalContent);
    }
  }

  return { design, content: finalContent };
};