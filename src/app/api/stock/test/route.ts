// src/app/api/stock/test/route.ts
import { NextResponse } from "next/server";
import { getDomesticStockPrice } from "@/services/kisService";
import { analyzeStock } from "@/services/aiService";

export async function GET(request: Request) {
  // 예시: /api/stock/test?symbol=005930&term=SHORT
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol") || "005930"; // 기본값: 삼성전자
  const term =
    (searchParams.get("term") as "SHORT" | "MID" | "LONG") || "SHORT";

  try {
    // 1. KIS API에서 주가 데이터 가져오기
    const priceData = await getDomesticStockPrice(symbol);

    // 임시 종목명 매핑 (실제로는 DB에서 symbol로 조회해와야 함)
    const stockName = symbol === "005930" ? "삼성전자" : symbol;

    // 2. Gemini AI에게 분석 요청하기
    const aiAnalysis = await analyzeStock(stockName, priceData, term);

    // 3. 최종 결과 반환
    return NextResponse.json({
      success: true,
      stockInfo: {
        symbol,
        name: stockName,
        currentPrice: priceData.output.stck_prpr,
        changeRate: priceData.output.prdy_ctrt,
      },
      analysis: aiAnalysis,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 },
    );
  }
}
