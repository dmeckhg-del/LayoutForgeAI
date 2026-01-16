import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { DocumentDesign } from '../types';

interface LayoutRendererProps {
  data: DocumentDesign;
  content: string; // The raw markdown
  previewMode: 'desktop' | 'mobile';
}

export const LayoutRenderer: React.FC<LayoutRendererProps> = ({ data, content, previewMode }) => {
  // Container width adjustment for mobile preview simulation
  const wrapperClass = previewMode === 'mobile' 
    ? 'w-[375px] min-h-[667px] mx-auto border-x-8 border-t-8 border-b-8 border-slate-800 rounded-[3rem] overflow-hidden bg-black shadow-2xl my-8 shrink-0'
    : 'w-full min-h-screen';

  // The inner container needs to handle scrolling if it's mobile mode
  const scrollContainerClass = previewMode === 'mobile'
    ? 'w-full h-full overflow-y-auto bg-white' // Mobile inner scroll
    : 'w-full h-full'; 

  const isCard = data.layoutType === 'card';
  const isMultiCard = data.layoutType === 'multi-card';

  // Split content logic for multi-card
  const contentSections = useMemo(() => {
    if (!isMultiCard) return [content];
    // Split content by H1 (#) or H2 (##) at the start of a line
    const sections = content.split(/(?=^#{1,2}\s)/gm).filter(s => s.trim().length > 0);
    return sections.length > 0 ? sections : [content];
  }, [content, isMultiCard]);

  // Layout Styles
  const layoutWrapperStyles = (isCard || isMultiCard)
    ? `${data.pageBackground} flex flex-col items-center py-8 md:py-16`
    : `${data.pageBackground} flex flex-col items-center`;

  // Grid container for multi-card vs Single container for card/flat
  const outerContainerWidth = isMultiCard ? 'max-w-6xl w-full px-4' : data.containerMaxWidth;
  
  // Styles applied to the actual content box(es)
  const cardBaseStyles = `${data.containerBackground} ${data.containerShadow} ${data.containerPadding} ${data.containerBorderRadius}`;
  const flatBaseStyles = `${data.containerBackground} ${data.containerPadding} min-h-screen shadow-none rounded-none`;
  
  const contentBoxStyles = isMultiCard 
    ? cardBaseStyles 
    : (isCard ? `w-full ${cardBaseStyles}` : `w-full ${flatBaseStyles}`);

  // Markdown Components Config
  // We add 'layout-block' class to help the exporter identify slice boundaries
  const mdComponents = {
    h1: ({node, ...props}: any) => <h1 className={`layout-block ${data.titleSize} ${data.heading1}`} {...props} />,
    h2: ({node, ...props}: any) => <h2 className={`layout-block ${data.heading2}`} {...props} />,
    h3: ({node, ...props}: any) => <h3 className={`layout-block text-xl font-bold mt-8 mb-4 opacity-90`} {...props} />,
    p: ({node, ...props}: any) => <p className={`layout-block ${data.paragraph}`} {...props} />,
    blockquote: ({node, ...props}: any) => <blockquote className={`layout-block ${data.blockquote}`} {...props} />,
    ul: ({node, ...props}: any) => <ul className={`layout-block list-disc list-inside mb-6 space-y-2 opacity-90 pl-2`} {...props} />,
    ol: ({node, ...props}: any) => <ol className={`layout-block list-decimal list-inside mb-6 space-y-2 opacity-90 pl-2`} {...props} />,
    li: ({node, ...props}: any) => <li className="" {...props} />, // li is usually inside ul/ol, so no layout-block needed
    strong: ({node, ...props}: any) => <strong style={{ color: data.highlightColor }} className="font-bold" {...props} />,
    hr: ({node, ...props}: any) => <hr className={`layout-block ${data.dividerStyle}`} {...props} />,
    a: ({node, ...props}: any) => <a className="underline decoration-2 underline-offset-2 hover:opacity-80 transition" style={{ color: data.highlightColor, textDecorationColor: data.highlightColor }} {...props} />,
    code: ({node, ...props}: any) => <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-sm font-mono text-pink-500" {...props} />,
    pre: ({node, ...props}: any) => <pre className={`layout-block bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto my-6 text-sm font-mono leading-relaxed`} {...props} />,
  };

  return (
    <div className={`transition-all duration-500 ease-in-out flex flex-col items-center justify-start`}>
        
        {/* The Frame */}
        <div className={wrapperClass}>
            
            {/* The Scroll Area */}
            <div 
                id="layout-preview-content"
                className={`${scrollContainerClass} ${layoutWrapperStyles} transition-colors duration-500`}
            >
                {/* Header Metadata */}
                <div className={`${outerContainerWidth} mb-8 opacity-40 px-4 flex justify-between text-xs font-mono uppercase tracking-widest mix-blend-multiply dark:mix-blend-screen`}>
                    <span>{data.themeName}</span>
                    <span className="flex items-center gap-2">
                        {data.layoutType?.toUpperCase()}
                    </span>
                </div>

                {/* Content Area */}
                <div className={`
                    ${outerContainerWidth}
                    ${isMultiCard && previewMode !== 'mobile' ? 'grid grid-cols-1 md:grid-cols-2 gap-6 items-start' : 'flex flex-col gap-6'}
                    ${data.fontFamily}
                    ${data.textColor}
                `}>
                    {contentSections.map((sectionContent, index) => (
                        <div 
                            key={index}
                            className={`
                                layout-card
                                ${contentBoxStyles}
                                transition-all duration-500
                                ${isMultiCard ? 'h-full' : ''} 
                            `}
                        >
                             <article id="markdown-article" className={`${data.baseFontSize} ${data.lineHeight}`}>
                                <ReactMarkdown components={mdComponents}>
                                    {sectionContent}
                                </ReactMarkdown>
                             </article>
                        </div>
                    ))}
                </div>
                
                {/* Footer Flourish */}
                <div className="mt-16 pb-8 border-t border-current opacity-20 w-1/3 flex justify-center text-xs font-mono mx-auto">
                    ***
                </div>
            </div>
        </div>
    </div>
  );
};