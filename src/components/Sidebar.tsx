import React from 'react';
import {
  Activity,
  BarChart3,
  Compass,
  Cpu,
  Layers,
  MessageSquareText,
  X,
} from 'lucide-react';
import { WorkspaceTab } from '../types';

interface SidebarProps {
  activeTab: WorkspaceTab;
  onSelectTab: (tab: WorkspaceTab) => void;
  negativeAlertCount: number;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const NAV_ITEMS: Array<{
  id: WorkspaceTab;
  label: string;
  sublabel: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    id: 'dashboard',
    label: '實時輿情儀表板',
    sublabel: '四條主線 × 八大圖表',
    icon: Activity,
  },
  {
    id: 'sentiment',
    label: '議題與正負情緒分析',
    sublabel: '議題追蹤 × 情緒歸因 × 原文',
    icon: MessageSquareText,
  },
  {
    id: 'strategy',
    label: '使用者痛點與策略研究',
    sublabel: '角色痛點矩陣 × 切入藍圖',
    icon: Compass,
  },
  {
    id: 'competitive',
    label: '競爭版圖與七大指標',
    sublabel: '台灣樣本 × 國際標竿',
    icon: BarChart3,
  },
  {
    id: 'ecosystem',
    label: 'AI Tutor 與 Multi-Agent',
    sublabel: '五步循環 × 協作架構',
    icon: Cpu,
  },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  negativeAlertCount,
  mobileOpen,
  onCloseMobile,
}) => {
  const navContent = (
    <div className="flex h-full flex-col justify-between bg-[#081223] border-r border-sky-900/40 px-4 py-6">
      <div className="space-y-8">
        {/* Brand Header */}
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-500/15 border border-cyan-400/35 text-cyan-300">
              <Layers className="h-5 w-5" />
            </div>
            <span className="font-display text-base font-bold tracking-tight text-slate-100 whitespace-nowrap">
              EAAF EdTech Intel
            </span>
          </div>
          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden p-2 text-slate-400 hover:text-slate-100 rounded-lg"
            aria-label="關閉導覽選單"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Workspace Navigation */}
        <nav className="space-y-1.5" aria-label="主要分析工作區">
          <p className="px-3 pb-1 text-xs font-medium text-slate-400">
            產業輿情與研究工作區
          </p>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectTab(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-left transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-200 border border-cyan-400/30'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-slate-100 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={`h-4 w-4 shrink-0 ${
                      isActive ? 'text-cyan-400' : 'text-slate-400'
                    }`}
                  />
                  <div className="min-w-0">
                    <div className="text-sm font-medium whitespace-nowrap truncate">
                      {item.label}
                    </div>
                    <div className="text-xs text-slate-400 whitespace-nowrap truncate">
                      {item.sublabel}
                    </div>
                  </div>
                </div>
                {item.id === 'sentiment' && negativeAlertCount > 0 && (
                  <span className="font-mono-num text-xs font-semibold text-amber-300 shrink-0">
                    {negativeAlertCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Research Scope Context Footer */}
      <div className="rounded-lg bg-[#0D1B33] border border-sky-900/40 p-4 space-y-2">
        <div className="text-xs font-semibold text-cyan-300">
          EAAF 產業情報研究架構
        </div>
        <div className="text-xs text-slate-400 leading-relaxed">
          第一層：教育新創產業輿情
          <br />
          第二層：AI Tutor 技術驗證
          <br />
          第三層：Multi-Agent 人工覆核
        </div>
        <div className="pt-2 border-t border-sky-900/40 text-[11px] text-slate-400 font-mono-num">
          範圍：台灣為主 · 2025.11–2026.10
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block w-64 shrink-0 h-screen sticky top-0">
        {navContent}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs"
            onClick={onCloseMobile}
          />
          <aside className="relative w-72 max-w-[85vw] h-full z-10">
            {navContent}
          </aside>
        </div>
      )}
    </>
  );
};
