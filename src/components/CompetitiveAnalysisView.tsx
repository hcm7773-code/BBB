import React, { useState, useMemo } from 'react';
import {
  AnalysisDimension,
  EdTechPlatform,
  PlatformRegion,
} from '../types';
import { SEVEN_INDICATORS, TRANSFORMATION_STAGES } from '../data/edtechData';
import { CheckCircle2, ShieldCheck } from 'lucide-react';

interface CompetitiveAnalysisViewProps {
  platforms: EdTechPlatform[];
}

const DIMENSIONS: AnalysisDimension[] = [
  '市場競爭',
  '社群輿情',
  '使用者需求',
  '服務生態系',
];

const EXPANSION_STAGES = [
  {
    id: 'stage_1',
    title: '01. 單一垂直場景試點',
    focus: '能力評量 ＋ 學習診斷 ＋ 個人化學習',
    example: '例如：GAEC Mini 自適應英語檢測（聽、說、讀、寫與整合應用）',
    metrics: [
      { label: '使用者需求驗證', value: '89%' },
      { label: '前後測平均提升', value: '+18.4%' },
      { label: '教師採用留存', value: '82%' },
      { label: '機構付費意願', value: '74%' },
    ],
  },
  {
    id: 'stage_2',
    title: '02. 多學科知識圖譜延伸',
    focus: '英語檢測架構複用至數學、自然與資訊領域',
    example: '整合 108 課綱節點與錯題前導回溯，擴充題庫與診斷模型',
    metrics: [
      { label: '跨科模型遷移率', value: '76%' },
      { label: '單校週活躍班級', value: '14 班' },
      { label: '教師備課省時', value: '-42%' },
      { label: '續約轉換率', value: '81%' },
    ],
  },
  {
    id: 'stage_3',
    title: '03. 多校與多角色 Multi-Agent',
    focus: '教學 / 診斷 / 評量 / 教師支援 Agent 全面協作',
    example: '銜接縣市教育雲與校務系統，保留高風險決策人工覆核閘道',
    metrics: [
      { label: '合作學校數', value: '36 校' },
      { label: '人工覆核合規率', value: '100%' },
      { label: '跨平台互通指數', value: '8.7 / 10' },
      { label: '年度生態留存', value: '91%' },
    ],
  },
];

export const CompetitiveAnalysisView: React.FC<CompetitiveAnalysisViewProps> = ({
  platforms,
}) => {
  const [regionFilter, setRegionFilter] = useState<'全部' | PlatformRegion>('全部');
  const [selectedPlatformId, setSelectedPlatformId] = useState<string>(
    platforms[0]?.id || 'junyi'
  );
  const [activeDimension, setActiveDimension] = useState<AnalysisDimension>('市場競爭');
  const [activeExpansionId, setActiveExpansionId] = useState<string>('stage_1');

  const filteredPlatforms = useMemo(() => {
    if (regionFilter === '全部') return platforms;
    return platforms.filter((p) => p.region === regionFilter);
  }, [platforms, regionFilter]);

  const selectedPlatform = useMemo(
    () => platforms.find((p) => p.id === selectedPlatformId) || platforms[0],
    [platforms, selectedPlatformId]
  );

  // Average score per indicator across all platforms for Radar Benchmark
  const industryAverageScores = useMemo(() => {
    return SEVEN_INDICATORS.map((ind) => {
      const sum = platforms.reduce((acc, p) => {
        const ev = p.evidences.find((e) => e.indicatorId === ind.id);
        return acc + (ev ? ev.score : 0);
      }, 0);
      return sum / platforms.length;
    });
  }, [platforms]);

  // Radar SVG geometry (7 axes)
  const radarSize = 300;
  const cx = radarSize / 2;
  const cy = radarSize / 2;
  const maxR = 102;

  const getRadarPoint = (index: number, scoreOutOf10: number) => {
    const angle = (Math.PI * 2 * index) / 7 - Math.PI / 2;
    const r = (scoreOutOf10 / 10) * maxR;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  };

  const selectedPolygon = selectedPlatform.evidences
    .map((ev, idx) => {
      const pt = getRadarPoint(idx, ev.score);
      return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
    })
    .join(' ');

  const benchmarkPolygon = industryAverageScores
    .map((avg, idx) => {
      const pt = getRadarPoint(idx, avg);
      return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
    })
    .join(' ');

  const currentExpansion =
    EXPANSION_STAGES.find((s) => s.id === activeExpansionId) || EXPANSION_STAGES[0];

  return (
    <div className="space-y-6">
      {/* Section 1: 市場轉型五階段演進 */}
      <section className="bg-[#0B1528] border border-sky-900/40 rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="font-display text-xl font-bold text-slate-50">
              教育科技市場轉型與七大關鍵指標評估
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              從數位內容提供走向智慧化多代理協作 · 保留每項判斷之資料來源、觀察日期與信心等級
            </p>
          </div>
          <span className="text-xs text-cyan-300 font-mono-num">
            樣本數：{platforms.length} 平台 · 7 項指標
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {TRANSFORMATION_STAGES.map((stage) => {
            const isMatched = selectedPlatform.aiStage === stage.title;
            return (
              <div
                key={stage.step}
                className={`rounded-lg p-3.5 border transition-colors ${
                  isMatched
                    ? 'bg-cyan-500/10 border-cyan-400/50'
                    : 'bg-[#071020] border-sky-900/35'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-mono-num">
                  <span className={isMatched ? 'text-cyan-300 font-bold' : 'text-slate-400'}>
                    階段 {stage.step}
                  </span>
                  {isMatched && (
                    <span className="text-[11px] font-sans font-medium text-cyan-300">
                      目前選取平台定位
                    </span>
                  )}
                </div>
                <div className="mt-1.5 text-sm font-semibold text-slate-100">
                  {stage.title}
                </div>
                <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                  {stage.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Section 1.5: 七項關鍵指標熱力表（全平台橫向比較矩陣） */}
      <section className="bg-[#0B1528] border border-sky-900/40 rounded-xl p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-100">
              七項關鍵指標熱力表（全平台橫向評估矩陣）
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              一致量表 1–10 分 · 點擊任一平台列或分數儲存格可同步切換下方雷達圖與實證來源修訂
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 font-mono-num shrink-0">
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-xs bg-cyan-500/40 inline-block" />
              ≥ 9.0 領先
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-xs bg-sky-500/25 inline-block" />
              8.0–8.9 穩健
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-xs bg-sky-900/50 inline-block" />
              7.0–7.9 中等
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-xs bg-slate-800/80 inline-block" />
              &lt; 7.0 待強化
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-sky-900/40 text-slate-400">
                <th className="py-2.5 pr-3 text-left font-medium whitespace-nowrap">
                  平台樣本
                </th>
                {SEVEN_INDICATORS.map((ind) => (
                  <th
                    key={ind.id}
                    className="py-2.5 px-1.5 text-center font-medium min-w-[84px]"
                    title={ind.name}
                  >
                    <div className="font-mono-num text-cyan-300">{ind.code}</div>
                    <div className="text-[11px] text-slate-300 font-normal truncate max-w-[92px] mx-auto">
                      {ind.name.slice(0, 6)}
                    </div>
                  </th>
                ))}
                <th className="py-2.5 pl-3 text-right font-medium whitespace-nowrap">
                  均分
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredPlatforms.map((plat) => {
                const avg = (
                  plat.evidences.reduce((s, e) => s + e.score, 0) /
                  plat.evidences.length
                ).toFixed(1);
                const isSelected = plat.id === selectedPlatform.id;
                return (
                  <tr
                    key={plat.id}
                    onClick={() => {
                      setSelectedPlatformId(plat.id);
                    }}
                    className={`border-b border-sky-900/25 transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-500/12'
                        : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="py-2 pr-3 font-medium text-slate-100 whitespace-nowrap">
                      <span>{plat.shortName}</span>
                      <span className="ml-1.5 text-[10px] text-slate-400">
                        {plat.region === '台灣樣本' ? 'TW' : 'GL'}
                      </span>
                    </td>
                    {plat.evidences.map((ev) => {
                      const heatClass =
                        ev.score >= 9.0
                          ? 'bg-cyan-500/40 text-cyan-50 font-semibold'
                          : ev.score >= 8.0
                          ? 'bg-sky-500/25 text-sky-100'
                          : ev.score >= 7.0
                          ? 'bg-sky-900/50 text-slate-200'
                          : 'bg-slate-800/80 text-slate-400';
                      return (
                        <td key={ev.indicatorId} className="p-1 text-center">
                          <span
                            className={`block py-1.5 rounded-xs font-mono-num ${heatClass}`}
                            title={`${plat.name}｜${ev.indicatorName}：${ev.score.toFixed(1)}（${ev.source}）`}
                          >
                            {ev.score.toFixed(1)}
                          </span>
                        </td>
                      );
                    })}
                    <td className="py-2 pl-3 text-right font-mono-num font-bold text-cyan-300 whitespace-nowrap">
                      {avg}
                    </td>
                  </tr>
                );
              })}
              {/* Industry Average Row */}
              <tr className="bg-[#071020] border-t border-sky-800/50 text-slate-300">
                <td className="py-2.5 pr-3 font-semibold text-slate-200 whitespace-nowrap">
                  全體平台均值
                </td>
                {industryAverageScores.map((avgScore, idx) => (
                  <td
                    key={SEVEN_INDICATORS[idx].id}
                    className="py-2.5 px-1.5 text-center font-mono-num font-semibold text-sky-200"
                  >
                    {avgScore.toFixed(1)}
                  </td>
                ))}
                <td className="py-2.5 pl-3 text-right font-mono-num font-bold text-slate-100">
                  {(
                    industryAverageScores.reduce((s, v) => s + v, 0) /
                    industryAverageScores.length
                  ).toFixed(1)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 2: Platform Selector & 7-Axis Radar Comparison */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* Left: Platform Directory */}
        <div className="xl:col-span-4 bg-[#0B1528] border border-sky-900/40 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-slate-100">
              競爭版圖平台選單
            </h2>
            <div className="flex items-center gap-1 p-1 rounded-lg bg-[#060D1A] border border-sky-900/40">
              {(['全部', '台灣樣本', '國際標竿'] as const).map((region) => (
                <button
                  key={region}
                  type="button"
                  onClick={() => setRegionFilter(region)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    regionFilter === region
                      ? 'bg-cyan-500/20 text-cyan-200'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {region}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 max-h-[430px] overflow-y-auto pr-1">
            {filteredPlatforms.map((plat) => {
              const avg = (
                plat.evidences.reduce((s, e) => s + e.score, 0) /
                plat.evidences.length
              ).toFixed(1);
              const isSelected = plat.id === selectedPlatform.id;
              return (
                <button
                  key={plat.id}
                  type="button"
                  onClick={() => {
                    setSelectedPlatformId(plat.id);
                  }}
                  className={`w-full text-left p-3.5 rounded-lg border transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-500/12 border-cyan-400/50'
                      : 'bg-[#071020] border-sky-900/35 hover:border-sky-700/60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-slate-100">
                      {plat.name}
                    </span>
                    <span className="font-mono-num text-sm font-bold text-cyan-300">
                      {avg}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    {plat.region} · {plat.aiStage}
                  </div>
                  <div className="mt-1.5 text-xs text-slate-300 line-clamp-1">
                    {plat.positioning}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Radar + Four Dimensions */}
        <div className="xl:col-span-8 bg-[#0B1528] border border-sky-900/40 rounded-xl p-5 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-4 border-b border-sky-900/40">
            <div>
              <div className="text-xs text-cyan-300">
                {selectedPlatform.region} · {selectedPlatform.aiStage}
              </div>
              <h2 className="text-xl font-bold text-slate-50 mt-0.5">
                {selectedPlatform.name}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {selectedPlatform.positioning} · 商業模式：{selectedPlatform.businessModel}
              </p>
            </div>
            <div className="flex flex-wrap gap-1 p-1 rounded-lg bg-[#060D1A] border border-sky-900/40 shrink-0">
              {DIMENSIONS.map((dim) => (
                <button
                  key={dim}
                  type="button"
                  onClick={() => setActiveDimension(dim)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    activeDimension === dim
                      ? 'bg-sky-500/20 text-sky-200 border border-sky-400/40'
                      : 'text-slate-400 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  {dim}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
            {/* 7-Axis Radar SVG */}
            <div className="md:col-span-6 flex flex-col items-center">
              <svg
                viewBox={`0 0 ${radarSize} ${radarSize}`}
                className="w-full max-w-[300px] h-auto"
                role="img"
                aria-label={`${selectedPlatform.name} 七項關鍵指標雷達圖`}
              >
                {[2, 4, 6, 8, 10].map((level) => {
                  const pts = SEVEN_INDICATORS.map((_, idx) => {
                    const p = getRadarPoint(idx, level);
                    return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
                  }).join(' ');
                  return (
                    <polygon
                      key={level}
                      points={pts}
                      fill="none"
                      stroke="rgba(56, 189, 248, 0.14)"
                      strokeWidth="1"
                    />
                  );
                })}
                {SEVEN_INDICATORS.map((ind, idx) => {
                  const end = getRadarPoint(idx, 10);
                  const lbl = getRadarPoint(idx, 11.7);
                  return (
                    <g key={ind.id}>
                      <line
                        x1={cx}
                        y1={cy}
                        x2={end.x}
                        y2={end.y}
                        stroke="rgba(56, 189, 248, 0.18)"
                      />
                      <text
                        x={lbl.x}
                        y={lbl.y + 3}
                        textAnchor="middle"
                        className="fill-slate-300 text-[9.5px] font-mono"
                      >
                        {ind.code}
                      </text>
                    </g>
                  );
                })}
                <polygon
                  points={benchmarkPolygon}
                  fill="rgba(148, 163, 184, 0.12)"
                  stroke="#94A3B8"
                  strokeDasharray="3 3"
                  strokeWidth="1.2"
                />
                <polygon
                  points={selectedPolygon}
                  fill="rgba(34, 211, 238, 0.22)"
                  stroke="#22D3EE"
                  strokeWidth="2"
                />
              </svg>
              <div className="flex items-center gap-5 text-xs text-slate-300 mt-1">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-3 h-0.5 bg-cyan-400" />
                  {selectedPlatform.shortName}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-3 h-0.5 border-t border-dashed border-slate-400" />
                  9 平台均值
                </span>
              </div>
            </div>

            {/* Dimension Focused Summary */}
            <div className="md:col-span-6 space-y-4">
              <div className="rounded-lg bg-[#071020] border border-sky-900/40 p-4 space-y-2.5">
                <div className="text-xs font-semibold text-cyan-300">
                  構面剖析：{activeDimension}
                </div>
                {activeDimension === '市場競爭' && (
                  <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
                    <p>
                      <span className="text-slate-400">成長訊號：</span>
                      {selectedPlatform.growthSignal}
                    </p>
                    <p>
                      <span className="text-slate-400">市場動能指數：</span>
                      <span className="font-mono-num text-slate-100 font-semibold">
                        {selectedPlatform.marketMomentum} / 100
                      </span>
                    </p>
                    <p>
                      <span className="text-slate-400">AI 搜尋能見度：</span>
                      <span className="font-mono-num text-slate-100 font-semibold">
                        {selectedPlatform.aiSearchVisibility} / 100
                      </span>
                    </p>
                  </div>
                )}
                {activeDimension === '社群輿情' && (
                  <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
                    <p>
                      <span className="text-slate-400">月度社群討論聲量：</span>
                      <span className="font-mono-num text-cyan-300 font-semibold">
                        {selectedPlatform.monthlyMentions.toLocaleString()} 筆
                      </span>
                    </p>
                    <p>
                      <span className="text-slate-400">情緒分佈：</span>
                      正向 {selectedPlatform.sentimentPositive}% · 中立{' '}
                      {selectedPlatform.sentimentNeutral}% · 負向{' '}
                      {selectedPlatform.sentimentNegative}%
                    </p>
                  </div>
                )}
                {activeDimension === '使用者需求' && (
                  <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
                    <p>
                      <span className="text-slate-400">核心服務客群：</span>
                      {selectedPlatform.targetUsers.join(' · ')}
                    </p>
                    <p>
                      <span className="text-slate-400">教師工作流可控性：</span>
                      <span className="font-mono-num text-slate-100 font-semibold">
                        {selectedPlatform.evidences[3]?.score.toFixed(1)} / 10
                      </span>
                    </p>
                  </div>
                )}
                {activeDimension === '服務生態系' && (
                  <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
                    <p>
                      <span className="text-slate-400">Agent 協作深度：</span>
                      <span className="font-mono-num text-slate-100 font-semibold">
                        {selectedPlatform.agentDepth} / 100
                      </span>
                    </p>
                    <p>
                      <span className="text-slate-400">校園與系統整合度：</span>
                      <span className="font-mono-num text-slate-100 font-semibold">
                        {selectedPlatform.ecosystemIntegration} / 100
                      </span>
                    </p>
                  </div>
                )}
              </div>

              <div className="text-xs text-slate-400 leading-relaxed">
                七項關鍵指標皆遵循一致量表評估，於下方表格完整揭露各項指標之實證資料來源、觀察日期與信心等級。
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: 7 Key Indicators Evidence Table */}
      <section className="bg-[#0B1528] border border-sky-900/40 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-100">
              {selectedPlatform.name} — 七項關鍵指標實證紀錄表
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              記錄每項指標之量表分數、資料來源、觀察日期、信心等級與實證判斷備註
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-sky-900/40 text-slate-400">
                <th className="py-2.5 pr-4 font-medium">關鍵指標</th>
                <th className="py-2.5 px-3 font-medium text-right">量表分數</th>
                <th className="py-2.5 px-3 font-medium">資料來源</th>
                <th className="py-2.5 px-3 font-medium">觀察日期</th>
                <th className="py-2.5 px-3 font-medium">信心等級</th>
                <th className="py-2.5 pl-3 font-medium">實證判斷備註</th>
              </tr>
            </thead>
            <tbody>
              {selectedPlatform.evidences.map((ev, idx) => (
                <tr key={ev.indicatorId} className="border-b border-sky-900/25 hover:bg-slate-800/35">
                  <td className="py-3 pr-4 font-medium text-slate-100 whitespace-nowrap">
                    <span className="font-mono-num text-cyan-400 mr-2">
                      0{idx + 1}
                    </span>
                    {ev.indicatorName}
                  </td>
                  <td className="py-3 px-3 text-right font-mono-num font-bold text-cyan-300">
                    {ev.score.toFixed(1)}
                  </td>
                  <td className="py-3 px-3 text-slate-300 whitespace-nowrap">
                    {ev.source}
                  </td>
                  <td className="py-3 px-3 font-mono-num text-slate-400 whitespace-nowrap">
                    {ev.observedDate}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 font-medium ${
                        ev.confidence === '高'
                          ? 'text-emerald-300'
                          : ev.confidence === '中'
                          ? 'text-amber-300'
                          : 'text-rose-300'
                      }`}
                    >
                      <ShieldCheck className="h-3.5 w-3.5" />
                      信心：{ev.confidence}
                    </span>
                  </td>
                  <td className="py-3 pl-3 text-slate-300 max-w-md">
                    {ev.note}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 4: 新創切入策略與擴張路徑模擬 (PDF Page 8) */}
      <section className="bg-[#0B1528] border border-sky-900/40 rounded-xl p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-100">
              新創切入策略：先聚焦垂直場景，小規模驗證再擴張
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              擴張路徑：單一場景 → 多學科 → 多校與多角色 Agent · 點擊各階段檢視驗證指標
            </p>
          </div>
          <div className="flex items-center gap-1 p-1 rounded-lg bg-[#060D1A] border border-sky-900/40">
            {EXPANSION_STAGES.map((st, idx) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setActiveExpansionId(st.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  activeExpansionId === st.id
                    ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/40'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                階段 {idx + 1}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center bg-[#071020] border border-sky-900/35 rounded-lg p-4">
          <div className="lg:col-span-6 space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-cyan-300">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{currentExpansion.title}</span>
            </div>
            <div className="text-sm font-medium text-slate-100">
              優先切入：{currentExpansion.focus}
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {currentExpansion.example}
            </p>
          </div>

          <div className="lg:col-span-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {currentExpansion.metrics.map((m) => (
              <div
                key={m.label}
                className="rounded-lg bg-[#0B1528] border border-sky-900/40 p-3"
              >
                <div className="text-[11px] text-slate-400">{m.label}</div>
                <div className="mt-1 font-mono-num text-lg font-bold text-slate-50">
                  {m.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
