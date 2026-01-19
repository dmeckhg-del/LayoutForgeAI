import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { DocumentDesign, INITIAL_DESIGN, Language, ServiceProvider, OpenAIConfig } from "../types";

const localStorageStorage = createJSONStorage(() => localStorage);

export interface AppState {
  designData: DocumentDesign;
  markdownContent: string;
  previewMode: 'desktop' | 'mobile';
  activeTab: 'write' | 'preview' | 'config';
  lang: Language;
  prompt: string;
  isGenerating: boolean;
  error: string | null;
  showAiSettings: boolean;
  provider: ServiceProvider;
  geminiKey: string;
  openaiConfig: OpenAIConfig;
  wechatHtml: string | null;
  previewType: 'normal' | 'wechat';
}

export interface AppDispatch {
  setDesignData: (design: DocumentDesign | ((prev: DocumentDesign) => DocumentDesign)) => void;
  setMarkdownContent: (content: string | ((prev: string) => string)) => void;
  setPreviewMode: (mode: 'desktop' | 'mobile' | ((prev: 'desktop' | 'mobile') => 'desktop' | 'mobile')) => void;
  setActiveTab: (tab: 'write' | 'preview' | 'config' | ((prev: 'write' | 'preview' | 'config') => 'write' | 'preview' | 'config')) => void;
  setLang: (lang: Language | ((prev: Language) => Language)) => void;
  setPrompt: (prompt: string | ((prev: string) => string)) => void;
  setIsGenerating: (isGenerating: boolean | ((prev: boolean) => boolean)) => void;
  setError: (error: string | null | ((prev: string | null) => string | null)) => void;
  setShowAiSettings: (show: boolean | ((prev: boolean) => boolean)) => void;
  setProvider: (provider: ServiceProvider | ((prev: ServiceProvider) => ServiceProvider)) => void;
  setGeminiKey: (key: string | ((prev: string) => string)) => void;
  setOpenaiConfig: (config: OpenAIConfig | ((prev: OpenAIConfig) => OpenAIConfig)) => void;
  setWechatHtml: (html: string | null | ((prev: string | null) => string | null)) => void;
  setPreviewType: (type: 'normal' | 'wechat' | ((prev: 'normal' | 'wechat') => 'normal' | 'wechat')) => void;
  resetDesign: () => void;
}

const initialState: AppState = {
  designData: INITIAL_DESIGN,
  markdownContent: '',
  previewMode: 'desktop',
  activeTab: 'write',
  lang: 'zh',
  prompt: '',
  isGenerating: false,
  error: null,
  showAiSettings: false,
  provider: 'gemini',
  geminiKey: '',
  openaiConfig: {
    apiKey: '',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4-turbo-preview'
  },
  wechatHtml: null,
  previewType: 'normal'
};

export const appStore = create<AppState & AppDispatch>()(
  persist(
    (set) => ({
      ...initialState,
      setDesignData: (design) =>
        set((state) => ({
          designData: typeof design === 'function' ? (design as (prev: DocumentDesign) => DocumentDesign)(state.designData) : design
        })),
      setMarkdownContent: (content) =>
        set((state) => ({
          markdownContent: typeof content === 'function' ? (content as (prev: string) => string)(state.markdownContent) : content
        })),
      setPreviewMode: (mode) =>
        set((state) => ({
          previewMode: typeof mode === 'function' ? (mode as (prev: 'desktop' | 'mobile') => 'desktop' | 'mobile')(state.previewMode) : mode
        })),
      setActiveTab: (tab) =>
        set((state) => ({
          activeTab: typeof tab === 'function' ? (tab as (prev: 'write' | 'preview' | 'config') => 'write' | 'preview' | 'config')(state.activeTab) : tab
        })),
      setLang: (lang) =>
        set((state) => ({
          lang: typeof lang === 'function' ? (lang as (prev: Language) => Language)(state.lang) : lang
        })),
      setPrompt: (prompt) =>
        set((state) => ({
          prompt: typeof prompt === 'function' ? (prompt as (prev: string) => string)(state.prompt) : prompt
        })),
      setIsGenerating: (isGenerating) =>
        set((state) => ({
          isGenerating: typeof isGenerating === 'function' ? (isGenerating as (prev: boolean) => boolean)(state.isGenerating) : isGenerating
        })),
      setError: (error) =>
        set((state) => ({
          error: typeof error === 'function' ? (error as (prev: string | null) => string | null)(state.error) : error
        })),
      setShowAiSettings: (show) =>
        set((state) => ({
          showAiSettings: typeof show === 'function' ? (show as (prev: boolean) => boolean)(state.showAiSettings) : show
        })),
      setProvider: (provider) =>
        set((state) => ({
          provider: typeof provider === 'function' ? (provider as (prev: ServiceProvider) => ServiceProvider)(state.provider) : provider
        })),
      setGeminiKey: (key) =>
        set((state) => ({
          geminiKey: typeof key === 'function' ? (key as (prev: string) => string)(state.geminiKey) : key
        })),
      setOpenaiConfig: (config) =>
        set((state) => ({
          openaiConfig: typeof config === 'function' ? (config as (prev: OpenAIConfig) => OpenAIConfig)(state.openaiConfig) : config
        })),
      setWechatHtml: (html) =>
        set((state) => ({
          wechatHtml: typeof html === 'function' ? (html as (prev: string | null) => string | null)(state.wechatHtml) : html
        })),
      setPreviewType: (type) =>
        set((state) => ({
          previewType: typeof type === 'function' ? (type as (prev: 'normal' | 'wechat') => 'normal' | 'wechat')(state.previewType) : type
        })),
      resetDesign: () => set({ designData: INITIAL_DESIGN })
    }),
    {
      name: "layout-forge-ai-store",
      storage: localStorageStorage,
      partialize: (state) => ({
        lang: state.lang,
        provider: state.provider,
        geminiKey: state.geminiKey,
        openaiConfig: state.openaiConfig
      })
    }
  )
);

export const useDesignData = () => appStore((s) => s.designData);
export const useSetDesignData = () => appStore((s) => s.setDesignData);
export const useMarkdownContent = () => appStore((s) => s.markdownContent);
export const useSetMarkdownContent = () => appStore((s) => s.setMarkdownContent);
export const usePreviewMode = () => appStore((s) => s.previewMode);
export const useSetPreviewMode = () => appStore((s) => s.setPreviewMode);
export const useActiveTab = () => appStore((s) => s.activeTab);
export const useSetActiveTab = () => appStore((s) => s.setActiveTab);
export const useLang = () => appStore((s) => s.lang);
export const useSetLang = () => appStore((s) => s.setLang);
export const usePrompt = () => appStore((s) => s.prompt);
export const useSetPrompt = () => appStore((s) => s.setPrompt);
export const useIsGenerating = () => appStore((s) => s.isGenerating);
export const useSetIsGenerating = () => appStore((s) => s.setIsGenerating);
export const useError = () => appStore((s) => s.error);
export const useSetError = () => appStore((s) => s.setError);
export const useShowAiSettings = () => appStore((s) => s.showAiSettings);
export const useSetShowAiSettings = () => appStore((s) => s.setShowAiSettings);
export const useProvider = () => appStore((s) => s.provider);
export const useSetProvider = () => appStore((s) => s.setProvider);
export const useGeminiKey = () => appStore((s) => s.geminiKey);
export const useSetGeminiKey = () => appStore((s) => s.setGeminiKey);
export const useOpenaiConfig = () => appStore((s) => s.openaiConfig);
export const useSetOpenaiConfig = () => appStore((s) => s.setOpenaiConfig);
export const useWechatHtml = () => appStore((s) => s.wechatHtml);
export const useSetWechatHtml = () => appStore((s) => s.setWechatHtml);
export const usePreviewType = () => appStore((s) => s.previewType);
export const useSetPreviewType = () => appStore((s) => s.setPreviewType);
export const useResetDesign = () => appStore((s) => s.resetDesign);
