import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { DocumentDesign } from '../types';

interface WechatLayoutRendererProps {
  data: DocumentDesign;
  content: string;
  previewMode: 'desktop' | 'mobile';
}

export const WechatLayoutRenderer: React.FC<WechatLayoutRendererProps> = ({ data, content, previewMode }) => {
  const isCard = data.layoutType === 'card';
  const isMultiCard = data.layoutType === 'multi-card';

  const contentSections = useMemo(() => {
    if (!isMultiCard) return [content];
    const sections = content.split(/(?=^#{1,2}\s)/gm).filter(s => s.trim().length > 0);
    return sections.length > 0 ? sections : [content];
  }, [content, isMultiCard]);

  const outerContainerWidth = isMultiCard ? 'max-w-full' : data.containerMaxWidth;
  
  const mdComponents = {
    h1: ({node, ...props}: any) => (
      <section className="max-w-full mt-2.5 mb-5">
        <p className="whitespace-normal m-0 p-0">
          <span className={`text-2xl font-bold ${data.textColor}`} style={{ display: 'block', marginBottom: '12px' }} {...props} />
        </p>
      </section>
    ),
    h2: ({node, ...props}: any) => (
      <section className="max-w-full mt-2.5 mb-5">
        <p className="whitespace-normal m-0 p-0">
          <span className={`text-xl font-semibold ${data.textColor}`} style={{ display: 'block', marginBottom: '10px', borderLeft: `4px solid ${data.highlightColor}`, paddingLeft: '12px' }} {...props} />
        </p>
      </section>
    ),
    h3: ({node, ...props}: any) => (
      <section className="max-w-full mt-2.5 mb-5">
        <p className="whitespace-normal m-0 p-0">
          <span className={`text-lg font-semibold ${data.textColor}`} style={{ display: 'block', marginBottom: '8px' }} {...props} />
        </p>
      </section>
    ),
    p: ({node, ...props}: any) => (
      <section className="max-w-full mt-2.5 mb-5">
        <p className="whitespace-normal m-0 p-0">
          <span className={data.paragraph} style={{ display: 'block' }} {...props} />
        </p>
      </section>
    ),
    blockquote: ({node, ...props}: any) => (
      <section className="max-w-full mt-2.5 mb-5">
        <p className="whitespace-normal m-0 p-0">
          <span className={data.blockquote} style={{ display: 'block', borderLeft: `4px solid ${data.highlightColor}`, paddingLeft: '12px', background: 'rgb(248, 250, 252)' }} {...props} />
        </p>
      </section>
    ),
    ul: ({node, ...props}: any) => (
      <section className="max-w-full mt-2.5 mb-5">
        <p className="whitespace-normal m-0 p-0">
          <ul className="pl-4" style={{ listStyleType: 'disc', paddingLeft: '20px', display: 'block' }} {...props} />
        </p>
      </section>
    ),
    ol: ({node, ...props}: any) => (
      <section className="max-w-full mt-2.5 mb-5">
        <p className="whitespace-normal m-0 p-0">
          <ol className="pl-4" style={{ listStyleType: 'decimal', paddingLeft: '20px', display: 'block' }} {...props} />
        </p>
      </section>
    ),
    li: ({node, ...props}: any) => <li style={{ marginBottom: '6px' }} {...props} />,
    strong: ({node, ...props}: any) => <strong style={{ color: data.highlightColor }} className="font-bold" {...props} />,
    hr: ({node, ...props}: any) => (
      <section className="max-w-full mt-2.5 mb-5">
        <p className="whitespace-normal m-0 p-0">
          <hr style={{ border: 'none', borderTop: `1px solid ${data.highlightColor}`, opacity: '0.3', margin: '20px 0' }} {...props} />
        </p>
      </section>
    ),
    a: ({node, ...props}: any) => (
      <a style={{ color: data.highlightColor, textDecoration: 'underline' }} {...props} />
    ),
    code: ({node, ...props}: any) => <code style={{ backgroundColor: 'rgb(241, 245, 249)', padding: '2px 6px', borderRadius: '4px', fontSize: '14px', fontFamily: 'monospace', color: '#db2777' }} {...props} />,
    pre: ({node, ...props}: any) => (
      <section className="max-w-full mt-2.5 mb-5">
        <p className="whitespace-normal m-0 p-0">
          <pre style={{ backgroundColor: 'rgb(15, 23, 42)', color: 'rgb(241, 245, 249)', padding: '16px', borderRadius: '8px', overflowX: 'auto', fontSize: '14px', fontFamily: 'monospace', lineHeight: '1.6' }} {...props} />
        </p>
      </section>
    ),
  };

  const getContainerStyles = () => {
    if (data.layoutType === 'flat') {
      return {
        background: 'transparent',
        boxShadow: 'none',
        borderRadius: '0',
        padding: '12px 0'
      };
    }
    return {
      background: 'white',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      borderRadius: data.layoutType === 'multi-card' ? '8px' : '0',
      padding: isMultiCard ? '12px' : '12px 0'
    };
  };

  return (
    <div className={`transition-all duration-500 ease-in-out flex flex-col items-center justify-start ${previewMode === 'mobile' ? 'w-[375px] min-h-[667px] mx-auto border-x-8 border-t-8 border-b-8 border-slate-800 rounded-[3rem] overflow-hidden bg-black shadow-2xl my-8 shrink-0' : 'w-full min-h-screen'}`}>
      <div className={previewMode === 'mobile' ? 'w-full h-full overflow-y-auto bg-white' : 'w-full h-full'}>
        <section id="wechat-wrapper" className={`${data.pageBackground} flex flex-col items-center py-8 md:py-16`}>
          <section 
            id="wechat-container" 
            className={`${outerContainerWidth}`}
            style={{ 
              width: '100%',
              ...getContainerStyles()
            }}
          >
            <section className="opacity-50 text-xs mb-5 text-center font-sans tracking-widest" style={{ color: 'inherit' }}>
              {data.themeName}
            </section>

            <div className={`flex flex-col gap-6 ${data.fontFamily} ${data.textColor}`}>
              {contentSections.map((sectionContent, index) => (
                <section
                  key={index}
                  className="max-w-full"
                  style={{ marginTop: index > 0 ? '10px' : '0' }}
                >
                  <article id="markdown-article" className={`${data.baseFontSize} ${data.lineHeight}`}>
                    <ReactMarkdown components={mdComponents}>
                      {sectionContent}
                    </ReactMarkdown>
                  </article>
                </section>
              ))}
            </div>

            <section className="text-center mt-10 opacity-30 text-xs" style={{ color: 'inherit' }}>
              ***
            </section>
          </section>
        </section>
      </div>
    </div>
  );
};
