// src/lib/gemini.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY 환경 변수가 누락되었습니다.");
}

export const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
