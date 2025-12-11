
import { GoogleGenAI } from "@google/genai";
import { StockHolding } from "../types";

export const GeminiService = {
  updateStockPrices: async (holdings: StockHolding[]): Promise<StockHolding[]> => {
    // Guideline: Use process.env.API_KEY directly.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const symbols = holdings.map(h => h.symbol).join(', ');
    const prompt = `
      Find the real-time or latest closing price for these stock symbols: ${symbols}.
      If you cannot find the exact real-time price, use the latest available close price.
      Return the data strictly as a JSON object where keys are the symbols and values are the numeric prices.
      Example format:
      \`\`\`json
      {
        "2330.TW": 600.5,
        "AAPL": 150.25
      }
      \`\`\`
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }] // Use search to get real data
        }
      });

      const text = response.text || '';
      
      // Extract JSON from markdown block if present
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/```\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : text;
      
      let priceMap: Record<string, number> = {};
      try {
        priceMap = JSON.parse(jsonStr);
      } catch (e) {
        console.error("Failed to parse price JSON", e);
      }

      // Guideline: Must extract grounding chunks when using Google Search
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      
      // Explicitly type the filtered array to ensure it matches the StockHolding['sources'] type
      const validSources: { uri: string; title: string }[] = groundingChunks
        .map((chunk: any) => {
          if (chunk.web && chunk.web.uri && chunk.web.title) {
            return { uri: String(chunk.web.uri), title: String(chunk.web.title) };
          }
          return null;
        })
        .filter((s): s is { uri: string; title: string } => s !== null);

      return holdings.map(h => {
        // Prepare the new object with explicit typing for optional fields
        const updatedStock: StockHolding = {
          ...h,
          currentPrice: priceMap[h.symbol] !== undefined ? priceMap[h.symbol] : h.currentPrice,
          lastUpdated: new Date().toISOString(),
          sources: validSources.length > 0 ? validSources : h.sources
        };
        return updatedStock;
      });

    } catch (error) {
      console.error("Failed to update stock prices via Gemini:", error);
      return holdings; // Return original if fail
    }
  },

  analyzePortfolio: async (holdings: StockHolding[], totalAssets: number): Promise<string | null> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const portfolioSummary = holdings.map(h => 
      `${h.name} (${h.symbol}): 持有 ${h.shares} 股, 成本 ${h.averageCost}, 現價 ${h.currentPrice}`
    ).join('\n');

    const prompt = `
      你是專業的財務顧問。請根據以下投資組合提供簡短的分析建議 (繁體中文):
      
      總資產: ${totalAssets}
      持股:
      ${portfolioSummary}

      請分析風險分佈並給出建議，限制在 200 字以內。
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      return response.text ?? null;
    } catch (error) {
        console.error("Analysis failed:", error);
        return "暫時無法分析，請稍後再試。";
    }
  }
};
