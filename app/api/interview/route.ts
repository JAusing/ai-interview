// 從共用的 lib/interview 匯入常數與型別
import {
  API_KEY_HEADER, // 前端用來傳遞 OpenAI API Key 的 header 名稱
  TOTAL_QUESTIONS, // 一場面試的總題數
  type ChatMessage, // 單則對話訊息的型別（面試官或候選人）
  type Evaluation, // 最終評分結果的型別
  type InterviewRequest, // 前端送來的請求內容型別
  type InterviewResponse, // 回傳給前端的回應型別
} from "@/lib/interview"; // 匯入來源檔案

// OpenAI Chat Completions API 的網址
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
// 使用的模型：優先讀環境變數 OPENAI_MODEL，沒設定就用 gpt-4o-mini
const MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

// 最終評分時要求 OpenAI 回傳的 JSON 結構（Structured Outputs）
const evaluationSchema = {
  name: "interview_evaluation", // 這個 schema 的名稱
  strict: true, // 嚴格模式：輸出必須完全符合 schema
  schema: { // 實際的 JSON Schema 定義
    type: "object", // 最外層是一個物件
    additionalProperties: false, // 不允許出現未定義的欄位
    required: ["overallScore", "summary", "questions", "strengths", "improvements"], // 必填欄位清單
    properties: { // 各欄位的定義
      overallScore: { type: "integer", description: "總分，0 到 100" }, // 總分（整數）
      summary: { type: "string", description: "整體表現總評" }, // 整體總評文字
      questions: { // 逐題評分
        type: "array", // 是一個陣列
        items: { // 陣列中每個元素的結構
          type: "object", // 每題是一個物件
          additionalProperties: false, // 不允許多餘欄位
          required: ["question", "score", "feedback"], // 每題的必填欄位
          properties: { // 每題的欄位定義
            question: { type: "string", description: "題目摘要" }, // 題目摘要
            score: { type: "integer", description: "此題分數，0 到 10" }, // 此題分數
            feedback: { type: "string", description: "對此題回答的具體評語" }, // 此題評語
          }, // 每題欄位定義結束
        }, // 陣列元素結構結束
      }, // questions 定義結束
      strengths: { type: "array", items: { type: "string" } }, // 優點：字串陣列
      improvements: { type: "array", items: { type: "string" } }, // 改進建議：字串陣列
    }, // properties 結束
  }, // schema 結束
}; // evaluationSchema 結束

// 依照目前進度（已回答幾題）產生給 OpenAI 的 system prompt
function systemPrompt(jobDescription: string, answered: number) {
  // 所有階段共用的基本設定：面試官角色、職缺描述、題數（以下模板字串內容會原樣送給模型，因此不在其中加註解）
  const base = `你是一位專業、友善但嚴謹的面試官，正在針對以下職缺進行面試。請全程使用繁體中文。

【職缺描述】
${jobDescription}

本場面試共 ${TOTAL_QUESTIONS} 題，題目需與職缺所需的技能、經驗與情境高度相關，難度適中。`;

  // 已回答完所有題目：進入評分階段
  if (answered >= TOTAL_QUESTIONS) {
    // 回傳要求模型評分的 prompt
    return `${base}

面試已結束。請根據候選人對 ${TOTAL_QUESTIONS} 題的回答給出評分與建議：逐題評分（0-10）並說明理由、整體總分（0-100）、優點，以及具體可行的改進建議。若回答空泛或離題，請如實反映在分數上。`;
  } // 評分階段判斷結束

  // 還沒回答任何題目：面試剛開始
  if (answered === 0) {
    // 回傳要求模型開場並出第 1 題的 prompt
    return `${base}

請先用一句話簡短開場，然後提出第 1 題。只輸出開場與題目，不要附上答案或提示。`;
  } // 開場階段判斷結束

  // 面試進行中：回應上一題並出下一題
  return `${base}

候選人剛回答完第 ${answered} 題。請先用一兩句話簡短回應他的回答（可以點出亮點或追問的方向，但不要給分數），接著提出第 ${answered + 1} 題。
第 ${answered + 1} 題可以是針對上一題回答的深入追問，也可以是新的題目，由你判斷哪個更能評估候選人。只輸出回應與題目。`;
} // systemPrompt 結束

// 把我們自己的訊息格式轉成 OpenAI 需要的格式
function toOpenAIMessages(messages: ChatMessage[]) {
  // 逐則訊息轉換
  return messages.map((m) => ({
    role: m.role === "interviewer" ? "assistant" : "user", // 面試官 → assistant，候選人 → user
    content: m.content, // 訊息內容原樣保留
  })); // map 結束
} // toOpenAIMessages 結束

// 檢查請求內容格式是否正確（型別守衛，通過後 TypeScript 會視為 InterviewRequest）
function isValidRequest(body: unknown): body is InterviewRequest {
  // body 必須是非 null 的物件
  if (typeof body !== "object" || body === null) return false;
  // 取出要檢查的兩個欄位
  const { jobDescription, messages } = body as Record<string, unknown>;
  // 所有條件都成立才算合法
  return (
    typeof jobDescription === "string" && // 職缺描述必須是字串
    jobDescription.trim().length > 0 && // 且不能是空白
    Array.isArray(messages) && // messages 必須是陣列
    messages.every( // 陣列中每一則訊息都要符合以下條件
      (m) => // m 代表其中一則訊息
        typeof m === "object" && // 必須是物件
        m !== null && // 且不是 null
        (m.role === "interviewer" || m.role === "candidate") && // role 只能是面試官或候選人
        typeof m.content === "string", // content 必須是字串
    ) // every 結束
  ); // return 結束
} // isValidRequest 結束

// 處理 POST /api/interview 請求
export async function POST(request: Request) {
  // 從請求 header 讀取使用者自己的 OpenAI API Key（BYOK），並去除前後空白
  const apiKey = request.headers.get(API_KEY_HEADER)?.trim();
  // 沒有帶金鑰
  if (!apiKey) {
    // 回傳 401，提示使用者先到設定輸入金鑰
    return Response.json({ error: "請先在設定中輸入你的 OpenAI API Key" }, { status: 401 });
  } // 金鑰檢查結束

  // 解析請求的 JSON 內容，解析失敗就當作 null
  const body: unknown = await request.json().catch(() => null);
  // 格式不正確
  if (!isValidRequest(body)) {
    // 回傳 400 錯誤
    return Response.json({ error: "請求格式錯誤，需要 jobDescription 與 messages" }, { status: 400 });
  } // 格式檢查結束

  // 取出職缺描述與對話紀錄
  const { jobDescription, messages } = body;
  // 計算候選人已經回答了幾題
  const answered = messages.filter((m) => m.role === "candidate").length;
  // 是否已答完所有題目、該進入評分
  const isFinal = answered >= TOTAL_QUESTIONS;

  // 呼叫 OpenAI API
  const res = await fetch(OPENAI_URL, {
    method: "POST", // 使用 POST 方法
    headers: { // 請求標頭
      "Content-Type": "application/json", // 內容為 JSON
      Authorization: `Bearer ${apiKey}`, // 使用使用者提供的金鑰做驗證
    }, // headers 結束
    body: JSON.stringify({ // 請求內容轉成 JSON 字串
      model: MODEL, // 指定模型
      messages: [ // 送給模型的訊息
        { role: "system", content: systemPrompt(jobDescription, answered) }, // 第一則是依進度產生的 system prompt
        ...toOpenAIMessages(messages), // 接著是轉換後的對話紀錄
      ], // messages 結束
      ...(isFinal && { // 只有在評分階段才加入以下設定
        response_format: { type: "json_schema", json_schema: evaluationSchema }, // 要求依 evaluationSchema 回傳 JSON
      }), // 條件設定結束
    }), // body 結束
  }); // fetch 結束

  // OpenAI 回傳 401：金鑰無效
  if (res.status === 401) {
    // 回傳 401，提示使用者檢查金鑰
    return Response.json({ error: "OpenAI API Key 無效，請到設定中確認" }, { status: 401 });
  } // 401 處理結束
  // 其他非成功的狀態碼
  if (!res.ok) {
    // 在伺服器端記錄錯誤細節，方便除錯
    console.error("OpenAI API error", res.status, await res.text());
    // 回傳 502（上游服務錯誤）給前端
    return Response.json({ error: "呼叫 OpenAI 失敗，請稍後再試" }, { status: 502 });
  } // 錯誤處理結束

  // 解析 OpenAI 回傳的 JSON
  const data = await res.json();
  // 取出模型回覆的文字內容，取不到就用空字串
  const content: string = data.choices?.[0]?.message?.content ?? "";

  // 準備回傳給前端的結果
  let result: InterviewResponse;
  // 評分階段
  if (isFinal) {
    // 嘗試解析模型回傳的 JSON
    try {
      // 解析成功：包成評分結果
      result = { type: "evaluation", evaluation: JSON.parse(content) as Evaluation };
    } catch { // 解析失敗
      // 回傳 502，請使用者重試
      return Response.json({ error: "評分結果解析失敗，請重試" }, { status: 502 });
    } // try/catch 結束
  } else { // 一般出題階段
    // 包成下一題的結果，並附上題號
    result = { type: "question", questionNumber: answered + 1, content };
  } // 階段判斷結束

  // 回傳結果給前端
  return Response.json(result);
} // POST 結束
