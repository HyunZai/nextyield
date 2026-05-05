// src/lib/supabaseAdmin.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// 서버 전용: RLS 무시하고 DB 조작 가능. 클라이언트에 절대 노출 금지
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
