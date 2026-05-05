"use client";

import { Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import {
  TrendingUp,
  AlertTriangle,
  Zap,
  ArrowLeft,
  ShieldAlert,
} from "lucide-react";

interface AnalysisData {
  success: boolean;
  stockInfo: {
    symbol: string;
    name: string;
    currentPrice: string;
    changeRate: string;
  };
  analysis: {
    recommendation_score: number;
    risk_score: number;
    summary: string;
    analysis_report: string;
    risk_factors: string[];
    action: "STRONG_BUY" | "BUY" | "HOLD" | "SELL";
  };
}

function AnalysisContent() {
  const searchParams = useSearchParams();
  const symbol = searchParams.get("symbol") || "005930";
  const term = searchParams.get("term") || "SHORT";

  const { data, isLoading, error } = useQuery<AnalysisData>({
    queryKey: ["stockAnalysis", symbol, term],
    queryFn: async () => {
      const res = await fetch(`/api/stock/test?symbol=${symbol}&term=${term}`);
      if (!res.ok) throw new Error("데이터를 가져오지 못했습니다.");
      return res.json();
    },
  });

  if (isLoading)
    return (
      <div className="flex h-screen items-center justify-center text-emerald-500">
        분석 중...
      </div>
    );
  if (error || !data)
    return <div className="p-10 text-center">에러가 발생했습니다.</div>;

  const { stockInfo, analysis } = data;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 p-4 pb-20 md:p-8">
      {/* 상단 네비게이션 */}
      <header className="flex items-center gap-4 mb-8">
        <button className="p-2 hover:bg-slate-900 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-xl font-bold">{stockInfo.name}</h1>
          <p className="text-slate-400 text-sm">
            {stockInfo.symbol} · {term} 분석
          </p>
        </div>
      </header>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* 1. 가격 및 요약 카드 */}
        <section className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 backdrop-blur-sm">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-slate-400 text-xs mb-1">현재가</p>
              <h2 className="text-3xl font-bold tracking-tight">
                {Number(stockInfo.currentPrice).toLocaleString()}원
              </h2>
              <p
                className={`text-sm mt-1 font-medium ${Number(stockInfo.changeRate) > 0 ? "text-emerald-400" : "text-rose-400"}`}
              >
                {Number(stockInfo.changeRate) > 0 ? "+" : ""}
                {stockInfo.changeRate}%
              </p>
            </div>
            <div
              className={`px-4 py-2 rounded-2xl font-bold text-sm ${getActionStyle(analysis.action)}`}
            >
              {analysis.action}
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
            <Zap className="w-5 h-5 text-emerald-400 shrink-0" />
            <p className="text-sm font-medium text-emerald-50 leading-relaxed">
              {analysis.summary}
            </p>
          </div>
        </section>

        {/* 2. 스코어 섹션 (그리드) */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-5">
            <p className="text-slate-400 text-xs mb-3 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> 매수 추천도
            </p>
            <p className="text-2xl font-bold text-emerald-400">
              {analysis.recommendation_score}점
            </p>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3">
              <div
                className="bg-emerald-500 h-full rounded-full"
                style={{ width: `${analysis.recommendation_score}%` }}
              />
            </div>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-5">
            <p className="text-slate-400 text-xs mb-3 flex items-center gap-1">
              <ShieldAlert className="w-3 h-3" /> 진입 위험도
            </p>
            <p className="text-2xl font-bold text-amber-400">
              {analysis.risk_score}점
            </p>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3">
              <div
                className="bg-amber-500 h-full rounded-full"
                style={{ width: `${analysis.risk_score}%` }}
              />
            </div>
          </div>
        </div>

        {/* 3. 상세 분석 내용 */}
        <section className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">
            AI 전략 리포트
          </h3>
          <p className="text-slate-400 text-sm leading-relaxed whitespace-pre-wrap">
            {analysis.analysis_report}
          </p>
        </section>

        {/* 4. 리스크 요인 */}
        <section className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6">
          <h3 className="text-sm font-semibold text-rose-300 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> 주의해야 할 리스크
          </h3>
          <ul className="space-y-3">
            {analysis.risk_factors.map((factor, i) => (
              <li key={i} className="flex gap-3 text-sm text-slate-400">
                <span className="text-rose-500 text-xs mt-1">•</span>
                {factor}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}

export default function AnalysisPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center text-emerald-500">
          로딩 중...
        </div>
      }
    >
      <AnalysisContent />
    </Suspense>
  );
}

function getActionStyle(action: string) {
  switch (action) {
    case "STRONG_BUY":
      return "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20";
    case "BUY":
      return "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30";
    case "HOLD":
      return "bg-slate-800 text-slate-300";
    case "SELL":
      return "bg-rose-500/20 text-rose-400 border border-rose-500/30";
    default:
      return "bg-slate-800 text-slate-300";
  }
}
