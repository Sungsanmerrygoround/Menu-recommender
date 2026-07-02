import { createClient } from "@supabase/supabase-js";

// 환경변수에 /rest/v1 경로나 뒤 슬래시가 붙어 있어도 동작하도록 베이스 URL로 정규화
const supabaseUrl = process.env
  .NEXT_PUBLIC_SUPABASE_URL!.trim()
  .replace(/\/rest\/v1\/?$/, "")
  .replace(/\/+$/, "");
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!.trim();

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // 로그인 기능이 없으므로 세션 저장/갱신을 모두 끈다
    persistSession: false,
    autoRefreshToken: false,
  },
});
