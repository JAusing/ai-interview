// 匯入傳遞 API Key 用的 header 名稱
import { API_KEY_HEADER } from "@/lib/interview";

// OpenAI 列出模型的 API：不花費 token，適合用來驗證金鑰
const OPENAI_MODELS_URL = "https://api.openai.com/v1/models";

// 處理 POST /api/validate-key：檢查使用者輸入的 OpenAI API Key 是否有效
export async function POST(request: Request) {
  // 從請求 header 讀取要驗證的金鑰，並去除前後空白
  const apiKey = request.headers.get(API_KEY_HEADER)?.trim();
  // 沒有帶金鑰
  if (!apiKey) {
    // 回傳 400，提示使用者輸入金鑰
    return Response.json({ error: "請輸入 OpenAI API Key" }, { status: 400 });
  } // 金鑰檢查結束

  // 用這把金鑰呼叫 OpenAI，網路失敗時當作 null
  const res = await fetch(OPENAI_MODELS_URL, {
    headers: { Authorization: `Bearer ${apiKey}` }, // 使用要驗證的金鑰做驗證
  }).catch(() => null); // 連線失敗不丟錯，交給下面處理

  // 連不上 OpenAI
  if (!res) {
    // 回傳 502（上游服務錯誤）
    return Response.json({ error: "無法連線到 OpenAI，請稍後再試" }, { status: 502 });
  } // 連線檢查結束
  // OpenAI 回傳 401：金鑰無效
  if (res.status === 401) {
    // 回傳 401，告訴使用者金鑰不正確
    return Response.json({ error: "API Key 無效，請確認後再試" }, { status: 401 });
  } // 401 處理結束
  // 其他非成功的狀態碼
  if (!res.ok) {
    // 在伺服器端記錄錯誤細節，方便除錯
    console.error("OpenAI key validation error", res.status, await res.text());
    // 回傳 502 給前端
    return Response.json({ error: "驗證失敗，請稍後再試" }, { status: 502 });
  } // 錯誤處理結束

  // 金鑰有效
  return Response.json({ ok: true });
} // POST 結束
