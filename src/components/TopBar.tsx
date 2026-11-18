import React from 'react';
import { BellRing, Menu } from 'lucide-react';
import { WorkspaceTab } from '../types';

interface TopBarProps {
  activeTab: WorkspaceTab;
  onOpenMobileNav: () => void;
  onNavigateSentiment: () => void;
}

const TAB_BREADCRUMBS: Record<WorkspaceTab, string> = {
  dashboard: '教育新創產業實時輿情儀表板',
  sentiment: '議題分析、正負情緒歸因與輿情警報',
  strategy: '使用者痛點分析與 EAAF 策略研究',
  competitive: '教育平台競爭版圖與七大指標評估',
  ecosystem: 'AI Tutor 五步循環與 Multi-Agent 生態系',
};

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  onOpenMobileNav,
  onNavigateSentiment,
}) => {
  return (
    <header className="sticky top-0 z-30 h-16 bg-[#060D1A]/90 backdrop-blur-md border-b border-sky-900/40 px-4 sm:px-8 flex items-center justify-between gap-8">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileNav}
          className="lg:hidden p-2 rounded-lg text-slate-300 hover:bg-slate-800/80 hover:text-white transition-colors"
          aria-label="開啟功能選單"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2 text-sm min-w-0">
          <span className="text-slate-400 whitespace-nowrap shrink-0">
            EAAF 輿情系統
          </span>
          <span className="text-slate-600" aria-hidden="true">
            /
          </span>
          <span className="font-semibold text-slate-100 truncate">
            {TAB_BREADCRUMBS[activeTab]}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={onNavigateSentiment}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <BellRing className="h-4 w-4 shrink-0" />
          <span>輿情警報設置</span>
        </button>
      </div>
    </header>
  );
};
