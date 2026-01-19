import { tws } from 'tailwind-to-style';

export function convertTailwindToInline(tailwindClasses: string): string {
  if (!tailwindClasses || !tailwindClasses.trim()) {
    return '';
  }

  try {
    const styles = tws(tailwindClasses, true) as Record<string, string>;
    const styleString = Object.entries(styles)
      .map(([key, value]) => `${key}: ${value};`)
      .join(' ');
    return styleString;
  } catch (error) {
    console.error('Tailwind conversion error:', error);
    return '';
  }
}

export function extractTailwindClasses(styleString: string): string[] {
  const classPattern = /class=["']([^"']+)["']/gi;
  const matches = [];
  let match;
  
  while ((match = classPattern.exec(styleString)) !== null) {
    matches.push(match[1]);
  }
  
  return matches;
}

export function replaceTailwindWithInline(html: string): string {
  return html.replace(/class=["']([^"']+)["']/gi, (match, classes) => {
    const inlineStyle = convertTailwindToInline(classes);
    return inlineStyle ? `style="${inlineStyle}"` : '';
  });
}
