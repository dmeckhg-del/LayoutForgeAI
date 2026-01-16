
import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";
import { OpenAIConfig } from "./openaiService";
import { ServiceProvider } from "../types";

const WECHAT_LAYOUT_SYSTEM_PROMPT = `
You are a WeChat article layout converter.

Your job:
- Take ONE text segment (from a Markdown document) and wrap it into a single WeChat-compatible HTML "card".

Constraints:
1. Output MUST be valid HTML.
2. Output MUST contain exactly ONE top-level <section> wrapper representing a single card.
3. Use ONLY inline CSS styles; no external stylesheets or <style> tags.
4. Do NOT include <html>, <head>, or <body>. Produce only the card snippet.
5. Do NOT add explanatory text, comments, or prose outside of HTML.

Layout rules (very important):
- Use nested <section> and <p> elements similar to WeChat rich text.
- Card structure:
  - Outer <section> with max-width: 100%, margin-top: 10px, margin-bottom: 20px.
  - Inside, a flex row: left decorative bar, main content, optional right bar.
  - Main content container:
    - border-width: 1px
    - border-style: solid
    - border-color: {HIGHLIGHT_COLOR}
    - border-radius: 12px
    - padding: 12px 0
    - background-color: #fdfdfd
    - flex: 100 100 0%
    - overflow: hidden
  
Left/Right decorative bars:
- Narrow vertical rectangles:
  - width: 6px
  - height: 75px
  - background-color: {HIGHLIGHT_COLOR}
  - Use <section> wrappers like typical WeChat export HTML.
  - vertical-align: top
  
Text styling:
- Wrap text in <p><span>...</span></p> blocks.
- Use:
  - font-size: 15px;
  - line-height: 2;
  - font-family: PingFangSC-light, -apple-system, BlinkMacSystemFont, "Helvetica Neue", "Microsoft YaHei", Arial, sans-serif;
  - text-align: justify
  - padding: 0 16px
- Use "white-space: normal; margin: 0; padding: 0;" on <p> tags.

Content rules:
- Preserve the original meaning and language (do NOT translate).
- Convert basic Markdown constructs:
  - Headings (#, ##) -> visually emphasized phrases inside the card (e.g. bold span or separate p with margin).
  - Lists -> paragraphs with bullet points.
- Do NOT invent extra content.
`;

export interface ExportAIConfig {
  provider: ServiceProvider;
  openai?: OpenAIConfig;
  geminiApiKey?: string;
}

export function splitMarkdownIntoBlocks(md: string): string[] {
  // Normalize line endings
  const normalized = md.replace(/\r\n/g, '\n');
  // Split by double line breaks (paragraphs)
  return normalized
    .split(/\n\s*\n/g)
    .map(block => block.trim())
    .filter(block => block.length > 0);
}

export async function* streamWeChatCardHtml(
  config: ExportAIConfig,
  highlightColor: string,
  blockText: string,
  index: number,
  total: number
): AsyncGenerator<string> {
  const systemPrompt = WECHAT_LAYOUT_SYSTEM_PROMPT.replace(/\{HIGHLIGHT_COLOR\}/g, highlightColor);
  
  const userPrompt = `
You are converting one content segment of a Markdown document into a single WeChat card.

Context:
- Card index: ${index} of ${total}
- Highlight color (for borders and decorative bars): ${highlightColor}

Input segment (Markdown, raw):
---
${blockText}
---

Task:
1. Convert this SINGLE segment into ONE WeChat card HTML snippet.
2. Follow ALL layout rules from the system message.
3. Return ONLY the HTML snippet for this one card.
`;

  if (config.provider === 'openai' && config.openai) {
    const client = new OpenAI({
      apiKey: config.openai.apiKey,
      baseURL: config.openai.baseUrl || 'https://api.openai.com/v1',
      dangerouslyAllowBrowser: true,
    });

    const stream = await client.chat.completions.create({
      model: config.openai.model,
      stream: true,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) {
        yield delta;
      }
    }
  } else if (config.provider === 'gemini') {
      const apiKey = config.geminiApiKey;
      if (!apiKey) throw new Error("Gemini API Key is missing. Please check your environment variables.");

      const ai = new GoogleGenAI({ apiKey });
      
      try {
          const responseStream = await ai.models.generateContentStream({
            model: 'gemini-3-flash-preview',
            contents: userPrompt,
            config: {
                systemInstruction: systemPrompt,
            }
          });

          for await (const chunk of responseStream) {
              const text = chunk.text;
              if (text) {
                  yield text;
              }
          }
      } catch (error: any) {
          console.error("Gemini API Error during export:", error);
          throw new Error(`Gemini Export Error: ${error.message}`);
      }
  } else {
      throw new Error(`Unsupported provider: ${config.provider}`);
  }
}

export async function streamWeChatArticleFromMarkdown(
  config: ExportAIConfig,
  markdown: string,
  highlightColor: string,
  onCardStart?: (index: number, total: number) => void,
  onCardToken?: (index: number, partialHtml: string) => void,
  onCardComplete?: (index: number, fullHtml: string) => void
): Promise<string> {
  const blocks = splitMarkdownIntoBlocks(markdown);
  const total = blocks.length;
  const cardHtmlSnippets: string[] = [];

  for (let i = 0; i < total; i++) {
    const block = blocks[i];
    let cardHtml = '';

    if (onCardStart) onCardStart(i, total);

    for await (const token of streamWeChatCardHtml(config, highlightColor, block, i + 1, total)) {
      cardHtml += token;
      if (onCardToken) onCardToken(i, cardHtml);
    }

    cardHtmlSnippets.push(cardHtml);
    if (onCardComplete) onCardComplete(i, cardHtml);
  }

  return cardHtmlSnippets.join('\n');
}
