import React, { useState } from 'react';
import { Smartphone, Share2, PlusSquare, X, Check } from 'lucide-react';
import { usePWAInstall } from './usePWAInstall';

interface PWAInstallButtonProps {
  compact?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [justInstalled, setJustInstalled] = useState(false);

  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (success) {
        setJustInstalled(true);
        setTimeout(() => setJustInstalled(false), 3000);
      }
    } else if (isIOS) {
      setShowIOSModal(true);
    } else {
      setShowIOSModal(true);
    }
  };

  return (
    <>
      <button
        onClick={handleInstallClick}
        type="button"
        title="Install AudioArc App on Android, iPhone, or Desktop"
        className={`flex items-center gap-1.5 rounded-lg border transition-all duration-200 ${
          compact
            ? 'px-2 py-1.5 text-xs bg-gradient-to-r from-cyan-950/70 to-blue-950/70 border-cyan-500/40 text-cyan-300 hover:text-white hover:border-cyan-400 shadow-sm'
            : 'px-2.5 py-1.5 text-xs font-semibold bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white border-transparent shadow-md hover:shadow-cyan-500/20 active:scale-95'
        }`}
      >
        {justInstalled ? (
          <Check size={14} className="text-emerald-300" />
        ) : (
          <Smartphone size={14} className="text-cyan-300 animate-pulse" />
        )}
        <span className="whitespace-nowrap font-medium text-[11px]">
          {justInstalled ? 'Installed!' : isIOS ? 'App for iPhone' : 'Install App'}
        </span>
      </button>

      {/* iOS & Mobile Installation Instruction Modal */}
      {showIOSModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setShowIOSModal(false)}
        >
          <div 
            className="w-full max-w-sm rounded-2xl bg-[#141922] border border-cyan-500/30 p-5 shadow-2xl text-left"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300">
                  <Smartphone size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white brand-font">Install AudioArc</h3>
                  <p className="text-[10px] text-gray-400">Add to your Home Screen</p>
                </div>
              </div>
              <button
                onClick={() => setShowIOSModal(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-gray-300">
              <p className="text-gray-300 text-[11px] leading-relaxed">
                Run AudioArc as a native full-screen app on your phone (Android or iPhone) with zero browser toolbars:
              </p>

              {isIOS ? (
                <div className="bg-black/40 border border-white/10 rounded-xl p-3.5 space-y-2.5 text-xs">
                  <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-blue-600/30 text-blue-300 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      1
                    </div>
                    <div>
                      <span className="font-semibold text-white">Tap the Share icon</span>
                      <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                        In Safari bottom toolbar: <Share2 size={12} className="inline text-blue-400" />
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-blue-600/30 text-blue-300 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      2
                    </div>
                    <div>
                      <span className="font-semibold text-white">Tap &ldquo;Add to Home Screen&rdquo;</span>
                      <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                        Scroll down and select <PlusSquare size={12} className="inline text-blue-400" />
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-black/40 border border-white/10 rounded-xl p-3.5 space-y-2.5 text-xs">
                  <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-cyan-600/30 text-cyan-300 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      1
                    </div>
                    <div>
                      <span className="font-semibold text-white">Browser Menu (⋮)</span>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        Tap the three dots menu at the top-right of Chrome / Edge.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-cyan-600/30 text-cyan-300 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      2
                    </div>
                    <div>
                      <span className="font-semibold text-white">Select &ldquo;Install App&rdquo; or &ldquo;Add to Home Screen&rdquo;</span>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        AudioArc will launch in standalone native mode.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="text-[10px] text-cyan-400/90 bg-cyan-950/40 p-2.5 rounded-lg border border-cyan-500/20">
                ✨ <strong>Benefits:</strong> Fast offline caching, full-screen timeline editing, responsive touch drag handles, and no browser URL bar taking up screen space.
              </div>
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="mt-4 w-full py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
