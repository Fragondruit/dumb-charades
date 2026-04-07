import { GoogleGenerativeAI } from "@google/generative-ai";

const MODEL = "gemini-2.5-flash";

export class GeminiClient {
  static async convertToHindi(apiKey: string, englishTitle: string): Promise<string> {
    return GeminiClient.generate(apiKey, englishTitle, "hindi");
  }

  static async convertToUrdu(apiKey: string, englishTitle: string): Promise<string> {
    return GeminiClient.generate(apiKey, englishTitle, "urdu");
  }

  private static async generate(
    apiKey: string,
    englishTitle: string,
    lang: "hindi" | "urdu",
  ): Promise<string> {
    if (!apiKey.trim() || !englishTitle.trim()) {
      return "";
    }

    const prompt = `Convert the sentence '${englishTitle}' verbatim into ${lang} script. Output no extraneous text please.`;

    try {
      const ai = new GoogleGenerativeAI(apiKey);
      const model = ai.getGenerativeModel({ model: MODEL });
      const result = await model.generateContent(prompt);
      return result.response.text().trim();
    } catch {
      return "";
    }
  }
}
