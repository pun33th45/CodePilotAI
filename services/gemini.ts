
import { GoogleGenAI, Schema, Type } from "@google/genai";
import { AIAnalysisResponse, UserPreferences } from "../types";

const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING, description: "Executive summary of the code quality." },
    score: { type: Type.INTEGER, description: "0-100 quality score. Give 100 if code is perfect." },
    language: { type: Type.STRING, description: "Detected language." },
    refactoredCode: { type: Type.STRING, description: "The COMPLETE fixed source code file. DO NOT WRAP IN MARKDOWN. DO NOT RETURN PARTIAL SNIPPETS. Must be ready to compile/run." },
    comments: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          lineNumber: { type: Type.INTEGER, description: "The line number this issue refers to (1-based). If unknown, use 1." },
          severity: { type: Type.STRING, enum: ["critical", "major", "minor", "info"] },
          category: { type: Type.STRING, enum: ["security", "performance", "style", "bug", "refactor"] },
          content: { type: Type.STRING, description: "The explanation of the issue." },
          suggestion: { type: Type.STRING, description: "The code snippet to replace the issue with, if applicable." }
        },
        required: ["lineNumber", "severity", "category", "content"]
      }
    }
  },
  required: ["summary", "score", "language", "comments"]
};

// Helper to strip markdown code fences if the model hallucinates them
const cleanCode = (code: string | undefined): string => {
  if (!code) return '';
  return code
    .replace(/^```[a-z]*\n/i, '') // Remove start fence
    .replace(/\n```$/, '')         // Remove end fence
    .trim();
};

export const gemini = {
  analyze: async (code: string, preferences: UserPreferences, styleGuide?: string): Promise<AIAnalysisResponse> => {
    // 1. Strict API Key Validation
    // Use the Vite way to get the key locally
const apiKey = import.meta.env.VITE_API_KEY; 

if (!apiKey) {
  throw new Error("API Key is missing. Check your .env file.");
}

const ai = new GoogleGenAI({ apiKey: apiKey });
    // 2. Construct System Prompt based on User Persona
    const systemPrompt = `
      You are a Principal Software Engineer at a FAANG company. 
      Review the code provided. 
      Style Preference: ${preferences.preferredStyle}.
      User Primary Languages: ${preferences.primaryLanguages.join(', ')}.
      ${styleGuide ? `Adhere to this Style Guide: ${styleGuide}` : ''}
      
      Focus on:
      1. Security Vulnerabilities (Injection, XSS, Auth)
      2. Performance Bottlenecks (O(n^2), memory leaks)
      3. Clean Code & Maintainability (SOLID principles)
      
      CRITICAL INSTRUCTION:
      1. If issues are found, provide a "refactoredCode" field containing the **ENTIRE FILE** with all fixes applied.
      2. The "refactoredCode" must be PURE CODE. Do NOT wrap it in markdown backticks (e.g. \`\`\`js).
      3. If the code provided is already clean, secure, optimized, and follows best practices, DO NOT invent issues. Return an empty 'comments' array and a 'score' of 100.
      4. Ensure the refactored code fixes ALL detected issues so that a subsequent analysis of the refactored code would yield a score of 100.
      
      Provide specific, line-based comments ONLY if actual issues exist.
    `;

    const lines = code.split('\n');
    const numberedCode = lines.map((l, i) => `${i + 1}: ${l}`).join('\n');

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Review this code:\n\n${numberedCode}`,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: analysisSchema,
          temperature: 0.1, // Lower temperature for more deterministic/strict output
        }
      });

      if (!response.text) {
        throw new Error("AI returned empty response.");
      }

      // 3. Robust Parsing
      let parsed: AIAnalysisResponse;
      try {
        parsed = JSON.parse(response.text);
        
        // Sanitize the output code
        if (parsed.refactoredCode) {
          parsed.refactoredCode = cleanCode(parsed.refactoredCode);
        }
        
        // Safety check: if score is high but comments exist, ensure consistency
        if (parsed.score === 100 && parsed.comments.length > 0) {
          parsed.score = 95;
        }
        
        // If low score but no refactored code, fallback (unlikely with strict schema but good for safety)
        if (parsed.score < 100 && !parsed.refactoredCode) {
           parsed.refactoredCode = code; // Fallback to original
        }

      } catch (e) {
        console.error("JSON Parse Error", response.text);
        throw new Error("Failed to parse AI response.");
      }
      
      return parsed;

    } catch (e: any) {
      console.error("Gemini Analysis Failed:", e);
      throw new Error(e.message || "Code analysis failed due to an API error.");
    }
  }
};
