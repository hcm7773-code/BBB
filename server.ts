import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

function createGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// In-memory response cache to prevent redundant Gemini API quota consumption across reloads/tabs
const CACHE_TTL_MS = 60 * 60 * 1000; // 60 minutes
const responseCache = new Map<string, { value: any; expiresAt: number }>();

function getCachedResponse(key: string) {
  const entry = responseCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    responseCache.delete(key);
    return null;
  }
  return entry.value;
}

function setCachedResponse(key: string, value: any) {
  if (responseCache.size >= 100) {
    const oldestKey = responseCache.keys().next().value;
    if (oldestKey) responseCache.delete(oldestKey);
  }
  responseCache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
}

function isQuotaError(err: any): boolean {
  const msg = String(err?.message || err || '');
  return (
    err?.status === 429 ||
    msg.includes('"code":429') ||
    msg.includes('RESOURCE_EXHAUSTED')
  );
}

function isAuthError(err: any): boolean {
  const msg = String(err?.message || err || '');
  return (
    err?.status === 400 ||
    err?.status === 403 ||
    msg.includes('API_KEY_INVALID') ||
    msg.includes('PERMISSION_DENIED')
  );
}

async function generateWithResilience(
  ai: GoogleGenAI,
  params: { contents: string; config?: any }
) {
  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
  const models = ['gemini-4-hydrogen', 'gemini-3.1-flash-lite'] as const;
  let lastError: any = null;

  for (const model of models) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        return await ai.models.generateContent({
          model,
          contents: params.contents,
          config: params.config,
        });
      } catch (err: any) {
        lastError = err;
        if (isQuotaError(err)) {
          // Daily/project quota reached on this model; try next model without wasting retries
          break;
        }
        const status = err?.status;
        if ((status === 500 || status === 502 || status === 503 || status === 504) && attempt === 0) {
          await sleep(800);
          continue;
        }
        throw err;
      }
    }
  }

  throw lastError;
}

function handleGeminiError(res: express.Response, label: string, error: any) {
  if (isQuotaError(error)) {
    console.warn(`${label}: Gemini API quota exhausted (429 RESOURCE_EXHAUSTED).`);
    return res.status(429).json({
      error:
        'Gemini API 免費額度已達上限（RESOURCE_EXHAUSTED）。請至 Settings > Secrets 面板選擇已啟用計費（Billing）的 API 金鑰以提升配額，或稍後再試。',
      code: 'RESOURCE_EXHAUSTED',
    });
  }
  if (isAuthError(error)) {
    console.warn(`${label}: Gemini API key invalid or permission denied.`);
    return res.status(403).json({
      error:
        'Gemini API 金鑰無效或權限不足，請至 Settings > Secrets 面板確認您的 API 金鑰設定。',
      code: 'AUTH_ERROR',
    });
  }
  console.error(`${label}:`, error?.message || error);
  return res.status(500).json({
    error: error?.message || `${label}暫時無法回應，請稍後再試。`,
  });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // 1. AI Market & Sentiment Brief (Dashboard Insight)
  app.post('/api/ai-market-brief', async (req, res) => {
    try {
      const { activeTrack, platformsSummary, forceRefresh } = req.body;
      const cacheKey = `brief:${activeTrack || '全部主線'}:${JSON.stringify(platformsSummary || [])}`;
      if (!forceRefresh) {
        const cached = getCachedResponse(cacheKey);
        if (cached) return res.json(cached);
      }

      const ai = createGeminiClient();
      if (!ai) {
        return res.status(500).json({
          error: '尚未設定 GEMINI_API_KEY，請於 Settings > Secrets 確認金鑰設定。',
        });
      }

      const prompt = `你是教育科技（EdTech × AI Tutor × Multi-Agent）產業輿情研究分析師。
目前使用者正在檢視市場主線：「${activeTrack || '全部主線'}」。
以下是追蹤平台的即時聲量與指標摘要數據：
${JSON.stringify(platformsSummary, null, 2)}

請以簡潔、客觀、專業的繁體中文提供 3 點產業輿情洞察：
1. 市場競爭與社群聲量變化訊號（比較台灣樣本與國際標竿的輿情落差）
2. 教師工作流、人工覆核（Human-in-the-loop）與使用者痛點的切入機會
3. 建議下一步追蹤或實驗的垂直場景策略`;

      const response = await generateWithResilience(ai, { contents: prompt });
      const payload = { brief: response.text || '' };
      setCachedResponse(cacheKey, payload);
      return res.json(payload);
    } catch (error: any) {
      return handleGeminiError(res, 'AI Market Brief Error', error);
    }
  });

  // 2. AI Sentiment & Stakeholder Classifier
  app.post('/api/ai-sentiment', async (req, res) => {
    try {
      const { platformName, channel, rawText } = req.body;
      const ai = createGeminiClient();
      if (!ai) {
        return res.status(500).json({
          error: '尚未設定 GEMINI_API_KEY，請於 Settings > Secrets 確認金鑰設定。',
        });
      }

      const prompt = `你是教育新創產業輿情分析系統的語意分類引擎。請分析以下這則教育平台相關的社群貼文／評論：

提及平台：${platformName || '未指定'}
來源管道：${channel || '社群論壇'}
原文內容：${rawText}

請嚴格依結構化欄位回傳繁體中文輿情判讀結果。`;

      const response = await generateWithResilience(ai, {
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              polarity: {
                type: Type.STRING,
                description: '必須為 正面、中立 或 負面',
              },
              stakeholder: {
                type: Type.STRING,
                description: '必須為 學生、教師、家長 或 學校',
              },
              track: {
                type: Type.STRING,
                description: '必須為 教育新創平台、AI Tutor、Multi-Agent 或 教育 AI 市場',
              },
              topicTag: {
                type: Type.STRING,
                description: '簡短議題標籤（例如：教師工作流減負、AI 引導品質、資料隱私）',
              },
              aiInsight: {
                type: Type.STRING,
                description: '2 句話以內的產品機會或風險判讀建議',
              },
            },
            required: ['polarity', 'stakeholder', 'track', 'topicTag', 'aiInsight'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json(parsed);
    } catch (error: any) {
      return handleGeminiError(res, 'AI Sentiment Error', error);
    }
  });

  // 3. AI Strategic Research Memo Generator
  app.post('/api/ai-strategy', async (req, res) => {
    try {
      const { scenario, targetStakeholder, focusPainPoint, competitorBenchmark } = req.body;
      const ai = createGeminiClient();
      if (!ai) {
        return res.status(500).json({
          error: '尚未設定 GEMINI_API_KEY，請於 Settings > Secrets 確認金鑰設定。',
        });
      }

      const prompt = `你是教育科技產業策略研究首席顧問，熟稔「EAAF 教育 AI Agent Framework」與台灣及國際 EdTech 競爭格局（均一、PaGamO、因材網、學習吧、Uedu、Duolingo、Khanmigo、Coursera、Quizlet）。

請針對以下研究設定，產出一份具商業可行性與教育價值驗證的繁體中文策略研究報告：
- 切入垂直場景：${scenario}
- 首要目標利害關係人：${targetStakeholder}
- 核心解決痛點：${focusPainPoint}
- 對標競品參照：${competitorBenchmark}

請嚴格依循「先聚焦垂直場景、小規模驗證、逐步自動化並保留人工覆核」研究原則輸出結構化策略建議。`;

      const response = await generateWithResilience(ai, {
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              positioningTitle: {
                type: Type.STRING,
                description: '策略定位一句話標題',
              },
              competitiveGapOpportunity: {
                type: Type.STRING,
                description: '針對對標競品的差異化切入缺口說明（2-3句）',
              },
              mvpExecutionPlan: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '3 個具體可執行的短期垂直驗證步驟',
              },
              validationMetrics: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '3 項可量化的驗證指標（含使用者需求、學習成效、教師採用或付費意願）',
              },
              humanOversightDesign: {
                type: Type.STRING,
                description: '如何在該策略中保留教師人工覆核（Human-in-the-loop）與資料治理信任機制',
              },
            },
            required: [
              'positioningTitle',
              'competitiveGapOpportunity',
              'mvpExecutionPlan',
              'validationMetrics',
              'humanOversightDesign',
            ],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json(parsed);
    } catch (error: any) {
      return handleGeminiError(res, 'AI Strategy Error', error);
    }
  });

  // 4. AI Keyword Cloud Semantic & Trend Analyzer
  app.post('/api/ai-keyword-analysis', async (req, res) => {
    try {
      const { keyword, track, polarity, mentionsCount, growthRate, matchedExcerpts, forceRefresh } = req.body;
      const cacheKey = `kw:${keyword}:${track}:${(matchedExcerpts || []).length}`;
      if (!forceRefresh) {
        const cached = getCachedResponse(cacheKey);
        if (cached) return res.json(cached);
      }

      const ai = createGeminiClient();
      if (!ai) {
        return res.status(500).json({
          error: '尚未設定 GEMINI_API_KEY，請於 Settings > Secrets 確認金鑰設定。',
        });
      }

      const prompt = `你是教育新創產業輿情關鍵詞語意分析師。請針對目前關鍵詞雲圖中被點擊選取的關鍵詞進行深度解析：
- 關鍵詞：${keyword}
- 所屬主線：${track}
- 主導情緒極性：${polarity}
- 近 7 日聲量：${mentionsCount} 筆（成長率 +${growthRate}%）
- 相關社群輿情原文摘錄：
${(matchedExcerpts || []).map((e: string, i: number) => `${i + 1}. ${e}`).join('\n') || '（暫無額外原文，請依產業脈絡解析）'}

請以簡潔專業的繁體中文提供 3 點關鍵詞雲圖分析：
1. 關鍵詞背後反映的教育現場痛點或產品需求訊號
2. 正負情緒形成原因與利害關係人關注焦點
3. 對教育新創產品定位或風險控管的具體建議`;

      const response = await generateWithResilience(ai, { contents: prompt });
      const payload = { analysis: response.text || '' };
      setCachedResponse(cacheKey, payload);
      return res.json(payload);
    } catch (error: any) {
      return handleGeminiError(res, 'AI Keyword Analysis Error', error);
    }
  });

  // 5. AI Automatic 24-Hour Sentiment Summary Report
  app.post('/api/ai-24h-summary', async (req, res) => {
    try {
      const { recentMentions, stats24h, latestDayVolume, activeAlertsCount, forceRefresh } = req.body;
      const mentionIdsKey = Array.isArray(recentMentions)
        ? recentMentions.map((m: any) => m.id).join(',')
        : 'none';
      const cacheKey = `24h:${mentionIdsKey}:${stats24h?.total || 0}`;
      if (!forceRefresh) {
        const cached = getCachedResponse(cacheKey);
        if (cached) return res.json(cached);
      }

      const ai = createGeminiClient();
      if (!ai) {
        return res.status(500).json({
          error: '尚未設定 GEMINI_API_KEY，請於 Settings > Secrets 確認金鑰設定。',
        });
      }

      const prompt = `你是「EAAF 教育新創產業輿情分析平台」首席分析師。請根據最近 24 小時內的社群輿情動態，自動生成一份簡短精煉的市場趨勢洞察文字報告。

最近 24 小時統計摘要：
- 24 小時輿情樣本數：${stats24h?.total || 0} 筆（正面 ${stats24h?.pos || 0} / 中立 ${stats24h?.neu || 0} / 負面 ${stats24h?.neg || 0}）
- 當日跨平台聲量：正面 ${latestDayVolume?.正面 || 0}、中立 ${latestDayVolume?.中立 || 0}、負面 ${latestDayVolume?.負面 || 0}（總計 ${latestDayVolume?.總聲量 || 0}）
- 目前觸發警報數：${activeAlertsCount ?? 0} 項

最近 24 小時輿情動態明細：
${(recentMentions || [])
  .map(
    (m: any, i: number) =>
      `${i + 1}. [${m.timestamp}] ${m.platformName} (${m.stakeholder} / ${m.polarity} / ${m.topicTag})：${m.excerpt}`
  )
  .join('\n')}

請嚴格輸出結構化繁體中文 JSON 報告，文字精簡扼要、無多餘裝飾符號。`;

      const response = await generateWithResilience(ai, {
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              headline: {
                type: Type.STRING,
                description: '一句話市場趨勢核心結論（18字以內）',
              },
              reportText: {
                type: Type.STRING,
                description:
                  '最近 24 小時市場趨勢洞察文字報告（3 至 4 句流暢繁體中文段落，點出聲量動能、主流關注議題與台灣／國際平台訊號）',
              },
              trendBullets: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '3 條極精簡的 24 小時關鍵趨勢要點（每條 25 字以內）',
              },
              watchSignal: {
                type: Type.STRING,
                description: '一句話未來 24 小時需關注之負面風險或合規訊號',
              },
            },
            required: ['headline', 'reportText', 'trendBullets', 'watchSignal'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      setCachedResponse(cacheKey, parsed);
      return res.json(parsed);
    } catch (error: any) {
      return handleGeminiError(res, 'AI 24H Summary Error', error);
    }
  });

  // 6. AI Automatic Topic Clustering (5 Categories)
  app.post('/api/ai-topic-clustering', async (req, res) => {
    try {
      const { mentions, forceRefresh } = req.body;
      if (!Array.isArray(mentions) || mentions.length === 0) {
        return res.status(400).json({
          error: '請提供至少一筆輿情資料以進行自動議題聚類。',
        });
      }

      const mentionIdsKey = mentions.map((m: any) => m.id).join(',');
      const cacheKey = `cluster:${mentions.length}:${mentionIdsKey}`;
      if (!forceRefresh) {
        const cached = getCachedResponse(cacheKey);
        if (cached) return res.json(cached);
      }

      const ai = createGeminiClient();
      if (!ai) {
        return res.status(500).json({
          error: '尚未設定 GEMINI_API_KEY，請於 Settings > Secrets 確認金鑰設定。',
        });
      }

      const VALID_CATEGORIES = [
        '產品體驗',
        '行銷活動',
        '競爭策略',
        '人才招募',
        '政策環境',
      ] as const;

      const prompt = `你是「EAAF 教育新創產業輿情分析平台」後端語意聚類引擎。
請對以下收錄的每一筆教育科技輿情資料進行語意分析，並將每筆資料精準歸類至以下五大類之一（category 欄位必須嚴格為這五個詞之一）：
1. 產品體驗：產品介面、AI Tutor／口說語音功能使用感受、學習診斷精準度、教師減負工具體驗、AI 幻覺或錯題品質等。
2. 行銷活動：品牌宣傳、電競盃／挑戰賽、KOL 社群短影音推廣、優惠碼／限時免費試用、口碑轉介與招生活動。
3. 競爭策略：定價與商業模式（訂閱門檻／B2B 授權）、市場定位差異化、競品比較、跨界合作與通路擴張策略。
4. 人才招募：AI 工程師、教研師資、跨領域產品人才招募、組織擴編與人才培育議題。
5. 政策環境：教育部政策補助（如生生用平板、數位學習精進方案）、教育雲 SSO 規格、未成年個資保護與資安合規法規。

待聚類輿情清單：
${mentions
  .map(
    (m: any) =>
      `- ID: ${m.id} | 平台: ${m.platformName} | 管道: ${m.channel} | 角色: ${m.stakeholder} | 標籤: ${m.topicTag} | 情緒: ${m.polarity}\n  內容: ${m.excerpt}`
  )
  .join('\n')}

請針對清單中的每一筆 mentionId 回傳歸類結果、語意信心度（0-100 整數）、簡短歸類依據（15-30字繁體中文）及 2-3 個核心語意關鍵詞，並提供整體聚類趨勢總結。`;

      const response = await generateWithResilience(ai, {
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              assignments: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    mentionId: { type: Type.STRING },
                    category: {
                      type: Type.STRING,
                      description:
                        '必須嚴格為：產品體驗、行銷活動、競爭策略、人才招募 或 政策環境',
                    },
                    confidence: {
                      type: Type.INTEGER,
                      description: '語意歸類信心度（60 至 100 整數）',
                    },
                    rationale: {
                      type: Type.STRING,
                      description: '簡短繁體中文語意歸類依據（25字以內）',
                    },
                    keywords: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: '2 至 3 個核心語意詞彙',
                    },
                  },
                  required: [
                    'mentionId',
                    'category',
                    'confidence',
                    'rationale',
                    'keywords',
                  ],
                },
              },
              dominantCategory: {
                type: Type.STRING,
                description:
                  '聲量最高之主導類別（必須為：產品體驗、行銷活動、競爭策略、人才招募 或 政策環境）',
              },
              clusterSummary: {
                type: Type.STRING,
                description:
                  '2 至 3 句繁體中文總結本次五大議題聚類的分佈洞察與市場訊號',
              },
            },
            required: ['assignments', 'dominantCategory', 'clusterSummary'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      const normalizeCategory = (cat: string) =>
        (VALID_CATEGORIES as readonly string[]).includes(cat) ? cat : '產品體驗';

      const normalizedAssignments = Array.isArray(parsed.assignments)
        ? parsed.assignments.map((a: any) => ({
            mentionId: String(a.mentionId || ''),
            category: normalizeCategory(String(a.category || '')),
            confidence: Math.max(50, Math.min(100, Number(a.confidence) || 85)),
            rationale: String(a.rationale || ''),
            keywords: Array.isArray(a.keywords) ? a.keywords.slice(0, 3) : [],
          }))
        : [];

      const resultPayload = {
        assignments: normalizedAssignments,
        dominantCategory: normalizeCategory(String(parsed.dominantCategory || '')),
        clusterSummary: String(parsed.clusterSummary || ''),
      };
      setCachedResponse(cacheKey, resultPayload);
      return res.json(resultPayload);
    } catch (error: any) {
      return handleGeminiError(res, 'AI Topic Clustering Error', error);
    }
  });

  // 7. AI Daily In-Depth Sentiment Briefing (5 Topics Summary & Perspective)
  app.post('/api/ai-daily-briefing', async (req, res) => {
    try {
      const {
        dateLabel,
        mentions,
        sevenDayLatest,
        platformsSummary,
        activeAlertsCount,
        forceRefresh,
      } = req.body;

      const mentionIdsKey = Array.isArray(mentions)
        ? mentions.map((m: any) => m.id).join(',')
        : 'none';
      const cacheKey = `daily-briefing:${dateLabel || '2026-11-18'}:${mentionIdsKey}`;
      if (!forceRefresh) {
        const cached = getCachedResponse(cacheKey);
        if (cached) return res.json(cached);
      }

      const ai = createGeminiClient();
      if (!ai) {
        return res.status(500).json({
          error: '尚未設定 GEMINI_API_KEY，請於 Settings > Secrets 確認金鑰設定。',
        });
      }

      const CATEGORIES = [
        '產品體驗',
        '行銷活動',
        '競爭策略',
        '人才招募',
        '政策環境',
      ] as const;

      const prompt = `你是「EAAF 教育新創產業輿情分析平台」每日深度簡報主編與產業研究總監。
請針對簡報日期「${dateLabel || '2026-11-18'}」，綜合分析收錄的社群輿情語料、當日聲量結構與追蹤平台表現，自動撰寫一份涵蓋五大議題的「每日輿情深度簡報」。

必須完整涵蓋這五大議題（topicBriefings 陣列必須依序包含這 5 個 category，不可遺漏）：
1. 產品體驗
2. 行銷活動
3. 競爭策略
4. 人才招募
5. 政策環境

當日總體聲量指標：
- 最新單日跨平台聲量：正面 ${sevenDayLatest?.正面 || 0}、中立 ${sevenDayLatest?.中立 || 0}、負面 ${sevenDayLatest?.負面 || 0}（總聲量 ${sevenDayLatest?.總聲量 || 0}）
- 追蹤平台數量：${Array.isArray(platformsSummary) ? platformsSummary.length : 9} 家（目前觸發風險警報：${activeAlertsCount ?? 0} 項）

收錄輿情動態語料：
${(mentions || [])
  .map(
    (m: any, i: number) =>
      `${i + 1}. [${m.timestamp}] ${m.platformName} (${m.stakeholder} / ${m.polarity} / ${m.topicTag})：${m.excerpt}`
  )
  .join('\n')}

請以專業、具決策參考價值的繁體中文輸出結構化 JSON：
- executiveOverview：3 至 4 句總結當日全市場輿情主軸與正負動能消長。
- topicBriefings：針對五大議題逐一提供「dailySummary（每日關鍵摘要文字，2-3 句）」、「perspectiveAdvice（分析師觀點與具體應對建議，2 句）」、「sentimentTone（例如：正面主導、中性觀望、審慎偏負）」、「mentionCount（該議題關聯樣本估算筆數）」與「keySignals（2 個核心代表訊號短詞）」。
- crossTopicRecommendations：3 條跨議題整合行動建議。`;

      const response = await generateWithResilience(ai, {
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              briefingDate: { type: Type.STRING },
              title: {
                type: Type.STRING,
                description: '當日深度簡報主標題（24字以內）',
              },
              executiveOverview: {
                type: Type.STRING,
                description: '當日輿情全景導讀摘要（3 至 4 句繁體中文）',
              },
              topicBriefings: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    category: { type: Type.STRING },
                    sentimentTone: { type: Type.STRING },
                    mentionCount: { type: Type.INTEGER },
                    dailySummary: { type: Type.STRING },
                    perspectiveAdvice: { type: Type.STRING },
                    keySignals: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                  },
                  required: [
                    'category',
                    'sentimentTone',
                    'mentionCount',
                    'dailySummary',
                    'perspectiveAdvice',
                    'keySignals',
                  ],
                },
              },
              crossTopicRecommendations: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: [
              'briefingDate',
              'title',
              'executiveOverview',
              'topicBriefings',
              'crossTopicRecommendations',
            ],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      const rawItems = Array.isArray(parsed.topicBriefings) ? parsed.topicBriefings : [];

      const normalizedTopics = CATEGORIES.map((cat) => {
        const found = rawItems.find((item: any) => item?.category === cat);
        return {
          category: cat,
          sentimentTone: String(found?.sentimentTone || '中性關注'),
          mentionCount: Math.max(0, Number(found?.mentionCount) || 0),
          dailySummary: String(found?.dailySummary || '尚無額外補充摘要。'),
          perspectiveAdvice: String(found?.perspectiveAdvice || '持續追蹤該議題社群討論走向。'),
          keySignals: Array.isArray(found?.keySignals)
            ? found.keySignals.slice(0, 3).map((s: any) => String(s))
            : [],
        };
      });

      const payload = {
        briefingDate: String(parsed.briefingDate || dateLabel || '2026-11-18'),
        title: String(parsed.title || '每日五大議題輿情深度簡報'),
        executiveOverview: String(parsed.executiveOverview || ''),
        topicBriefings: normalizedTopics,
        crossTopicRecommendations: Array.isArray(parsed.crossTopicRecommendations)
          ? parsed.crossTopicRecommendations.slice(0, 4).map((r: any) => String(r))
          : [],
      };

      setCachedResponse(cacheKey, payload);
      return res.json(payload);
    } catch (error: any) {
      return handleGeminiError(res, 'AI Daily Briefing Error', error);
    }
  });

  // Vite middleware for development vs static serve for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
