import React, { useState, useEffect, useMemo } from 'react';
import {
  DailySentimentPoint,
  EdTechPlatform,
  KeywordCloudItem,
  MarketTrack,
  MonthlyTrackPoint,
  SentimentMention,
  SentimentPolarity,
  TriggeredAlert,
} from '../types';
import {
  DEMAND_RANKINGS,
  INITIAL_KEYWORD_CLOUD,
  INITIAL_SEVEN_DAY_SENTIMENT,
  INITIAL_VOLUME_TREND,
  KOL_EDGES,
  KOL_NODES,
  SEVEN_INDICATORS,
} from '../data/edtechData';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ArrowUpRight,
  BellRing,
  Clock,
  FileText,
  MinusCircle,
  Pause,
  Play,
  RefreshCw,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  TrendingUp,
} from 'lucide-react';
import { doesMentionMatch, HighlightText } from '../utils/sentimentMatch';
import { TopicClusteringWidget } from './TopicClusteringWidget';
import { DailyBriefingWidget } from './DailyBriefingWidget';

interface DashboardViewProps {
  platforms: EdTechPlatform[];
  mentions: SentimentMention[];
  triggeredAlerts: TriggeredAlert[];
  onNavigateTab: (
    tab: 'sentiment' | 'strategy' | 'competitive' | 'ecosystem',
    keyword?: string,
    subTab?: 'issues' | 'polarity' | 'feed' | 'alerts'
  ) => void;
}

const TRACK_OPTIONS: Array<'全部主線' | MarketTrack> = [
  '全部主線',
  '教育新創平台',
  'AI Tutor',
  'Multi-Agent',
  '教育 AI 市場',
];

const TRACK_COLORS: Record<MarketTrack, string> = {
  教育新創平台: '#38BDF8',
  'AI Tutor': '#22D3EE',
  'Multi-Agent': '#818CF8',
  '教育 AI 市場': '#10B981',
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  platforms,
  mentions,
  triggeredAlerts,
  onNavigateTab,
}) => {
  const [activeTrack, setActiveTrack] = useState<'全部主線' | MarketTrack>('全部主線');
  const [isStreaming, setIsStreaming] = useState<boolean>(true);
  const [trendData, setTrendData] = useState<MonthlyTrackPoint[]>(INITIAL_VOLUME_TREND);
  const [hoveredMonthIdx, setHoveredMonthIdx] = useState<number>(INITIAL_VOLUME_TREND.length - 1);
  const [hoveredPlatformId, setHoveredPlatformId] = useState<string | null>(null);
  const [hoveredKolId, setHoveredKolId] = useState<string | null>(null);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>(() =>
    new Date().toLocaleTimeString('zh-TW', { hour12: false })
  );
  const [liveMentionsDelta, setLiveMentionsDelta] = useState<number>(0);

  // Recharts 7-day Sentiment Volume State
  const [sevenDaySentiment, setSevenDaySentiment] = useState<DailySentimentPoint[]>(
    INITIAL_SEVEN_DAY_SENTIMENT
  );

  // Keyword Cloud Interactive State & Analysis
  const [cloudPolarityFilter, setCloudPolarityFilter] = useState<'全部' | SentimentPolarity>('全部');
  const [selectedKeyword, setSelectedKeyword] = useState<KeywordCloudItem>(
    INITIAL_KEYWORD_CLOUD[0]
  );
  const [cloudFilterActive, setCloudFilterActive] = useState<boolean>(true);
  const [kwAiAnalysis, setKwAiAnalysis] = useState<string | null>(null);
  const [kwAiLoading, setKwAiLoading] = useState<boolean>(false);
  const [kwAiError, setKwAiError] = useState<string | null>(null);

  // AI Market & Sentiment Brief State
  const [aiBrief, setAiBrief] = useState<string | null>(null);
  const [aiBriefLoading, setAiBriefLoading] = useState<boolean>(false);
  const [aiBriefError, setAiBriefError] = useState<string | null>(null);

  // AI Automatic 24-Hour Summary State
  interface Auto24hSummary {
    headline: string;
    reportText: string;
    trendBullets: string[];
    watchSignal: string;
    generatedAt: string;
  }
  const [auto24hSummary, setAuto24hSummary] = useState<Auto24hSummary | null>(null);
  const [auto24hLoading, setAuto24hLoading] = useState<boolean>(false);
  const [auto24hError, setAuto24hError] = useState<string | null>(null);

  useEffect(() => {
    if (!isStreaming) return;
    const timer = setInterval(() => {
      setTrendData((prev) => {
        const next = [...prev];
        const last = { ...next[next.length - 1] };
        const jitter = () => Math.round((Math.random() - 0.45) * 3);
        last['教育新創平台'] = Math.max(60, Math.min(98, last['教育新創平台'] + jitter()));
        last['AI Tutor'] = Math.max(72, Math.min(100, last['AI Tutor'] + jitter()));
        last['Multi-Agent'] = Math.max(70, Math.min(99, last['Multi-Agent'] + jitter()));
        last['教育 AI 市場'] = Math.max(80, Math.min(100, last['教育 AI 市場'] + jitter()));
        next[next.length - 1] = last;
        return next;
      });
      setSevenDaySentiment((prev) => {
        const next = [...prev];
        const last = { ...next[next.length - 1] };
        const posAdd = Math.floor(Math.random() * 4) + 1;
        const neuAdd = Math.floor(Math.random() * 3);
        const negAdd = Math.random() > 0.65 ? 1 : 0;
        last.正面 += posAdd;
        last.中立 += neuAdd;
        last.負面 += negAdd;
        last.總聲量 = last.正面 + last.中立 + last.負面;
        next[next.length - 1] = last;
        return next;
      });
      setLiveMentionsDelta((d) => d + Math.floor(Math.random() * 7) + 1);
      setLastUpdatedTime(new Date().toLocaleTimeString('zh-TW', { hour12: false }));
    }, 3200);
    return () => clearInterval(timer);
  }, [isStreaming]);

  const totalMentions = useMemo(() => {
    const base = platforms.reduce((acc, p) => acc + p.monthlyMentions, 0);
    return base + liveMentionsDelta;
  }, [platforms, liveMentionsDelta]);

  const avgPositiveSentiment = useMemo(() => {
    if (platforms.length === 0) return 0;
    return Math.round(
      platforms.reduce((sum, p) => sum + p.sentimentPositive, 0) / platforms.length
    );
  }, [platforms]);

  const avgAiVisibility = useMemo(() => {
    if (platforms.length === 0) return 0;
    return (
      platforms.reduce((sum, p) => sum + p.aiSearchVisibility, 0) / platforms.length
    ).toFixed(1);
  }, [platforms]);

  const filteredDemands = useMemo(() => {
    if (activeTrack === '全部主線') return DEMAND_RANKINGS;
    return DEMAND_RANKINGS.filter((d) => d.track === activeTrack);
  }, [activeTrack]);

  // Scale 7-day Recharts data based on selected Main Track
  const trackScaledSevenDayData = useMemo(() => {
    const scaleMap: Record<'全部主線' | MarketTrack, number> = {
      全部主線: 1,
      教育新創平台: 0.34,
      'AI Tutor': 0.31,
      'Multi-Agent': 0.19,
      '教育 AI 市場': 0.28,
    };
    const factor = scaleMap[activeTrack];
    return sevenDaySentiment.map((d) => {
      const 正面 = Math.round(d.正面 * factor);
      const 中立 = Math.round(d.中立 * factor);
      const 負面 = Math.round(d.負面 * factor);
      return {
        ...d,
        正面,
        中立,
        負面,
        總聲量: 正面 + 中立 + 負面,
      };
    });
  }, [sevenDaySentiment, activeTrack]);

  // Filtered Keyword Cloud items
  const filteredKeywords = useMemo(() => {
    return INITIAL_KEYWORD_CLOUD.filter((kw) => {
      if (activeTrack !== '全部主線' && kw.track !== activeTrack) return false;
      if (cloudPolarityFilter !== '全部' && kw.polarity !== cloudPolarityFilter) return false;
      return true;
    });
  }, [activeTrack, cloudPolarityFilter]);

  // Keyword Cloud Analysis Metrics
  const keywordCloudStats = useMemo(() => {
    const pos = filteredKeywords.filter((k) => k.polarity === '正面');
    const neu = filteredKeywords.filter((k) => k.polarity === '中立');
    const neg = filteredKeywords.filter((k) => k.polarity === '負面');
    const totalMentionsSum = filteredKeywords.reduce((s, k) => s + k.mentions, 0) || 1;
    const avgGrowth = filteredKeywords.length
      ? (
          filteredKeywords.reduce((s, k) => s + k.growthRate, 0) /
          filteredKeywords.length
        ).toFixed(1)
      : '0.0';
    const topBarData = [...filteredKeywords]
      .sort((a, b) => b.mentions - a.mentions)
      .slice(0, 7)
      .map((k) => ({
        name: k.word.length > 8 ? `${k.word.slice(0, 8)}…` : k.word,
        討論提及數: k.mentions,
        權重分數: k.weight,
        成長率: k.growthRate,
      }));
    return {
      posCount: pos.length,
      neuCount: neu.length,
      negCount: neg.length,
      posShare: Math.round((pos.reduce((s, k) => s + k.mentions, 0) / totalMentionsSum) * 100),
      avgGrowth,
      topBarData,
    };
  }, [filteredKeywords]);

  // Mentions automatically filtered & highlighted by clicked keyword
  const keywordMatchedMentions = useMemo(() => {
    if (!selectedKeyword) return [];
    return mentions.filter((m) => doesMentionMatch(m, selectedKeyword.word));
  }, [mentions, selectedKeyword]);

  const coOccurringKeywords = useMemo(() => {
    if (!selectedKeyword) return [];
    return INITIAL_KEYWORD_CLOUD.filter(
      (k) => k.id !== selectedKeyword.id && k.track === selectedKeyword.track
    ).slice(0, 4);
  }, [selectedKeyword]);

  const handleSelectCloudKeyword = (kw: KeywordCloudItem) => {
    setSelectedKeyword(kw);
    setCloudFilterActive(true);
    setKwAiAnalysis(null);
    setKwAiError(null);
  };

  const handleFetchKeywordAnalysis = async () => {
    if (!selectedKeyword) return;
    setKwAiLoading(true);
    setKwAiError(null);
    try {
      const res = await fetch('/api/ai-keyword-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: selectedKeyword.word,
          track: selectedKeyword.track,
          polarity: selectedKeyword.polarity,
          mentionsCount: selectedKeyword.mentions,
          growthRate: selectedKeyword.growthRate,
          matchedExcerpts: keywordMatchedMentions.map((m) => `[${m.platformName}] ${m.excerpt}`),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || '無法取得關鍵詞 AI 分析');
      }
      setKwAiAnalysis(data.analysis);
    } catch (err: any) {
      setKwAiError(err.message || '連線發生錯誤');
    } finally {
      setKwAiLoading(false);
    }
  };

  const handleFetchMarketBrief = async () => {
    setAiBriefLoading(true);
    setAiBriefError(null);
    try {
      const res = await fetch('/api/ai-market-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activeTrack,
          platformsSummary: platforms.map((p) => ({
            name: p.name,
            region: p.region,
            aiStage: p.aiStage,
            monthlyMentions: p.monthlyMentions,
            sentimentPositive: p.sentimentPositive,
            agentDepth: p.agentDepth,
            marketMomentum: p.marketMomentum,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || '無法取得 AI 輿情簡報');
      }
      setAiBrief(data.brief);
    } catch (err: any) {
      setAiBriefError(err.message || '連線發生錯誤');
    } finally {
      setAiBriefLoading(false);
    }
  };

  // Recent 24 Hours Mentions Extraction & Automatic AI Summary
  const { recent24hMentions, stats24h } = useMemo(() => {
    const parseTs = (ts: string) => {
      const normalized = ts.replace(' ', 'T');
      const ms = Date.parse(normalized);
      return Number.isNaN(ms) ? 0 : ms;
    };
    const maxTs = mentions.reduce((max, m) => Math.max(max, parseTs(m.timestamp)), 0);
    const cutoff = maxTs - 24 * 60 * 60 * 1000;
    const within24h = mentions.filter((m) => parseTs(m.timestamp) >= cutoff);
    const list = within24h.length > 0 ? within24h : mentions.slice(0, 6);
    const pos = list.filter((m) => m.polarity === '正面').length;
    const neu = list.filter((m) => m.polarity === '中立').length;
    const neg = list.filter((m) => m.polarity === '負面').length;
    const platformSet = Array.from(new Set(list.map((m) => m.platformName)));
    return {
      recent24hMentions: list,
      stats24h: {
        total: list.length,
        pos,
        neu,
        neg,
        platformCount: platformSet.length,
      },
    };
  }, [mentions]);

  const fetchAuto24hSummary = React.useCallback(
    async (forceRefresh = false) => {
      const idsSig = recent24hMentions.map((m) => m.id).join('_');
      const cacheKey = `eaaf_24h_summary_v2_${recent24hMentions.length}_${idsSig.slice(0, 48)}`;
      if (!forceRefresh) {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          try {
            setAuto24hSummary(JSON.parse(cached));
            setAuto24hError(null);
            return;
          } catch {
            // ignore corrupted cache
          }
        }
      }

      setAuto24hLoading(true);
      setAuto24hError(null);
      try {
        const latestDayVolume =
          INITIAL_SEVEN_DAY_SENTIMENT[INITIAL_SEVEN_DAY_SENTIMENT.length - 1];
        const res = await fetch('/api/ai-24h-summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recentMentions: recent24hMentions,
            stats24h,
            latestDayVolume,
            activeAlertsCount: triggeredAlerts.length,
            forceRefresh,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'AI 自動輿情摘要生成失敗');
        }
        const payload: Auto24hSummary = {
          headline: data.headline || '近 24 小時教育 AI 市場動向摘要',
          reportText: data.reportText || '',
          trendBullets: Array.isArray(data.trendBullets) ? data.trendBullets : [],
          watchSignal: data.watchSignal || '',
          generatedAt: new Date().toLocaleTimeString('zh-TW', { hour12: false }),
        };
        setAuto24hSummary(payload);
        localStorage.setItem(cacheKey, JSON.stringify(payload));
      } catch (err: any) {
        setAuto24hError(err.message || '連線發生錯誤');
      } finally {
        setAuto24hLoading(false);
      }
    },
    [recent24hMentions, stats24h, triggeredAlerts.length]
  );

  useEffect(() => {
    fetchAuto24hSummary(false);
  }, [fetchAuto24hSummary]);

  // Chart 1 SVG Geometry helpers
  const chartW = 540;
  const chartH = 190;
  const padL = 32;
  const padR = 14;
  const padT = 16;
  const padB = 26;
  const plotW = chartW - padL - padR;
  const plotH = chartH - padT - padB;

  const getTrackPolyline = (track: MarketTrack) => {
    return trendData
      .map((pt, idx) => {
        const x = padL + (idx / (trendData.length - 1)) * plotW;
        const y = padT + (1 - pt[track] / 100) * plotH;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  };

  const hoveredPoint = trendData[hoveredMonthIdx] || trendData[trendData.length - 1];

  return (
    <div className="space-y-6">
      {/* Control Header & Track Filter */}
      <section className="bg-[#0B1528] border border-sky-900/40 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span>每月市場追蹤與產業情報系統</span>
            <span aria-hidden="true">·</span>
            <span>四條主線 × 八大圖表</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-num text-cyan-300">
              最近更新 {lastUpdatedTime}
            </span>
          </div>
          <h1 className="font-display text-xl sm:text-2xl font-bold text-slate-50 tracking-tight">
            教育新創產業輿情與實時數據儀表板
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div
            className="flex flex-wrap items-center gap-1 p-1 rounded-lg bg-[#060D1A] border border-sky-900/50"
            role="tablist"
            aria-label="主線篩選"
          >
            {TRACK_OPTIONS.map((track) => (
              <button
                key={track}
                type="button"
                onClick={() => setActiveTrack(track)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTrack === track
                    ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/40'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                {track}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setIsStreaming((v) => !v)}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              isStreaming
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-800/70 border-slate-700 text-slate-300'
            }`}
          >
            {isStreaming ? (
              <>
                <Pause className="h-3.5 w-3.5" />
                <span>即時串流：開啟</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" />
                <span>即時串流：暫停</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleFetchMarketBrief}
            disabled={aiBriefLoading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-400/40 text-sky-200 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
          >
            {aiBriefLoading ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            <span>生成 AI 輿情洞察</span>
          </button>
        </div>
      </section>

      {/* Active Sentiment Alert Summary Bar */}
      <section className="bg-[#0B1528] border border-amber-500/35 rounded-xl px-5 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          <BellRing className="h-4 w-4 text-amber-300 shrink-0 mt-0.5 sm:mt-0" />
          <div className="text-xs text-slate-200 min-w-0">
            <span className="font-semibold text-amber-300">
              即時輿情警報監測：{triggeredAlerts.length} 項觸發中
            </span>
            {triggeredAlerts.length > 0 ? (
              <span className="text-slate-300 ml-2">
                {triggeredAlerts
                  .slice(0, 2)
                  .map((a) => `${a.ruleName}（${a.targetLabel}）`)
                  .join(' · ')}
              </span>
            ) : (
              <span className="text-slate-400 ml-2">
                目前所有監測規則皆位於安全區間內
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigateTab('sentiment', undefined, 'alerts')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/40 text-amber-200 text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer"
        >
          <span>輿情警報設置</span>
          <ArrowUpRight className="h-3.5 w-3.5" />
        </button>
      </section>

      {/* AI Market & Sentiment Brief Output */}
      {(aiBrief || aiBriefError) && (
        <section className="bg-[#0D1A31] border border-cyan-500/35 rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-cyan-300">
              AI 產業輿情即時簡報（主線：{activeTrack}）
            </h2>
            <button
              type="button"
              onClick={() => {
                setAiBrief(null);
                setAiBriefError(null);
              }}
              className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              收合
            </button>
          </div>
          {aiBriefError ? (
            <p className="text-sm text-rose-300">{aiBriefError}</p>
          ) : (
            <div className="text-sm text-slate-200 leading-relaxed whitespace-pre-line">
              {aiBrief}
            </div>
          )}
        </section>
      )}

      {/* 4-Column KPI Summary Strip */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => onNavigateTab('competitive')}
          className="text-left bg-[#0B1528] hover:bg-[#0E1C35] border border-sky-900/40 rounded-xl p-5 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>追蹤教育平台樣本</span>
            <ArrowUpRight className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="mt-2 font-mono-num text-2xl font-bold text-slate-50">
            {platforms.length} 家平台
          </div>
          <div className="mt-1 text-xs text-slate-400">
            台灣樣本 5 家 · 國際標竿 4 家
          </div>
        </button>

        <div className="bg-[#0B1528] border border-sky-900/40 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>月度跨平台實時總聲量</span>
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 font-mono-num text-2xl font-bold text-cyan-300">
            {totalMentions.toLocaleString()}
          </div>
          <div className="mt-1 text-xs text-emerald-300 font-mono-num">
            +14.8% 較上期 · Multi-Agent 增幅領先
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigateTab('sentiment')}
          className="text-left bg-[#0B1528] hover:bg-[#0E1C35] border border-sky-900/40 rounded-xl p-5 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>全產業平均正向情緒比</span>
            <ArrowUpRight className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="mt-2 font-mono-num text-2xl font-bold text-slate-50">
            {avgPositiveSentiment}%
          </div>
          <div className="mt-1 text-xs text-slate-400">
            已收錄 {mentions.length} 筆精選社群語意樣本
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab('ecosystem')}
          className="text-left bg-[#0B1528] hover:bg-[#0E1C35] border border-sky-900/40 rounded-xl p-5 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>AI 搜尋引擎平均能見度</span>
            <ArrowUpRight className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="mt-2 font-mono-num text-2xl font-bold text-slate-50">
            {avgAiVisibility} / 100
          </div>
          <div className="mt-1 text-xs text-slate-400">
            對應 EAAF 三層架構與人工覆核驗證
          </div>
        </button>
      </section>

      {/* AI Automatic 24-Hour Sentiment Summary Module */}
      <section className="bg-[#0B1528] border border-cyan-500/35 rounded-xl p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pb-3 border-b border-sky-900/40">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span className="inline-flex items-center gap-1 text-cyan-300 font-medium">
                <Clock className="h-3.5 w-3.5" />
                <span>近 24 小時自動分析</span>
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono-num">
                樣本 {stats24h.total} 筆（涵蓋 {stats24h.platformCount} 家平台）
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono-num">
                <span className="text-emerald-300">正面 {stats24h.pos}</span> /{' '}
                <span className="text-sky-300">中立 {stats24h.neu}</span> /{' '}
                <span className="text-rose-300">負面 {stats24h.neg}</span>
              </span>
              {auto24hSummary?.generatedAt && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono-num text-slate-500">
                    報告生成 {auto24hSummary.generatedAt}
                  </span>
                </>
              )}
            </div>
            <h2 className="text-base font-semibold text-slate-100 mt-1 flex items-center gap-2">
              <FileText className="h-4 w-4 text-cyan-400" />
              <span>AI 自動輿情摘要（24 小時市場趨勢洞察文字報告）</span>
            </h2>
          </div>

          <button
            type="button"
            onClick={() => fetchAuto24hSummary(true)}
            disabled={auto24hLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/40 text-cyan-200 text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50 self-start lg:self-auto"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${auto24hLoading ? 'animate-spin' : ''}`} />
            <span>{auto24hLoading ? 'AI 彙整分析中...' : '重新生成 24H 摘要'}</span>
          </button>
        </div>

        {auto24hLoading && !auto24hSummary ? (
          <div className="rounded-lg bg-[#071020] border border-sky-900/35 p-5 flex items-center gap-3 text-xs text-cyan-200">
            <RefreshCw className="h-4 w-4 animate-spin text-cyan-400 shrink-0" />
            <span>
              正在透過 AI 自動分析最近 24 小時內的 {stats24h.total} 筆跨平台輿情動態與聲量波動...
            </span>
          </div>
        ) : auto24hError ? (
          <div className="rounded-lg bg-rose-500/10 border border-rose-500/30 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-rose-300">
            <span>{auto24hError}</span>
            <button
              type="button"
              onClick={() => fetchAuto24hSummary(true)}
              className="text-cyan-300 hover:underline font-medium shrink-0 cursor-pointer"
            >
              重試分析
            </button>
          </div>
        ) : auto24hSummary ? (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-stretch">
            <div className="xl:col-span-7 rounded-lg bg-[#071020] border border-sky-900/35 p-4 space-y-2.5">
              <div className="text-sm font-semibold text-cyan-300">
                {auto24hSummary.headline}
              </div>
              <p className="text-sm text-slate-200 leading-relaxed">
                {auto24hSummary.reportText}
              </p>
              {auto24hSummary.watchSignal && (
                <div className="pt-2 border-t border-sky-900/30 text-xs text-amber-200 leading-relaxed">
                  <span className="font-semibold text-amber-300">24H 風險與關注訊號：</span>
                  {auto24hSummary.watchSignal}
                </div>
              )}
            </div>

            <div className="xl:col-span-5 rounded-lg bg-[#071020] border border-sky-900/35 p-4 flex flex-col justify-between gap-3">
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-300">
                  近 24 小時三大核心動態
                </div>
                <ul className="space-y-2 text-xs text-slate-200">
                  {auto24hSummary.trendBullets.map((bullet, idx) => (
                    <li key={idx} className="flex items-start gap-2 leading-relaxed">
                      <span className="font-mono-num text-cyan-400 font-semibold shrink-0">
                        0{idx + 1}
                      </span>
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-2 border-t border-sky-900/30 flex justify-end">
                <button
                  type="button"
                  onClick={() => onNavigateTab('sentiment', undefined, 'feed')}
                  className="inline-flex items-center gap-1 text-xs font-medium text-cyan-300 hover:text-cyan-200 cursor-pointer"
                >
                  <span>檢視 24H 社群原文明細</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </section>

      {/* Featured Row: Recharts 7-Day Sentiment Line Chart + Interactive Keyword Cloud */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* Recharts 7-Day Sentiment Volume Trend */}
        <article className="xl:col-span-7 bg-[#0B1528] border border-sky-900/40 rounded-xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                過去 7 天輿情聲量趨勢（依情感傾向分色 · Recharts）
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                統計區間 2026/11/12–11/18 · 主線：{activeTrack} · 綠：正面 / 青藍：中立 / 紅：負面
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono-num shrink-0">
              <span className="text-emerald-300">
                今日正面 {trackScaledSevenDayData[trackScaledSevenDayData.length - 1]?.正面}
              </span>
              <span className="text-sky-300">
                中立 {trackScaledSevenDayData[trackScaledSevenDayData.length - 1]?.中立}
              </span>
              <span className="text-rose-300">
                負面 {trackScaledSevenDayData[trackScaledSevenDayData.length - 1]?.負面}
              </span>
            </div>
          </div>

          <div className="w-full h-72 bg-[#071020] rounded-lg border border-sky-900/30 p-3">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={trackScaledSevenDayData}
                margin={{ top: 10, right: 16, left: -12, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(56, 189, 248, 0.12)" />
                <XAxis
                  dataKey="date"
                  stroke="#94A3B8"
                  tick={{ fill: '#94A3B8', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                  axisLine={{ stroke: 'rgba(56, 189, 248, 0.25)' }}
                />
                <YAxis
                  stroke="#94A3B8"
                  tick={{ fill: '#94A3B8', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                  axisLine={{ stroke: 'rgba(56, 189, 248, 0.25)' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#060D1A',
                    borderColor: 'rgba(34, 211, 238, 0.45)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#F1F5F9',
                  }}
                  labelStyle={{ color: '#22D3EE', fontWeight: 600, marginBottom: '4px' }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '12px', paddingTop: '6px' }}
                />
                <Line
                  type="monotone"
                  dataKey="正面"
                  name="正面聲量"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  dot={{ r: 3.5, fill: '#10B981', strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: '#10B981', stroke: '#ECFDF5', strokeWidth: 1.5 }}
                />
                <Line
                  type="monotone"
                  dataKey="中立"
                  name="中立聲量"
                  stroke="#38BDF8"
                  strokeWidth={2.2}
                  dot={{ r: 3.5, fill: '#38BDF8', strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: '#38BDF8', stroke: '#E0F2FE', strokeWidth: 1.5 }}
                />
                <Line
                  type="monotone"
                  dataKey="負面"
                  name="負面聲量"
                  stroke="#F43F5E"
                  strokeWidth={2.2}
                  dot={{ r: 3.5, fill: '#F43F5E', strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: '#F43F5E', stroke: '#FFE4E6', strokeWidth: 1.5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>

        {/* Interactive Sentiment Keyword Cloud with Hover Scale & Click-to-Filter */}
        <article className="xl:col-span-5 bg-[#0B1528] border border-sky-900/40 rounded-xl p-5 flex flex-col justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                輿情關鍵詞雲圖
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                懸停放大檢視 · 點擊詞彙自動過濾並高亮相關輿情條目
              </p>
            </div>

            <div className="flex items-center gap-1 p-1 rounded-lg bg-[#060D1A] border border-sky-900/50 shrink-0">
              {(['全部', '正面', '中立', '負面'] as const).map((pol) => (
                <button
                  key={pol}
                  type="button"
                  onClick={() => setCloudPolarityFilter(pol)}
                  className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                    cloudPolarityFilter === pol
                      ? 'bg-cyan-500/20 text-cyan-200'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {pol}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 min-h-[210px] bg-[#071020] rounded-lg border border-sky-900/30 p-5 flex flex-wrap items-center justify-center content-center gap-x-5 gap-y-3 overflow-hidden">
            {filteredKeywords.length === 0 ? (
              <p className="text-xs text-slate-400">
                此主線與情緒篩選下暫無關鍵詞
              </p>
            ) : (
              filteredKeywords.map((kw) => {
                const fontSize = Math.round(13 + ((kw.weight - 55) / 45) * 14);
                const isSelected = selectedKeyword?.id === kw.id && cloudFilterActive;
                const colorClass =
                  kw.polarity === '正面'
                    ? 'text-emerald-300 hover:text-emerald-200'
                    : kw.polarity === '負面'
                    ? 'text-rose-300 hover:text-rose-200'
                    : 'text-sky-300 hover:text-cyan-200';
                return (
                  <button
                    key={kw.id}
                    type="button"
                    onClick={() => handleSelectCloudKeyword(kw)}
                    style={{ fontSize: `${fontSize}px` }}
                    className={`px-2 py-0.5 rounded-md leading-tight origin-center transform transition-transform duration-200 ease-out hover:scale-125 focus-visible:scale-125 cursor-pointer ${colorClass} ${
                      kw.weight >= 84 ? 'font-bold' : kw.weight >= 70 ? 'font-semibold' : 'font-medium'
                    } ${
                      isSelected
                        ? 'bg-cyan-500/20 ring-1 ring-cyan-400/70 scale-110'
                        : 'hover:bg-slate-800/70'
                    }`}
                  >
                    {kw.word}
                  </button>
                );
              })
            )}
          </div>

          {/* Selected Keyword Inspector Footer */}
          {selectedKeyword && (
            <div className="rounded-lg bg-[#071020] border border-sky-900/40 px-3.5 py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-100">
                    {selectedKeyword.word}
                  </span>
                  <span
                    className={
                      selectedKeyword.polarity === '正面'
                        ? 'text-emerald-300'
                        : selectedKeyword.polarity === '負面'
                        ? 'text-rose-300'
                        : 'text-sky-300'
                    }
                  >
                    · {selectedKeyword.polarity}傾向
                  </span>
                  <span className="font-mono-num text-emerald-300">
                    +{selectedKeyword.growthRate}%
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 truncate">
                  近 7 日提及{' '}
                  <span className="font-mono-num text-slate-200">
                    {selectedKeyword.mentions.toLocaleString()}
                  </span>{' '}
                  筆 · 匹配條目{' '}
                  <span className="font-mono-num text-cyan-300">
                    {keywordMatchedMentions.length}
                  </span>{' '}
                  則
                </div>
              </div>

              <button
                type="button"
                onClick={() => onNavigateTab('sentiment', selectedKeyword.word, 'feed')}
                className="inline-flex items-center gap-1 text-cyan-300 hover:text-cyan-200 font-medium whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>完整輿情高亮檢視</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </article>
      </section>

      {/* Keyword Cloud Deep Analysis & Auto-Filtered Highlighted Sentiment Entries */}
      <section className="bg-[#0B1528] border border-sky-900/40 rounded-xl p-5 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pb-3 border-b border-sky-900/40">
          <div>
            <div className="text-xs text-slate-400">
              關鍵詞權重結構 × 聲量成長對比 × 點擊關鍵詞即時高亮過濾
            </div>
            <h2 className="text-base font-semibold text-slate-100 mt-0.5">
              關鍵詞雲圖分析與關聯輿情聲量條目
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-mono-num">
            <span className="text-slate-300">
              分析詞彙：{filteredKeywords.length} 個
            </span>
            <span className="text-emerald-300">
              正面詞 {keywordCloudStats.posCount}（聲量占 {keywordCloudStats.posShare}%）
            </span>
            <span className="text-sky-300">
              中立詞 {keywordCloudStats.neuCount}
            </span>
            <span className="text-rose-300">
              負面詞 {keywordCloudStats.negCount}
            </span>
            <span className="text-cyan-300">
              平均成長 +{keywordCloudStats.avgGrowth}%
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
          {/* Left: Keyword Cloud Recharts Distribution & Co-occurring Terms */}
          <div className="xl:col-span-5 bg-[#071020] border border-sky-900/35 rounded-lg p-4 flex flex-col justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-100">
                Top 關鍵詞聲量排行（Recharts）
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                呈現目前篩選主線下討論提及數最高之 7 大核心關鍵詞
              </p>
            </div>

            <div className="w-full h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={keywordCloudStats.topBarData}
                  layout="vertical"
                  margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(56, 189, 248, 0.12)" />
                  <XAxis
                    type="number"
                    stroke="#94A3B8"
                    tick={{ fill: '#94A3B8', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={78}
                    stroke="#94A3B8"
                    tick={{ fill: '#E2E8F0', fontSize: 11 }}
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
                  <Bar dataKey="討論提及數" fill="#22D3EE" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {selectedKeyword && coOccurringKeywords.length > 0 && (
              <div className="pt-3 border-t border-sky-900/35 space-y-2">
                <div className="text-xs text-slate-400">
                  同主線共現關鍵詞（點擊切換過濾）：
                </div>
                <div className="flex flex-wrap gap-2">
                  {coOccurringKeywords.map((co) => (
                    <button
                      key={co.id}
                      type="button"
                      onClick={() => handleSelectCloudKeyword(co)}
                      className="px-2.5 py-1 rounded-md bg-[#0B1528] hover:bg-cyan-500/15 border border-sky-800/60 hover:border-cyan-400/50 text-xs text-cyan-200 transition-transform duration-150 hover:scale-105 cursor-pointer"
                    >
                      {co.word}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Filtered & Highlighted Sentiment Entries for Selected Keyword + AI Keyword Analysis */}
          <div className="xl:col-span-7 bg-[#071020] border border-sky-900/35 rounded-lg p-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-slate-100">
                  關聯輿情聲量條目（已自動過濾並高亮：「
                  <span className="text-cyan-300">{selectedKeyword?.word}</span>」）
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  共命中 {keywordMatchedMentions.length} 筆社群語意紀錄 · 關聯平台：
                  {selectedKeyword?.relatedPlatform}
                </p>
              </div>

              <button
                type="button"
                onClick={handleFetchKeywordAnalysis}
                disabled={kwAiLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/40 text-cyan-200 text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
              >
                {kwAiLoading ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                <span>AI 解析關鍵詞趨勢</span>
              </button>
            </div>

            {(kwAiAnalysis || kwAiError) && (
              <div className="rounded-lg bg-[#0B1528] border border-cyan-500/35 p-3.5 space-y-1.5 text-xs">
                <div className="font-semibold text-cyan-300">
                  AI 關鍵詞語意深度解析（{selectedKeyword?.word}）
                </div>
                {kwAiError ? (
                  <p className="text-rose-300">{kwAiError}</p>
                ) : (
                  <p className="text-slate-200 leading-relaxed whitespace-pre-line">
                    {kwAiAnalysis}
                  </p>
                )}
              </div>
            )}

            {keywordMatchedMentions.length === 0 ? (
              <div className="rounded-lg bg-[#0B1528] border border-sky-900/35 p-6 text-center text-xs text-slate-400">
                目前樣本庫尚無直接包含「{selectedKeyword?.word}」的紀錄，可點擊上方其他關鍵詞或前往輿情中心新增樣本。
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                {keywordMatchedMentions.map((m) => (
                  <article
                    key={m.id}
                    className="rounded-lg bg-[#0B1528] border border-cyan-500/35 p-3.5 space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-cyan-300">
                          <HighlightText text={m.platformName} query={selectedKeyword.word} />
                        </span>
                        <span className="text-slate-600" aria-hidden="true">
                          ·
                        </span>
                        <span className="text-slate-300">{m.stakeholder}視角</span>
                        <span className="text-slate-600" aria-hidden="true">
                          ·
                        </span>
                        <span className="text-slate-400">
                          <HighlightText text={m.topicTag} query={selectedKeyword.word} />
                        </span>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 font-semibold shrink-0 ${
                          m.polarity === '正面'
                            ? 'text-emerald-300'
                            : m.polarity === '負面'
                            ? 'text-rose-300'
                            : 'text-sky-300'
                        }`}
                      >
                        {m.polarity === '正面' && <ThumbsUp className="h-3 w-3" />}
                        {m.polarity === '負面' && <ThumbsDown className="h-3 w-3" />}
                        {m.polarity === '中立' && <MinusCircle className="h-3 w-3" />}
                        <span>{m.polarity}</span>
                      </span>
                    </div>

                    <p className="text-xs text-slate-100 leading-relaxed">
                      「<HighlightText text={m.excerpt} query={selectedKeyword.word} />」
                    </p>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      判讀：<HighlightText text={m.aiInsight} query={selectedKeyword.word} />
                    </p>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Automatic Topic Clustering & Five-Category Distribution */}
      <TopicClusteringWidget
        mentions={mentions}
        onNavigateFeed={(kw) => onNavigateTab('sentiment', kw, 'feed')}
      />

      {/* Daily In-Depth Sentiment Briefing (5 Topics) */}
      <DailyBriefingWidget
        mentions={mentions}
        platforms={platforms}
        activeAlertsCount={triggeredAlerts.length}
        onNavigateTab={(tab, keyword) =>
          onNavigateTab(
            tab,
            keyword,
            tab === 'sentiment' ? 'feed' : undefined
          )
        }
      />

      {/* Eight Charts Grid */}
      <section className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Chart 1: 聲量趨勢 */}
        <article className="bg-[#0B1528] border border-sky-900/40 rounded-xl p-5 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                01. 聲量趨勢（四條主線 12 個月追蹤）
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                研究期間 2025.11–2026.10 · 移動滑鼠檢視各月度主線熱度指數
              </p>
            </div>
            <span className="font-mono-num text-xs text-cyan-300 shrink-0">
              {hoveredPoint.month}
            </span>
          </div>

          <div className="w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${chartW} ${chartH}`}
              className="w-full h-48 select-none"
              role="img"
              aria-label="四條主線聲量趨勢折線圖"
            >
              {[20, 40, 60, 80, 100].map((v) => {
                const y = padT + (1 - v / 100) * plotH;
                return (
                  <g key={v}>
                    <line
                      x1={padL}
                      y1={y}
                      x2={chartW - padR}
                      y2={y}
                      stroke="rgba(56, 189, 248, 0.1)"
                      strokeDasharray="3 3"
                    />
                    <text
                      x={padL - 6}
                      y={y + 3}
                      textAnchor="end"
                      className="fill-slate-500 text-[9px] font-mono"
                    >
                      {v}
                    </text>
                  </g>
                );
              })}

              {(Object.keys(TRACK_COLORS) as MarketTrack[]).map((track) => {
                const dimmed =
                  activeTrack !== '全部主線' && activeTrack !== track;
                return (
                  <polyline
                    key={track}
                    fill="none"
                    stroke={TRACK_COLORS[track]}
                    strokeWidth={dimmed ? 1.2 : 2.5}
                    strokeOpacity={dimmed ? 0.25 : 0.95}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={getTrackPolyline(track)}
                  />
                );
              })}

              {trendData.map((pt, idx) => {
                const x = padL + (idx / (trendData.length - 1)) * plotW;
                const isSelected = idx === hoveredMonthIdx;
                return (
                  <g key={pt.month}>
                    {isSelected && (
                      <line
                        x1={x}
                        y1={padT}
                        x2={x}
                        y2={chartH - padB}
                        stroke="rgba(34, 211, 238, 0.45)"
                        strokeWidth={1}
                      />
                    )}
                    <rect
                      x={x - plotW / trendData.length / 2}
                      y={padT}
                      width={plotW / trendData.length}
                      height={plotH}
                      fill="transparent"
                      className="cursor-crosshair"
                      onMouseEnter={() => setHoveredMonthIdx(idx)}
                    />
                    {idx % 2 === 0 && (
                      <text
                        x={x}
                        y={chartH - 6}
                        textAnchor="middle"
                        className="fill-slate-400 text-[9px] font-mono"
                      >
                        {pt.month.slice(2)}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-sky-900/40 text-xs">
            {(Object.keys(TRACK_COLORS) as MarketTrack[]).map((track) => (
              <div key={track} className="flex items-center gap-1.5">
                <span
                  className="inline-block w-2.5 h-2.5 rounded-xs"
                  style={{ backgroundColor: TRACK_COLORS[track] }}
                />
                <span className="text-slate-300">{track}</span>
                <span className="font-mono-num text-slate-100 font-semibold">
                  {hoveredPoint[track]}
                </span>
              </div>
            ))}
          </div>
        </article>

        {/* Chart 2: 競爭力矩陣 */}
        <article className="bg-[#0B1528] border border-sky-900/40 rounded-xl p-5 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                02. 競爭力矩陣（七項關鍵指標熱力表）
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                一致量表 1–10 分 · 點擊任意平台可跳轉至實證來源檢核
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('competitive')}
              className="text-xs font-medium text-cyan-300 hover:text-cyan-200 whitespace-nowrap shrink-0 cursor-pointer"
            >
              完整評估
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-sky-900/40 text-slate-400">
                  <th className="py-2 pr-2 text-left font-medium">平台</th>
                  {SEVEN_INDICATORS.map((ind) => (
                    <th
                      key={ind.id}
                      className="py-2 px-1 text-center font-mono-num font-medium"
                      title={ind.name}
                    >
                      {ind.code}
                    </th>
                  ))}
                  <th className="py-2 pl-2 text-right font-medium">均分</th>
                </tr>
              </thead>
              <tbody>
                {platforms.map((plat) => {
                  const avg = (
                    plat.evidences.reduce((s, e) => s + e.score, 0) /
                    plat.evidences.length
                  ).toFixed(1);
                  return (
                    <tr
                      key={plat.id}
                      onMouseEnter={() => setHoveredPlatformId(plat.id)}
                      onMouseLeave={() => setHoveredPlatformId(null)}
                      onClick={() => onNavigateTab('competitive')}
                      className={`border-b border-sky-900/25 transition-colors cursor-pointer ${
                        hoveredPlatformId === plat.id ? 'bg-cyan-500/10' : 'hover:bg-slate-800/40'
                      }`}
                    >
                      <td className="py-1.5 pr-2 font-medium text-slate-200 whitespace-nowrap">
                        {plat.shortName}
                        <span className="ml-1.5 text-[10px] text-slate-500">
                          {plat.region === '台灣樣本' ? 'TW' : 'GL'}
                        </span>
                      </td>
                      {plat.evidences.map((ev) => {
                        const opacity =
                          ev.score >= 9.0
                            ? 'bg-cyan-500/40 text-cyan-50 font-semibold'
                            : ev.score >= 8.0
                            ? 'bg-sky-500/25 text-sky-100'
                            : ev.score >= 7.0
                            ? 'bg-sky-900/50 text-slate-200'
                            : 'bg-slate-800/80 text-slate-400';
                        return (
                          <td key={ev.indicatorId} className="p-0.5 text-center">
                            <span
                              className={`block py-1 rounded-xs font-mono-num ${opacity}`}
                              title={`${ev.indicatorName}: ${ev.score.toFixed(1)} 分（${ev.source}）`}
                            >
                              {ev.score.toFixed(1)}
                            </span>
                          </td>
                        );
                      })}
                      <td className="py-1.5 pl-2 text-right font-mono-num font-semibold text-cyan-300">
                        {avg}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-2 border-t border-sky-900/35 text-[11px] text-slate-400">
            <span>
              指標：01成效評量 / 02個人化 / 03AI能力 / 04教師可控 / 05課程整合 / 06隱私信任 / 07校園互通
            </span>
            <span className="flex items-center gap-2 shrink-0 font-mono-num">
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-xs bg-cyan-500/40 inline-block" />
                ≥9.0
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-xs bg-sky-500/25 inline-block" />
                8.0–8.9
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-xs bg-sky-900/50 inline-block" />
                7.0–7.9
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-xs bg-slate-800/80 inline-block" />
                &lt;7.0
              </span>
            </span>
          </div>
        </article>

        {/* Chart 3: 競爭風暴 */}
        <article className="bg-[#0B1528] border border-sky-900/40 rounded-xl p-5 space-y-4">
          <div>
            <h2 className="text-base font-semibold text-slate-100">
              03. 競爭風暴（市場動能 × AI Agent 深度）
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              氣泡面積代表月度聲量規模 · 青藍為台灣樣本，靛紫為國際標竿
            </p>
          </div>

          <svg
            viewBox="0 0 460 220"
            className="w-full h-52 bg-[#071020] rounded-lg border border-sky-900/30"
            role="img"
            aria-label="教育平台競爭風暴氣泡圖"
          >
            <line x1="230" y1="16" x2="230" y2="196" stroke="rgba(56,189,248,0.18)" strokeDasharray="4 4" />
            <line x1="36" y1="106" x2="444" y2="106" stroke="rgba(56,189,248,0.18)" strokeDasharray="4 4" />
            <text x="42" y="28" className="fill-slate-500 text-[9px]">高動能 · 傳統內容型</text>
            <text x="335" y="28" className="fill-cyan-400/80 text-[9px]">領先風暴區（高動能 × 強 Agent）</text>
            <text x="240" y="212" textAnchor="middle" className="fill-slate-400 text-[9px]">
              AI Tutor / Multi-Agent 技術深度 →
            </text>

            {platforms.map((p) => {
              const cx = 36 + ((p.agentDepth - 45) / 55) * 396;
              const cy = 192 - ((p.marketMomentum - 50) / 50) * 168;
              const r = Math.max(8, Math.min(24, Math.sqrt(p.monthlyMentions) / 4.4));
              const isTW = p.region === '台灣樣本';
              const isHov = hoveredPlatformId === p.id;
              return (
                <g
                  key={p.id}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredPlatformId(p.id)}
                  onMouseLeave={() => setHoveredPlatformId(null)}
                >
                  <circle
                    cx={cx}
                    cy={cy}
                    r={r}
                    fill={isTW ? 'rgba(34, 211, 238, 0.25)' : 'rgba(129, 140, 248, 0.22)'}
                    stroke={isTW ? '#22D3EE' : '#818CF8'}
                    strokeWidth={isHov ? 2.5 : 1.5}
                  />
                  <text
                    x={cx}
                    y={cy + 3}
                    textAnchor="middle"
                    className="fill-slate-100 text-[9px] font-medium pointer-events-none"
                  >
                    {p.shortName}
                  </text>
                </g>
              );
            })}
          </svg>
        </article>

        {/* Chart 4: 情緒分析 */}
        <article className="bg-[#0B1528] border border-sky-900/40 rounded-xl p-5 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                04. 社群情緒分析（正面 / 中立 / 負面聲量結構）
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                依平台社群討論、教師社團回饋與 App 評論語意分類
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('sentiment')}
              className="text-xs font-medium text-cyan-300 hover:text-cyan-200 whitespace-nowrap shrink-0 cursor-pointer"
            >
              檢視原文
            </button>
          </div>

          <div className="space-y-2.5">
            {platforms.map((p) => (
              <div
                key={p.id}
                onMouseEnter={() => setHoveredPlatformId(p.id)}
                onMouseLeave={() => setHoveredPlatformId(null)}
                className="space-y-1"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-200 font-medium">
                    {p.name}
                    <span className="ml-2 text-slate-500">{p.region}</span>
                  </span>
                  <span className="font-mono-num text-slate-300">
                    正向 {p.sentimentPositive}% · 中立 {p.sentimentNeutral}% · 負向 {p.sentimentNegative}%
                  </span>
                </div>
                <div className="h-2.5 w-full rounded-sm overflow-hidden flex bg-slate-900">
                  <div className="bg-emerald-500/80" style={{ width: `${p.sentimentPositive}%` }} />
                  <div className="bg-sky-500/45" style={{ width: `${p.sentimentNeutral}%` }} />
                  <div className="bg-rose-500/75" style={{ width: `${p.sentimentNegative}%` }} />
                </div>
              </div>
            ))}
          </div>
        </article>

        {/* Chart 5: 需求排行 */}
        <article className="bg-[#0B1528] border border-sky-900/40 rounded-xl p-5 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                05. 使用者需求排行（學生 · 教師 · 家長 · 學校）
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                對應目前篩選主線：{activeTrack} · 依近 30 日議題熱度與成長率排序
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('strategy')}
              className="text-xs font-medium text-cyan-300 hover:text-cyan-200 whitespace-nowrap shrink-0 cursor-pointer"
            >
              痛點與策略
            </button>
          </div>

          <div className="space-y-3">
            {filteredDemands.map((item, idx) => (
              <div key={item.id} className="space-y-1.5">
                <div className="flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono-num text-cyan-400 font-semibold">
                      0{idx + 1}
                    </span>
                    <span className="text-slate-100 font-medium truncate">
                      {item.label}
                    </span>
                    <span className="text-slate-400 shrink-0">
                      · {item.stakeholder}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 font-mono-num">
                    <span className="text-emerald-300">+{item.delta}%</span>
                    <span className="text-slate-100 font-semibold">{item.score}</span>
                  </div>
                </div>
                <div className="h-2 w-full bg-[#060D1A] rounded-sm overflow-hidden border border-sky-900/30">
                  <div
                    className="h-full bg-gradient-to-r from-sky-500 to-cyan-400"
                    style={{ width: `${item.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </article>

        {/* Chart 6: KOL 網絡 */}
        <article className="bg-[#0B1528] border border-sky-900/40 rounded-xl p-5 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                06. KOL 意見領袖與生態影響力網絡
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                滑鼠移至節點可聚焦其社群擴散路徑與主要關注主線
              </p>
            </div>
            {hoveredKolId && (
              <span className="text-xs text-cyan-300 shrink-0">
                {KOL_NODES.find((n) => n.id === hoveredKolId)?.role}
              </span>
            )}
          </div>

          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="xMidYMid meet"
            className="w-full h-56 bg-[#071020] rounded-lg border border-sky-900/30"
            role="img"
            aria-label="教育科技 KOL 關聯網絡圖"
          >
            {KOL_EDGES.map((edge, idx) => {
              const s = KOL_NODES.find((n) => n.id === edge.source)!;
              const t = KOL_NODES.find((n) => n.id === edge.target)!;
              const isHighlighted =
                !hoveredKolId ||
                hoveredKolId === edge.source ||
                hoveredKolId === edge.target;
              return (
                <line
                  key={idx}
                  x1={s.x}
                  y1={s.y}
                  x2={t.x}
                  y2={t.y}
                  stroke={isHighlighted ? '#38BDF8' : '#1E293B'}
                  strokeOpacity={isHighlighted ? 0.55 : 0.25}
                  strokeWidth={edge.strength * 0.4}
                />
              );
            })}
            {KOL_NODES.map((node) => {
              const isDimmed =
                (activeTrack !== '全部主線' && node.track !== activeTrack) ||
                (hoveredKolId &&
                  hoveredKolId !== node.id &&
                  !KOL_EDGES.some(
                    (e) =>
                      (e.source === hoveredKolId && e.target === node.id) ||
                      (e.target === hoveredKolId && e.source === node.id)
                  ));
              return (
                <g
                  key={node.id}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredKolId(node.id)}
                  onMouseLeave={() => setHoveredKolId(null)}
                >
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={node.influence / 24}
                    fill={hoveredKolId === node.id ? '#22D3EE' : '#0EA5E9'}
                    fillOpacity={isDimmed ? 0.25 : 0.85}
                    stroke="#E0F2FE"
                    strokeWidth={hoveredKolId === node.id ? 0.8 : 0.3}
                  />
                  <text
                    x={node.x}
                    y={node.y + node.influence / 24 + 4.2}
                    textAnchor="middle"
                    className={`text-[3px] font-medium ${
                      isDimmed ? 'fill-slate-600' : 'fill-slate-200'
                    }`}
                  >
                    {node.name}
                  </text>
                </g>
              );
            })}
          </svg>
        </article>

        {/* Chart 7: 定位散布 */}
        <article className="bg-[#0B1528] border border-sky-900/40 rounded-xl p-5 space-y-4">
          <div>
            <h2 className="text-base font-semibold text-slate-100">
              07. 定位散布圖（內容↔Multi-Agent × B2C↔校園生態）
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              檢視直接競爭、間接競爭與 EAAF 切入空缺象限
            </p>
          </div>

          <svg
            viewBox="0 0 460 220"
            className="w-full h-52 bg-[#071020] rounded-lg border border-sky-900/30"
            role="img"
            aria-label="教育平台市場定位散布圖"
          >
            <line x1="230" y1="16" x2="230" y2="196" stroke="rgba(56,189,248,0.2)" />
            <line x1="36" y1="106" x2="444" y2="106" stroke="rgba(56,189,248,0.2)" />
            <text x="44" y="28" className="fill-slate-400 text-[9px]">↑ B2B 校園採購與校務整合</text>
            <text x="44" y="190" className="fill-slate-400 text-[9px]">↓ B2C 個人學習與能力檢定</text>
            <text x="436" y="100" textAnchor="end" className="fill-cyan-300 text-[9px]">Multi-Agent 協作 →</text>

            {platforms.map((p) => {
              const x = 44 + ((p.agentDepth - 45) / 55) * 380;
              const y = 186 - ((p.ecosystemIntegration - 50) / 50) * 158;
              const isTW = p.region === '台灣樣本';
              return (
                <g
                  key={p.id}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredPlatformId(p.id)}
                  onMouseLeave={() => setHoveredPlatformId(null)}
                >
                  <rect
                    x={x - 3.5}
                    y={y - 3.5}
                    width="7"
                    height="7"
                    transform={`rotate(45 ${x} ${y})`}
                    fill={isTW ? '#22D3EE' : '#F59E0B'}
                  />
                  <text
                    x={x + 7}
                    y={y + 3}
                    className="fill-slate-200 text-[9px] font-medium"
                  >
                    {p.shortName}
                  </text>
                </g>
              );
            })}
          </svg>
        </article>

        {/* Chart 8: AI 搜尋能見度 */}
        <article className="bg-[#0B1528] border border-sky-900/40 rounded-xl p-5 space-y-4">
          <div>
            <h2 className="text-base font-semibold text-slate-100">
              08. AI 搜尋能見度指標（生成式引擎引用占比）
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              衡量各平台於主流 AI 搜尋引擎教育推薦查詢中之曝光權重（0–100）
            </p>
          </div>

          <div className="space-y-2.5">
            {[...platforms]
              .sort((a, b) => b.aiSearchVisibility - a.aiSearchVisibility)
              .map((p) => (
                <div key={p.id} className="grid grid-cols-12 items-center gap-3 text-xs">
                  <div className="col-span-4 sm:col-span-3 text-slate-200 font-medium truncate">
                    {p.shortName}
                    <span className="ml-1 text-[10px] text-slate-500">
                      {p.region === '台灣樣本' ? 'TW' : 'GL'}
                    </span>
                  </div>
                  <div className="col-span-6 sm:col-span-7 h-2.5 bg-[#060D1A] rounded-sm overflow-hidden border border-sky-900/30">
                    <div
                      className={`h-full transition-all ${
                        p.region === '台灣樣本' ? 'bg-cyan-400' : 'bg-indigo-400'
                      }`}
                      style={{ width: `${p.aiSearchVisibility}%` }}
                    />
                  </div>
                  <div className="col-span-2 text-right font-mono-num font-semibold text-slate-100">
                    {p.aiSearchVisibility}
                  </div>
                </div>
              ))}
          </div>
        </article>
      </section>
    </div>
  );
};
