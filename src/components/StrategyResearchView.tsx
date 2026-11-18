import React, { useState, useMemo } from 'react';
import {
  EdTechPlatform,
  StakeholderType,
  UserPainPoint,
} from '../types';
import { STRATEGIC_INITIATIVES } from '../data/edtechData';
import {
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
  CheckCircle2,
  Compass,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

interface StrategyResearchViewProps {
  platforms: EdTechPlatform[];
  painPoints: UserPainPoint[];
  onAddPainPoint: (painPoint: UserPainPoint) => void;
}

const STAKEHOLDER_FILTERS: Array<'全部角色' | StakeholderType> = [
  '全部角色',
  '教師',
  '學生',
  '家長',
  '學校',
];

const HORIZON_FILTERS = [
  '全部階段',
  '短期切入 (0–3個月)',
  '中期擴張 (3–9個月)',
  '長期生態 (9–18個月)',
] as const;

interface GeneratedStrategyMemo {
  positioningTitle: string;
  competitiveGapOpportunity: string;
  mvpExecutionPlan: string[];
  validationMetrics: string[];
  humanOversightDesign: string;
}

export const StrategyResearchView: React.FC<StrategyResearchViewProps> = ({
  platforms,
  painPoints,
  onAddPainPoint,
}) => {
  const [stakeholderFilter, setStakeholderFilter] = useState<'全部角色' | StakeholderType>('全部角色');
  const [horizonFilter, setHorizonFilter] = useState<(typeof HORIZON_FILTERS)[number]>('全部階段');

  // Add Pain Point Inline Form
  const [showAddPain, setShowAddPain] = useState<boolean>(false);
  const [newStakeholder, setNewStakeholder] = useState<StakeholderType>('教師');
  const [newTitle, setNewTitle] = useState<string>('');
  const [newDesc, setNewDesc] = useState<string>('');
  const [newSeverity, setNewSeverity] = useState<number>(8.5);
  const [newUnmetGap, setNewUnmetGap] = useState<number>(70);
  const [newSolution, setNewSolution] = useState<string>('');

  // AI Strategy Research Memo State
  const [strategyScenario, setStrategyScenario] = useState<string>('GAEC Mini 自適應英語檢測垂直切入');
  const [strategyStakeholder, setStrategyStakeholder] = useState<StakeholderType>('教師');
  const [strategyPainId, setStrategyPainId] = useState<string>(painPoints[0]?.id || 'pp_1');
  const [strategyBenchmark, setStrategyBenchmark] = useState<string>('Khanmigo 與 教育部因材網');
  const [strategyLoading, setStrategyLoading] = useState<boolean>(false);
  const [strategyError, setStrategyError] = useState<string | null>(null);
  const [generatedMemo, setGeneratedMemo] = useState<GeneratedStrategyMemo | null>(null);

  const filteredPainPoints = useMemo(() => {
    if (stakeholderFilter === '全部角色') return painPoints;
    return painPoints.filter((p) => p.stakeholder === stakeholderFilter);
  }, [painPoints, stakeholderFilter]);

  const painChartData = useMemo(() => {
    return filteredPainPoints.map((p) => ({
      name: p.title.length > 11 ? `${p.title.slice(0, 11)}…` : p.title,
      fullName: p.title,
      提及頻率: p.frequency,
      市場未滿足缺口: p.unmetGap,
    }));
  }, [filteredPainPoints]);

  const filteredInitiatives = useMemo(() => {
    if (horizonFilter === '全部階段') return STRATEGIC_INITIATIVES;
    return STRATEGIC_INITIATIVES.filter((s) => s.horizon === horizonFilter);
  }, [horizonFilter]);

  const handleCreatePainPoint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onAddPainPoint({
      id: `pp_${Date.now()}`,
      stakeholder: newStakeholder,
      title: newTitle.trim(),
      description: newDesc.trim() || '研究團隊新增之第一線使用者痛點觀察紀錄。',
      frequency: 76,
      severity: newSeverity,
      unmetGap: newUnmetGap,
      currentWorkaround: '暫以人工補救或跨工具切換應對',
      eaafSolution: newSolution.trim() || '透過 Multi-Agent 協作與人工覆核流程改善',
      relatedPlatforms: ['EAAF 試點平台'],
    });
    setNewTitle('');
    setNewDesc('');
    setNewSolution('');
    setShowAddPain(false);
  };

  const handleGenerateStrategy = async (e: React.FormEvent) => {
    e.preventDefault();
    setStrategyLoading(true);
    setStrategyError(null);

    const targetPain =
      painPoints.find((p) => p.id === strategyPainId)?.title ||
      painPoints[0]?.title ||
      '教師工作流負擔與診斷落差';

    try {
      const res = await fetch('/api/ai-strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario: strategyScenario,
          targetStakeholder: strategyStakeholder,
          focusPainPoint: targetPain,
          competitorBenchmark: strategyBenchmark,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || '策略研究生成失敗');
      }
      setGeneratedMemo(data);
    } catch (err: any) {
      setStrategyError(err.message || '連線發生錯誤');
    } finally {
      setStrategyLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Section 1: 使用者痛點分析 Header & Chart */}
      <section className="bg-[#0B1528] border border-sky-900/40 rounded-xl p-5 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="text-xs text-slate-400">
              四大構面深度解析 · 使用者需求（學生 · 教師 · 家長 · 學校）與新創策略研究
            </div>
            <h1 className="font-display text-xl font-bold text-slate-50 mt-0.5">
              使用者痛點分析與策略研究工作台
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex flex-wrap items-center gap-1 p-1 rounded-lg bg-[#060D1A] border border-sky-900/50">
              {STAKEHOLDER_FILTERS.map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStakeholderFilter(st)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    stakeholderFilter === st
                      ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/40'
                      : 'text-slate-400 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowAddPain((v) => !v)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-sky-800/60 text-cyan-300 text-xs font-medium whitespace-nowrap cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>新增痛點觀察</span>
            </button>
          </div>
        </div>

        {/* Inline Add Pain Point Form */}
        {showAddPain && (
          <form
            onSubmit={handleCreatePainPoint}
            className="grid grid-cols-1 md:grid-cols-12 gap-3 p-4 rounded-lg bg-[#071020] border border-cyan-500/35 items-end"
          >
            <div className="md:col-span-2">
              <label className="block text-[11px] text-slate-400 mb-1">對象角色</label>
              <select
                value={newStakeholder}
                onChange={(e) => setNewStakeholder(e.target.value as StakeholderType)}
                className="w-full px-3 py-2 rounded-lg bg-[#0B1528] border border-sky-800/60 text-xs text-slate-100"
              >
                <option value="教師">教師</option>
                <option value="學生">學生</option>
                <option value="家長">家長</option>
                <option value="學校">學校</option>
              </select>
            </div>
            <div className="md:col-span-3">
              <label className="block text-[11px] text-slate-400 mb-1">痛點標題</label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="例如：雙語教材與課綱進度對齊不易"
                className="w-full px-3 py-2 rounded-lg bg-[#0B1528] border border-sky-800/60 text-xs text-slate-100"
              />
            </div>
            <div className="md:col-span-3">
              <label className="block text-[11px] text-slate-400 mb-1">EAAF 對應解方</label>
              <input
                type="text"
                value={newSolution}
                onChange={(e) => setNewSolution(e.target.value)}
                placeholder="例如：教師支援 Agent 自動匹配課綱節點"
                className="w-full px-3 py-2 rounded-lg bg-[#0B1528] border border-sky-800/60 text-xs text-slate-100"
              />
            </div>
            <div className="md:col-span-1">
              <label className="block text-[11px] text-slate-400 mb-1">嚴重度</label>
              <input
                type="number"
                step="0.1"
                min="1"
                max="10"
                value={newSeverity}
                onChange={(e) => setNewSeverity(Number(e.target.value))}
                className="w-full px-2.5 py-2 rounded-lg bg-[#0B1528] border border-sky-800/60 text-xs font-mono-num text-slate-100"
              />
            </div>
            <div className="md:col-span-1">
              <label className="block text-[11px] text-slate-400 mb-1">缺口%</label>
              <input
                type="number"
                min="10"
                max="100"
                value={newUnmetGap}
                onChange={(e) => setNewUnmetGap(Number(e.target.value))}
                className="w-full px-2.5 py-2 rounded-lg bg-[#0B1528] border border-sky-800/60 text-xs font-mono-num text-slate-100"
              />
            </div>
            <div className="md:col-span-2 flex gap-2">
              <button
                type="submit"
                className="flex-1 px-3 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-semibold cursor-pointer"
              >
                儲存痛點
              </button>
              <button
                type="button"
                onClick={() => setShowAddPain(false)}
                className="px-3 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs cursor-pointer"
              >
                取消
              </button>
            </div>
          </form>
        )}

        {/* Recharts Pain Point Frequency vs Unmet Market Gap */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
          <div className="xl:col-span-6 bg-[#071020] border border-sky-900/35 rounded-lg p-4 flex flex-col justify-between">
            <div className="mb-3">
              <h2 className="text-sm font-semibold text-slate-100">
                痛點發生頻率 vs 市場未滿足缺口比較（Recharts）
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                高頻率且高未滿足缺口者，代表教育新創優先切入之高價值市場縫隙
              </p>
            </div>
            <div className="w-full h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={painChartData}
                  margin={{ top: 10, right: 12, left: -16, bottom: 16 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(56, 189, 248, 0.12)" />
                  <XAxis
                    dataKey="name"
                    stroke="#94A3B8"
                    tick={{ fill: '#94A3B8', fontSize: 10 }}
                    interval={0}
                    angle={-12}
                    textAnchor="end"
                    height={52}
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
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="提及頻率" fill="#38BDF8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="市場未滿足缺口" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pain Points Matrix List */}
          <div className="xl:col-span-6 space-y-3 max-h-[360px] overflow-y-auto pr-1">
            {filteredPainPoints.map((pp) => (
              <article
                key={pp.id}
                className="rounded-lg bg-[#071020] border border-sky-900/40 p-4 space-y-2"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs text-cyan-300 font-medium">
                      {pp.stakeholder}痛點 · 相關平台：{pp.relatedPlatforms.join(' / ')}
                    </div>
                    <h3 className="text-sm font-semibold text-slate-100 mt-0.5">
                      {pp.title}
                    </h3>
                  </div>
                  <div className="text-right font-mono-num shrink-0">
                    <div className="text-xs text-amber-300 font-semibold flex items-center gap-1 justify-end">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      嚴重度 {pp.severity.toFixed(1)}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      未滿足缺口 {pp.unmetGap}%
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {pp.description}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
                  <div className="p-2.5 rounded-md bg-[#0B1528] border border-sky-900/30 text-slate-400">
                    <span className="text-slate-300 font-medium">現行替代做法：</span>
                    {pp.currentWorkaround}
                  </div>
                  <div className="p-2.5 rounded-md bg-[#0B1528] border border-cyan-500/25 text-cyan-100">
                    <span className="text-cyan-300 font-medium">EAAF 切入解方：</span>
                    {pp.eaafSolution}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Section 2: 策略研究藍圖與 AI 策略研究生成 */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* Left: 3-Horizon Strategic Roadmap */}
        <div className="xl:col-span-7 bg-[#0B1528] border border-sky-900/40 rounded-xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                <Compass className="h-4 w-4 text-cyan-400" />
                策略研究藍圖：垂直切入 → 工作流共生 → 生態系互通
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                依據 PDF 研究結論規劃三階段商業與技術擴張路徑
              </p>
            </div>

            <div className="flex flex-wrap gap-1 p-1 rounded-lg bg-[#060D1A] border border-sky-900/50">
              {HORIZON_FILTERS.map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setHorizonFilter(h)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    horizonFilter === h
                      ? 'bg-cyan-500/20 text-cyan-200'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {h === '全部階段' ? '全部' : h.slice(0, 4)}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3.5">
            {filteredInitiatives.map((init) => (
              <article
                key={init.id}
                className="rounded-lg bg-[#071020] border border-sky-900/40 p-4 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <span className="text-xs font-mono-num font-semibold text-cyan-300">
                    {init.horizon}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    對齊指標：{init.indicatorAlignment.join(' · ')}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-slate-100">
                    {init.title}
                  </h3>
                  <p className="text-xs text-slate-300 mt-1">
                    <span className="text-slate-400">鎖定場景：</span>
                    {init.targetScenario}
                  </p>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    <span className="text-cyan-300 font-medium">差異化護城河：</span>
                    {init.competitiveMoat}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-sky-900/30 text-xs">
                  <div className="space-y-1">
                    <div className="text-slate-400 font-medium">預期驗證 KPI</div>
                    <ul className="space-y-1 text-slate-200">
                      {init.expectedKpis.map((kpi) => (
                        <li key={kpi} className="flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                          <span>{kpi}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-1">
                    <div className="text-amber-300 font-medium flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      人工覆核與治理護欄
                    </div>
                    <p className="text-slate-300 leading-relaxed">
                      {init.humanReviewGuardrail}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* Right: Interactive Gemini AI Strategic Research Synthesizer */}
        <div className="xl:col-span-5 bg-[#0B1528] border border-sky-900/40 rounded-xl p-5 space-y-4">
          <div>
            <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-cyan-400" />
              AI 策略研究備忘錄生成器
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              結合競品對標與使用者痛點，即時推演新創垂直切入策略與驗證指標
            </p>
          </div>

          <form onSubmit={handleGenerateStrategy} className="space-y-3">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                目標垂直場景
              </label>
              <select
                value={strategyScenario}
                onChange={(e) => setStrategyScenario(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#060D1A] border border-sky-800/60 text-xs text-slate-100"
              >
                <option value="GAEC Mini 自適應英語檢測垂直切入">GAEC Mini 自適應英語檢測垂直切入</option>
                <option value="國中小數學補救教學與前導診斷">國中小數學補救教學與前導診斷</option>
                <option value="K-12 教師差異化備課與批改減負工作流">K-12 教師差異化備課與批改減負工作流</option>
                <option value="跨校教育雲 AI 安全護欄與人工覆核中樞">跨校教育雲 AI 安全護欄與人工覆核中樞</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  首要目標對象
                </label>
                <select
                  value={strategyStakeholder}
                  onChange={(e) => setStrategyStakeholder(e.target.value as StakeholderType)}
                  className="w-full px-3 py-2 rounded-lg bg-[#060D1A] border border-sky-800/60 text-xs text-slate-100"
                >
                  <option value="教師">教師</option>
                  <option value="學生">學生</option>
                  <option value="學校">學校</option>
                  <option value="家長">家長</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  對標競爭參照
                </label>
                <select
                  value={strategyBenchmark}
                  onChange={(e) => setStrategyBenchmark(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#060D1A] border border-sky-800/60 text-xs text-slate-100"
                >
                  <option value="Khanmigo 與 教育部因材網">Khanmigo 與 教育部因材網</option>
                  <option value="Duolingo Max 與 Uedu">Duolingo Max 與 Uedu</option>
                  <option value="均一教育平台 與 PaGamO">均一教育平台 與 PaGamO</option>
                  {platforms.slice(0, 3).map((p) => (
                    <option key={p.id} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                優先解決之核心痛點
              </label>
              <select
                value={strategyPainId}
                onChange={(e) => setStrategyPainId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#060D1A] border border-sky-800/60 text-xs text-slate-100"
              >
                {painPoints.map((pp) => (
                  <option key={pp.id} value={pp.id}>
                    [{pp.stakeholder}] {pp.title}
                  </option>
                ))}
              </select>
            </div>

            {strategyError && (
              <div className="text-xs text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-2">
                {strategyError}
              </div>
            )}

            <button
              type="submit"
              disabled={strategyLoading}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
            >
              {strategyLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>生成結構化策略研究中...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>生成 AI 策略研究建議</span>
                </>
              )}
            </button>
          </form>

          {generatedMemo && (
            <div className="rounded-lg bg-[#071020] border border-cyan-500/35 p-4 space-y-3 text-xs">
              <div className="font-semibold text-sm text-cyan-300">
                {generatedMemo.positioningTitle}
              </div>
              <p className="text-slate-200 leading-relaxed">
                {generatedMemo.competitiveGapOpportunity}
              </p>
              <div className="space-y-1">
                <div className="font-medium text-slate-300">短期驗證執行步驟</div>
                <ul className="space-y-1 text-slate-200 list-disc pl-4">
                  {generatedMemo.mvpExecutionPlan.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ul>
              </div>
              <div className="space-y-1">
                <div className="font-medium text-emerald-300">可量化驗證指標</div>
                <ul className="space-y-1 text-slate-200 list-disc pl-4">
                  {generatedMemo.validationMetrics.map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              </div>
              <div className="pt-2 border-t border-sky-900/35 text-amber-200 leading-relaxed">
                <span className="font-semibold">人工覆核與治理設計：</span>
                {generatedMemo.humanOversightDesign}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
