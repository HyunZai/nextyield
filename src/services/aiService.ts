// src/services/aiService.ts
import { genAI } from "@/lib/gemini";
import { KisPriceResponse } from "./kisService";

export type TermType = "SHORT" | "MID" | "LONG";

// 프론트엔드에서 사용할 AI 분석 결과 타입 지정
export interface AiAnalysisResult {
  recommendation_score: number; // 0~100 (매수 추천도)
  risk_score: number; // 0~100 (진입 위험도)
  summary: string; // 한 줄 요약
  analysis_report: string; // 상세 분석 내용 (자연어)
  risk_factors: string[]; // 리스크 요인 (최소 2개)
  action: "STRONG_BUY" | "BUY" | "HOLD" | "SELL";
}

export async function analyzeStock(
  stockName: string,
  priceData: KisPriceResponse,
  term: TermType,
): Promise<AiAnalysisResult> {
  // 1. 모델 선택 (gemini-1.5-flash) 및 JSON 출력 강제 설정
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-lite",
    generationConfig: {
      responseMimeType: "application/json",
    },
  });

  // 2. 투자 기간별 초점 분기
  const termFocus = {
    SHORT: "3~7일 단기 스윙. 현재의 모멘텀, 거래 대금 변화, 단기 심리에 집중.",
    MID: "1개월 중기 투자. 수급 현황, 섹터 트렌드, 지지선/저항선 기반의 박스권 매매에 집중.",
    LONG: "1년 이상 장기 투자. 거시 경제 상황, 기업의 펀더멘털, 밸류에이션 저평가 여부에 집중.",
  };

  // 3. 프롬프트 구성 (System Instruction 역할 포함)
  const prompt = `
    당신은 'NextYield'의 수석 투자 전략가입니다. 뇌동매매를 방지하고 객관적인 지표를 기반으로 분석해야 합니다.
    아래 주어진 주식 데이터와 투자 기간을 바탕으로 현재 진입(매수)할 만한지 분석해 주세요.

    [투자 타겟 정보]
    - 종목명: ${stockName}
    - 투자 기간: ${term} (${termFocus[term]})
    - 현재가: ${priceData.output.stck_prpr}원
    - 전일 대비 등락률: ${priceData.output.prdy_ctrt}%
    - 누적 거래 대금: ${priceData.output.acml_tr_pbmn}

    [제약 조건]
    1. 무조건 오를 것이라는 확증 편향을 지양하세요.
    2. 리스크 요인(risk_factors)은 반드시 2개 이상 구체적으로 명시하세요.
    3. 반환값은 반드시 아래 JSON 스키마를 엄격하게 따르세요.

    {
      "recommendation_score": "매수 추천도 (0~100 숫자)",
      "risk_score": "현재 진입 위험도 (0~100 숫자. 높을수록 위험)",
      "summary": "분석에 대한 한 줄 요약",
      "analysis_report": "왜 이런 판단을 내렸는지에 대한 3~4문장의 논리적인 설명",
      "risk_factors": ["리스크 요인 1", "리스크 요인 2"],
      "action": "STRONG_BUY, BUY, HOLD, SELL 중 택 1"
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // JSON 파싱 후 반환
    const analysisData: AiAnalysisResult = JSON.parse(responseText);
    return analysisData;
  } catch (error) {
    console.error("AI 분석 중 오류 발생:", error);
    throw new Error("AI 분석을 완료하지 못했습니다.");
  }
}
