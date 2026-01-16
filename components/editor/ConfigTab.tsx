
import React, { useState } from 'react';
import { Sparkles, Bot, Globe, Palette, RefreshCw, Wand2 } from 'lucide-react';
import { DocumentDesign, Language, ServiceProvider } from '../../types';
import { generateDesignVariations } from '../../services/geminiService';
import { DesignVariations } from './DesignVariations';
import { useToast } from '../ToastSystem';

interface ConfigTabProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
  designData: DocumentDesign;
  setDesignData: (design: DocumentDesign) => void;
  isGenerating: boolean;
  handleGenerate: () => void;
  error: string | null;
  lang: Language;
  toggleLanguage: () => void;
  provider: ServiceProvider;
  setShowAiSettings: (show: boolean) => void;
  t: any;
}

export const ConfigTab: React.FC<ConfigTabProps> = ({
  prompt,
  setPrompt,
  designData,
  setDesignData,
  isGenerating,
  handleGenerate,
  error,
  lang,
  toggleLanguage,
  provider,
  setShowAiSettings,
  t
}) => {
  const { addToast } = useToast();
  
  // Local state for style variations options
  const [designOptions, setDesignOptions] = useState<DocumentDesign[]>([]);
  const [isDesigning, setIsDesigning] = useState(false);

  const handleGenerateStyles = async () => {
    if (!prompt.trim()) return;
    setIsDesigning(true);
    try {
      // Currently only implemented for Gemini in the service
      const variations = await generateDesignVariations(prompt, 'auto');
      setDesignOptions(variations);
      addToast('2 style variations generated!', 'success');
    } catch (e: any) {
      console.error(e);
      addToast(e.message || 'Failed to generate styles', 'error');
    } finally {
      setIsDesigning(false);
    }
  };

  const LoaderIcon = () => (
    <svg className="animate-spin h-3.5 w-3.5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );

  return (
    <div className="w-full h-full p-6 overflow-y-auto">
      <div className="max-w-xl mx-auto space-y-8">
        
        {/* Language & Service Settings */}
        <div className="flex justify-end gap-2">
           <button 
            onClick={() => setShowAiSettings(true)}
            className={`flex items-center gap-2 text-xs font-medium transition px-3 py-1.5 rounded-full border ${provider === 'openai' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
           >
             <Bot className="w-3 h-3" />
             {provider === 'gemini' ? 'Gemini' : 'OpenAI'}
           </button>

           <button 
            onClick={toggleLanguage}
            className="flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-indigo-600 transition bg-white border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded-full"
           >
             <Globe className="w-3 h-3" />
             {lang === 'zh' ? 'English' : '中文'}
           </button>
        </div>

        {/* Prompt Section & Style Generator */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
             <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              {t.stylePrompt}
             </label>
             {/* Generate Styles Button - Primary Action for Layout Selection */}
             <button 
                onClick={handleGenerateStyles}
                disabled={isDesigning || !prompt.trim()}
                className="text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition flex items-center gap-1.5"
             >
               {isDesigning ? <LoaderIcon /> : <Wand2 className="w-3.5 h-3.5" />}
               {isDesigning ? t.generatingStyles : t.generateStyles}
             </button>
          </div>
          
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={t.stylePlaceholder}
            className="w-full p-4 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none h-28 bg-white shadow-sm"
          />

          {/* Style Variations Module */}
          <DesignVariations 
            options={designOptions}
            selectedId={designData.id}
            onSelect={setDesignData}
            t={t}
          />

        </div>

        {/* Generate Button */}
        <button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className={`w-full py-3 px-4 rounded-xl text-white font-medium text-sm flex items-center justify-center gap-2 transition-all ${
              isGenerating ? 'bg-slate-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 shadow-lg hover:shadow-indigo-500/30 active:scale-[0.98]'
            }`}
        >
            {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {isGenerating ? t.generating : t.generate}
        </button>
         {error && <p className="text-xs text-red-500 mt-2 bg-red-50 p-2 rounded border border-red-100">{error}</p>}

        {/* Presets */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {t.presets}
          </label>
          <div className="grid grid-cols-1 gap-2">
            <button onClick={() => setPrompt("WeChat Official Account style (公众号风格). Flat layout, max-w-xl. Headings (H2) should be very decorative: use colored pills (rounded-full bg-blue-50), left borders, or bottom borders. Font size slightly larger (text-[17px]) for good readability. Comfortable line height. Auto-extract key points into headers.")} className="text-left text-xs p-3 bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 border-green-200 rounded-lg border text-emerald-800 transition shadow-sm group ring-1 ring-green-100">
                <span className="font-semibold block group-hover:text-emerald-900">{t.presetWeChat.split('：')[0]}</span>
                <span className="opacity-70">{t.presetWeChat.split('：')[1]}</span>
            </button>
            <button onClick={() => setPrompt("Technology/SaaS style. Dark mode, monospace fonts for code, neon accents.")} className="text-left text-xs p-3 bg-white hover:bg-indigo-50 hover:border-indigo-200 rounded-lg border border-slate-200 text-slate-600 transition shadow-sm group">
                <span className="font-semibold text-slate-800 block group-hover:text-indigo-700">{t.presetSaas.split('：')[0]}</span>
                <span className="opacity-70">{t.presetSaas.split('：')[1]}</span>
            </button>
            <button onClick={() => setPrompt("Classic literature style. Warm beige background, high readability serif fonts, elegant margins.")} className="text-left text-xs p-3 bg-white hover:bg-indigo-50 hover:border-indigo-200 rounded-lg border border-slate-200 text-slate-600 transition shadow-sm group">
                <span className="font-semibold text-slate-800 block group-hover:text-indigo-700">{t.presetBlog.split('：')[0]}</span>
                <span className="opacity-70">{t.presetBlog.split('：')[1]}</span>
            </button>
          </div>
        </div>

        {/* Theme Info */}
        <div className="p-4 bg-indigo-50 text-indigo-900 rounded-xl text-xs flex items-start gap-3 border border-indigo-100">
          <Palette className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">{t.theme}: <span className="capitalize">{designData.themeName}</span></p>
            <p className="opacity-80">{t.proTip}</p>
          </div>
        </div>

      </div>
    </div>
  );
};
