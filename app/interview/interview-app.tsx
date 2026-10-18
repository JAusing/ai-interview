"use client";

import { useEffect, useRef, useState } from "react";
import { ScoreRing } from "@/components/score-ring";
import {
  TOTAL_QUESTIONS,
  type ChatMessage,
  type Evaluation,
  type InterviewResponse,
} from "@/lib/interview";

type Stage = "setup" | "interview" | "result";

const samples = [
  {
    label: "前端工程師",
    jd: "前端工程師\n- 熟悉 React、TypeScript，有 3 年以上開發經驗\n- 了解前端效能優化與瀏覽器渲染原理\n- 能與設計師、後端工程師緊密協作\n- 加分：Next.js、測試自動化經驗",
  },
  {
    label: "產品經理",
    jd: "產品經理\n- 2 年以上 B2C 產品經驗\n- 能以數據驅動產品決策，熟悉 A/B 測試\n- 擅長撰寫 PRD 並與工程、設計團隊協作\n- 具備良好的優先順序判斷與跨部門溝通能力",
  },
  {
    label: "行銷企劃",
    jd: "行銷企劃\n- 負責品牌社群經營與數位廣告投放\n- 熟悉 Meta、Google Ads 後台與成效分析\n- 能獨立規劃整合行銷活動並追蹤 KPI\n- 具備文案撰寫能力",
  },
];

const stageLabels: Record<Stage, string> = {
  setup: "職缺設定",
  interview: "面試中",
  result: "評分報告",
};

export function InterviewApp() {
  const [stage, setStage] = useState<Stage>("setup");
  const [jobDescription, setJobDescription] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [answer, setAnswer] = useState("");
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, loading]);

  async function requestNext(history: ChatMessage[]) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription, messages: history }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "發生未知錯誤");

      const result = data as InterviewResponse;
      if (result.type === "question") {
        setMessages([...history, { role: "interviewer", content: result.content }]);
        setQuestionNumber(result.questionNumber);
        setStage("interview");
      } else {
        setEvaluation(result.evaluation);
        setStage("result");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "發生未知錯誤");
    } finally {
      setLoading(false);
    }
  }

  function startInterview() {
    if (!jobDescription.trim()) return;
    setMessages([]);
    requestNext([]);
  }

  function submitAnswer() {
    if (!answer.trim() || loading) return;
    const history: ChatMessage[] = [...messages, { role: "candidate", content: answer.trim() }];
    setMessages(history);
    setAnswer("");
    requestNext(history);
  }

  function retry() {
    requestNext(messages);
  }

  function reset() {
    setStage("setup");
    setMessages([]);
    setQuestionNumber(0);
    setAnswer("");
    setEvaluation(null);
    setError(null);
  }

  const answered = messages.filter((m) => m.role === "candidate").length;
  const waitingForInterviewer = messages.at(-1)?.role === "candidate";

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-5 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <ol className="flex items-center gap-2 font-mono text-[11px] tracking-widest text-muted uppercase">
            {(Object.keys(stageLabels) as Stage[]).map((s, i) => (
              <li key={s} className="flex items-center gap-2">
                {i > 0 && <span className="h-px w-5 bg-line" />}
                <span className={s === stage ? "text-accent" : ""}>{stageLabels[s]}</span>
              </li>
            ))}
          </ol>
          <h1 className="text-3xl font-semibold tracking-tight">
            {stage === "setup" && (
              <>
                今天要<span className="font-serif font-normal italic">排練</span>哪個職缺？
              </>
            )}
            {stage === "interview" && (
              <>
                第 <span className="font-serif font-normal text-accent">{questionNumber}</span> / {TOTAL_QUESTIONS} 題
              </>
            )}
            {stage === "result" && (
              <>
                你的<span className="font-serif font-normal italic">面試</span>報告
              </>
            )}
          </h1>
        </div>
        {stage !== "setup" && (
          <button
            onClick={reset}
            className="rounded-full border border-line bg-card px-4 py-2 text-sm transition-colors hover:border-ink"
          >
            ↺ 重新開始
          </button>
        )}
      </div>

      {stage === "setup" && (
        <section className="rise flex flex-col gap-5 rounded-3xl border border-line bg-card p-6 sm:p-8">
          <div className="flex flex-col gap-1">
            <label htmlFor="jd" className="font-medium">
              職缺描述
            </label>
            <p className="text-sm text-muted">
              貼上完整的 JD，面試官會依此出 {TOTAL_QUESTIONS} 題，並在最後給你評分與建議。
            </p>
          </div>
          <textarea
            id="jd"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            rows={10}
            placeholder="例如：前端工程師，需熟悉 React、TypeScript，有 3 年以上開發經驗……"
            className="w-full resize-y rounded-2xl border border-line bg-paper p-4 leading-relaxed outline-none transition-colors placeholder:text-muted/70 focus:border-accent"
          />
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-muted">試試範例：</span>
              {samples.map((s) => (
                <button
                  key={s.label}
                  onClick={() => setJobDescription(s.jd)}
                  className="rounded-full border border-line px-3 py-1 transition-colors hover:border-accent hover:text-accent"
                >
                  {s.label}
                </button>
              ))}
            </div>
            <PrimaryButton onClick={startInterview} disabled={!jobDescription.trim() || loading}>
              {loading ? "面試官準備中…" : "開始面試 →"}
            </PrimaryButton>
          </div>
        </section>
      )}

      {stage === "interview" && (
        <section className="rise flex flex-col overflow-hidden rounded-3xl border border-line bg-card">
          <div className="flex gap-1.5 border-b border-line px-6 py-4">
            {Array.from({ length: TOTAL_QUESTIONS }, (_, i) => (
              <span
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-colors ${i < answered ? "bg-accent" : "bg-soft"}`}
              />
            ))}
          </div>

          <div className="flex flex-col gap-4 p-6 leading-relaxed">
            {messages.map((m, i) =>
              m.role === "interviewer" ? (
                <div key={i} className="flex max-w-[90%] gap-3 self-start">
                  <Avatar />
                  <div className="rounded-2xl rounded-tl-sm bg-soft px-4 py-3 whitespace-pre-wrap">{m.content}</div>
                </div>
              ) : (
                <div
                  key={i}
                  className="max-w-[85%] self-end rounded-2xl rounded-tr-sm bg-ink px-4 py-3 whitespace-pre-wrap text-paper"
                >
                  {m.content}
                </div>
              ),
            )}
            {loading && (
              <div className="flex gap-3 self-start">
                <Avatar />
                <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm bg-soft px-4 py-3 text-sm text-muted">
                  <span className="typing inline-flex gap-1">
                    <span>●</span>
                    <span>●</span>
                    <span>●</span>
                  </span>
                  {answered >= TOTAL_QUESTIONS ? "面試官評分中" : "面試官思考中"}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {!waitingForInterviewer && (
            <div className="flex flex-col gap-3 border-t border-line bg-paper/50 p-5">
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) submitAnswer();
                }}
                rows={5}
                disabled={loading}
                placeholder="輸入你的回答……"
                className="w-full resize-y rounded-2xl border border-line bg-card p-4 leading-relaxed outline-none transition-colors placeholder:text-muted/70 focus:border-accent"
              />
              <div className="flex items-center justify-between gap-4">
                <span className="font-mono text-xs text-muted">Ctrl + Enter 送出</span>
                <PrimaryButton onClick={submitAnswer} disabled={!answer.trim() || loading}>
                  送出回答
                </PrimaryButton>
              </div>
            </div>
          )}
        </section>
      )}

      {stage === "result" && evaluation && <EvaluationView evaluation={evaluation} onRestart={reset} />}

      {error && (
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-accent/40 bg-accent/10 px-5 py-4 text-sm">
          <span>{error}</span>
          {stage === "interview" && waitingForInterviewer && (
            <button onClick={retry} className="font-medium text-accent underline underline-offset-4">
              重試
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function Avatar() {
  return (
    <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink font-serif text-base text-paper italic">
      R
    </span>
  );
}

function PrimaryButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }) {
  return (
    <button
      {...props}
      className="rounded-full bg-accent px-6 py-2.5 font-medium text-accent-ink transition-transform hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function EvaluationView({ evaluation, onRestart }: { evaluation: Evaluation; onRestart: () => void }) {
  return (
    <section className="rise flex flex-col gap-6">
      <div className="flex flex-col items-center gap-6 rounded-3xl border border-line bg-card p-8 sm:flex-row">
        <ScoreRing score={evaluation.overallScore} size={120} />
        <div className="flex flex-col gap-2">
          <span className="font-mono text-xs tracking-widest text-accent uppercase">總評</span>
          <p className="leading-relaxed">{evaluation.summary}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-line bg-card">
        <h2 className="border-b border-line px-6 py-4 font-semibold">逐題評分</h2>
        <ul className="divide-y divide-line">
          {evaluation.questions.map((q, i) => (
            <li key={i} className="flex flex-col gap-3 p-6">
              <div className="flex items-start gap-4">
                <span className="font-mono text-xs text-muted">0{i + 1}</span>
                <span className="flex-1 font-medium">{q.question}</span>
                <span className="shrink-0 font-serif text-2xl leading-none text-accent">
                  {q.score}
                  <span className="font-sans text-xs text-muted"> /10</span>
                </span>
              </div>
              <div className="ml-8 h-1.5 overflow-hidden rounded-full bg-soft">
                <div className="h-full rounded-full bg-accent" style={{ width: `${q.score * 10}%` }} />
              </div>
              <p className="ml-8 text-sm leading-relaxed text-muted">{q.feedback}</p>
            </li>
          ))}
        </ul>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <List title="優點" mark="+" items={evaluation.strengths} />
        <List title="改進建議" mark="→" items={evaluation.improvements} accent />
      </div>

      <div className="flex justify-center pt-2">
        <PrimaryButton onClick={onRestart}>再練一場 ↺</PrimaryButton>
      </div>
    </section>
  );
}

function List({ title, mark, items, accent }: { title: string; mark: string; items: string[]; accent?: boolean }) {
  return (
    <div className={`rounded-3xl border p-6 ${accent ? "border-accent/30 bg-accent/5" : "border-line bg-card"}`}>
      <h2 className="mb-4 font-semibold">{title}</h2>
      <ul className="flex flex-col gap-3 text-sm leading-relaxed">
        {items.map((item, i) => (
          <li key={i} className="flex gap-3">
            <span className={`shrink-0 font-mono ${accent ? "text-accent" : "text-muted"}`}>{mark}</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
