import { DocumentDesign, AIConfig } from "../types";
import { generateContent, generateStream } from "./aiEngine";

const WECHAT_LAYOUT_SYSTEM_PROMPT = `
You are a WeChat article layout converter.

Your job:

* Take ONE text segment (from a Markdown document) and wrap it into a single WeChat-compatible HTML "card".

Constraints:

1. Output MUST be valid HTML.
2. Output MUST contain exactly ONE top-level <section> wrapper representing a single card.
3. Use ONLY inline CSS styles; no external stylesheets or <style> tags.
4. Do NOT include <html>, <head>, or <body>. Produce only the card snippet.
5. Do NOT add explanatory text, comments, or prose outside of HTML.

Layout rules (very important):

* Use nested <section> and <p> elements similar to WeChat rich text.
* Card structure:

  * Outer <section> with max-width: 100%, margin-top: 10px, margin-bottom: 20px.
  * Inside, a flex row: left decorative bar, main content, optional right bar.
  * Main content container:

    * border-radius: 12px
    * padding: 12px 0
    * background-color: #fdfdfd
    * flex: 100 100 0%
    * overflow: hidden

Left/Right decorative bars:

* Narrow vertical rectangles:

  * width: 6px
  * height: 75px
  * background-color: {HIGHLIGHT_COLOR}
  * Use <section> wrappers like typical WeChat export HTML.
  * vertical-align: top

Text styling:

* Wrap text in <p><span>...</span></p> blocks.
* Use:

  * font-size: 15px;
  * line-height: 2;
  * font-family: PingFangSC-light, -apple-system, BlinkMacSystemFont, "Helvetica Neue", "Microsoft YaHei", Arial, sans-serif;
  * text-align: justify
  * padding: 0 16px
* Use "white-space: normal; margin: 0; padding: 0;" on <p> tags.

Content rules:

* Preserve the original meaning and language (do NOT translate).
* Convert basic Markdown constructs:

  * Headings (#, ##) -> visually emphasized phrases inside the card (e.g. bold span or separate p with margin).
  * Lists -> paragraphs with bullet points.
* Do NOT invent extra content.
`;

const WECHAT_WRAPPER_SYSTEM_PROMPT = `
You are an expert WeChat HTML/CSS Layout Engineer.
Your task is to generate the OUTER CONTAINER HTML structure for a WeChat article based on a provided "DocumentDesign" JSON.

Input:
- Design JSON (contains Tailwind classes for page background, container styling, fonts, etc.).

Output:
- A single HTML snippet representing the PAGE WRAPPER.
- Use INLINE CSS exclusively (style="...").
- Do NOT include <html>, <head>, <body> tags.
- Structure:
  <section id="wechat-wrapper" style="... (Page Background styles) ...">
     <section id="wechat-container" style="... (Container Background, Shadow, Padding, Radius, Layout settings) ...">
        <!-- Header Metadata (Theme Name) -->
        <section style="opacity:0.5; font-size:12px; margin-bottom:20px; text-align:center; font-family:sans-serif; letter-spacing: 1px;">
           {THEME_NAME}
        </section>
        
        <!-- THE CONTENT PLACEHOLDER -->
        {{CONTENT}}
        
        <!-- Footer Flourish -->
        <section style="text-align:center; margin-top:40px; opacity:0.3; font-size: 12px;">***</section>
     </section>
  </section>

Translation Rules (Tailwind -> Inline CSS):
- bg-slate-100 -> background-color: #f1f5f9;
- bg-white -> background-color: #ffffff;
- shadow-xl -> box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1);
- p-8 -> padding: 32px;
- rounded-xl -> border-radius: 12px;
- max-w-2xl -> max-width: 672px; margin: 0 auto;

IMPORTANT:
- If layoutType is 'flat', remove shadows/radius from the container and make it blend with the page.
- Ensure the wrapper has min-height: 100vh (or equivalent) to look like a full page.
- Return ONLY the HTML string with {{CONTENT}} inside.
`;

export function splitMarkdownIntoBlocks(md: string): string[] {
  if (!md) return [];
  const normalized = md.replace(/\r\n/g, '\n');
  return normalized
    .split(/\n\s*\n/g)
    .map(block => block.trim())
    .filter(block => block.length > 0);
}

export async function generateWeChatWrapper(
  config: AIConfig,
  design: DocumentDesign
): Promise<string> {
  const userPrompt = `
    Generate WeChat Wrapper HTML for this design:
    ${JSON.stringify(design, null, 2)}
  `;

  let wrapperHtml = "";

  try {
    wrapperHtml = await generateContent(config, {
        prompt: userPrompt,
        systemInstruction: WECHAT_WRAPPER_SYSTEM_PROMPT,
        jsonMode: false
    });
  } catch (error: any) {
    console.error("Wrapper Gen Error:", error);
    wrapperHtml = `<section style="padding: 20px;">{{CONTENT}}</section>`;
  }
  
  if (!wrapperHtml) wrapperHtml = `<section style="padding: 20px;">{{CONTENT}}</section>`;
  
  wrapperHtml = wrapperHtml.replace(/```html/g, '').replace(/```/g, '').trim();
  
  if (!wrapperHtml.includes('{{CONTENT}}')) {
      const lastCloseIndex = wrapperHtml.lastIndexOf('</');
      if (lastCloseIndex > -1) {
          wrapperHtml = wrapperHtml.substring(0, lastCloseIndex) + "\n{{CONTENT}}\n" + wrapperHtml.substring(lastCloseIndex);
      } else {
          wrapperHtml += "\n{{CONTENT}}";
      }
  }
  
  return wrapperHtml;
}

export async function* streamWeChatCardHtml(
  config: AIConfig,
  highlightColor: string,
  blockText: string,
  index: number,
  total: number
): AsyncGenerator<string> {
  const systemPrompt = WECHAT_LAYOUT_SYSTEM_PROMPT.replace(/\{HIGHLIGHT_COLOR\}/g, highlightColor || '#6366f1');
  
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

  // Use generic streaming engine
  const stream = generateStream(config, {
      prompt: userPrompt,
      systemInstruction: systemPrompt
  });

  for await (const chunk of stream) {
      yield chunk;
  }
}

export async function streamWeChatArticleFromMarkdown(
  config: AIConfig,
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
