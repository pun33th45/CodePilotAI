import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AnalysisResult, AppSettings } from "../types";

const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    score: {
      type: Type.INTEGER,
      description: "A quality score from 0 to 100.",
    },
    summary: {
      type: Type.STRING,
      description: "A summary of the code.",
    },
    issues: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of issues found.",
    },
    correctedCode: {
      type: Type.STRING,
      description: "Refactored code.",
    },
    language: {
      type: Type.STRING,
      description: "The detected programming language (e.g., 'TypeScript', 'Python').",
    },
    complexity: {
      type: Type.STRING,
      enum: ["Low", "Medium", "High"],
      description: "Cyclomatic complexity estimation.",
    }
  },
  required: ["score", "summary", "issues", "correctedCode", "language", "complexity"],
};

const getSystemInstruction = (settings: AppSettings) => {
  let persona = "You are CodePilot AI, an expert code reviewer.";
  
  switch(settings.persona) {
    case 'strict':
      persona += " Be extremely strict, focusing on performance optimization, security hardening, and perfect TypeScript typing. Do not tolerate sloppy code.";
      break;
    case 'teacher':
      persona += " Explain concepts gently. Focus on educational value and best practices for beginners. Use encouraging language.";
      break;
    case 'minimalist':
      persona += " Be extremely concise. Bullet points only. No fluff.";
      break;
    case 'friendly':
    default:
      persona += " Be helpful and constructive. Point out good practices as well as bad ones.";
  }

  if (settings.detailLevel === 'brief') {
    persona += " Keep the summary and issue descriptions short.";
  }

  return persona;
};

export const analyzeCode = async (code: string, settings: AppSettings): Promise<AnalysisResult> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Analyze the following code snippet. Return the response in JSON format.
      
      CODE TO ANALYZE:
      ${code}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        systemInstruction: getSystemInstruction(settings),
        temperature: 0.2,
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response from AI model.");
    }

    const result = JSON.parse(text) as AnalysisResult;
    return result;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};