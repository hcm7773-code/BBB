import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  DailyDeepBriefingResponse,
  EdTechPlatform,
  SentimentMention,
  TopicClusterCategory,
} from '../types';
import { INITIAL_SEVEN_DAY_SENTIMENT } from '../data/edtechData';
import {
  ArrowUpRight,
  BookOpen,
  Check,
  Copy,
  RefreshCw,
} from 'lucide-react';

interface DailyBriefingWidgetProps {
  mentions: SentimentMention[];
  platforms: EdTechPlatform[];
  activeAlertsCount: number;
  onNavigateTab?: (
    tab: 'sentiment' | 'strategy',
    keyword?: string
  ) => void;
}

interface CachedDailyBriefing extends DailyDeepBriefingResponse {
  generatedAt: string;
}

const TOPIC_ACCENT_TEXT: Record<TopicClusterCategory, string> = {
  產品體驗: 'text-cyan-300',
  行銷活動: 'text-violet-300',
  競爭策略: 'text-sky-300',
  人才招募: 'text-amber-300',
  政策環境: 'text-emerald-300',
};

export const DailyBriefingWidget: React.FC<DailyBriefingWidgetProps> = ({
  mentions,
  platforms,
  activeAlertsCount,
  onNavigateTab,
}) => {
  const [briefing, setBriefing] = useState<CachedDailyBriefing | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<'全部' | TopicClusterCategory>('全部');
  const [copied, setCopied] = useState<boolean>(false);

  const dateLabel = useMemo(() => {
    const latest = INITIAL_SEVEN_DAY_SENTIMENT[INITIAL_SEVEN_DAY_SENTIMENT.length - 1];
    return latest?.fullDate || '2026-11-18';
  }, []);

  const mentionsSignature = useMemo(() => {
    return `${mentions.length}_${mentions.map((m) => m.id).slice(0, 20).join('_')}`;
  }, [mentions]);

  const fetchDailyBriefing = useCallback(
    async (forceRefresh = false) => {
      if (mentions.length === 0) {
        setBriefing(null);
        return;
      }

      const cacheKey = `eaaf_daily_briefing_v1_${dateLabel}_${mentionsSignature}`;
      if (!forceRefresh) {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          try {
            setBriefing(JSON.parse(cached) as CachedDailyBriefing);
            setError(null);
            return;
          } catch {
            // ignore corrupted cache
          }
        }
      }

      setLoading(true);
      setError(null);
      try {
        const sevenDayLatest =
          INITIAL_SEVEN_DAY_SENTIMENT[INITIAL_SEVEN_DAY_SENTIMENT.length - 1];
        const res = await fetch('/api/ai-daily-briefing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dateLabel,
            mentions: mentions.map((m) => ({
              id: m.id,
              timestamp: m.timestamp,
              platformName: m.platformName,
              stakeholder: m.stakeholder,
              polarity: m.polarity,
              topicTag: m.topicTag,
              excerpt: m.excerpt,
            })),
            sevenDayLatest,
            platformsSummary: platforms.map((p) => ({
              name: p.shortName,
              sentimentPositive: p.sentimentPositive,
              sentimentNegative: p.sentimentNegative,
              monthlyMentions: p.monthlyMentions,
            })),
            activeAlertsCount,
            forceRefresh,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || '每日輿情深度簡報生成失敗');
        }
        const payload: CachedDailyBriefing = {
          briefingDate: data.briefingDate || dateLabel,
          title: data.title || '每日五大議題輿情深度簡報',
          executiveOverview: data.executiveOverview || '',
          topicBriefings: Array.isArray(data.topicBriefings) ? data.topicBriefings : [],
          crossTopicRecommendations: Array.isArray(data.crossTopicRecommendations)
            ? data.crossTopicRecommendations
            : [],
          generatedAt: new Date().toLocaleTimeString('zh-TW', { hour12: false }),
        };
        setBriefing(payload);
        localStorage.setItem(cacheKey, JSON.stringify(payload));
      } catch (err: any) {
        setError(err?.message || '連線發生錯誤');
      } finally {
        setLoading(false);
      }
    },
    [dateLabel, mentions, mentionsSignature, platforms, activeAlertsCount]
  );

  useEffect(() => {
    fetchDailyBriefing(false);
  }, [fetchDailyBriefing]);

  const displayedTopics = useMemo(() => {
    if (!briefing) return [];
    if (selectedTopic === '全部') return briefing.topicBriefings;
    return briefing.topicBriefings.filter((t) => t.category === selectedTopic);
  }, [briefing, selectedTopic]);

  const handleCopyBriefing = async () => {
    if (!briefing) return;
    const lines: string[] = [
      `【${briefing.title}】(${briefing.briefingDate})`,
      '',
      `一、當日全景導讀`,
      briefing.executiveOverview,
      '',
      `二、五大議題關鍵摘要與觀點建議`,
      ...briefing.topicBriefings.map(
        (t, idx) =>
          `${idx + 1}. ${t.category}（${t.sentimentTone}｜約 ${t.mentionCount} 筆）\n` +
          `   關鍵摘要：${t.dailySummary}\n` +
          `   觀點建議：${t.perspectiveAdvice}`
      ),
      '',
      `三、跨議題行動建議`,
      ...briefing.crossTopicRecommendations.map((r, i) => `0${i + 1}. ${r}`),
    ];

    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable
    }
  };

  return (
    <section className="bg-[#0B1528] border border-cyan-500/35 rounded-xl p-5 space-y-5">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pb-3 border-b border-sky-900/40">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span className="inline-flex items-center gap-1 text-cyan-300 font-medium">
              <BookOpen className="h-3.5 w-3.5" />
              <span>五大議題每日編輯室</span>
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-num">簡報日期 {dateLabel}</span>
            <span aria-hidden="true">·</span>
            <span>產品體驗 / 行銷活動 / 競爭策略 / 人才招募 / 政策環境</span>
            {briefing?.generatedAt && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-mono-num text-slate-500">
                  生成 {briefing.generatedAt}
                </span>
              </>
            )}
          </div>
          <h2 className="text-base font-semibold text-slate-100 mt-1">
            每日輿情深度簡報（五大議題關鍵摘要與觀點建議）
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0 self-start lg:self-auto">
          {briefing && (
            <button
              type="button"
              onClick={handleCopyBriefing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#071020] hover:bg-slate-800/80 border border-sky-800/60 text-slate-200 text-xs font-medium whitespace-nowrap cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span>已複製簡報</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-cyan-300" />
                  <span>複製簡報全文</span>
                </>
              )}
            </button>
          )}
          <button
            type="button"
            onClick={() => fetchDailyBriefing(true)}
            disabled={loading || mentions.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/40 text-cyan-200 text-xs font-medium whitespace-nowrap cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? '深度簡報生成中...' : '重新生成每日簡報'}</span>
          </button>
        </div>
      </div>

      {/* Loading / Error / Empty / Populated */}
      {loading && !briefing ? (
        <div className="rounded-lg bg-[#071020] border border-sky-900/35 p-6 flex items-center gap-3 text-xs text-cyan-200">
          <RefreshCw className="h-4 w-4 animate-spin text-cyan-400 shrink-0" />
          <span>
            正在彙整五大議題（產品體驗、行銷活動、競爭策略、人才招募、政策環境）撰寫每日輿情深度簡報...
          </span>
        </div>
      ) : error ? (
        <div className="rounded-lg bg-rose-500/10 border border-rose-500/30 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-rose-300">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => fetchDailyBriefing(true)}
            className="text-cyan-300 hover:underline font-medium shrink-0 cursor-pointer"
          >
            重試生成
          </button>
        </div>
      ) : mentions.length === 0 ? (
        <div className="rounded-lg bg-[#071020] border border-sky-900/35 p-6 text-center text-xs text-slate-400">
          尚無輿情語料可供生成每日深度簡報，請先新增輿情紀錄。
        </div>
      ) : briefing ? (
        <div className="space-y-4">
          {/* Executive Overview + Cross-Topic Action Strip */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-stretch">
            <div className="xl:col-span-7 rounded-lg bg-[#071020] border border-sky-900/35 p-4 space-y-2">
              <div className="text-sm font-semibold text-cyan-300">
                {briefing.title}
              </div>
              <p className="text-sm text-slate-200 leading-relaxed">
                {briefing.executiveOverview}
              </p>
            </div>

            <div className="xl:col-span-5 rounded-lg bg-[#071020] border border-sky-900/35 p-4 flex flex-col justify-between gap-3">
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-300">
                  跨議題策略行動建議
                </div>
                <ul className="space-y-1.5 text-xs text-slate-200">
                  {briefing.crossTopicRecommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-2 leading-relaxed">
                      <span className="font-mono-num text-cyan-400 font-semibold shrink-0">
                        0{idx + 1}
                      </span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {onNavigateTab && (
                <div className="pt-2 border-t border-sky-900/30 flex justify-end">
                  <button
                    type="button"
                    onClick={() => onNavigateTab('strategy')}
                    className="inline-flex items-center gap-1 text-xs font-medium text-cyan-300 hover:text-cyan-200 cursor-pointer"
                  >
                    <span>延伸至策略研究模擬器</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Topic Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1 p-1 rounded-lg bg-[#060D1A] border border-sky-900/45">
              {(
                [
                  '全部',
                  '產品體驗',
                  '行銷活動',
                  '競爭策略',
                  '人才招募',
                  '政策環境',
                ] as const
              ).map((topic) => (
                <button
                  key={topic}
                  type="button"
                  onClick={() => setSelectedTopic(topic)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    selectedTopic === topic
                      ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/40'
                      : 'text-slate-400 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  {topic === '全部' ? '全部五大議題' : topic}
                </button>
              ))}
            </div>

            {onNavigateTab && (
              <button
                type="button"
                onClick={() =>
                  onNavigateTab(
                    'sentiment',
                    selectedTopic !== '全部' ? selectedTopic : undefined
                  )
                }
                className="inline-flex items-center gap-1 text-xs font-medium text-cyan-300 hover:text-cyan-200 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>追蹤完整輿情明細</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* 5-Topic Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {displayedTopics.map((item, idx) => {
              const accentText = TOPIC_ACCENT_TEXT[item.category] || 'text-cyan-300';
              return (
                <article
                  key={item.category}
                  className="rounded-lg bg-[#071020] border border-sky-900/35 p-4 space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-sky-900/30">
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <span className="font-mono-num text-xs text-slate-400">
                          0{idx + 1}
                        </span>
                        <span className={accentText}>{item.category}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400 font-mono-num">
                        <span>{item.sentimentTone}</span>
                        <span aria-hidden="true">·</span>
                        <span>關聯 {item.mentionCount} 筆</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="text-[11px] font-medium text-slate-400">
                        每日關鍵摘要
                      </div>
                      <p className="text-xs text-slate-100 leading-relaxed">
                        {item.dailySummary}
                      </p>
                    </div>

                    <div className="space-y-1 pt-1">
                      <div className="text-[11px] font-medium text-cyan-300">
                        觀點建議
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {item.perspectiveAdvice}
                      </p>
                    </div>
                  </div>

                  {item.keySignals.length > 0 && (
                    <div className="pt-2 border-t border-sky-900/25 flex items-center justify-between gap-2 text-[11px] text-slate-400">
                      <span>關鍵訊號：{item.keySignals.join(' · ')}</span>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      ) : null}
    </section>
  );
};
