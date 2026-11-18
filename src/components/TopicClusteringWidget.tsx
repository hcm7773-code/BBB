import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  SentimentMention,
  TopicClusterAssignment,
  TopicClusterCategory,
  TopicClusteringResponse,
} from '../types';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ArrowUpRight,
  Layers,
  MinusCircle,
  RefreshCw,
  ThumbsDown,
  ThumbsUp,
} from 'lucide-react';

interface TopicClusteringWidgetProps {
  mentions: SentimentMention[];
  onNavigateFeed?: (keyword?: string) => void;
}

const CLUSTER_CATEGORIES: Array<{
  key: TopicClusterCategory;
  color: string;
  textClass: string;
  desc: string;
}> = [
  {
    key: '產品體驗',
    color: '#22D3EE',
    textClass: 'text-cyan-300',
    desc: 'AI 助教引導、語音評測、診斷準確度與功能操作感受',
  },
  {
    key: '行銷活動',
    color: '#A78BFA',
    textClass: 'text-violet-300',
    desc: '電競賽事推廣、KOL 短影音宣傳、試用碼與口碑轉介',
  },
  {
    key: '競爭策略',
    color: '#38BDF8',
    textClass: 'text-sky-300',
    desc: '訂閱定價門檻、差異化定位、跨界結盟與通路擴張',
  },
  {
    key: '人才招募',
    color: '#F59E0B',
    textClass: 'text-amber-300',
    desc: 'AI Agent 工程師、雙語教研師資與跨領域人才徵才',
  },
  {
    key: '政策環境',
    color: '#10B981',
    textClass: 'text-emerald-300',
    desc: '教育部數位學習補助、教育雲 SSO 與個資資安合規',
  },
];

interface CachedClusterState extends TopicClusteringResponse {
  analyzedAt: string;
}

export const TopicClusteringWidget: React.FC<TopicClusteringWidgetProps> = ({
  mentions,
  onNavigateFeed,
}) => {
  const [clusterData, setClusterData] = useState<CachedClusterState | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'全部' | TopicClusterCategory>('全部');

  const mentionsSignature = useMemo(() => {
    return `${mentions.length}_${mentions.map((m) => m.id).join('|')}`;
  }, [mentions]);

  const runClustering = useCallback(
    async (forceRefresh = false) => {
      if (mentions.length === 0) {
        setClusterData(null);
        return;
      }

      const cacheKey = `eaaf_topic_clustering_v2_${mentionsSignature}`;
      if (!forceRefresh) {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          try {
            const parsed = JSON.parse(cached) as CachedClusterState;
            setClusterData(parsed);
            setError(null);
            return;
          } catch {
            // ignore invalid cache
          }
        }
      }

      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/ai-topic-clustering', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            forceRefresh,
            mentions: mentions.map((m) => ({
              id: m.id,
              platformName: m.platformName,
              channel: m.channel,
              stakeholder: m.stakeholder,
              track: m.track,
              polarity: m.polarity,
              topicTag: m.topicTag,
              excerpt: m.excerpt,
            })),
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || '自動議題聚類失敗');
        }
        const payload: CachedClusterState = {
          assignments: Array.isArray(data.assignments) ? data.assignments : [],
          clusterSummary: data.clusterSummary || '',
          dominantCategory: data.dominantCategory || '產品體驗',
          analyzedAt: new Date().toLocaleTimeString('zh-TW', { hour12: false }),
        };
        setClusterData(payload);
        localStorage.setItem(cacheKey, JSON.stringify(payload));
      } catch (err: any) {
        setError(err?.message || '後端語意聚類連線發生錯誤');
      } finally {
        setLoading(false);
      }
    },
    [mentions, mentionsSignature]
  );

  useEffect(() => {
    runClustering(false);
  }, [runClustering]);

  const assignmentMap = useMemo(() => {
    const map = new Map<string, TopicClusterAssignment>();
    (clusterData?.assignments || []).forEach((item) => {
      map.set(item.mentionId, item);
    });
    return map;
  }, [clusterData]);

  const clusteredRecords = useMemo(() => {
    return mentions
      .map((m) => {
        const assignment = assignmentMap.get(m.id);
        return {
          mention: m,
          assignment,
        };
      })
      .filter((item) => Boolean(item.assignment));
  }, [mentions, assignmentMap]);

  const distributionStats = useMemo(() => {
    const total = clusteredRecords.length || 1;
    return CLUSTER_CATEGORIES.map((cat) => {
      const matched = clusteredRecords.filter(
        (r) => r.assignment?.category === cat.key
      );
      const count = matched.length;
      const pct = Math.round((count / total) * 100);
      const posCount = matched.filter((r) => r.mention.polarity === '正面').length;
      const negCount = matched.filter((r) => r.mention.polarity === '負面').length;
      const avgConf = count
        ? Math.round(
            matched.reduce((sum, r) => sum + (r.assignment?.confidence || 0), 0) / count
          )
        : 0;
      return {
        category: cat.key,
        color: cat.color,
        textClass: cat.textClass,
        desc: cat.desc,
        筆數: count,
        占比: pct,
        posCount,
        negCount,
        avgConf,
      };
    });
  }, [clusteredRecords]);

  const filteredRecords = useMemo(() => {
    if (selectedCategory === '全部') return clusteredRecords;
    return clusteredRecords.filter(
      (r) => r.assignment?.category === selectedCategory
    );
  }, [clusteredRecords, selectedCategory]);

  const activeCategoryMeta = useMemo(() => {
    if (selectedCategory === '全部') return null;
    return CLUSTER_CATEGORIES.find((c) => c.key === selectedCategory) || null;
  }, [selectedCategory]);

  return (
    <section className="bg-[#0B1528] border border-sky-900/40 rounded-xl p-5 space-y-5">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pb-3 border-b border-sky-900/40">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span className="inline-flex items-center gap-1 text-cyan-300 font-medium">
              <Layers className="h-3.5 w-3.5" />
              <span>後端 AI 語意聚類引擎</span>
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-num">
              已收錄 {mentions.length} 筆輿情語料 · 五大議題分類
            </span>
            {clusterData?.analyzedAt && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-mono-num text-slate-500">
                  聚類完成 {clusterData.analyzedAt}
                </span>
              </>
            )}
          </div>
          <h2 className="text-base font-semibold text-slate-100 mt-1">
            自動議題聚類與五大類分類分佈圖
          </h2>
        </div>

        <button
          type="button"
          onClick={() => runClustering(true)}
          disabled={loading || mentions.length === 0}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/40 text-cyan-200 text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50 self-start lg:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? '語意聚類分析中...' : '重新執行語意聚類'}</span>
        </button>
      </div>

      {/* Loading / Error / Empty / Populated */}
      {loading && !clusterData ? (
        <div className="rounded-lg bg-[#071020] border border-sky-900/35 p-6 flex items-center gap-3 text-xs text-cyan-200">
          <RefreshCw className="h-4 w-4 animate-spin text-cyan-400 shrink-0" />
          <span>
            正在透過後端語意分析將 {mentions.length} 筆輿情資料自動歸類至「產品體驗」、「行銷活動」、「競爭策略」、「人才招募」與「政策環境」...
          </span>
        </div>
      ) : error ? (
        <div className="rounded-lg bg-rose-500/10 border border-rose-500/30 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-rose-300">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => runClustering(true)}
            className="text-cyan-300 hover:underline font-medium shrink-0 cursor-pointer"
          >
            重試聚類分析
          </button>
        </div>
      ) : mentions.length === 0 ? (
        <div className="rounded-lg bg-[#071020] border border-sky-900/35 p-6 text-center text-xs text-slate-400">
          目前尚無收錄的輿情資料，請先至「輿情分析」分頁新增社群評論以啟動自動議題聚類。
        </div>
      ) : clusterData ? (
        <>
          {/* 5-Category Summary Strip (Interactive Click-to-Filter) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {distributionStats.map((item) => {
              const isSelected = selectedCategory === item.category;
              return (
                <button
                  key={item.category}
                  type="button"
                  onClick={() =>
                    setSelectedCategory((prev) =>
                      prev === item.category ? '全部' : item.category
                    )
                  }
                  className={`text-left rounded-lg p-3.5 border transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-500/12 border-cyan-400/55'
                      : 'bg-[#071020] border-sky-900/35 hover:border-sky-700/60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className={`font-semibold ${item.textClass}`}>
                      {item.category}
                    </span>
                    <span className="font-mono-num text-slate-300 font-semibold">
                      {item.占比}%
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-baseline gap-2">
                    <span className="font-mono-num text-xl font-bold text-slate-50">
                      {item.筆數}
                    </span>
                    <span className="text-[11px] text-slate-400">筆語料</span>
                  </div>
                  <div className="mt-2 h-1.5 w-full rounded-sm bg-[#060D1A] overflow-hidden">
                    <div
                      className="h-full transition-all duration-300"
                      style={{
                        width: `${Math.max(4, item.占比)}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                  <div className="mt-2 text-[11px] text-slate-400 font-mono-num">
                    正面 {item.posCount} · 負面 {item.negCount} · 信心 {item.avgConf}%
                  </div>
                </button>
              );
            })}
          </div>

          {/* Main 2-Column Split: Distribution Chart + Clustered Mentions Inspector */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
            {/* Left: Five-Category Distribution BarChart (Recharts) + AI Cluster Summary */}
            <div className="xl:col-span-5 bg-[#071020] border border-sky-900/35 rounded-lg p-4 flex flex-col justify-between gap-4">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-slate-100">
                    五大議題分類分佈圖（Recharts）
                  </h3>
                  <span className="text-[11px] font-mono-num text-cyan-300">
                    主導類別：{clusterData.dominantCategory}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  點擊長條或上方分類卡片可篩選右側歸類輿情明細
                </p>
              </div>

              <div className="w-full h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={distributionStats}
                    margin={{ top: 8, right: 12, left: -16, bottom: 4 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(56, 189, 248, 0.12)"
                    />
                    <XAxis
                      dataKey="category"
                      stroke="#94A3B8"
                      tick={{ fill: '#E2E8F0', fontSize: 11 }}
                      axisLine={{ stroke: 'rgba(56, 189, 248, 0.25)' }}
                    />
                    <YAxis
                      allowDecimals={false}
                      stroke="#94A3B8"
                      tick={{
                        fill: '#94A3B8',
                        fontSize: 11,
                        fontFamily: 'JetBrains Mono',
                      }}
                      axisLine={{ stroke: 'rgba(56, 189, 248, 0.25)' }}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(56, 189, 248, 0.08)' }}
                      contentStyle={{
                        backgroundColor: '#060D1A',
                        borderColor: 'rgba(34, 211, 238, 0.45)',
                        borderRadius: '8px',
                        fontSize: '12px',
                        color: '#F1F5F9',
                      }}
                      formatter={(value: any, _name: any, props: any) => [
                        `${value} 筆（${props?.payload?.占比 ?? 0}%）`,
                        '歸類聲量',
                      ]}
                    />
                    <Bar
                      dataKey="筆數"
                      radius={[4, 4, 0, 0]}
                      className="cursor-pointer"
                      onClick={(barData: any) => {
                        if (barData?.category) {
                          setSelectedCategory((prev) =>
                            prev === barData.category ? '全部' : barData.category
                          );
                        }
                      }}
                    >
                      {distributionStats.map((entry) => (
                        <Cell
                          key={entry.category}
                          fill={entry.color}
                          fillOpacity={
                            selectedCategory === '全部' ||
                            selectedCategory === entry.category
                              ? 0.9
                              : 0.3
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="pt-3 border-t border-sky-900/35 space-y-1.5">
                <div className="text-xs font-semibold text-cyan-300">
                  後端語意聚類洞察總結
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {clusterData.clusterSummary}
                </p>
              </div>
            </div>

            {/* Right: Clustered Mentions List & Rationale */}
            <div className="xl:col-span-7 bg-[#071020] border border-sky-900/35 rounded-lg p-4 flex flex-col justify-between gap-4">
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-100">
                      自動歸類輿情明細（{selectedCategory} · {filteredRecords.length} 筆）
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {activeCategoryMeta
                        ? activeCategoryMeta.desc
                        : '檢視每筆輿情之語意分類標籤、信心度與 AI 歸類依據'}
                    </p>
                  </div>

                  {onNavigateFeed && (
                    <button
                      type="button"
                      onClick={() =>
                        onNavigateFeed(
                          selectedCategory !== '全部' ? selectedCategory : undefined
                        )
                      }
                      className="inline-flex items-center gap-1 text-xs font-medium text-cyan-300 hover:text-cyan-200 whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <span>前往輿情明細中心</span>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Segmented Category Filter Bar */}
                <div className="flex flex-wrap items-center gap-1 p-1 rounded-lg bg-[#060D1A] border border-sky-900/45">
                  {(['全部', '產品體驗', '行銷活動', '競爭策略', '人才招募', '政策環境'] as const).map(
                    (cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          selectedCategory === cat
                            ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/40'
                            : 'text-slate-400 hover:text-slate-200 border border-transparent'
                        }`}
                      >
                        {cat}
                      </button>
                    )
                  )}
                </div>

                {/* Mentions List */}
                {filteredRecords.length === 0 ? (
                  <div className="rounded-lg bg-[#0B1528] border border-sky-900/35 p-6 text-center text-xs text-slate-400">
                    目前「{selectedCategory}」類別下尚無歸類輿情樣本，可於輿情中心新增貼文後點擊重新聚類。
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                    {filteredRecords.map(({ mention, assignment }) => {
                      const catMeta = CLUSTER_CATEGORIES.find(
                        (c) => c.key === assignment?.category
                      );
                      return (
                        <article
                          key={mention.id}
                          className="rounded-lg bg-[#0B1528] border border-sky-900/40 p-3.5 space-y-2"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`font-semibold ${
                                  catMeta?.textClass || 'text-cyan-300'
                                }`}
                              >
                                {assignment?.category}
                              </span>
                              <span className="text-slate-600" aria-hidden="true">
                                ·
                              </span>
                              <span className="font-medium text-slate-100">
                                {mention.platformName}
                              </span>
                              <span className="text-slate-600" aria-hidden="true">
                                ·
                              </span>
                              <span className="text-slate-400">
                                {mention.stakeholder}視角
                              </span>
                              <span className="text-slate-600" aria-hidden="true">
                                ·
                              </span>
                              <span className="font-mono-num text-slate-400">
                                信心 {assignment?.confidence}%
                              </span>
                            </div>

                            <span
                              className={`inline-flex items-center gap-1 font-semibold shrink-0 ${
                                mention.polarity === '正面'
                                  ? 'text-emerald-300'
                                  : mention.polarity === '負面'
                                  ? 'text-rose-300'
                                  : 'text-sky-300'
                              }`}
                            >
                              {mention.polarity === '正面' && (
                                <ThumbsUp className="h-3 w-3" />
                              )}
                              {mention.polarity === '負面' && (
                                <ThumbsDown className="h-3 w-3" />
                              )}
                              {mention.polarity === '中立' && (
                                <MinusCircle className="h-3 w-3" />
                              )}
                              <span>{mention.polarity}</span>
                            </span>
                          </div>

                          <p className="text-xs text-slate-100 leading-relaxed">
                            「{mention.excerpt}」
                          </p>

                          <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-sky-900/25 text-[11px] text-slate-400">
                            <span>
                              歸類依據：{assignment?.rationale}
                            </span>
                            {assignment?.keywords && assignment.keywords.length > 0 && (
                              <span className="text-cyan-300/90">
                                {assignment.keywords.join(' · ')}
                              </span>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
};
