import {
  TOTAL_QUESTIONS,
  type ChatMessage,
  type Evaluation,
  type InterviewRequest,
  type InterviewResponse,
} from "@/lib/interview";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

const evaluationSchema = {
  name: "interview_evaluation",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["overallScore", "summary", "questions", "strengths", "improvements"],
    properties: {
      overallScore: { type: "integer", description: "總分，0 到 100" },
      summary: { type: "string", description: "整體表現總評" },
      questions: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["question", "score", "feedback"],
          properties: {
            question: { type: "string", description: "題目摘要" },
            score: { type: "integer", description: "此題分數，0 到 10" },
            feedback: { type: "string", description: "對此題回答的具體評語" },
          },
        },
      },
      strengths: { type: "array", items: { type: "string" } },
      improvements: { type: "array", items: { type: "string" } },
    },
  },
};

function systemPrompt(jobDescription: string, answered: number) {
  const base = `你是一位專業、友善但嚴謹的面試官，正在針對以下職缺進行面試。請全程使用繁體中文。

【職缺描述】
${jobDescription}

本場面試共 ${TOTAL_QUESTIONS} 題，題目需與職缺所需的技能、經驗與情境高度相關，難度適中。`;

  if (answered >= TOTAL_QUESTIONS) {
    return `${base}

面試已結束。請根據候選人對 ${TOTAL_QUESTIONS} 題的回答給出評分與建議：逐題評分（0-10）並說明理由、整體總分（0-100）、優點，以及具體可行的改進建議。若回答空泛或離題，請如實反映在分數上。`;
  }

  if (answered === 0) {
    return `${base}

請先用一句話簡短開場，然後提出第 1 題。只輸出開場與題目，不要附上答案或提示。`;
  }

  return `${base}

候選人剛回答完第 ${answered} 題。請先用一兩句話簡短回應他的回答（可以點出亮點或追問的方向，但不要給分數），接著提出第 ${answered + 1} 題。
第 ${answered + 1} 題可以是針對上一題回答的深入追問，也可以是新的題目，由你判斷哪個更能評估候選人。只輸出回應與題目。`;
}

function toOpenAIMessages(messages: ChatMessage[]) {
  return messages.map((m) => ({
    role: m.role === "interviewer" ? "assistant" : "user",
    content: m.content,
  }));
}

function isValidRequest(body: unknown): body is InterviewRequest {
  if (typeof body !== "object" || body === null) return false;
  const { jobDescription, messages } = body as Record<string, unknown>;
  return (
    typeof jobDescription === "string" &&
    jobDescription.trim().length > 0 &&
    Array.isArray(messages) &&
    messages.every(
      (m) =>
        typeof m === "object" &&
        m !== null &&
        (m.role === "interviewer" || m.role === "candidate") &&
        typeof m.content === "string",
    )
  );
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "伺服器未設定 OPENAI_API_KEY" }, { status: 500 });
  }

  const body: unknown = await request.json().catch(() => null);
  if (!isValidRequest(body)) {
    return Response.json({ error: "請求格式錯誤，需要 jobDescription 與 messages" }, { status: 400 });
  }

  const { jobDescription, messages } = body;
  const answered = messages.filter((m) => m.role === "candidate").length;
  const isFinal = answered >= TOTAL_QUESTIONS;

  const res = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt(jobDescription, answered) },
        ...toOpenAIMessages(messages),
      ],
      ...(isFinal && {
        response_format: { type: "json_schema", json_schema: evaluationSchema },
      }),
    }),
  });

  if (!res.ok) {
    console.error("OpenAI API error", res.status, await res.text());
    return Response.json({ error: "呼叫 OpenAI 失敗，請稍後再試" }, { status: 502 });
  }

  const data = await res.json();
  const content: string = data.choices?.[0]?.message?.content ?? "";

  let result: InterviewResponse;
  if (isFinal) {
    try {
      result = { type: "evaluation", evaluation: JSON.parse(content) as Evaluation };
    } catch {
      return Response.json({ error: "評分結果解析失敗，請重試" }, { status: 502 });
    }
  } else {
    result = { type: "question", questionNumber: answered + 1, content };
  }

  return Response.json(result);
}
