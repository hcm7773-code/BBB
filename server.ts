import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API endpoint for AI food recommendation
  app.post('/api/ai-recommend', async (req, res) => {
    try {
      const { userPreference, orderType, menuItems } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return res.status(500).json({ error: 'GEMINI_API_KEY is not configured.' });
      }

      const ai = new GoogleGenAI({ apiKey });

      const prompt = `你是一位親切熱情的餐廳美食點餐顧問。
請根據顧客的情緒/偏好或用餐情境：「${userPreference || '推薦熱銷美味組'}」，以及用餐方式：「${orderType === 'dine-in' ? '內用' : orderType === 'takeout' ? '外帶' : '外送'}」，從我們的菜單中推薦 2~3 道最適合的菜單組合。

這是我們的菜單列表：
${JSON.stringify(menuItems.map((m: any) => ({ name: m.name, category: m.category, price: m.price, description: m.description, tags: m.tags })), null, 2)}

請回傳繁體中文，格式需簡明熱情、包含：
1. 【推薦組合名稱】 (例如：開胃療癒雙饗餐)
2. 【建議餐點】 (列出菜單中對應的精確餐點名稱與金額)
3. 【推薦理由】 (簡短說明為什麼這個組合非常適合顧客)
4. 【溫馨小貼士】 (例如：甜度冰塊建議、辣度搭配建議)`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
      });

      const recommendationText = response.text;
      return res.json({ recommendation: recommendationText });
    } catch (error: any) {
      console.error('Gemini API Error:', error);
      return res.status(500).json({ error: error.message || 'AI 推薦服務暫時無法使用' });
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
