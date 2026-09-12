import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, Bot, Monitor, Cpu, Cloud, Zap, 
  ChevronDown, Settings, RefreshCw, 
  Image as ImageIcon, Activity
} from 'lucide-react';
import { AI_MODEL_LABELS } from './influences';

interface HeaderConnectionStatusProps {
  provider: 'gemini' | 'openai' | 'ollama' | 'lmstudio' | 'openrouter' | 'pollinations';
  connectionStatus: 'idle' | 'checking' | 'connected' | 'error';
  // Models
  geminiMainModel: string;
  geminiUtilityModel: string;
  geminiImageModel: string;
  imageEngine: 'gemini' | 'imagen';
  imagenModel: string;
  imageProvider: 'google' | 'openrouter';
  openAIModel: string;
  ollamaModel: string;
  ollamaUrl: string;
  lmStudioModel: string;
  lmStudioUrl: string;
  openRouterModel: string;
  pollinationsModel: string;
  // Key status
  apiKeyStatus: 'detected' | 'not_found';
  totalTokenUsage: number;
  onOpenSettings: (tab?: 'config' | 'billing' | 'guide') => void;
  onTestConnection?: () => void;
  isTestingConnection?: boolean;
}

export const HeaderConnectionStatus: React.FC<HeaderConnectionStatusProps> = ({
  provider,
  connectionStatus,
  geminiMainModel,
  geminiUtilityModel,
  geminiImageModel,
  imageEngine,
  imagenModel,
  imageProvider,
  openAIModel,
  ollamaModel,
  ollamaUrl,
  lmStudioModel,
  lmStudioUrl,
  openRouterModel,
  pollinationsModel,
  apiKeyStatus,
  totalTokenUsage,
  onOpenSettings,
  onTestConnection,
  isTestingConnection = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Provider branding details
  const getProviderConfig = () => {
    switch (provider) {
      case 'gemini':
        return {
          name: 'Gemini',
          icon: <Sparkles size={12} className="text-blue-400" />,
          colorText: 'text-blue-400',
          borderColor: 'border-blue-500/30',
          bgColor: 'bg-blue-950/40',
          activeModel: geminiMainModel,
          activeModelDisplay: AI_MODEL_LABELS[geminiMainModel] || geminiMainModel,
          endpoint: 'Google AI Studio Cloud',
          type: 'Cloud API'
        };
      case 'openai':
        return {
          name: 'OpenAI',
          icon: <Bot size={12} className="text-emerald-400" />,
          colorText: 'text-emerald-400',
          borderColor: 'border-emerald-500/30',
          bgColor: 'bg-emerald-950/40',
          activeModel: openAIModel,
          activeModelDisplay: openAIModel,
          endpoint: 'api.openai.com/v1',
          type: 'Cloud API'
        };
      case 'ollama':
        return {
          name: 'Ollama',
          icon: <Monitor size={12} className="text-orange-400" />,
          colorText: 'text-orange-400',
          borderColor: 'border-orange-500/30',
          bgColor: 'bg-orange-950/40',
          activeModel: ollamaModel,
          activeModelDisplay: ollamaModel,
          endpoint: ollamaUrl || 'http://localhost:11434',
          type: 'Local Private'
        };
      case 'lmstudio':
        return {
          name: 'LM Studio',
          icon: <Cpu size={12} className="text-purple-400" />,
          colorText: 'text-purple-400',
          borderColor: 'border-purple-500/30',
          bgColor: 'bg-purple-950/40',
          activeModel: lmStudioModel,
          activeModelDisplay: lmStudioModel,
          endpoint: lmStudioUrl || 'http://localhost:1234/v1',
          type: 'Local / Offline'
        };
      case 'openrouter':
        return {
          name: 'OpenRouter',
          icon: <Cloud size={12} className="text-cyan-400" />,
          colorText: 'text-cyan-400',
          borderColor: 'border-cyan-500/30',
          bgColor: 'bg-cyan-950/40',
          activeModel: openRouterModel,
          activeModelDisplay: openRouterModel.split('/').pop() || openRouterModel,
          endpoint: 'openrouter.ai/api',
          type: 'Multi-Model Cloud'
        };
      case 'pollinations':
        return {
          name: 'Pollinations',
          icon: <Zap size={12} className="text-pink-400" />,
          colorText: 'text-pink-400',
          borderColor: 'border-pink-500/30',
          bgColor: 'bg-pink-950/40',
          activeModel: pollinationsModel,
          activeModelDisplay: pollinationsModel,
          endpoint: 'pollinations.ai (Free)',
          type: 'Community Serverless'
        };
      default:
        return {
          name: 'AI Engine',
          icon: <Sparkles size={12} className="text-gray-400" />,
          colorText: 'text-gray-300',
          borderColor: 'border-white/10',
          bgColor: 'bg-white/5',
          activeModel: 'Auto',
          activeModelDisplay: 'Auto',
          endpoint: 'Default',
          type: 'Cloud'
        };
    }
  };

  const config = getProviderConfig();

  // Active image model display
  const getImageModelDisplay = () => {
    if (imageProvider === 'openrouter') {
      return 'OpenRouter SD3';
    }
    if (imageEngine === 'imagen') {
      return imagenModel ? AI_MODEL_LABELS[imagenModel] || imagenModel : 'Imagen 4';
    }
    if (geminiImageModel === 'gemini-3.1-flash-image') {
      return '🍌 Nano Banana 2';
    }
    if (geminiImageModel === 'gemini-3.1-flash-lite-image') {
      return '🍌 Nano Banana 2 Lite';
    }
    if (geminiImageModel === 'gemini-3-pro-image') {
      return '🍌 Nano Banana Pro';
    }
    return geminiImageModel.replace('gemini-', '');
  };

  const isConnected = connectionStatus === 'connected' || (provider === 'gemini' && apiKeyStatus === 'detected');

  return (
    <div className="relative" ref={popoverRef}>
      {/* Primary Clickable Header Badge */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`group flex items-center gap-2 pl-2.5 pr-2 py-1 rounded-full border transition-all select-none ${
          isConnected 
            ? 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20' 
            : 'bg-red-950/20 hover:bg-red-950/40 border-red-500/30'
        }`}
        title={`Connected to ${config.name} (${config.activeModel}). Click for details.`}
      >
        {/* Status Dot */}
        <div className="relative flex items-center justify-center">
          <div 
            className={`w-2 h-2 rounded-full ${
              isConnected 
                ? 'bg-emerald-400 shadow-sm shadow-emerald-400' 
                : connectionStatus === 'checking' || isTestingConnection
                ? 'bg-amber-400 animate-pulse'
                : 'bg-red-400'
            }`} 
          />
          {isConnected && (
            <div className="absolute w-3.5 h-3.5 rounded-full bg-emerald-400/20 animate-ping pointer-events-none" />
          )}
        </div>

        {/* Provider Icon & Name */}
        <div className="flex items-center gap-1.5 text-xs font-bold text-white">
          {config.icon}
          <span>{config.name}</span>
        </div>

        {/* Active Model Name Chip (Monospace) */}
        <div className="hidden lg:flex items-center">
          <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-black/40 text-gray-300 border border-white/5 max-w-[130px] truncate">
            {config.activeModelDisplay}
          </span>
        </div>

        {/* Image Engine Pill */}
        <div className="hidden xl:flex items-center">
          <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-purple-950/40 text-purple-300 border border-purple-500/20 truncate max-w-[110px]">
            {getImageModelDisplay()}
          </span>
        </div>

        {/* Dropdown Chevron */}
        <ChevronDown 
          size={12} 
          className={`text-gray-400 group-hover:text-white transition-transform ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {/* Interactive Details Dropdown Popover */}
      {isOpen && (
        <div 
          className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-[#161822] border border-white/10 rounded-2xl shadow-2xl z-50 p-4 space-y-3.5 animate-in fade-in slide-in-from-top-1 duration-150 backdrop-blur-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Popover Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                {config.icon}
              </div>
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>{config.name} AI Engine</span>
                  <span className="text-[9px] font-mono font-normal px-1.5 py-0.2 rounded bg-white/5 text-gray-400">
                    {config.type}
                  </span>
                </h4>
                <p className="text-[10px] text-gray-400 font-mono truncate max-w-[180px]">
                  {config.endpoint}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                isConnected 
                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30' 
                  : 'bg-red-950/60 text-red-300 border border-red-500/30'
              }`}>
                <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-red-400'}`} />
                {isConnected ? 'Active & Ready' : 'Disconnected'}
              </span>
            </div>
          </div>

          {/* Model Roster Grid */}
          <div className="space-y-2 text-xs">
            {/* Primary LLM Model */}
            <div className="bg-black/30 border border-white/5 rounded-xl p-2.5 flex items-start justify-between gap-2">
              <div className="space-y-0.5">
                <span className="text-[9px] uppercase font-bold text-gray-500 tracking-wider block">
                  Storyboard & Script Model
                </span>
                <span className="font-mono text-xs font-bold text-gray-200">
                  {config.activeModel}
                </span>
                {AI_MODEL_LABELS[config.activeModel] && (
                  <span className="text-[10px] text-gray-400 block">
                    {AI_MODEL_LABELS[config.activeModel]}
                  </span>
                )}
              </div>
              <span className="text-[9px] text-blue-400 bg-blue-950/40 border border-blue-500/20 px-1.5 py-0.5 rounded flex-shrink-0">
                Primary LLM
              </span>
            </div>

            {/* Utility Model (if Gemini) */}
            {provider === 'gemini' && (
              <div className="bg-black/30 border border-white/5 rounded-xl p-2.5 flex items-start justify-between gap-2">
                <div className="space-y-0.5">
                  <span className="text-[9px] uppercase font-bold text-gray-500 tracking-wider block">
                    Fast Utility / Summary Model
                  </span>
                  <span className="font-mono text-xs font-medium text-gray-200">
                    {geminiUtilityModel}
                  </span>
                  {AI_MODEL_LABELS[geminiUtilityModel] && (
                    <span className="text-[10px] text-gray-400 block">
                      {AI_MODEL_LABELS[geminiUtilityModel]}
                    </span>
                  )}
                </div>
                <span className="text-[9px] text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-1.5 py-0.5 rounded flex-shrink-0">
                  Flash-Lite
                </span>
              </div>
            )}

            {/* Image Generation Engine */}
            <div className="bg-black/30 border border-white/5 rounded-xl p-2.5 flex items-start justify-between gap-2">
              <div className="space-y-0.5">
                <span className="text-[9px] uppercase font-bold text-gray-500 tracking-wider block">
                  Active Image Engine
                </span>
                <div className="flex items-center gap-1.5">
                  <ImageIcon size={12} className="text-purple-400" />
                  <span className="font-mono text-xs font-bold text-gray-200">
                    {getImageModelDisplay()}
                  </span>
                </div>
                <span className="text-[10px] text-gray-400 block">
                  {imageProvider === 'google' 
                    ? (imageEngine === 'gemini' ? 'Multimodal Native Image Generation' : 'Google Imagen 4 Photorealism')
                    : 'OpenRouter Diffusion / SD3'}
                </span>
              </div>
              <span className="text-[9px] text-purple-400 bg-purple-950/40 border border-purple-500/20 px-1.5 py-0.5 rounded flex-shrink-0">
                Visual Gen
              </span>
            </div>

            {/* Token Usage Metric */}
            {totalTokenUsage > 0 && (
              <div className="flex items-center justify-between text-[11px] text-gray-400 px-1 pt-1">
                <span className="flex items-center gap-1">
                  <Activity size={12} className="text-amber-400" /> Session Token Meter:
                </span>
                <span className="font-mono text-white font-bold">
                  {totalTokenUsage.toLocaleString()} tokens
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2">
            {onTestConnection && (
              <button
                onClick={() => {
                  onTestConnection();
                }}
                disabled={isTestingConnection}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-lg text-xs font-medium border border-white/10 transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw size={11} className={isTestingConnection ? 'animate-spin' : ''} />
                <span>Test Ping</span>
              </button>
            )}

            <button
              onClick={() => {
                setIsOpen(false);
                onOpenSettings('config');
              }}
              className="flex-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Settings size={12} />
              <span>Switch Model or Provider</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
