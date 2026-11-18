import React, { useState, useMemo } from 'react';
import {
  AlertRuleType,
  AlertSeverity,
  EdTechPlatform,
  MarketTrack,
  SentimentAlertRule,
  SentimentMention,
  SentimentPolarity,
  StakeholderType,
  TriggeredAlert,
} from '../types';
import {
  INITIAL_KEYWORD_CLOUD,
  ISSUE_CLUSTERS,
  ISSUE_DEEP_ANALYSES,
  SENTIMENT_DRIVERS,
} from '../data/edtechData';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  BellRing,
  CheckCircle2,
  Layers,
  MessageSquarePlus,
  MessageSquareText,
  MinusCircle,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import { doesMentionMatch, HighlightText } from '../utils/sentimentMatch';

export type SentimentSubTab = 'issues' | 'polarity' | 'feed' | 'alerts';

interface SentimentMonitorViewProps {
  platforms: EdTechPlatform[];
  mentions: SentimentMention[];
  onAddMention: (mention: SentimentMention) => void;
  initialSearchQuery?: string;
  onClearInitialSearch?: () => void;
  initialSubTab?: SentimentSubTab;
  onClearInitialSubTab?: () => void;
  alertRules: SentimentAlertRule[];
  triggeredAlerts: TriggeredAlert[];
  onAddAlertRule: (rule: SentimentAlertRule) => void;
  onToggleAlertRule: (ruleId: string) => void;
  onUpdateRuleThreshold: (ruleId: string, threshold: number) => void;
  onDeleteAlertRule: (ruleId: string) => void;
}

const STAKEHOLDERS: Array<'全部' | StakeholderType> = [
  '全部',
  '學生',
  '教師',
  '家長',
  '學校',
];

const POLARITIES: Array<'全部' | SentimentPolarity> = [
  '全部',
  '正面',
  '中立',
  '負面',
];

const RULE_TYPE_LABELS: Record<AlertRuleType, string> = {
  negative_ratio: '平台負面情緒占比 (%) ≥',
  net_sentiment_drop: '品牌淨情緒分數 (pt) ≤',
  keyword_match: '敏感關鍵詞出現筆數 ≥',
  daily_negative_spike: '單日負面聲量筆數 ≥',
};

export const SentimentMonitorView: React.FC<SentimentMonitorViewProps> = ({
  platforms,
  mentions,
  onAddMention,
  initialSearchQuery = '',
  onClearInitialSearch,
  initialSubTab,
  onClearInitialSubTab,
  alertRules,
  triggeredAlerts,
  onAddAlertRule,
  onToggleAlertRule,
  onUpdateRuleThreshold,
  onDeleteAlertRule,
}) => {
  const [subTab, setSubTab] = useState<SentimentSubTab>(
    initialSubTab || (initialSearchQuery ? 'feed' : 'issues')
  );
  const [selectedIssueId, setSelectedIssueId] = useState<string>(
    ISSUE_DEEP_ANALYSES[0].id
  );

  // Feed filters
  const [selectedPlatformId, setSelectedPlatformId] = useState<string>('all');
  const [selectedStakeholder, setSelectedStakeholder] = useState<'全部' | StakeholderType>('全部');
  const [selectedPolarity, setSelectedPolarity] = useState<'全部' | SentimentPolarity>('全部');
  const [searchQuery, setSearchQuery] = useState<string>(initialSearchQuery);

  React.useEffect(() => {
    if (initialSearchQuery) {
      setSearchQuery(initialSearchQuery);
      setSubTab('feed');
      onClearInitialSearch?.();
    }
  }, [initialSearchQuery, onClearInitialSearch]);

  React.useEffect(() => {
    if (initialSubTab) {
      setSubTab(initialSubTab);
      onClearInitialSubTab?.();
    }
  }, [initialSubTab, onClearInitialSubTab]);

  // AI Sentiment Analyzer State
  const [analyzePlatformId, setAnalyzePlatformId] = useState<string>(platforms[0]?.id || 'junyi');
  const [analyzeChannel, setAnalyzeChannel] = useState<string>('教師共備社群');
  const [rawText, setRawText] = useState<string>('');
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  // New Alert Rule Form State
  const [ruleName, setRuleName] = useState<string>('');
  const [ruleType, setRuleType] = useState<AlertRuleType>('negative_ratio');
  const [rulePlatformId, setRulePlatformId] = useState<string>('all');
  const [ruleThreshold, setRuleThreshold] = useState<number>(10);
  const [ruleKeyword, setRuleKeyword] = useState<string>('隱私,個資');
  const [ruleSeverity, setRuleSeverity] = useState<AlertSeverity>('高風險');
  const [ruleChannel, setRuleChannel] = useState<string>('研究團隊即時儀表板');

  const activeIssue = useMemo(() => {
    return (
      ISSUE_DEEP_ANALYSES.find((iss) => iss.id === selectedIssueId) ||
      ISSUE_DEEP_ANALYSES[0]
    );
  }, [selectedIssueId]);

  const issueOverviewChartData = useMemo(() => {
    return ISSUE_DEEP_ANALYSES.map((iss) => ({
      name: iss.title.length > 9 ? `${iss.title.slice(0, 9)}…` : iss.title,
      討論聲量: iss.totalVolume,
      成長率: iss.growthDelta,
    }));
  }, []);

  const platformSentimentChartData = useMemo(() => {
    return [...platforms]
      .map((p) => ({
        name: p.shortName,
        正面情緒: p.sentimentPositive,
        負面情緒: p.sentimentNegative,
        淨情緒分數: p.sentimentPositive - p.sentimentNegative,
      }))
      .sort((a, b) => b.淨情緒分數 - a.淨情緒分數);
  }, [platforms]);

  const sentimentMetrics = useMemo(() => {
    const count = platforms.length || 1;
    const avgPos = Math.round(
      platforms.reduce((s, p) => s + p.sentimentPositive, 0) / count
    );
    const avgNeg = Math.round(
      platforms.reduce((s, p) => s + p.sentimentNegative, 0) / count
    );
    const avgNss = avgPos - avgNeg;
    const topPlat = [...platforms].sort(
      (a, b) =>
        b.sentimentPositive -
        b.sentimentNegative -
        (a.sentimentPositive - a.sentimentNegative)
    )[0];
    return { avgPos, avgNeg, avgNss, topPlat };
  }, [platforms]);

  const positiveDrivers = useMemo(
    () => SENTIMENT_DRIVERS.filter((d) => d.polarity === '正面'),
    []
  );
  const negativeDrivers = useMemo(
    () => SENTIMENT_DRIVERS.filter((d) => d.polarity === '負面'),
    []
  );

  const filteredMentions = useMemo(() => {
    return mentions.filter((m) => {
      if (selectedPlatformId !== 'all' && m.platformId !== selectedPlatformId) return false;
      if (selectedStakeholder !== '全部' && m.stakeholder !== selectedStakeholder) return false;
      if (selectedPolarity !== '全部' && m.polarity !== selectedPolarity) return false;
      if (searchQuery.trim() && !doesMentionMatch(m, searchQuery)) return false;
      return true;
    });
  }, [mentions, selectedPlatformId, selectedStakeholder, selectedPolarity, searchQuery]);

  const polaritySummary = useMemo(() => {
    const pos = filteredMentions.filter((m) => m.polarity === '正面').length;
    const neu = filteredMentions.filter((m) => m.polarity === '中立').length;
    const neg = filteredMentions.filter((m) => m.polarity === '負面').length;
    return { pos, neu, neg, total: filteredMentions.length };
  }, [filteredMentions]);

  const alertStats = useMemo(() => {
    const enabledCount = alertRules.filter((r) => r.enabled).length;
    const highRiskCount = triggeredAlerts.filter((a) => a.severity === '高風險').length;
    const mediumCount = triggeredAlerts.filter((a) => a.severity === '中度注意').length;
    return { enabledCount, highRiskCount, mediumCount };
  }, [alertRules, triggeredAlerts]);

  const handleAnalyzeAndLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawText.trim()) return;
    setAnalyzing(true);
    setAnalyzeError(null);

    const targetPlatform = platforms.find((p) => p.id === analyzePlatformId) || platforms[0];
    try {
      const res = await fetch('/api/ai-sentiment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platformName: targetPlatform.name,
          channel: analyzeChannel,
          rawText: rawText.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || '輿情語意判讀失敗');
      }

      const now = new Date();
      const ts = `${now.toISOString().slice(0, 10)} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const validPolarity: SentimentPolarity =
        data.polarity === '正面' || data.polarity === '負面' || data.polarity === '中立'
          ? data.polarity
          : '中立';
      const validStakeholder: StakeholderType =
        data.stakeholder === '學生' ||
        data.stakeholder === '教師' ||
        data.stakeholder === '家長' ||
        data.stakeholder === '學校'
          ? data.stakeholder
          : '教師';
      const validTrack: MarketTrack =
        data.track === '教育新創平台' ||
        data.track === 'AI Tutor' ||
        data.track === 'Multi-Agent' ||
        data.track === '教育 AI 市場'
          ? data.track
          : '教育新創平台';

      onAddMention({
        id: `mnt_${Date.now()}`,
        timestamp: ts,
        platformId: targetPlatform.id,
        platformName: targetPlatform.name,
        channel: analyzeChannel,
        stakeholder: validStakeholder,
        track: validTrack,
        polarity: validPolarity,
        topicTag: data.topicTag || '社群即時回饋',
        excerpt: rawText.trim(),
        aiInsight: data.aiInsight || '已完成語意極性與使用者角色歸類。',
        engagement: 1,
      });

      setRawText('');
    } catch (err: any) {
      setAnalyzeError(err.message || '連線錯誤');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleName.trim()) return;
    onAddAlertRule({
      id: `alr_${Date.now()}`,
      name: ruleName.trim(),
      ruleType,
      targetPlatformId: rulePlatformId,
      threshold: Number(ruleThreshold) || 1,
      keyword: ruleType === 'keyword_match' ? ruleKeyword.trim() : '',
      severity: ruleSeverity,
      enabled: true,
      notifyChannel: ruleChannel.trim() || '研究團隊即時儀表板',
      createdAt: new Date().toISOString().slice(0, 10),
    });
    setRuleName('');
  };

  return (
    <div className="space-y-6">
      {/* Header & Sub-Tab Switcher */}
      <section className="bg-[#0B1528] border border-sky-900/40 rounded-xl p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="text-xs text-slate-400">
              四大構面深度追蹤 · 議題分析 × 正負情緒歸因 × 社群原文 AI 判讀 × 輿情警報
            </div>
            <h1 className="font-display text-xl font-bold text-slate-50 mt-0.5">
              議題分析與正負情緒監測中心
            </h1>
          </div>

          <div
            className="flex flex-wrap items-center gap-1 p-1 rounded-lg bg-[#060D1A] border border-sky-900/50"
            role="tablist"
            aria-label="輿情分析子頁籤"
          >
            <button
              type="button"
              onClick={() => setSubTab('issues')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                subTab === 'issues'
                  ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/40'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>議題分析</span>
            </button>
            <button
              type="button"
              onClick={() => setSubTab('polarity')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                subTab === 'polarity'
                  ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/40'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              <span>正負情緒分析</span>
            </button>
            <button
              type="button"
              onClick={() => setSubTab('feed')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                subTab === 'feed'
                  ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/40'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              <MessageSquareText className="h-3.5 w-3.5" />
              <span>社群原文與 AI 判讀 ({mentions.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setSubTab('alerts')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                subTab === 'alerts'
                  ? 'bg-amber-500/20 text-amber-200 border border-amber-400/40'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              <BellRing className="h-3.5 w-3.5" />
              <span>輿情警報設置 ({triggeredAlerts.length})</span>
            </button>
          </div>
        </div>

        {/* Feed-Only Filter Toolbar & Hover-Scale Quick Keyword Cloud */}
        {subTab === 'feed' && (
          <div className="space-y-3 pt-3 border-t border-sky-900/40">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              <div className="md:col-span-3">
                <select
                  value={selectedPlatformId}
                  onChange={(e) => setSelectedPlatformId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#060D1A] border border-sky-800/60 text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
                  aria-label="依平台篩選"
                >
                  <option value="all">全部平台（9 家樣本）</option>
                  {platforms.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.region})
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-4 flex flex-wrap gap-1 p-1 rounded-lg bg-[#060D1A] border border-sky-900/50">
                {STAKEHOLDERS.map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setSelectedStakeholder(st)}
                    className={`flex-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                      selectedStakeholder === st
                        ? 'bg-cyan-500/20 text-cyan-200'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              <div className="md:col-span-3 flex gap-1 p-1 rounded-lg bg-[#060D1A] border border-sky-900/50">
                {POLARITIES.map((pol) => (
                  <button
                    key={pol}
                    type="button"
                    onClick={() => setSelectedPolarity(pol)}
                    className={`flex-1 px-2 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                      selectedPolarity === pol
                        ? 'bg-sky-500/20 text-sky-200'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {pol}
                  </button>
                ))}
              </div>

              <div className="md:col-span-2 relative">
                <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜尋議題關鍵字..."
                  className="w-full pl-8 pr-3 py-2 rounded-lg bg-[#060D1A] border border-sky-800/60 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            {/* Interactive Keyword Cloud Filter Strip with Hover Scale */}
            <div className="rounded-lg bg-[#071020] border border-sky-900/35 px-3.5 py-2.5 flex flex-wrap items-center gap-x-3 gap-y-2">
              <span className="text-[11px] text-slate-400 shrink-0">
                關鍵詞雲快速過濾與高亮：
              </span>
              {INITIAL_KEYWORD_CLOUD.slice(0, 12).map((kw) => {
                const isActive =
                  searchQuery.trim().toLowerCase() === kw.word.toLowerCase();
                return (
                  <button
                    key={kw.id}
                    type="button"
                    onClick={() =>
                      setSearchQuery(isActive ? '' : kw.word)
                    }
                    className={`px-2 py-0.5 rounded-md text-xs origin-center transform transition-transform duration-200 ease-out hover:scale-120 cursor-pointer ${
                      isActive
                        ? 'bg-cyan-500/25 text-cyan-100 ring-1 ring-cyan-400/60 font-semibold scale-110'
                        : kw.polarity === '正面'
                        ? 'text-emerald-300 hover:bg-slate-800/70'
                        : kw.polarity === '負面'
                        ? 'text-rose-300 hover:bg-slate-800/70'
                        : 'text-sky-300 hover:bg-slate-800/70'
                    }`}
                  >
                    {kw.word}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* SUB-TAB 1: 議題分析 */}
      {subTab === 'issues' && (
        <div className="space-y-6">
          <section className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
            {/* Left: Issue Selector + Overview BarChart */}
            <div className="xl:col-span-5 bg-[#0B1528] border border-sky-900/40 rounded-xl p-5 flex flex-col justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-slate-100">
                  四大焦點議題聲量對比與生命週期選擇
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  點選任一議題卡片，右側展開 7 日聲量曲線、推力與阻力深度歸因
                </p>
              </div>

              <div className="w-full h-52 bg-[#071020] rounded-lg border border-sky-900/30 p-3">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={issueOverviewChartData}
                    margin={{ top: 8, right: 12, left: -14, bottom: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(56, 189, 248, 0.12)" />
                    <XAxis
                      dataKey="name"
                      stroke="#94A3B8"
                      tick={{ fill: '#94A3B8', fontSize: 10 }}
                    />
                    <YAxis
                      stroke="#94A3B8"
                      tick={{ fill: '#94A3B8', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#060D1A',
                        borderColor: 'rgba(34, 211, 238, 0.45)',
                        borderRadius: '8px',
                        fontSize: '12px',
                        color: '#F1F5F9',
                      }}
                    />
                    <Bar dataKey="討論聲量" fill="#22D3EE" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2.5">
                {ISSUE_DEEP_ANALYSES.map((iss) => {
                  const isActive = iss.id === activeIssue.id;
                  return (
                    <button
                      key={iss.id}
                      type="button"
                      onClick={() => setSelectedIssueId(iss.id)}
                      className={`w-full text-left p-3.5 rounded-lg border transition-colors cursor-pointer space-y-1.5 ${
                        isActive
                          ? 'bg-cyan-500/12 border-cyan-400/50'
                          : 'bg-[#071020] border-sky-900/35 hover:bg-[#0D1C34]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-semibold text-slate-100">{iss.title}</span>
                        <span className="font-mono-num text-emerald-300 shrink-0">
                          +{iss.growthDelta}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono-num">
                        <span>
                          {iss.track} · {iss.dominantStakeholder}主導
                        </span>
                        <span>
                          聲量 {iss.totalVolume.toLocaleString()} · 正向 {iss.positivePct}%
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right: Selected Issue Deep Dive */}
            <div className="xl:col-span-7 bg-[#0B1528] border border-sky-900/40 rounded-xl p-5 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pb-4 border-b border-sky-900/40">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    <span className="text-cyan-300 font-medium">{activeIssue.track}</span>
                    <span aria-hidden="true">·</span>
                    <span>主要利害關係人：{activeIssue.dominantStakeholder}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono-num text-emerald-300">
                      近週聲量 +{activeIssue.growthDelta}%
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-50 mt-1">
                    {activeIssue.title}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery(activeIssue.title.slice(0, 4));
                    setSubTab('feed');
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-400/40 text-sky-200 text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>檢視相關原文</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* 7-day Issue Volume AreaChart */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-cyan-400" />
                    議題近 7 日討論熱度擴散曲線（Recharts）
                  </span>
                  <span className="font-mono-num text-slate-400">
                    總討論筆數：{activeIssue.totalVolume.toLocaleString()}
                  </span>
                </div>
                <div className="w-full h-56 bg-[#071020] rounded-lg border border-sky-900/35 p-3">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={activeIssue.dailyTrend}
                      margin={{ top: 10, right: 14, left: -14, bottom: 4 }}
                    >
                      <defs>
                        <linearGradient id="issueCyanGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22D3EE" stopOpacity={0.45} />
                          <stop offset="95%" stopColor="#22D3EE" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(56, 189, 248, 0.12)" />
                      <XAxis
                        dataKey="date"
                        stroke="#94A3B8"
                        tick={{ fill: '#94A3B8', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                      />
                      <YAxis
                        stroke="#94A3B8"
                        tick={{ fill: '#94A3B8', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#060D1A',
                          borderColor: 'rgba(34, 211, 238, 0.45)',
                          borderRadius: '8px',
                          fontSize: '12px',
                          color: '#F1F5F9',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="volume"
                        name="單日討論聲量"
                        stroke="#22D3EE"
                        strokeWidth={2.5}
                        fill="url(#issueCyanGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Sentiment Composition Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono-num">
                  <span className="text-slate-300 font-medium">議題情感極性分佈</span>
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-300">正面 {activeIssue.positivePct}%</span>
                    <span className="text-sky-300">中立 {activeIssue.neutralPct}%</span>
                    <span className="text-rose-300">負面 {activeIssue.negativePct}%</span>
                  </div>
                </div>
                <div className="h-2.5 w-full rounded-sm overflow-hidden flex bg-[#060D1A]">
                  <div
                    className="bg-emerald-500/80"
                    style={{ width: `${activeIssue.positivePct}%` }}
                  />
                  <div
                    className="bg-sky-500/45"
                    style={{ width: `${activeIssue.neutralPct}%` }}
                  />
                  <div
                    className="bg-rose-500/80"
                    style={{ width: `${activeIssue.negativePct}%` }}
                  />
                </div>
              </div>

              {/* Research Summary & Top Platforms */}
              <div className="rounded-lg bg-[#071020] border border-sky-900/35 p-4 space-y-2 text-xs">
                <div className="text-slate-400">
                  主要討論關聯平台：
                  <span className="text-cyan-200 font-medium">
                    {activeIssue.topPlatforms.join(' · ')}
                  </span>
                </div>
                <p className="text-sm text-slate-200 leading-relaxed">
                  {activeIssue.summary}
                </p>
              </div>

              {/* Positive vs Negative Drivers within Issue */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-lg bg-[#071020] border border-emerald-500/25 p-4 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-300">
                    <ThumbsUp className="h-3.5 w-3.5" />
                    <span>正向採用推力</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-200 list-disc pl-4 leading-relaxed">
                    {activeIssue.positiveDrivers.map((drv, idx) => (
                      <li key={idx}>{drv}</li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-lg bg-[#071020] border border-rose-500/25 p-4 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-300">
                    <ThumbsDown className="h-3.5 w-3.5" />
                    <span>負向導入阻力</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-200 list-disc pl-4 leading-relaxed">
                    {activeIssue.negativeDrivers.map((drv, idx) => (
                      <li key={idx}>{drv}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* SUB-TAB 2: 正負情緒分析 */}
      {subTab === 'polarity' && (
        <div className="space-y-6">
          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="bg-[#0B1528] border border-sky-900/40 rounded-xl p-5">
              <div className="text-xs text-slate-400">全樣本平均正向情緒</div>
              <div className="mt-2 font-mono-num text-2xl font-bold text-emerald-300">
                {sentimentMetrics.avgPos}%
              </div>
              <div className="mt-1 text-xs text-slate-400">
                涵蓋 9 家台灣與國際標竿平台
              </div>
            </div>

            <div className="bg-[#0B1528] border border-sky-900/40 rounded-xl p-5">
              <div className="text-xs text-slate-400">全樣本平均負向情緒</div>
              <div className="mt-2 font-mono-num text-2xl font-bold text-rose-300">
                {sentimentMetrics.avgNeg}%
              </div>
              <div className="mt-1 text-xs text-slate-400">
                主要集中於隱私合規與內容準確度
              </div>
            </div>

            <div className="bg-[#0B1528] border border-sky-900/40 rounded-xl p-5">
              <div className="text-xs text-slate-400">淨情緒分數 (Net Sentiment)</div>
              <div className="mt-2 font-mono-num text-2xl font-bold text-cyan-300">
                +{sentimentMetrics.avgNss} pt
              </div>
              <div className="mt-1 text-xs text-slate-400">
                計算基準：正向占比 − 負向占比
              </div>
            </div>

            <div className="bg-[#0B1528] border border-sky-900/40 rounded-xl p-5">
              <div className="text-xs text-slate-400">口碑領先標竿平台</div>
              <div className="mt-2 text-lg font-bold text-slate-50 truncate">
                {sentimentMetrics.topPlat?.shortName}
              </div>
              <div className="mt-1 text-xs font-mono-num text-emerald-300">
                淨情緒 +
                {sentimentMetrics.topPlat
                  ? sentimentMetrics.topPlat.sentimentPositive -
                    sentimentMetrics.topPlat.sentimentNegative
                  : 0}{' '}
                pt · 正向 {sentimentMetrics.topPlat?.sentimentPositive}%
              </div>
            </div>
          </section>

          <section className="bg-[#0B1528] border border-sky-900/40 rounded-xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h2 className="text-base font-semibold text-slate-100">
                  各教育平台正負情緒與淨情緒分數對比（Recharts）
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  依淨情緒分數（正向 % − 負向 %）由高至低排序，檢視品牌信任度差距
                </p>
              </div>
              <span className="text-xs font-mono-num text-slate-400">
                單位：百分比 (%) / 淨情緒點數 (pt)
              </span>
            </div>

            <div className="w-full h-80 bg-[#071020] rounded-lg border border-sky-900/35 p-3">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={platformSentimentChartData}
                  margin={{ top: 12, right: 16, left: -12, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(56, 189, 248, 0.12)" />
                  <XAxis
                    dataKey="name"
                    stroke="#94A3B8"
                    tick={{ fill: '#94A3B8', fontSize: 11 }}
                  />
                  <YAxis
                    stroke="#94A3B8"
                    domain={[0, 100]}
                    tick={{ fill: '#94A3B8', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#060D1A',
                      borderColor: 'rgba(34, 211, 238, 0.45)',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: '#F1F5F9',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '6px' }} />
                  <Bar dataKey="正面情緒" fill="#10B981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="淨情緒分數" fill="#22D3EE" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="負面情緒" fill="#F43F5E" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-[#0B1528] border border-sky-900/40 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-sky-900/40">
                <div className="flex items-center gap-2">
                  <ThumbsUp className="h-4 w-4 text-emerald-400" />
                  <h2 className="text-base font-semibold text-slate-100">
                    正面口碑驅動因子歸因
                  </h2>
                </div>
                <span className="text-xs font-mono-num text-emerald-300">
                  影響力權重 0–100
                </span>
              </div>

              <div className="space-y-3">
                {positiveDrivers.map((drv) => (
                  <article
                    key={drv.id}
                    className="rounded-lg bg-[#071020] border border-emerald-500/20 p-4 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-[11px] text-emerald-300 font-medium">
                          {drv.category} · 關聯：{drv.platformsAffected.join(' / ')}
                        </div>
                        <h3 className="text-sm font-semibold text-slate-100 mt-0.5">
                          {drv.factor}
                        </h3>
                      </div>
                      <div className="text-right font-mono-num shrink-0">
                        <div className="text-xs font-semibold text-emerald-300">
                          影響力 {drv.impactScore}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {drv.mentionCount.toLocaleString()} 筆提及
                        </div>
                      </div>
                    </div>

                    <div className="h-1.5 w-full bg-[#060D1A] rounded-sm overflow-hidden">
                      <div
                        className="h-full bg-emerald-400/80"
                        style={{ width: `${drv.impactScore}%` }}
                      />
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      代表語句：「{drv.representativeQuote}」
                    </p>
                  </article>
                ))}
              </div>
            </div>

            <div className="bg-[#0B1528] border border-sky-900/40 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-sky-900/40">
                <div className="flex items-center gap-2">
                  <ThumbsDown className="h-4 w-4 text-rose-400" />
                  <h2 className="text-base font-semibold text-slate-100">
                    負面摩擦與阻力因子歸因
                  </h2>
                </div>
                <span className="text-xs font-mono-num text-rose-300">
                  風險強度 0–100
                </span>
              </div>

              <div className="space-y-3">
                {negativeDrivers.map((drv) => (
                  <article
                    key={drv.id}
                    className="rounded-lg bg-[#071020] border border-rose-500/20 p-4 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-[11px] text-rose-300 font-medium">
                          {drv.category} · 影響對象：{drv.platformsAffected.join(' / ')}
                        </div>
                        <h3 className="text-sm font-semibold text-slate-100 mt-0.5">
                          {drv.factor}
                        </h3>
                      </div>
                      <div className="text-right font-mono-num shrink-0">
                        <div className="text-xs font-semibold text-rose-300">
                          強度 {drv.impactScore}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {drv.mentionCount.toLocaleString()} 筆提及
                        </div>
                      </div>
                    </div>

                    <div className="h-1.5 w-full bg-[#060D1A] rounded-sm overflow-hidden">
                      <div
                        className="h-full bg-rose-400/80"
                        style={{ width: `${drv.impactScore}%` }}
                      />
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      代表語句：「{drv.representativeQuote}」
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </section>
        </div>
      )}

      {/* SUB-TAB 3: 社群原文與 AI 判讀 */}
      {subTab === 'feed' && (
        <section className="grid grid-cols-1 xl:grid-cols-12 gap-5">
          {/* Left Column: Hot Issue Clusters & AI Classifier */}
          <div className="xl:col-span-5 space-y-5">
            <div className="bg-[#0B1528] border border-sky-900/40 rounded-xl p-5 space-y-4">
              <div>
                <h2 className="text-base font-semibold text-slate-100">
                  核心討論議題聚類排行
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  點選任一議題可快速過濾並高亮右側社群原文清單
                </p>
              </div>

              <div className="space-y-3">
                {ISSUE_CLUSTERS.map((cluster) => (
                  <button
                    key={cluster.id}
                    type="button"
                    onClick={() => setSearchQuery(cluster.keyword.slice(0, 4))}
                    className="w-full text-left p-3.5 rounded-lg bg-[#071020] hover:bg-[#0D1C34] border border-sky-900/35 transition-colors space-y-2 cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-semibold text-slate-100">
                        {cluster.keyword}
                      </span>
                      <span className="font-mono-num text-emerald-300 shrink-0">
                        +{cluster.growthDelta}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono-num">
                      <span>主線：{cluster.track}</span>
                      <span>
                        聲量 {cluster.volume} · 正向 {cluster.positiveShare}% / 負向{' '}
                        {cluster.negativeShare}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-[#060D1A] rounded-sm overflow-hidden flex">
                      <div
                        className="bg-emerald-500/80"
                        style={{ width: `${cluster.positiveShare}%` }}
                      />
                      <div
                        className="bg-sky-500/40"
                        style={{
                          width: `${100 - cluster.positiveShare - cluster.negativeShare}%`,
                        }}
                      />
                      <div
                        className="bg-rose-500/80"
                        style={{ width: `${cluster.negativeShare}%` }}
                      />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <form
              onSubmit={handleAnalyzeAndLog}
              className="bg-[#0B1528] border border-sky-900/40 rounded-xl p-5 space-y-3.5"
            >
              <div className="flex items-center gap-2 text-sm font-semibold text-cyan-300">
                <Sparkles className="h-4 w-4" />
                <span>新增社群輿情樣本與 AI 語意判讀</span>
              </div>
              <p className="text-xs text-slate-400">
                貼上社群貼文、App 評論或教師訪談逐字稿，系統將自動判別情緒極性、利害關係人與研究洞察。
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    提及教育平台
                  </label>
                  <select
                    value={analyzePlatformId}
                    onChange={(e) => setAnalyzePlatformId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#060D1A] border border-sky-800/60 text-xs text-slate-100"
                  >
                    {platforms.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    來源管道
                  </label>
                  <input
                    type="text"
                    value={analyzeChannel}
                    onChange={(e) => setAnalyzeChannel(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#060D1A] border border-sky-800/60 text-xs text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  輿情原文內容
                </label>
                <textarea
                  rows={3}
                  required
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="例如：我們學校導入自適應英語檢測後，老師能清楚看見學生口說停頓點，但家長還是擔心語音資料儲存是否符合教育雲規範。"
                  className="w-full px-3 py-2 rounded-lg bg-[#060D1A] border border-sky-800/60 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              {analyzeError && (
                <div className="text-xs text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-2">
                  {analyzeError}
                </div>
              )}

              <button
                type="submit"
                disabled={analyzing}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
              >
                {analyzing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>AI 語意分析與歸檔中...</span>
                  </>
                ) : (
                  <>
                    <MessageSquarePlus className="h-4 w-4" />
                    <span>執行 AI 輿情判讀並加入監測清單</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Column: Live Mentions Stream with Highlighting */}
          <div className="xl:col-span-7 bg-[#0B1528] border border-sky-900/40 rounded-xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-sky-900/40">
              <div>
                <h2 className="text-base font-semibold text-slate-100">
                  社群輿情即時語意串流清單
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  篩選筆數 {polaritySummary.total} · 正面 {polaritySummary.pos} / 中立{' '}
                  {polaritySummary.neu} / 負面 {polaritySummary.neg}
                  {searchQuery.trim() && (
                    <span className="text-cyan-300 ml-2">
                      · 已高亮匹配「{searchQuery}」
                    </span>
                  )}
                </p>
              </div>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-xs text-cyan-300 hover:underline cursor-pointer self-start sm:self-auto"
                >
                  清除搜尋「{searchQuery}」
                </button>
              )}
            </div>

            {filteredMentions.length === 0 ? (
              <div className="rounded-lg bg-[#071020] border border-sky-900/35 p-10 text-center space-y-2">
                <p className="text-sm font-medium text-slate-200">
                  查無符合篩選條件的輿情紀錄
                </p>
                <p className="text-xs text-slate-400">
                  請嘗試切換平台、情緒或角色篩選，或於左側新增輿情觀察樣本。
                </p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {filteredMentions.map((m) => {
                  const isHighlighted = Boolean(searchQuery.trim());
                  return (
                    <article
                      key={m.id}
                      className={`rounded-lg border p-4 space-y-2.5 transition-colors ${
                        isHighlighted
                          ? 'bg-[#0A172D] border-cyan-400/50'
                          : 'bg-[#071020] border-sky-900/40'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="font-semibold text-cyan-300">
                            <HighlightText text={m.platformName} query={searchQuery} />
                          </span>
                          <span className="text-slate-600" aria-hidden="true">
                            ·
                          </span>
                          <span className="text-slate-300">
                            <HighlightText text={m.channel} query={searchQuery} />
                          </span>
                          <span className="text-slate-600" aria-hidden="true">
                            ·
                          </span>
                          <span className="text-slate-300">{m.stakeholder}視角</span>
                          <span className="text-slate-600" aria-hidden="true">
                            ·
                          </span>
                          <span className="text-slate-400">{m.track}</span>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 text-xs">
                          <span className="font-mono-num text-slate-500">
                            {m.timestamp}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 font-semibold ${
                              m.polarity === '正面'
                                ? 'text-emerald-300'
                                : m.polarity === '負面'
                                ? 'text-rose-300'
                                : 'text-sky-300'
                            }`}
                          >
                            {m.polarity === '正面' && <ThumbsUp className="h-3.5 w-3.5" />}
                            {m.polarity === '負面' && <ThumbsDown className="h-3.5 w-3.5" />}
                            {m.polarity === '中立' && <MinusCircle className="h-3.5 w-3.5" />}
                            <span>{m.polarity}</span>
                          </span>
                        </div>
                      </div>

                      <p className="text-sm text-slate-100 leading-relaxed">
                        「<HighlightText text={m.excerpt} query={searchQuery} />」
                      </p>

                      <div className="rounded-lg bg-[#0B1528] border border-sky-900/35 px-3.5 py-2.5 text-xs space-y-1">
                        <div className="flex items-center justify-between text-cyan-300 font-medium">
                          <span>
                            議題標籤：
                            <HighlightText text={m.topicTag} query={searchQuery} />
                          </span>
                          <span className="font-mono-num text-slate-400">
                            互動熱度 {m.engagement}
                          </span>
                        </div>
                        <p className="text-slate-300 leading-relaxed">
                          研究判讀：
                          <HighlightText text={m.aiInsight} query={searchQuery} />
                        </p>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {/* SUB-TAB 4: 輿情警報設置 */}
      {subTab === 'alerts' && (
        <div className="space-y-6">
          {/* 4-Column Alert Status Summary */}
          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="bg-[#0B1528] border border-sky-900/40 rounded-xl p-5">
              <div className="text-xs text-slate-400">已啟用監測規則</div>
              <div className="mt-2 font-mono-num text-2xl font-bold text-cyan-300">
                {alertStats.enabledCount} / {alertRules.length}
              </div>
              <div className="mt-1 text-xs text-slate-400">
                即時比對 9 家平台與 7 日聲量趨勢
              </div>
            </div>

            <div className="bg-[#0B1528] border border-sky-900/40 rounded-xl p-5">
              <div className="text-xs text-slate-400">目前觸發警報總數</div>
              <div className="mt-2 font-mono-num text-2xl font-bold text-amber-300">
                {triggeredAlerts.length} 項
              </div>
              <div className="mt-1 text-xs text-slate-400">
                調整閾值或新增規則將立即重新計算
              </div>
            </div>

            <div className="bg-[#0B1528] border border-sky-900/40 rounded-xl p-5">
              <div className="text-xs text-slate-400">高風險警戒項目</div>
              <div className="mt-2 font-mono-num text-2xl font-bold text-rose-300">
                {alertStats.highRiskCount} 項
              </div>
              <div className="mt-1 text-xs text-slate-400">
                建議優先檢視負面占比與個資合規詞
              </div>
            </div>

            <div className="bg-[#0B1528] border border-sky-900/40 rounded-xl p-5">
              <div className="text-xs text-slate-400">中度注意項目</div>
              <div className="mt-2 font-mono-num text-2xl font-bold text-sky-300">
                {alertStats.mediumCount} 項
              </div>
              <div className="mt-1 text-xs text-slate-400">
                追蹤品牌淨情緒與單日聲量波動
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-12 gap-5">
            {/* Left: Create Alert Rule + Rules Management */}
            <div className="xl:col-span-6 space-y-5">
              <form
                onSubmit={handleCreateRule}
                className="bg-[#0B1528] border border-sky-900/40 rounded-xl p-5 space-y-4"
              >
                <div className="flex items-center gap-2 text-sm font-semibold text-cyan-300">
                  <Plus className="h-4 w-4" />
                  <span>新增輿情警報規則</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      規則名稱
                    </label>
                    <input
                      type="text"
                      required
                      value={ruleName}
                      onChange={(e) => setRuleName(e.target.value)}
                      placeholder="例如：英語檢測負評異常警報"
                      className="w-full px-3 py-2 rounded-lg bg-[#060D1A] border border-sky-800/60 text-xs text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      監測條件類型
                    </label>
                    <select
                      value={ruleType}
                      onChange={(e) => {
                        const nextType = e.target.value as AlertRuleType;
                        setRuleType(nextType);
                        if (nextType === 'negative_ratio') setRuleThreshold(10);
                        if (nextType === 'net_sentiment_drop') setRuleThreshold(55);
                        if (nextType === 'daily_negative_spike') setRuleThreshold(85);
                        if (nextType === 'keyword_match') setRuleThreshold(1);
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-[#060D1A] border border-sky-800/60 text-xs text-slate-100"
                    >
                      <option value="negative_ratio">平台負面情緒占比 (%) ≥</option>
                      <option value="net_sentiment_drop">品牌淨情緒分數 (pt) ≤</option>
                      <option value="keyword_match">敏感關鍵詞出現筆數 ≥</option>
                      <option value="daily_negative_spike">單日負面聲量筆數 ≥</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      監測對象範圍
                    </label>
                    <select
                      value={rulePlatformId}
                      onChange={(e) => setRulePlatformId(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-[#060D1A] border border-sky-800/60 text-xs text-slate-100"
                    >
                      <option value="all">全部平台（9 家）</option>
                      {platforms.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      觸發閾值
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={500}
                      value={ruleThreshold}
                      onChange={(e) => setRuleThreshold(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg bg-[#060D1A] border border-sky-800/60 text-xs font-mono-num text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      警報嚴重等級
                    </label>
                    <select
                      value={ruleSeverity}
                      onChange={(e) => setRuleSeverity(e.target.value as AlertSeverity)}
                      className="w-full px-3 py-2 rounded-lg bg-[#060D1A] border border-sky-800/60 text-xs text-slate-100"
                    >
                      <option value="高風險">高風險</option>
                      <option value="中度注意">中度注意</option>
                    </select>
                  </div>
                </div>

                {ruleType === 'keyword_match' && (
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      監測敏感關鍵詞（可用逗號分隔多組詞彙）
                    </label>
                    <input
                      type="text"
                      required
                      value={ruleKeyword}
                      onChange={(e) => setRuleKeyword(e.target.value)}
                      placeholder="例如：個資,隱私,幻覺,代寫"
                      className="w-full px-3 py-2 rounded-lg bg-[#060D1A] border border-sky-800/60 text-xs text-slate-100"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    預警通知管道
                  </label>
                  <input
                    type="text"
                    value={ruleChannel}
                    onChange={(e) => setRuleChannel(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#060D1A] border border-sky-800/60 text-xs text-slate-100"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <BellRing className="h-4 w-4" />
                  <span>建立警報規則並立即套用監測</span>
                </button>
              </form>

              {/* Existing Rules List */}
              <div className="bg-[#0B1528] border border-sky-900/40 rounded-xl p-5 space-y-3.5">
                <h2 className="text-base font-semibold text-slate-100">
                  已設定輿情警報規則清單
                </h2>
                <div className="space-y-3">
                  {alertRules.map((rule) => {
                    const scopeName =
                      rule.targetPlatformId === 'all'
                        ? '全部平台'
                        : platforms.find((p) => p.id === rule.targetPlatformId)?.shortName ||
                          rule.targetPlatformId;
                    return (
                      <div
                        key={rule.id}
                        className={`rounded-lg border p-3.5 space-y-2.5 ${
                          rule.enabled
                            ? 'bg-[#071020] border-sky-900/40'
                            : 'bg-[#060D1A] border-slate-800/70 opacity-65'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex flex-wrap items-center gap-2 text-[11px]">
                              <span
                                className={
                                  rule.severity === '高風險'
                                    ? 'text-rose-300 font-semibold'
                                    : 'text-amber-300 font-semibold'
                                }
                              >
                                {rule.severity}
                              </span>
                              <span className="text-slate-600" aria-hidden="true">
                                ·
                              </span>
                              <span className="text-slate-400">{scopeName}</span>
                              <span className="text-slate-600" aria-hidden="true">
                                ·
                              </span>
                              <span className="text-slate-400">{rule.notifyChannel}</span>
                            </div>
                            <h3 className="text-sm font-semibold text-slate-100 mt-0.5">
                              {rule.name}
                            </h3>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => onToggleAlertRule(rule.id)}
                              className={`px-2.5 py-1 rounded-md text-[11px] font-medium border cursor-pointer ${
                                rule.enabled
                                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                                  : 'bg-slate-800 border-slate-700 text-slate-400'
                              }`}
                            >
                              {rule.enabled ? '啟用中' : '已停用'}
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteAlertRule(rule.id)}
                              aria-label={`刪除規則 ${rule.name}`}
                              className="p-1.5 rounded-md text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-sky-900/30 text-xs">
                          <span className="text-slate-300">
                            條件：{RULE_TYPE_LABELS[rule.ruleType]}{' '}
                            <strong className="font-mono-num text-cyan-300">
                              {rule.threshold}
                            </strong>
                            {rule.keyword && (
                              <span className="text-slate-400 ml-2">
                                （監測詞：{rule.keyword}）
                              </span>
                            )}
                          </span>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                onUpdateRuleThreshold(
                                  rule.id,
                                  Math.max(1, rule.threshold - 1)
                                )
                              }
                              className="px-2 py-0.5 rounded bg-[#0B1528] border border-sky-800/60 text-slate-200 hover:border-cyan-400 cursor-pointer"
                            >
                              -
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                onUpdateRuleThreshold(rule.id, rule.threshold + 1)
                              }
                              className="px-2 py-0.5 rounded bg-[#0B1528] border border-sky-800/60 text-slate-200 hover:border-cyan-400 cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right: Live Triggered Alerts Stream */}
            <div className="xl:col-span-6 bg-[#0B1528] border border-sky-900/40 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-sky-900/40">
                <div>
                  <h2 className="text-base font-semibold text-slate-100">
                    即時觸發警報清單
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    根據目前平台情緒數據、7 日趨勢與社群原文即時比對計算
                  </p>
                </div>
                <span className="font-mono-num text-xs text-amber-300 font-semibold">
                  {triggeredAlerts.length} 項觸發中
                </span>
              </div>

              {triggeredAlerts.length === 0 ? (
                <div className="rounded-lg bg-[#071020] border border-emerald-500/25 p-10 text-center space-y-2">
                  <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto" />
                  <p className="text-sm font-medium text-slate-100">
                    目前無任何規則觸發異常警報
                  </p>
                  <p className="text-xs text-slate-400">
                    可嘗試調整左側閾值或新增敏感關鍵詞規則進行監測測試。
                  </p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {triggeredAlerts.map((alert) => (
                    <article
                      key={alert.ruleId}
                      className="rounded-lg bg-[#071020] border border-amber-500/35 p-4 space-y-2.5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 text-xs font-semibold">
                            <AlertTriangle
                              className={`h-3.5 w-3.5 ${
                                alert.severity === '高風險'
                                  ? 'text-rose-400'
                                  : 'text-amber-300'
                              }`}
                            />
                            <span
                              className={
                                alert.severity === '高風險'
                                  ? 'text-rose-300'
                                  : 'text-amber-300'
                              }
                            >
                              {alert.severity}警報
                            </span>
                            <span className="text-slate-600" aria-hidden="true">
                              ·
                            </span>
                            <span className="text-slate-300">{alert.targetLabel}</span>
                          </div>
                          <h3 className="text-sm font-semibold text-slate-100 mt-1">
                            {alert.ruleName}
                          </h3>
                        </div>

                        <span className="font-mono-num text-xs text-cyan-300 font-semibold shrink-0">
                          {alert.currentValue}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed">
                        {alert.reason}
                      </p>

                      <div className="pt-2 border-t border-sky-900/30 flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery(alert.searchHint);
                            setSubTab('feed');
                          }}
                          className="inline-flex items-center gap-1 text-xs font-medium text-cyan-300 hover:text-cyan-200 cursor-pointer"
                        >
                          <span>前往過濾並高亮相關輿情</span>
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};
