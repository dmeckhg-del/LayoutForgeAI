import React from 'react';
import { LayoutRenderer } from './LayoutRenderer';
import { WechatLayoutRenderer } from './WechatLayoutRenderer';
import { ExportToolbar } from './ExportToolbar';
import { 
  useDesignData,
  useMarkdownContent,
  usePreviewMode,
  usePreviewType
} from '../store';

export const PreviewPanel: React.FC = () => {
  const designData = useDesignData();
  const markdownContent = useMarkdownContent();
  const previewMode = usePreviewMode();
  const previewType = usePreviewType();

  return (
    <main className="flex-1 bg-slate-200 flex flex-col min-w-[350px] relative transition-all">
      
      <ExportToolbar />

      <div className="flex-1 overflow-y-auto relative bg-slate-200/50 flex flex-col">
         {previewType === 'wechat' ? (
           <WechatLayoutRenderer data={designData} content={markdownContent} previewMode={previewMode} />
         ) : (
           <LayoutRenderer data={designData} content={markdownContent} previewMode={previewMode} />
         )}
      </div>
    </main>
  );
};
