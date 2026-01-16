
import React, { useState } from 'react';
import { DocumentDesign, INITIAL_DESIGN, Language, ServiceProvider } from './types';
import { OpenAIConfig, generateLayoutWithOpenAI } from './services/openaiService';
import { generateLayoutFromPrompt } from './services/geminiService';
import { TRANSLATIONS, DEFAULT_MARKDOWN } from './constants';
import { EditorPanel } from './components/EditorPanel';
import { PreviewPanel } from './components/PreviewPanel';
import { AiSettingsModal } from './components/AiSettingsModal';
import { ToastProvider, useToast } from './components/ToastSystem';

const AppContent: React.FC = () => {
  // --- State ---
  const [designData, setDesignData] = useState<DocumentDesign>(INITIAL_DESIGN);
  const [markdownContent, setMarkdownContent] = useState(DEFAULT_MARKDOWN);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [activeTab, setActiveTab] = useState<'write' | 'preview' | 'config'>('write');
  const [lang, setLang] = useState<Language>('zh');
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // AI Provider State
  const [showAiSettings, setShowAiSettings] = useState(false);
  const [provider, setProvider] = useState<ServiceProvider>('gemini');
  const [openaiConfig, setOpenaiConfig] = useState<OpenAIConfig>({
    apiKey: '',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4-turbo-preview'
  });

  const { addToast } = useToast();
  const t = TRANSLATIONS[lang];

  // --- Handlers ---

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setError(null);
    
    const progressCallback = (type: 'design' | 'content', data: any) => {
        if (type === 'design') {
          setDesignData(data);
        } else if (type === 'content') {
          setMarkdownContent(data);
        }
    };

    // Determine if we are using a pre-selected design (non-default)
    const designToUse = designData.id !== 'default' ? designData : undefined;

    try {
      if (provider === 'gemini') {
          // Use Default Gemini Service
          await generateLayoutFromPrompt(
            prompt, 
            markdownContent, 
            'auto',
            progressCallback,
            designToUse
          );
      } else {
          // Use OpenAI Service
          if (!openaiConfig.apiKey) throw new Error("Please configure OpenAI API Key in settings");
          await generateLayoutWithOpenAI(
            openaiConfig,
            prompt,
            markdownContent,
            'auto',
            progressCallback,
            designToUse
          );
      }
      addToast(t.generate + " " + t.copied, 'success'); // Reusing translation keys creatively or just success
    } catch (err: any) {
      const msg = err.message || t.error;
      setError(msg);
      addToast(msg, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleLanguage = () => {
    setLang(prev => prev === 'zh' ? 'en' : 'zh');
  };

  // --- Render ---

  return (
    <div className="h-screen w-full flex flex-col md:flex-row bg-slate-100 overflow-hidden">
      
      {/* Column 1: Editor & Config */}
      <EditorPanel 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        markdownContent={markdownContent}
        setMarkdownContent={setMarkdownContent}
        prompt={prompt}
        setPrompt={setPrompt}
        isGenerating={isGenerating}
        handleGenerate={handleGenerate}
        error={error}
        lang={lang}
        toggleLanguage={toggleLanguage}
        designData={designData}
        setDesignData={setDesignData}
        provider={provider}
        setShowAiSettings={setShowAiSettings}
        t={t}
      />

      {/* Column 2: Preview & Export */}
      <PreviewPanel 
        designData={designData}
        markdownContent={markdownContent}
        previewMode={previewMode}
        setPreviewMode={setPreviewMode}
        lang={lang}
        t={t}
        provider={provider}
        openaiConfig={openaiConfig}
      />
      
       {/* Modal */}
      <AiSettingsModal 
        isOpen={showAiSettings}
        onClose={() => setShowAiSettings(false)}
        provider={provider}
        setProvider={setProvider}
        openaiConfig={openaiConfig}
        setOpenaiConfig={setOpenaiConfig}
        t={t}
      />

    </div>
  );
};

const App: React.FC = () => {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
};

export default App;
