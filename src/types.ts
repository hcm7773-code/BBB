export type WorkspaceTab = 'dashboard' | 'sentiment' | 'strategy' | 'competitive' | 'ecosystem';

export type MarketTrack = '教育新創平台' | 'AI Tutor' | 'Multi-Agent' | '教育 AI 市場';

export type PlatformRegion = '台灣樣本' | '國際標竿';

export type AnalysisDimension = '市場競爭' | '社群輿情' | '使用者需求' | '服務生態系';

export type ConfidenceLevel = '高' | '中' | '低';

export type StakeholderType = '學生' | '教師' | '家長' | '學校';

export type SentimentPolarity = '正面' | '中立' | '負面';

export type AgentRole =
  | 'Orchestrator'
  | '教學 Agent'
  | '診斷 Agent'
  | '評量 Agent'
  | '教師支援 Agent';

export interface IndicatorEvidence {
  indicatorId: string;
  indicatorName: string;
  score: number; // 1 to 10
  source: string;
  observedDate: string;
  confidence: ConfidenceLevel;
  note: string;
}

export interface EdTechPlatform {
  id: string;
  name: string;
  shortName: string;
  region: PlatformRegion;
  positioning: string;
  businessModel: string;
  targetUsers: string[];
  aiStage: string;
  growthSignal: string;
  monthlyMentions: number;
  sentimentPositive: number;
  sentimentNeutral: number;
  sentimentNegative: number;
  aiSearchVisibility: number;
  marketMomentum: number;
  agentDepth: number;
  ecosystemIntegration: number;
  evidences: IndicatorEvidence[];
}

export interface MonthlyTrackPoint {
  month: string;
  教育新創平台: number;
  'AI Tutor': number;
  'Multi-Agent': number;
  '教育 AI 市場': number;
}

export interface DemandRankItem {
  id: string;
  label: string;
  stakeholder: StakeholderType;
  track: MarketTrack;
  score: number;
  delta: number;
}

export interface KolNode {
  id: string;
  name: string;
  role: string;
  track: MarketTrack;
  influence: number;
  x: number;
  y: number;
}

export interface KolEdge {
  source: string;
  target: string;
  strength: number;
}

export interface SentimentMention {
  id: string;
  timestamp: string;
  platformId: string;
  platformName: string;
  channel: string;
  stakeholder: StakeholderType;
  track: MarketTrack;
  polarity: SentimentPolarity;
  topicTag: string;
  excerpt: string;
  aiInsight: string;
  engagement: number;
}

export interface IssueCluster {
  id: string;
  keyword: string;
  track: MarketTrack;
  volume: number;
  positiveShare: number;
  negativeShare: number;
  growthDelta: number;
}

export type LearningLoopStep = 1 | 2 | 3 | 4 | 5;

export interface DailySentimentPoint {
  date: string; // e.g. '11/12'
  fullDate: string; // e.g. '2026-11-12'
  正面: number;
  中立: number;
  負面: number;
  總聲量: number;
}

export interface KeywordCloudItem {
  id: string;
  word: string;
  weight: number; // 1 to 100
  mentions: number;
  polarity: SentimentPolarity;
  track: MarketTrack;
  growthRate: number;
  relatedPlatform: string;
}

export interface IssueDeepAnalysis {
  id: string;
  title: string;
  track: MarketTrack;
  dominantStakeholder: StakeholderType;
  totalVolume: number;
  growthDelta: number;
  positivePct: number;
  neutralPct: number;
  negativePct: number;
  dailyTrend: Array<{ date: string; volume: number }>;
  topPlatforms: string[];
  positiveDrivers: string[];
  negativeDrivers: string[];
  summary: string;
}

export interface SentimentDriverItem {
  id: string;
  factor: string;
  polarity: '正面' | '負面';
  category: string;
  mentionCount: number;
  impactScore: number; // 0-100
  representativeQuote: string;
  platformsAffected: string[];
}

export interface UserPainPoint {
  id: string;
  stakeholder: StakeholderType;
  title: string;
  description: string;
  frequency: number; // 0-100
  severity: number; // 1-10
  unmetGap: number; // 0-100%
  currentWorkaround: string;
  eaafSolution: string;
  relatedPlatforms: string[];
}

export interface StrategicInitiative {
  id: string;
  title: string;
  horizon: '短期切入 (0–3個月)' | '中期擴張 (3–9個月)' | '長期生態 (9–18個月)';
  targetScenario: string;
  competitiveMoat: string;
  indicatorAlignment: string[];
  expectedKpis: string[];
  humanReviewGuardrail: string;
}

export type AlertRuleType =
  | 'negative_ratio'
  | 'keyword_match'
  | 'daily_negative_spike'
  | 'net_sentiment_drop';

export type AlertSeverity = '高風險' | '中度注意';

export interface SentimentAlertRule {
  id: string;
  name: string;
  ruleType: AlertRuleType;
  targetPlatformId: string; // 'all' or platform id
  threshold: number;
  keyword: string;
  severity: AlertSeverity;
  enabled: boolean;
  notifyChannel: string;
  createdAt: string;
}

export interface TriggeredAlert {
  ruleId: string;
  ruleName: string;
  severity: AlertSeverity;
  reason: string;
  targetLabel: string;
  currentValue: string;
  searchHint: string;
}

export type TopicClusterCategory =
  | '產品體驗'
  | '行銷活動'
  | '競爭策略'
  | '人才招募'
  | '政策環境';

export interface TopicClusterAssignment {
  mentionId: string;
  category: TopicClusterCategory;
  confidence: number;
  rationale: string;
  keywords: string[];
}

export interface TopicClusteringResponse {
  assignments: TopicClusterAssignment[];
  clusterSummary: string;
  dominantCategory: TopicClusterCategory;
}

export interface DailyTopicBriefingItem {
  category: TopicClusterCategory;
  sentimentTone: string;
  mentionCount: number;
  dailySummary: string;
  perspectiveAdvice: string;
  keySignals: string[];
}

export interface DailyDeepBriefingResponse {
  briefingDate: string;
  title: string;
  executiveOverview: string;
  topicBriefings: DailyTopicBriefingItem[];
  crossTopicRecommendations: string[];
}
