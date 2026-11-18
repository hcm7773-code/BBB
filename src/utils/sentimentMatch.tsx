import React from 'react';
import {
  DailySentimentPoint,
  EdTechPlatform,
  SentimentAlertRule,
  SentimentMention,
  TriggeredAlert,
} from '../types';

export function getHighlightTokens(query: string): string[] {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const subTokens = trimmed
    .split(/[\s,，、/｜|()（）]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2);
  const all = [trimmed, ...subTokens];
  // Deduplicate and sort longer tokens first for clean regex matching
  return Array.from(new Set(all)).sort((a, b) => b.length - a.length);
}

export function doesMentionMatch(mention: SentimentMention, query: string): boolean {
  const tokens = getHighlightTokens(query);
  if (tokens.length === 0) return true;
  const haystack = `${mention.platformName} ${mention.channel} ${mention.topicTag} ${mention.excerpt} ${mention.aiInsight} ${mention.track}`.toLowerCase();
  return tokens.some((tok) => haystack.includes(tok.toLowerCase()));
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const HighlightText: React.FC<{
  text: string;
  query: string;
}> = ({ text, query }) => {
  const tokens = getHighlightTokens(query);
  if (tokens.length === 0) return <>{text}</>;

  const pattern = new RegExp(`(${tokens.map(escapeRegExp).join('|')})`, 'gi');
  const parts = text.split(pattern);

  return (
    <>
      {parts.map((part, idx) => {
        const isMatch = tokens.some(
          (tok) => tok.toLowerCase() === part.toLowerCase()
        );
        return isMatch ? (
          <mark
            key={idx}
            className="bg-cyan-400/25 text-cyan-100 px-1 py-0.5 rounded-xs font-semibold ring-1 ring-cyan-400/40"
          >
            {part}
          </mark>
        ) : (
          <React.Fragment key={idx}>{part}</React.Fragment>
        );
      })}
    </>
  );
};

export function evaluateAlertRules(
  rules: SentimentAlertRule[],
  platforms: EdTechPlatform[],
  mentions: SentimentMention[],
  sevenDaySentiment: DailySentimentPoint[]
): TriggeredAlert[] {
  const triggered: TriggeredAlert[] = [];

  for (const rule of rules) {
    if (!rule.enabled) continue;

    const scopedPlatforms =
      rule.targetPlatformId === 'all'
        ? platforms
        : platforms.filter((p) => p.id === rule.targetPlatformId);

    if (rule.ruleType === 'negative_ratio') {
      const breached = scopedPlatforms.filter(
        (p) => p.sentimentNegative >= rule.threshold
      );
      if (breached.length > 0) {
        const maxPlat = [...breached].sort(
          (a, b) => b.sentimentNegative - a.sentimentNegative
        )[0];
        triggered.push({
          ruleId: rule.id,
          ruleName: rule.name,
          severity: rule.severity,
          targetLabel: breached.map((b) => b.shortName).join(' · '),
          currentValue: `最高負面 ${maxPlat.sentimentNegative}%（警戒 ≥ ${rule.threshold}%）`,
          reason: `共有 ${breached.length} 家平台負面情緒占比達到或超過 ${rule.threshold}% 警戒門檻。`,
          searchHint: maxPlat.shortName,
        });
      }
    } else if (rule.ruleType === 'net_sentiment_drop') {
      const breached = scopedPlatforms.filter(
        (p) => p.sentimentPositive - p.sentimentNegative <= rule.threshold
      );
      if (breached.length > 0) {
        const minPlat = [...breached].sort(
          (a, b) =>
            a.sentimentPositive -
            a.sentimentNegative -
            (b.sentimentPositive - b.sentimentNegative)
        )[0];
        const nss = minPlat.sentimentPositive - minPlat.sentimentNegative;
        triggered.push({
          ruleId: rule.id,
          ruleName: rule.name,
          severity: rule.severity,
          targetLabel: breached.map((b) => b.shortName).join(' · '),
          currentValue: `最低淨情緒 ${nss} pt（警戒 ≤ ${rule.threshold} pt）`,
          reason: `${breached.length} 家平台淨情緒分數跌破或低於 ${rule.threshold} pt 基準線，需追蹤負評原因。`,
          searchHint: minPlat.shortName,
        });
      }
    } else if (rule.ruleType === 'keyword_match') {
      const kws = rule.keyword
        .split(/[,，、\s]+/)
        .map((k) => k.trim())
        .filter(Boolean);
      if (kws.length === 0) continue;

      const scopedMentions =
        rule.targetPlatformId === 'all'
          ? mentions
          : mentions.filter((m) => m.platformId === rule.targetPlatformId);

      const matched = scopedMentions.filter((m) =>
        kws.some((kw) => doesMentionMatch(m, kw))
      );

      if (matched.length >= Math.max(1, rule.threshold)) {
        triggered.push({
          ruleId: rule.id,
          ruleName: rule.name,
          severity: rule.severity,
          targetLabel: `命中詞：${kws.join(' / ')}`,
          currentValue: `偵測 ${matched.length} 筆（門檻 ≥ ${rule.threshold} 筆）`,
          reason: `社群輿情中偵測到 ${matched.length} 筆提及監測關鍵詞，包含「${matched[0].platformName}」等紀錄。`,
          searchHint: kws[0],
        });
      }
    } else if (rule.ruleType === 'daily_negative_spike') {
      const breachedDays = sevenDaySentiment.filter(
        (d) => d.負面 >= rule.threshold
      );
      if (breachedDays.length > 0) {
        const peakDay = [...breachedDays].sort((a, b) => b.負面 - a.負面)[0];
        triggered.push({
          ruleId: rule.id,
          ruleName: rule.name,
          severity: rule.severity,
          targetLabel: `異常日期：${breachedDays.map((d) => d.date).join('、')}`,
          currentValue: `單日負面峰值 ${peakDay.負面} 筆（上限 ≥ ${rule.threshold}）`,
          reason: `過去 7 日中有 ${breachedDays.length} 日單日負面聲量達 ${rule.threshold} 筆以上，建議檢視當日負向討論。`,
          searchHint: '隱私',
        });
      }
    }
  }

  return triggered;
}
