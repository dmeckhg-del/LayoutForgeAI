import { DocumentDesign, AIConfig } from "../types";
import { generateContent, generateStream } from "./aiEngine";
import { replaceTailwindWithInline } from "./tailwindConverter";
  

const WECHAT_LAYOUT_SYSTEM_PROMPT = `
You are a WeChat article layout converter.

Your job:

* Take ONE text segment (from a Markdown document) and wrap it into a single WeChat-compatible HTML "card".

Constraints:

1. Output MUST be valid HTML.
2. Output MUST contain exactly ONE top-level <section> wrapper representing a single card.
3. Use ONLY Tailwind CSS classes in the class attribute.
4. Do NOT include inline styles in style attributes.
5. Do NOT include <html>, <head>, or <body>. Produce only the card snippet.
6. Do NOT add explanatory text, comments, or prose outside of HTML.

Layout rules (very important):

* Use nested <section> and <p> elements similar to WeChat rich text.
* Card structure:

  * Outer <section> with Tailwind classes: max-w-full mt-2.5 mb-5.
  * Inside, a flex row: left decorative bar, main content, optional right bar (use flex classes).
  * Main content container:

    * padding: 12px 0
    * background-color: {HIGHLIGHT_COLOR}
    * flex: 100 100 0%
    * overflow: hidden

Text styling:

* Wrap text in <p><span>...</span></p> blocks.
* Use Tailwind classes: whitespace-normal m-0 p-0 on <p> tags.

Content rules:

* Preserve the original meaning and language (do NOT translate).
* Convert basic Markdown constructs:

  * Headings (#, ##) -> visually emphasized phrases inside the card (use bold or margin classes).
  * Lists -> paragraphs with bullet points (use Tailwind spacing classes).
* Do NOT invent extra content.

IMPORTANT: Use ONLY Tailwind CSS utility classes. The style conversion will be handled automatically by the system.

---
Document Design Field Descriptions:

DocumentDesign Schema:
- id: Unique identifier for the design
- themeName: Display name of the theme (e.g. "Modern Dark", "Classic Serif")

Layout Structure:
- layoutType: 'card' = floating paper style, 'flat' = seamless style, 'multi-card' = grid/bento layout

Container Styles:
- pageBackground: Tailwind class for page background color (e.g. "bg-slate-100")
- containerBackground: Tailwind class for container background (e.g. "bg-white")
- containerShadow: Tailwind class for shadow effect (e.g. "shadow-xl")
- containerMaxWidth: Tailwind class for maximum width (e.g. "max-w-3xl")
- containerPadding: Tailwind class for padding (e.g. "p-8 md:p-12")
- containerBorderRadius: Tailwind class for rounded corners (e.g. "rounded-xl")

Typography:
- fontFamily: Tailwind class for font family (e.g. "font-serif", "font-sans")
- baseFontSize: Tailwind class for base text size (e.g. "text-lg")
- lineHeight: Tailwind class for line height (e.g. "leading-relaxed")
- textColor: Tailwind class for text color (e.g. "text-slate-800")

Elements:
- titleSize: Tailwind class for H1 size (e.g. "text-4xl md:text-6xl")
- heading1: Tailwind classes for H1 styling - Color, Weight, Alignment, Spacing (NO SIZE)
- heading2: Tailwind classes for H2 styling
- paragraph: Tailwind classes for paragraph styling
- blockquote: Tailwind classes for blockquote styling
- highlightColor: Hex code for dynamic inline styles and decorative elements

Decorative:
- dividerStyle: Tailwind class for horizontal rule styling

---
Current Design Configuration:
{DESIGN_CONTEXT}
`;

const WECHAT_WRAPPER_SYSTEM_PROMPT = `
You are an expert WeChat HTML/CSS Layout Engineer.
Your task is to generate the OUTER CONTAINER HTML structure for a WeChat article based on a provided "DocumentDesign" JSON.

Input:
- Design JSON (contains Tailwind classes for page background, container styling, fonts, etc.).

Output:
- A single HTML snippet representing the PAGE WRAPPER.
- Use ONLY Tailwind CSS classes in the class attribute.
- Do NOT use inline styles (style attributes).
- Do NOT include <html>, <head>, <body> tags.
- Structure:
  <section id="wechat-wrapper" class="... (Page Background Tailwind classes) ...">
     <section id="wechat-container" class="... (Container Background, Shadow, Padding, Radius, Layout Tailwind classes) ...">
        <!-- Header Metadata (Theme Name) -->
        <section class="opacity-50 text-xs mb-5 text-center font-sans tracking-widest">
           {THEME_NAME}
        </section>
        
        <!-- THE CONTENT PLACEHOLDER -->
        {{CONTENT}}
        
        <!-- Footer Flourish -->
        <section class="text-center mt-10 opacity-30 text-xs">***</section>
     </section>
  </section>

IMPORTANT:
- If layoutType is 'flat', remove shadows/radius from the container and make it blend with the page.
- Ensure the wrapper has min-h-screen (or equivalent) to look like a full page.
- Use ONLY Tailwind CSS utility classes. The style conversion to inline CSS will be handled automatically by the system.
- Return ONLY the HTML string with {{CONTENT}} inside.

---
Document Design Field Descriptions:

DocumentDesign Schema:
- id: Unique identifier for the design
- themeName: Display name of the theme (e.g. "Modern Dark", "Classic Serif")

Layout Structure:
- layoutType: 'card' = floating paper style with shadows, 'flat' = seamless background blend, 'multi-card' = grid/bento layout

Container Styles:
- pageBackground: Tailwind class for page background color (e.g. "bg-slate-100")
- containerBackground: Tailwind class for main content container background (e.g. "bg-white")
- containerShadow: Tailwind class for shadow/depth effect (e.g. "shadow-xl", "shadow-lg", "shadow-none")
- containerMaxWidth: Tailwind class for content width (e.g. "max-w-2xl", "max-w-3xl", "max-w-4xl")
- containerPadding: Tailwind class for internal spacing (e.g. "p-8 md:p-12", "p-6 md:p-10")
- containerBorderRadius: Tailwind class for rounded corners (e.g. "rounded-xl", "rounded-none", "rounded-2xl")

Typography:
- fontFamily: Tailwind class for text font family (e.g. "font-serif", "font-sans", "font-mono")
- baseFontSize: Tailwind class for default text size (e.g. "text-base", "text-lg", "text-xl")
- lineHeight: Tailwind class for text line height (e.g. "leading-relaxed", "leading-normal", "leading-loose")
- textColor: Tailwind class for main text color (e.g. "text-slate-700", "text-gray-800", "text-slate-900")

Elements:
- titleSize: Tailwind class for main title/H1 size (e.g. "text-4xl md:text-6xl", "text-5xl")
- heading1: Tailwind classes for H1 styling - includes Color, Weight, Alignment, Spacing but NOT size (e.g. "font-bold text-slate-900 mb-8 tracking-tight")
- heading2: Tailwind classes for H2 styling (e.g. "text-2xl font-semibold text-slate-800 mt-10 mb-4")
- paragraph: Tailwind classes for paragraph spacing and style (e.g. "mb-6", "mb-4")
- blockquote: Tailwind classes for quoted text blocks (e.g. "italic text-slate-600 border-l-4 border-slate-300 pl-4 py-2")
- highlightColor: Hex color code for decorative elements, accents, and inline styles (e.g. "#6366f1", "#10b981")

Decorative:
- dividerStyle: Tailwind class for horizontal rule separator styling (e.g. "my-12 border-slate-200", "my-8 border-gray-300")

---
Current Design Configuration:
{DESIGN_CONTEXT}
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
  const designContext = JSON.stringify(design, null, 2);
  const systemInstruction = WECHAT_WRAPPER_SYSTEM_PROMPT
    .replace('{DESIGN_CONTEXT}', designContext)
    .replace('{THEME_NAME}', design.themeName || 'Unknown Theme');

  let wrapperHtml = "";

  try {
    wrapperHtml = await generateContent(config, {
        prompt: `Generate WeChat Wrapper HTML using the design context provided in the system message.`,
        systemInstruction: systemInstruction,
        jsonMode: false
    });
  } catch (error: any) {
    console.error("Wrapper Gen Error:", error);
    wrapperHtml = `<section class="p-5">{{CONTENT}}</section>`;
  }
  
  if (!wrapperHtml) wrapperHtml = `<section class="p-5">{{CONTENT}}</section>`;
  
  wrapperHtml = wrapperHtml.replace(/```html/g, '').replace(/```/g, '').trim();
  
  if (!wrapperHtml.includes('{{CONTENT}}')) {
      const lastCloseIndex = wrapperHtml.lastIndexOf('</');
      if (lastCloseIndex > -1) {
          wrapperHtml = wrapperHtml.substring(0, lastCloseIndex) + "\n{{CONTENT}}\n" + wrapperHtml.substring(lastCloseIndex);
      } else {
          wrapperHtml += "\n{{CONTENT}}";
      }
  }
  
  wrapperHtml = replaceTailwindWithInline(wrapperHtml);
  
  return wrapperHtml;
}

export async function* streamWeChatCardHtml(
  config: AIConfig,
  design: DocumentDesign,
  blockText: string,
  index: number,
  total: number
): AsyncGenerator<string> {
  const designContext = JSON.stringify(design, null, 2);
  const systemPrompt = WECHAT_LAYOUT_SYSTEM_PROMPT
    .replace(/\{HIGHLIGHT_COLOR\}/g, design.highlightColor || '#6366f1')
    .replace('{DESIGN_CONTEXT}', designContext)
    .replace('{THEME_NAME}', design.themeName || 'Unknown Theme');
  
  const userPrompt = `
You are converting one content segment of a Markdown document into a single WeChat card.

Context:
- Card index: ${index} of ${total}
- Theme: ${design.themeName}
- Highlight color (for borders and decorative bars): ${design.highlightColor}
- Layout type: ${design.layoutType}

Input segment (Markdown, raw):
---
${blockText}
---

Task:
1. Convert this SINGLE segment into ONE WeChat card HTML snippet.
2. Use the design context provided in the system message for styling consistency.
3. Follow ALL layout rules from the system message.
4. Return ONLY the HTML snippet for this one card.
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
  design: DocumentDesign,
  markdown: string,
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

    for await (const token of streamWeChatCardHtml(config, design, block, i + 1, total)) {
      cardHtml += token;
      if (onCardToken) onCardToken(i, cardHtml);
    }

    cardHtml = cardHtml.replace(/```html/g, '').replace(/```/g, '').trim();
    cardHtml = replaceTailwindWithInline(cardHtml);
    
    cardHtmlSnippets.push(cardHtml);
    if (onCardComplete) onCardComplete(i, cardHtml);
  }

  return cardHtmlSnippets.join('\n');
}
