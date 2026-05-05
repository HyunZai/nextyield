// src/services/kisService.ts
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const KIS_BASE_URL = "https://openapi.koreainvestment.com:9443"; // 실전투자용

export interface KisPriceResponse {
  output: {
    stck_prpr: string;
    prdy_vrss: string;
    prdy_ctrt: string;
    acml_tr_pbmn: string;
  };
  rt_cd: string;
  msg_cd: string;
  msg1: string;
}

/**
 * 1. 스마트 캐싱이 적용된 토큰 발급 함수
 */
export async function getValidKisToken(): Promise<string> {
  // A. DB에서 기존 KIS 토큰 조회
  const { data: tokenData, error } = await supabaseAdmin
    .from("api_tokens")
    .select("*")
    .eq("provider", "KIS")
    .single();

  const now = new Date();

  // B. 토큰이 존재하고, 만료 시간이 현재보다 미래라면(안전빵으로 10분 여유) 기존 토큰 반환
  if (
    tokenData &&
    new Date(tokenData.expires_at).getTime() > now.getTime() + 10 * 60 * 1000
  ) {
    console.log("✅ DB에 캐싱된 KIS 토큰을 재사용합니다.");
    return tokenData.access_token;
  }

  console.log("🔄 KIS 토큰이 없거나 만료되었습니다. 새로 발급받습니다...");

  // C. 토큰 신규 발급 요청
  const url = `${KIS_BASE_URL}/oauth2/tokenP`;
  const body = {
    grant_type: "client_credentials",
    appkey: process.env.KIS_APP_KEY,
    appsecret: process.env.KIS_APP_SECRET,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error("KIS 토큰 발급에 실패했습니다.");

  const data = await res.json();
  const newToken = data.access_token;
  const expiresIn = data.expires_in; // KIS는 보통 86400 (24시간) 반환

  // 만료 시간 계산 (현재 시간 + 유효 초)
  const expiresAt = new Date(now.getTime() + expiresIn * 1000).toISOString();

  // D. DB에 새 토큰 저장 (Upsert)
  await supabaseAdmin.from("api_tokens").upsert({
    provider: "KIS",
    access_token: newToken,
    expires_at: expiresAt,
    updated_at: new Date().toISOString(),
  });

  return newToken;
}

/**
 * 2. 국내 주식 현재가 조회 함수 (업데이트됨)
 */
export async function getDomesticStockPrice(
  symbol: string,
): Promise<KisPriceResponse> {
  // 항상 스마트 캐싱 함수를 통해 토큰을 가져옵니다.
  const token = await getValidKisToken();

  const url = `${KIS_BASE_URL}/uapi/domestic-stock/v1/quotations/inquire-price?fid_cond_mrkt_div_code=J&fid_input_iscd=${symbol}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      appkey: process.env.KIS_APP_KEY!,
      appsecret: process.env.KIS_APP_SECRET!,
      tr_id: "FHKST01010100",
    },
  });

  if (!res.ok) {
    throw new Error(`KIS 주가 조회 실패: ${res.status}`);
  }

  return res.json();
}
