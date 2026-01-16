
import React from 'react';
import { LayoutRenderer } from './LayoutRenderer';
import { ExportToolbar } from './ExportToolbar';
import { DocumentDesign, Language, ServiceProvider } from '../types';
import { OpenAIConfig } from '../services/openaiService';

interface PreviewPanelProps {
  designData: DocumentDesign;
  markdownContent: string;
  previewMode: 'desktop' | 'mobile';
  setPreviewMode: (mode: 'desktop' | 'mobile') => void;
  lang: Language;
  t: any;
  provider: ServiceProvider;
  openaiConfig: OpenAIConfig;
}

export const PreviewPanel: React.FC<PreviewPanelProps> = ({
  designData,
  markdownContent,
  previewMode,
  setPreviewMode,
  t,
  provider,
  openaiConfig
}) => {
  return (
    <main className="flex-1 bg-slate-200 flex flex-col min-w-[350px] relative transition-all">
      
      {/* Replaced old Toolbar with new dedicated Component */}
      <ExportToolbar 
        designData={designData}
        previewMode={previewMode}
        setPreviewMode={setPreviewMode}
        t={t}
        markdownContent={markdownContent}
        provider={provider}
        openaiConfig={openaiConfig}
      />

      {/* Canvas */}
      <div className="flex-1 overflow-y-auto relative bg-slate-200/50 flex flex-col">
         <LayoutRenderer data={designData} content={markdownContent} previewMode={previewMode} />
      </div>
    </main>
  );
};
