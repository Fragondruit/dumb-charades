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
    target: "hindi" | "urdu",
  ): Promise<string> {
    if (!apiKey.trim() || !englishTitle.trim()) {
      return "";
    }

    const titleLiteral = JSON.stringify(englishTitle);
    const scriptDesc =
      target === "hindi"
        ? "Devanagari (Hindi script)"
        : "Urdu using Arabic script (standard Urdu romanization conventions for film titles)";

    const prompt = `The following value is an English movie title (JSON-encoded string). Transliterate it verbatim into ${scriptDesc}: same pronunciation as commonly used for Indian cinema, not a translation of meaning.

Output ONLY the transliterated title. No quotes, labels, newlines, or explanation.

Movie title: ${titleLiteral}`;

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
