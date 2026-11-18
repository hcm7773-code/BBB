import React, { useState, useEffect, useMemo } from 'react';
import {
  EdTechPlatform,
  SentimentAlertRule,
  SentimentMention,
  UserPainPoint,
  WorkspaceTab,
} from './types';
import {
  INITIAL_ALERT_RULES,
  INITIAL_PAIN_POINTS,
  INITIAL_PLATFORMS,
  INITIAL_SENTIMENT_MENTIONS,
  INITIAL_SEVEN_DAY_SENTIMENT,
} from './data/edtechData';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { DashboardView } from './components/DashboardView';
import {
  SentimentMonitorView,
  SentimentSubTab,
} from './components/SentimentMonitorView';
import { StrategyResearchView } from './components/StrategyResearchView';
import { CompetitiveAnalysisView } from './components/CompetitiveAnalysisView';
import { EcosystemArchitectureView } from './components/EcosystemArchitectureView';
import { evaluateAlertRules } from './utils/sentimentMatch';
import { Check } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('dashboard');
  const [mobileNavOpen, setMobileNavOpen] = useState<boolean>(false);
  const [toast, setToast] = useState<string | null>(null);

  const [platforms] = useState<EdTechPlatform[]>(() => {
    const saved = localStorage.getItem('eaaf_platforms_v2');
    return saved ? JSON.parse(saved) : INITIAL_PLATFORMS;
  });

  const [mentions, setMentions] = useState<SentimentMention[]>(() => {
    const saved = localStorage.getItem('eaaf_mentions_v3');
    if (!saved) return INITIAL_SENTIMENT_MENTIONS;
    try {
      const parsed = JSON.parse(saved) as SentimentMention[];
      const existingIds = new Set(parsed.map((m) => m.id));
      const missingSeeds = INITIAL_SENTIMENT_MENTIONS.filter((m) => !existingIds.has(m.id));
      return [...parsed, ...missingSeeds];
    } catch {
      return INITIAL_SENTIMENT_MENTIONS;
    }
  });

  const [painPoints, setPainPoints] = useState<UserPainPoint[]>(() => {
    const saved = localStorage.getItem('eaaf_pain_points_v1');
    return saved ? JSON.parse(saved) : INITIAL_PAIN_POINTS;
  });

  const [alertRules, setAlertRules] = useState<SentimentAlertRule[]>(() => {
    const saved = localStorage.getItem('eaaf_alert_rules_v1');
    return saved ? JSON.parse(saved) : INITIAL_ALERT_RULES;
  });

  const [sentimentSearchKeyword, setSentimentSearchKeyword] = useState<string>('');
  const [sentimentInitialSubTab, setSentimentInitialSubTab] = useState<
    SentimentSubTab | undefined
  >(undefined);

  useEffect(() => {
    localStorage.setItem('eaaf_platforms_v2', JSON.stringify(platforms));
  }, [platforms]);

  useEffect(() => {
    localStorage.setItem('eaaf_mentions_v3', JSON.stringify(mentions));
  }, [mentions]);

  useEffect(() => {
    localStorage.setItem('eaaf_pain_points_v1', JSON.stringify(painPoints));
  }, [painPoints]);

  useEffect(() => {
    localStorage.setItem('eaaf_alert_rules_v1', JSON.stringify(alertRules));
  }, [alertRules]);

  const notify = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2600);
  };

  const triggeredAlerts = useMemo(() => {
    return evaluateAlertRules(
      alertRules,
      platforms,
      mentions,
      INITIAL_SEVEN_DAY_SENTIMENT
    );
  }, [alertRules, platforms, mentions]);

  const handleAddMention = (mention: SentimentMention) => {
    setMentions((prev) => [mention, ...prev]);
    notify(`已完成「${mention.platformName}」輿情 AI 語意歸檔`);
  };

  const handleAddPainPoint = (painPoint: UserPainPoint) => {
    setPainPoints((prev) => [painPoint, ...prev]);
    notify(`已新增「${painPoint.stakeholder}」痛點觀察紀錄`);
  };

  const handleAddAlertRule = (rule: SentimentAlertRule) => {
    setAlertRules((prev) => [rule, ...prev]);
    notify(`已建立輿情警報規則「${rule.name}」`);
  };

  const handleToggleAlertRule = (ruleId: string) => {
    setAlertRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, enabled: !r.enabled } : r))
    );
  };

  const handleUpdateRuleThreshold = (ruleId: string, threshold: number) => {
    setAlertRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, threshold } : r))
    );
  };

  const handleDeleteAlertRule = (ruleId: string) => {
    setAlertRules((prev) => prev.filter((r) => r.id !== ruleId));
    notify('已刪除該輿情警報規則');
  };

  return (
    <div className="min-h-screen bg-[#060D1A] bg-tech-grid text-slate-100 flex">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0F1E36] border border-cyan-400/50 text-slate-100 text-xs font-medium px-4 py-2.5 rounded-lg shadow-xl flex items-center gap-2">
          <Check className="h-4 w-4 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        negativeAlertCount={triggeredAlerts.length}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar
          activeTab={activeTab}
          onOpenMobileNav={() => setMobileNavOpen(true)}
          onNavigateSentiment={() => {
            setSentimentInitialSubTab('alerts');
            setActiveTab('sentiment');
          }}
        />

        <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-8 py-6">
          {activeTab === 'dashboard' && (
            <DashboardView
              platforms={platforms}
              mentions={mentions}
              triggeredAlerts={triggeredAlerts}
              onNavigateTab={(tab, keyword, subTab) => {
                if (tab === 'sentiment') {
                  if (keyword) setSentimentSearchKeyword(keyword);
                  if (subTab) setSentimentInitialSubTab(subTab);
                }
                setActiveTab(tab);
              }}
            />
          )}

          {activeTab === 'sentiment' && (
            <SentimentMonitorView
              platforms={platforms}
              mentions={mentions}
              onAddMention={handleAddMention}
              initialSearchQuery={sentimentSearchKeyword}
              onClearInitialSearch={() => setSentimentSearchKeyword('')}
              initialSubTab={sentimentInitialSubTab}
              onClearInitialSubTab={() => setSentimentInitialSubTab(undefined)}
              alertRules={alertRules}
              triggeredAlerts={triggeredAlerts}
              onAddAlertRule={handleAddAlertRule}
              onToggleAlertRule={handleToggleAlertRule}
              onUpdateRuleThreshold={handleUpdateRuleThreshold}
              onDeleteAlertRule={handleDeleteAlertRule}
            />
          )}

          {activeTab === 'strategy' && (
            <StrategyResearchView
              platforms={platforms}
              painPoints={painPoints}
              onAddPainPoint={handleAddPainPoint}
            />
          )}

          {activeTab === 'competitive' && (
            <CompetitiveAnalysisView platforms={platforms} />
          )}

          {activeTab === 'ecosystem' && <EcosystemArchitectureView />}
        </main>
      </div>
    </div>
  );
}
