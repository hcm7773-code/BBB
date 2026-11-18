import React, { useState } from 'react';
import { AgentRole, LearningLoopStep } from '../types';
import {
  CheckCircle2,
  Cpu,
  GitBranch,
  Layers,
  ShieldCheck,
} from 'lucide-react';

interface LoopStepSpec {
  step: LearningLoopStep;
  title: string;
  desc: string;
  leadAgent: AgentRole;
  inputSignal: string;
  outputArtifact: string;
  governanceRule: string;
}

const LOOP_STEPS: LoopStepSpec[] = [
  {
    step: 1,
    title: '能力評量',
    desc: '了解學生程度與基準能力',
    leadAgent: '評量 Agent',
    inputSignal: '自適應題庫作答紀錄、語音朗讀與對話音訊、文本寫作初稿',
    outputArtifact: '多維度基準能力座標（例如 CEFR 分項能力或知識節點起始狀態）',
    governanceRule: '題組難度動態校準須符合課綱與檢定信效度基準，不採黑箱單一總分。',
  },
  {
    step: 2,
    title: '學習診斷',
    desc: '辨識知識弱點與學習缺口',
    leadAgent: '診斷 Agent',
    inputSignal: '錯題型態、停頓與遲疑特徵、前置知識圖譜相依結構',
    outputArtifact: '可追溯的知識斷點清單與前置概念回溯建議',
    governanceRule: '每項弱點歸因須附帶對應題號或對話證據，避免無依據標籤化學生。',
  },
  {
    step: 3,
    title: '個人化推薦',
    desc: '規劃適性學習路徑建議',
    leadAgent: 'Orchestrator',
    inputSignal: '診斷缺口排序、學習時間預算、班級教學進度限制',
    outputArtifact: '分階補強練習序列與教師可微調之推薦課表草稿',
    governanceRule: 'Orchestrator 協調各代理資料一致性並過濾重複或無效的模型呼叫。',
  },
  {
    step: 4,
    title: 'AI 引導',
    desc: '提供漸進式練習與即時回饋',
    leadAgent: '教學 Agent',
    inputSignal: '目前學習步驟、學生卡關回應、蘇格拉底式提示層級',
    outputArtifact: '分步思考提示、句型鷹架與即時修正回饋（不直接代寫或給正解）',
    governanceRule: '嚴格套用未成年對話安全護欄，偵測異常提問或連續挫折時觸發提示降階。',
  },
  {
    step: 5,
    title: '教師覆核',
    desc: '保留人工確認形成持續改善循環',
    leadAgent: '教師支援 Agent',
    inputSignal: '班級學情摘要、高風險評級變動、AI 引導歷程稽核紀錄',
    outputArtifact: '待核准教學建議清單與最終定案之學習歷程回饋',
    governanceRule: '關鍵能力定級、跨級調動與補救派題必須經過教師人工覆核（Human-in-the-loop）方能生效。',
  },
];

const MULTI_AGENTS: Array<{
  role: AgentRole;
  duty: string;
  note: string;
  handoffTarget: string;
}> = [
  {
    role: 'Orchestrator',
    duty: '任務分派、協調與驗證',
    note: '管控多代理資料一致性、防止迴圈與無效呼叫，維護執行品質',
    handoffTarget: '協調全體 4 個專業子代理',
  },
  {
    role: '教學 Agent',
    duty: '解說、提問與蘇格拉底引導',
    note: '依據程度提供分步提示而非直接給標準答案，支援漸進式鷹架',
    handoffTarget: '接收診斷結果 → 回傳互動歷程',
  },
  {
    role: '診斷 Agent',
    duty: '分析能力與學習落差',
    note: '回溯前導知識斷點與跨維度能力關聯，定位真正失分根因',
    handoffTarget: '讀取評量數據 → 輸出弱點圖譜',
  },
  {
    role: '評量 Agent',
    duty: '出題、評分與精準回饋',
    note: '支援聽、說、讀、寫與整合應用之適性測驗及前後測對照',
    handoffTarget: '產出基準能力分數 → 交由診斷拆解',
  },
  {
    role: '教師支援 Agent',
    duty: '教案、班級與學習摘要',
    note: '彙整診斷報告與對話異常警示，供教師進行人工覆核與決策',
    handoffTarget: '整合班級摘要 → 交付教師人工覆核',
  },
];

const EAAF_LAYERS = [
  {
    layer: '第一層｜教育新創產業研究',
    summary: '透過四大構面與七項關鍵指標，持續追蹤台灣與國際標竿平台及社群輿情脈動。',
  },
  {
    layer: '第二層｜AI Tutor × Multi-Agent 技術研究',
    summary: '拆解單一 LLM 對話極限，透過評量、診斷、教學、教師支援多代理分工建立可控學習循環。',
  },
  {
    layer: '第三層｜EAAF 教育 AI Agent Framework',
    summary: '落實「逐步自動化、保留人工覆核」原則，建立結合教育專業與人類監督之可信生態系。',
  },
];

const GOVERNANCE_PILLARS = [
  {
    title: '品質驗證與幻覺防線',
    metric: '雙層檢核',
    desc: '教材知識庫與出題規準先經課綱節點比對，再由 Orchestrator 檢查推理步驟完整性，避免 UGC 或通用模型錯題流出。',
  },
  {
    title: '資料一致性與呼叫控管',
    metric: '單一狀態源',
    desc: '統一管理學習者能力狀態向量，防止評量 Agent 與教學 Agent 各自推論造成前後矛盾或重複 Token 消耗。',
  },
  {
    title: '教師可控性與人工覆核閘道',
    metric: 'Human-in-the-loop',
    desc: '高風險能力評定與跨階段學習路徑調整預設進入「待教師覆核」佇列，確保教育專業最終決策權留在教師手中。',
  },
];

export const EcosystemArchitectureView: React.FC = () => {
  const [selectedStep, setSelectedStep] = useState<LearningLoopStep>(5);
  const [selectedAgent, setSelectedAgent] = useState<AgentRole>('Orchestrator');

  const activeStepSpec =
    LOOP_STEPS.find((s) => s.step === selectedStep) || LOOP_STEPS[0];

  return (
    <div className="space-y-6">
      {/* Header & EAAF 3-Layer Roadmap */}
      <section className="bg-[#0B1528] border border-sky-900/40 rounded-xl p-5 space-y-5">
        <div>
          <div className="text-xs text-slate-400">
            研究結論與技術框架 · 市場研究 → 技術驗證 → 框架設計 → 平台實作
          </div>
          <h1 className="font-display text-xl font-bold text-slate-50 mt-0.5">
            AI Tutor 五步循環與 Multi-Agent 協作架構
          </h1>
        </div>

        {/* EAAF Three Layers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {EAAF_LAYERS.map((item) => (
            <div
              key={item.layer}
              className="rounded-lg bg-[#071020] border border-sky-900/40 p-4 space-y-1.5"
            >
              <div className="text-xs font-semibold text-cyan-300">{item.layer}</div>
              <p className="text-xs text-slate-300 leading-relaxed">{item.summary}</p>
            </div>
          ))}
        </div>

        {/* Multi-Agent Role Division */}
        <div className="space-y-2.5 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs">
            <span className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Cpu className="h-3.5 w-3.5 text-cyan-400" />
              Multi-Agent 角色分工與協調機制
            </span>
            <span className="text-slate-400">
              協調 · 品質驗證 · 資料一致性 · 人類監督
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
            {MULTI_AGENTS.map((ag) => {
              const isActive = selectedAgent === ag.role;
              return (
                <button
                  key={ag.role}
                  type="button"
                  onClick={() => setSelectedAgent(ag.role)}
                  className={`text-left rounded-lg border p-3.5 space-y-1.5 transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-cyan-500/12 border-cyan-400/50'
                      : 'bg-[#071020] border-sky-900/35 hover:bg-[#0D1C34]'
                  }`}
                >
                  <div className="text-xs font-semibold text-cyan-300">{ag.role}</div>
                  <div className="text-xs font-medium text-slate-100">{ag.duty}</div>
                  <div className="text-[11px] text-slate-400 leading-snug">{ag.note}</div>
                  <div className="pt-1 text-[11px] text-sky-300/90 border-t border-sky-900/30">
                    {ag.handoffTarget}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5-Step AI Tutor Cycle Architecture Blueprint */}
      <section className="bg-[#0B1528] border border-sky-900/40 rounded-xl p-5 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-slate-100">
              AI Tutor 五步學習循環架構規範
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              點選任意步驟檢視輸入訊號、輸出成果、主責代理與人工覆核設計護欄
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-300">
            <ShieldCheck className="h-4 w-4" />
            原則：逐步自動化、保留人工覆核
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
          {LOOP_STEPS.map((item) => {
            const isSelected = selectedStep === item.step;
            return (
              <button
                key={item.step}
                type="button"
                onClick={() => setSelectedStep(item.step)}
                className={`text-left rounded-lg p-3.5 border transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-500/15 border-cyan-400/60'
                    : 'bg-[#071020] border-sky-900/40 hover:bg-[#0D1C34]'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-mono-num">
                  <span className={isSelected ? 'text-cyan-300 font-bold' : 'text-slate-400'}>
                    步驟 0{item.step}
                  </span>
                  <CheckCircle2
                    className={`h-3.5 w-3.5 ${
                      isSelected ? 'text-emerald-400' : 'text-slate-600'
                    }`}
                  />
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-100">
                  {item.title}
                </div>
                <div className="mt-0.5 text-[11px] text-slate-400 leading-snug">
                  {item.desc}
                </div>
                <div className="mt-2 text-[11px] text-cyan-300/90 font-medium">
                  主責：{item.leadAgent}
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Step Specification Panel */}
        <div className="rounded-lg bg-[#071020] border border-sky-900/40 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-sky-900/35">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
              <GitBranch className="h-4 w-4 text-cyan-400" />
              <span>
                步驟 0{activeStepSpec.step}｜{activeStepSpec.title} — 架構規格拆解
              </span>
            </div>
            <span className="text-xs text-cyan-300 font-medium">
              協作主責代理：{activeStepSpec.leadAgent}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 rounded-lg bg-[#0B1528] border border-sky-900/35 space-y-1.5">
              <div className="text-slate-400 font-medium">輸入訊號（Input Context）</div>
              <p className="text-slate-200 leading-relaxed">
                {activeStepSpec.inputSignal}
              </p>
            </div>
            <div className="p-3.5 rounded-lg bg-[#0B1528] border border-sky-900/35 space-y-1.5">
              <div className="text-cyan-300 font-medium">輸出成果（Agent Output）</div>
              <p className="text-slate-200 leading-relaxed">
                {activeStepSpec.outputArtifact}
              </p>
            </div>
            <div className="p-3.5 rounded-lg bg-[#0B1528] border border-amber-500/25 space-y-1.5">
              <div className="text-amber-300 font-medium">治理與覆核護欄（Guardrail）</div>
              <p className="text-slate-200 leading-relaxed">
                {activeStepSpec.governanceRule}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* EAAF Governance Pillars */}
      <section className="bg-[#0B1528] border border-sky-900/40 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 text-base font-semibold text-slate-100">
          <Layers className="h-4 w-4 text-cyan-400" />
          <span>EAAF 教育 AI Agent Framework 核心治理準則</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {GOVERNANCE_PILLARS.map((pillar) => (
            <article
              key={pillar.title}
              className="rounded-lg bg-[#071020] border border-sky-900/35 p-4 space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-slate-100">{pillar.title}</h3>
                <span className="text-[11px] font-mono-num text-cyan-300 shrink-0">
                  {pillar.metric}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{pillar.desc}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};
