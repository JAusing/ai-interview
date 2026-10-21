// 標記為 Client Component：這個元件會在瀏覽器執行（需要 state、事件、localStorage）
"use client";

// 匯入 React 的 hooks：副作用、DOM 參照、狀態
import { useEffect, useRef, useState } from "react";
// 匯入分數圓環元件，用於評分報告
import { ScoreRing } from "@/components/score-ring";
// 匯入 API Key 的儲存函式與讀取 hook（存在 localStorage）
import { saveApiKey, useApiKey } from "@/lib/api-key";
// 從共用的 lib/interview 匯入常數與型別
import {
  API_KEY_HEADER, // 傳遞 API Key 用的 header 名稱
  TOTAL_QUESTIONS, // 一場面試的總題數
  type ChatMessage, // 單則對話訊息的型別
  type Evaluation, // 評分結果的型別
  type InterviewResponse, // API 回應的型別
} from "@/lib/interview"; // 匯入來源檔案

// 面試流程的三個階段：設定職缺、面試中、評分報告
type Stage = "setup" | "interview" | "result";

// 範例職缺清單，讓使用者一鍵帶入 JD
const samples = [
  { // 範例一
    label: "前端工程師", // 按鈕上顯示的名稱
    jd: "前端工程師\n- 熟悉 React、TypeScript，有 3 年以上開發經驗\n- 了解前端效能優化與瀏覽器渲染原理\n- 能與設計師、後端工程師緊密協作\n- 加分：Next.js、測試自動化經驗", // 範例 JD 內容
  }, // 範例一結束
  { // 範例二
    label: "產品經理", // 按鈕上顯示的名稱
    jd: "產品經理\n- 2 年以上 B2C 產品經驗\n- 能以數據驅動產品決策，熟悉 A/B 測試\n- 擅長撰寫 PRD 並與工程、設計團隊協作\n- 具備良好的優先順序判斷與跨部門溝通能力", // 範例 JD 內容
  }, // 範例二結束
  { // 範例三
    label: "行銷企劃", // 按鈕上顯示的名稱
    jd: "行銷企劃\n- 負責品牌社群經營與數位廣告投放\n- 熟悉 Meta、Google Ads 後台與成效分析\n- 能獨立規劃整合行銷活動並追蹤 KPI\n- 具備文案撰寫能力", // 範例 JD 內容
  }, // 範例三結束
]; // samples 結束

// 每個階段在進度列上顯示的文字
const stageLabels: Record<Stage, string> = {
  setup: "職缺設定", // 設定階段
  interview: "面試中", // 面試階段
  result: "評分報告", // 結果階段
}; // stageLabels 結束

// 模擬面試的主元件
export function InterviewApp() {
  // 目前所在的階段，預設為設定職缺
  const [stage, setStage] = useState<Stage>("setup");
  // 使用者輸入的職缺描述
  const [jobDescription, setJobDescription] = useState("");
  // 面試官與候選人的對話紀錄
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  // 目前進行到第幾題
  const [questionNumber, setQuestionNumber] = useState(0);
  // 回答輸入框中的文字
  const [answer, setAnswer] = useState("");
  // 最終評分結果，尚未評分時為 null
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  // 是否正在等待 API 回應
  const [loading, setLoading] = useState(false);
  // 錯誤訊息，沒有錯誤時為 null
  const [error, setError] = useState<string | null>(null);
  // 設定面板是否展開
  const [settingsOpen, setSettingsOpen] = useState(false);
  // 從 localStorage 讀取使用者的 OpenAI API Key（會隨儲存自動更新）
  const apiKey = useApiKey();
  // 指向對話底部的元素，用來自動捲動
  const bottomRef = useRef<HTMLDivElement>(null);

  // 對話或載入狀態改變時執行
  useEffect(() => {
    // 平滑捲動到對話底部，讓最新訊息可見
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, loading]); // 依賴：對話紀錄與載入狀態

  // 把目前對話送到後端，取得下一題或評分結果
  async function requestNext(history: ChatMessage[]) {
    // 還沒設定 API Key
    if (!apiKey) {
      // 自動打開設定面板
      setSettingsOpen(true);
      // 顯示提示訊息
      setError("請先設定你的 OpenAI API Key");
      // 中止，不送出請求
      return;
    } // 金鑰檢查結束
    // 進入載入狀態
    setLoading(true);
    // 清除先前的錯誤
    setError(null);
    // 嘗試呼叫 API
    try {
      // 呼叫我們的後端 API
      const res = await fetch("/api/interview", {
        method: "POST", // 使用 POST 方法
        headers: { "Content-Type": "application/json", [API_KEY_HEADER]: apiKey }, // 內容為 JSON，並帶上使用者的 API Key
        body: JSON.stringify({ jobDescription, messages: history }), // 送出職缺描述與對話紀錄
      }); // fetch 結束
      // 解析回應的 JSON
      const data = await res.json();
      // 401 代表金鑰缺少或無效，打開設定面板讓使用者修正
      if (res.status === 401) setSettingsOpen(true);
      // 非成功狀態就丟出錯誤，交給 catch 處理
      if (!res.ok) throw new Error(data.error ?? "發生未知錯誤");

      // 把回應視為 InterviewResponse 型別
      const result = data as InterviewResponse;
      // 回應是下一題
      if (result.type === "question") {
        // 把面試官的新題目加進對話紀錄
        setMessages([...history, { role: "interviewer", content: result.content }]);
        // 更新目前題號
        setQuestionNumber(result.questionNumber);
        // 切換到面試階段
        setStage("interview");
      } else { // 回應是評分結果
        // 儲存評分結果
        setEvaluation(result.evaluation);
        // 切換到結果階段
        setStage("result");
      } // 回應類型判斷結束
    } catch (e) { // 發生錯誤
      // 顯示錯誤訊息
      setError(e instanceof Error ? e.message : "發生未知錯誤");
    } finally { // 不論成功或失敗
      // 結束載入狀態
      setLoading(false);
    } // try/catch/finally 結束
  } // requestNext 結束

  // 開始面試
  function startInterview() {
    // 沒有填職缺描述就不執行
    if (!jobDescription.trim()) return;
    // 清空對話紀錄
    setMessages([]);
    // 以空的對話紀錄請求第 1 題
    requestNext([]);
  } // startInterview 結束

  // 送出候選人的回答
  function submitAnswer() {
    // 回答為空或正在載入時不執行
    if (!answer.trim() || loading) return;
    // 把回答加進對話紀錄，產生新的歷史
    const history: ChatMessage[] = [...messages, { role: "candidate", content: answer.trim() }];
    // 先更新畫面上的對話
    setMessages(history);
    // 清空輸入框
    setAnswer("");
    // 請求下一題或評分
    requestNext(history);
  } // submitAnswer 結束

  // 請求失敗時重試
  function retry() {
    // 用目前的對話紀錄重新請求
    requestNext(messages);
  } // retry 結束

  // 重新開始，回到初始狀態
  function reset() {
    // 回到設定階段
    setStage("setup");
    // 清空對話
    setMessages([]);
    // 題號歸零
    setQuestionNumber(0);
    // 清空回答輸入框
    setAnswer("");
    // 清除評分結果
    setEvaluation(null);
    // 清除錯誤訊息
    setError(null);
  } // reset 結束

  // 計算候選人已回答的題數
  const answered = messages.filter((m) => m.role === "candidate").length;
  // 最後一則是候選人的訊息，代表正在等面試官回應
  const waitingForInterviewer = messages.at(-1)?.role === "candidate";

  // 回傳畫面
  return (
    // 最外層容器：置中、限制寬度、垂直排列
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-5 py-12">
      {/* 頁首區塊：左邊標題、右邊按鈕 */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        {/* 左側：進度列與標題 */}
        <div className="flex flex-col gap-2">
          {/* 階段進度列 */}
          <ol className="flex items-center gap-2 font-mono text-[11px] tracking-widest text-muted uppercase">
            {/* 逐一列出每個階段 */}
            {(Object.keys(stageLabels) as Stage[]).map((s, i) => (
              // 單一階段項目
              <li key={s} className="flex items-center gap-2">
                {/* 第二個階段開始，前面加一條分隔線 */}
                {i > 0 && <span className="h-px w-5 bg-line" />}
                {/* 階段名稱，目前階段以強調色顯示 */}
                <span className={s === stage ? "text-accent" : ""}>{stageLabels[s]}</span>
              </li>
            ))}
          </ol>
          {/* 主標題，依階段顯示不同文字 */}
          <h1 className="text-3xl font-semibold tracking-tight">
            {/* 設定階段的標題 */}
            {stage === "setup" && (
              // Fragment 包住文字與強調字
              <>
                {/* 標題文字，「排練」以斜體襯線字強調 */}
                今天要<span className="font-serif font-normal italic">排練</span>哪個職缺？
              </>
            )}
            {/* 面試階段的標題：顯示目前題號 */}
            {stage === "interview" && (
              // Fragment 包住文字與題號
              <>
                {/* 例如「第 2 / 3 題」 */}
                第 <span className="font-serif font-normal text-accent">{questionNumber}</span> / {TOTAL_QUESTIONS} 題
              </>
            )}
            {/* 結果階段的標題 */}
            {stage === "result" && (
              // Fragment 包住文字與強調字
              <>
                {/* 標題文字，「面試」以斜體襯線字強調 */}
                你的<span className="font-serif font-normal italic">面試</span>報告
              </>
            )}
          </h1>
        </div>
        {/* 右側按鈕群組 */}
        <div className="flex items-center gap-2">
          {/* 設定按鈕 */}
          <button
            // 點擊切換設定面板開關
            onClick={() => setSettingsOpen((o) => !o)}
            // 告訴輔助技術面板目前是否展開
            aria-expanded={settingsOpen}
            // 按鈕樣式
            className="flex items-center gap-2 rounded-full border border-line bg-card px-4 py-2 text-sm transition-colors hover:border-ink"
          >
            {/* 狀態小圓點：已設定金鑰亮強調色，未設定為灰色 */}
            <span className={`h-2 w-2 rounded-full ${apiKey ? "bg-accent" : "bg-muted/50"}`} />
            {/* 按鈕文字 */}
            ⚙ 設定
          </button>
          {/* 非設定階段才顯示「重新開始」按鈕 */}
          {stage !== "setup" && (
            // 重新開始按鈕
            <button
              // 點擊後重設所有狀態
              onClick={reset}
              // 按鈕樣式
              className="rounded-full border border-line bg-card px-4 py-2 text-sm transition-colors hover:border-ink"
            >
              {/* 按鈕文字 */}
              ↺ 重新開始
            </button>
          )}
        </div>
      </div>

      {/* 設定面板：展開時才顯示 */}
      {settingsOpen && (
        // 設定面板元件
        <SettingsPanel
          // 傳入目前儲存的金鑰
          apiKey={apiKey}
          // 儲存金鑰時的處理
          onSave={(key) => {
            // 寫入 localStorage
            saveApiKey(key);
            // 清除錯誤訊息
            setError(null);
            // 有存入金鑰就自動收起面板（清除金鑰時保持展開）
            if (key) setSettingsOpen(false);
          }} // onSave 結束
          // 關閉面板
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {/* 設定階段：輸入職缺描述 */}
      {stage === "setup" && (
        // 職缺設定卡片
        <section className="rise flex flex-col gap-5 rounded-3xl border border-line bg-card p-6 sm:p-8">
          {/* 標籤與說明文字 */}
          <div className="flex flex-col gap-1">
            {/* 輸入框標籤，對應下方 id="jd" 的 textarea */}
            <label htmlFor="jd" className="font-medium">
              {/* 標籤文字 */}
              職缺描述
            </label>
            {/* 說明文字 */}
            <p className="text-sm text-muted">
              {/* 說明面試流程 */}
              貼上完整的 JD，面試官會依此出 {TOTAL_QUESTIONS} 題，並在最後給你評分與建議。
            </p>
          </div>
          {/* 職缺描述輸入框 */}
          <textarea
            // 與 label 對應的 id
            id="jd"
            // 綁定職缺描述狀態
            value={jobDescription}
            // 輸入時更新狀態
            onChange={(e) => setJobDescription(e.target.value)}
            // 預設高度 10 行
            rows={10}
            // 提示文字
            placeholder="例如：前端工程師，需熟悉 React、TypeScript，有 3 年以上開發經驗……"
            // 輸入框樣式
            className="w-full resize-y rounded-2xl border border-line bg-paper p-4 leading-relaxed outline-none transition-colors placeholder:text-muted/70 focus:border-accent"
          />
          {/* 底部列：範例按鈕與開始按鈕 */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* 範例按鈕群組 */}
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {/* 範例提示文字 */}
              <span className="text-muted">試試範例：</span>
              {/* 逐一產生範例按鈕 */}
              {samples.map((s) => (
                // 單一範例按鈕
                <button
                  // 以名稱作為 React 的 key
                  key={s.label}
                  // 點擊後帶入範例 JD
                  onClick={() => setJobDescription(s.jd)}
                  // 按鈕樣式
                  className="rounded-full border border-line px-3 py-1 transition-colors hover:border-accent hover:text-accent"
                >
                  {/* 按鈕文字 */}
                  {s.label}
                </button>
              ))}
            </div>
            {/* 開始面試按鈕：沒填 JD 或載入中時停用 */}
            <PrimaryButton onClick={startInterview} disabled={!jobDescription.trim() || loading}>
              {/* 載入中與一般狀態顯示不同文字 */}
              {loading ? "面試官準備中…" : "開始面試 →"}
            </PrimaryButton>
          </div>
        </section>
      )}

      {/* 面試階段：對話介面 */}
      {stage === "interview" && (
        // 面試卡片
        <section className="rise flex flex-col overflow-hidden rounded-3xl border border-line bg-card">
          {/* 答題進度條 */}
          <div className="flex gap-1.5 border-b border-line px-6 py-4">
            {/* 依總題數產生對應數量的進度格 */}
            {Array.from({ length: TOTAL_QUESTIONS }, (_, i) => (
              // 單一進度格
              <span
                // 以索引作為 key
                key={i}
                // 已回答的題目以強調色顯示
                className={`h-1.5 flex-1 rounded-full transition-colors ${i < answered ? "bg-accent" : "bg-soft"}`}
              />
            ))}
          </div>

          {/* 對話訊息列表 */}
          <div className="flex flex-col gap-4 p-6 leading-relaxed">
            {/* 逐一顯示每則訊息 */}
            {messages.map((m, i) =>
              // 判斷是面試官還是候選人的訊息
              m.role === "interviewer" ? (
                // 面試官訊息：靠左，帶頭像
                <div key={i} className="flex max-w-[90%] gap-3 self-start">
                  {/* 面試官頭像 */}
                  <Avatar />
                  {/* 面試官訊息泡泡，保留換行 */}
                  <div className="rounded-2xl rounded-tl-sm bg-soft px-4 py-3 whitespace-pre-wrap">{m.content}</div>
                </div>
              ) : (
                // 候選人訊息：靠右
                <div
                  // 以索引作為 key
                  key={i}
                  // 深色泡泡樣式，保留換行
                  className="max-w-[85%] self-end rounded-2xl rounded-tr-sm bg-ink px-4 py-3 whitespace-pre-wrap text-paper"
                >
                  {/* 候選人的回答內容 */}
                  {m.content}
                </div>
              ),
            )}
            {/* 載入中時顯示「面試官思考中」的提示 */}
            {loading && (
              // 提示外框：靠左
              <div className="flex gap-3 self-start">
                {/* 面試官頭像 */}
                <Avatar />
                {/* 提示泡泡 */}
                <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm bg-soft px-4 py-3 text-sm text-muted">
                  {/* 打字中動畫的三個點 */}
                  <span className="typing inline-flex gap-1">
                    {/* 第一個點 */}
                    <span>●</span>
                    {/* 第二個點 */}
                    <span>●</span>
                    {/* 第三個點 */}
                    <span>●</span>
                  </span>
                  {/* 答完所有題目時顯示「評分中」，否則顯示「思考中」 */}
                  {answered >= TOTAL_QUESTIONS ? "面試官評分中" : "面試官思考中"}
                </div>
              </div>
            )}
            {/* 對話底部的錨點，用於自動捲動 */}
            <div ref={bottomRef} />
          </div>

          {/* 不是在等面試官回應時，才顯示回答輸入區 */}
          {!waitingForInterviewer && (
            // 回答輸入區
            <div className="flex flex-col gap-3 border-t border-line bg-paper/50 p-5">
              {/* 回答輸入框 */}
              <textarea
                // 綁定回答狀態
                value={answer}
                // 輸入時更新狀態
                onChange={(e) => setAnswer(e.target.value)}
                // 鍵盤事件處理
                onKeyDown={(e) => {
                  // Ctrl + Enter（Mac 為 Cmd + Enter）送出回答
                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) submitAnswer();
                }} // onKeyDown 結束
                // 預設高度 5 行
                rows={5}
                // 載入中時停用
                disabled={loading}
                // 提示文字
                placeholder="輸入你的回答……"
                // 輸入框樣式
                className="w-full resize-y rounded-2xl border border-line bg-card p-4 leading-relaxed outline-none transition-colors placeholder:text-muted/70 focus:border-accent"
              />
              {/* 底部列：快捷鍵提示與送出按鈕 */}
              <div className="flex items-center justify-between gap-4">
                {/* 快捷鍵提示 */}
                <span className="font-mono text-xs text-muted">Ctrl + Enter 送出</span>
                {/* 送出按鈕：回答為空或載入中時停用 */}
                <PrimaryButton onClick={submitAnswer} disabled={!answer.trim() || loading}>
                  {/* 按鈕文字 */}
                  送出回答
                </PrimaryButton>
              </div>
            </div>
          )}
        </section>
      )}

      {/* 結果階段：有評分結果時顯示評分報告 */}
      {stage === "result" && evaluation && <EvaluationView evaluation={evaluation} onRestart={reset} />}

      {/* 有錯誤時顯示錯誤提示 */}
      {error && (
        // 錯誤提示框
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-accent/40 bg-accent/10 px-5 py-4 text-sm">
          {/* 錯誤訊息文字 */}
          <span>{error}</span>
          {/* 面試中且在等面試官回應時，提供重試按鈕 */}
          {stage === "interview" && waitingForInterviewer && (
            // 重試按鈕
            <button onClick={retry} className="font-medium text-accent underline underline-offset-4">
              {/* 按鈕文字 */}
              重試
            </button>
          )}
        </div>
      )}
    </div>
  ); // return 結束
} // InterviewApp 結束

// API Key 設定面板元件
function SettingsPanel({
  apiKey, // 目前儲存的金鑰
  onSave, // 儲存時呼叫的函式
  onClose, // 關閉面板時呼叫的函式
}: { // props 的型別定義
  apiKey: string; // 金鑰字串
  onSave: (key: string) => void; // 接收新金鑰的函式
  onClose: () => void; // 無參數的關閉函式
}) { // 元件本體開始
  // 輸入框中尚未儲存的草稿，初始值為目前的金鑰
  const [draft, setDraft] = useState(apiKey);
  // 是否以明文顯示金鑰
  const [visible, setVisible] = useState(false);
  // 是否正在向 OpenAI 驗證金鑰
  const [checking, setChecking] = useState(false);
  // 驗證失敗時的錯誤訊息，沒有錯誤時為 null
  const [checkError, setCheckError] = useState<string | null>(null);
  // 去除前後空白後的草稿
  const trimmed = draft.trim();

  // 先驗證金鑰，正確才儲存
  async function verifyAndSave() {
    // 草稿為空、與目前金鑰相同或正在驗證中時不執行
    if (!trimmed || trimmed === apiKey || checking) return;
    // 進入驗證中狀態
    setChecking(true);
    // 清除先前的驗證錯誤
    setCheckError(null);
    // 嘗試呼叫驗證 API
    try {
      // 呼叫後端驗證金鑰
      const res = await fetch("/api/validate-key", {
        method: "POST", // 使用 POST 方法，避免被快取
        headers: { [API_KEY_HEADER]: trimmed }, // 帶上要驗證的金鑰
      }); // fetch 結束
      // 驗證成功
      if (res.ok) {
        // 儲存金鑰
        onSave(trimmed);
        // 結束，不往下執行
        return;
      } // 成功處理結束
      // 解析錯誤訊息，解析失敗就當作空物件
      const data = await res.json().catch(() => ({}));
      // 顯示驗證失敗的原因
      setCheckError(data.error ?? "驗證失敗，請稍後再試");
    } catch { // 網路錯誤
      // 顯示連線失敗訊息
      setCheckError("無法連線到伺服器，請稍後再試");
    } finally { // 不論成功或失敗
      // 結束驗證中狀態
      setChecking(false);
    } // try/catch/finally 結束
  } // verifyAndSave 結束

  // 回傳畫面
  return (
    // 設定面板卡片
    <section className="rise flex flex-col gap-4 rounded-3xl border border-line bg-card p-6 sm:p-8">
      {/* 頂部：標題說明與關閉按鈕 */}
      <div className="flex items-start justify-between gap-4">
        {/* 標題與說明 */}
        <div className="flex flex-col gap-1">
          {/* 輸入框標籤，對應 id="api-key" */}
          <label htmlFor="api-key" className="font-medium">
            {/* 標籤文字 */}
            OpenAI API Key
          </label>
          {/* 說明金鑰的儲存方式 */}
          <p className="text-sm text-muted">
            {/* 說明文字 */}
            金鑰只會存在你這台瀏覽器的 localStorage，每次面試請求時帶給伺服器轉呼叫 OpenAI，不會被儲存。
          </p>
        </div>
        {/* 關閉按鈕 */}
        <button onClick={onClose} aria-label="關閉設定" className="text-muted transition-colors hover:text-ink">
          {/* 叉叉符號 */}
          ✕
        </button>
      </div>
      {/* 金鑰輸入列 */}
      <div className="flex gap-2">
        {/* 金鑰輸入框 */}
        <input
          // 與 label 對應的 id
          id="api-key"
          // 依 visible 切換明文或密碼遮蔽
          type={visible ? "text" : "password"}
          // 綁定草稿狀態
          value={draft}
          // 輸入時更新草稿，並清除上一次的驗證錯誤
          onChange={(e) => {
            // 更新草稿
            setDraft(e.target.value);
            // 清除驗證錯誤
            setCheckError(null);
          }} // onChange 結束
          // 鍵盤事件處理
          onKeyDown={(e) => {
            // 按 Enter 驗證並儲存
            if (e.key === "Enter") verifyAndSave();
          }} // onKeyDown 結束
          // 驗證中時停用輸入
          disabled={checking}
          // 驗證失敗時標記為無效，供輔助技術讀取
          aria-invalid={checkError !== null}
          // 提示文字
          placeholder="sk-..."
          // 關閉瀏覽器自動填入
          autoComplete="off"
          // 關閉拼字檢查
          spellCheck={false}
          // 輸入框樣式，驗證失敗時邊框改為強調色
          className={`min-w-0 flex-1 rounded-2xl border bg-paper px-4 py-2.5 font-mono text-sm outline-none transition-colors placeholder:text-muted/70 focus:border-accent disabled:opacity-60 ${checkError ? "border-accent" : "border-line"}`}
        />
        {/* 顯示／隱藏切換按鈕 */}
        <button
          // 點擊切換明文顯示
          onClick={() => setVisible((v) => !v)}
          // 按鈕樣式
          className="shrink-0 rounded-2xl border border-line px-3 text-sm text-muted transition-colors hover:border-ink hover:text-ink"
        >
          {/* 依狀態顯示「隱藏」或「顯示」 */}
          {visible ? "隱藏" : "顯示"}
        </button>
      </div>
      {/* 驗證失敗時顯示錯誤訊息 */}
      {checkError && <p className="-mt-2 text-sm text-accent">{checkError}</p>}
      {/* 底部列：清除／狀態與儲存按鈕 */}
      <div className="flex items-center justify-between gap-4">
        {/* 已有金鑰時顯示清除按鈕，否則顯示「尚未設定」 */}
        {apiKey ? (
          // 清除金鑰按鈕
          <button
            // 點擊時清空草稿並移除已儲存的金鑰
            onClick={() => {
              // 清空輸入框
              setDraft("");
              // 清除驗證錯誤
              setCheckError(null);
              // 以空字串儲存，等於刪除金鑰
              onSave("");
            }} // onClick 結束
            // 按鈕樣式
            className="text-sm text-muted underline underline-offset-4 transition-colors hover:text-ink"
          >
            {/* 按鈕文字 */}
            清除金鑰
          </button>
        ) : (
          // 未設定狀態文字
          <span className="text-sm text-muted">尚未設定</span>
        )}
        {/* 儲存按鈕：先驗證金鑰；草稿為空、與目前金鑰相同或驗證中時停用 */}
        <PrimaryButton onClick={verifyAndSave} disabled={!trimmed || trimmed === apiKey || checking}>
          {/* 驗證中與一般狀態顯示不同文字 */}
          {checking ? "驗證中…" : "儲存"}
        </PrimaryButton>
      </div>
    </section>
  ); // return 結束
} // SettingsPanel 結束

// 面試官頭像元件
function Avatar() {
  // 回傳畫面
  return (
    // 圓形深色底的頭像
    <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink font-serif text-base text-paper italic">
      {/* 頭像文字 R（Rehearse） */}
      R
    </span>
  ); // return 結束
} // Avatar 結束

// 主要按鈕元件：統一樣式，其餘屬性原樣傳給 button
function PrimaryButton({
  children, // 按鈕內容
  ...props // 其他 button 屬性（onClick、disabled 等）
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }) { // props 型別：原生 button 屬性加上 children
  // 回傳畫面
  return (
    // 原生 button
    <button
      // 展開傳入的屬性
      {...props}
      // 主要按鈕樣式（含停用狀態）
      className="rounded-full bg-accent px-6 py-2.5 font-medium text-accent-ink transition-transform hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {/* 按鈕內容 */}
      {children}
    </button>
  ); // return 結束
} // PrimaryButton 結束

// 評分報告元件
function EvaluationView({ evaluation, onRestart }: { evaluation: Evaluation; onRestart: () => void }) {
  // 回傳畫面
  return (
    // 報告外層容器
    <section className="rise flex flex-col gap-6">
      {/* 總分與總評卡片 */}
      <div className="flex flex-col items-center gap-6 rounded-3xl border border-line bg-card p-8 sm:flex-row">
        {/* 總分圓環 */}
        <ScoreRing score={evaluation.overallScore} size={120} />
        {/* 總評文字區 */}
        <div className="flex flex-col gap-2">
          {/* 小標題 */}
          <span className="font-mono text-xs tracking-widest text-accent uppercase">總評</span>
          {/* 總評內容 */}
          <p className="leading-relaxed">{evaluation.summary}</p>
        </div>
      </div>

      {/* 逐題評分卡片 */}
      <div className="overflow-hidden rounded-3xl border border-line bg-card">
        {/* 卡片標題 */}
        <h2 className="border-b border-line px-6 py-4 font-semibold">逐題評分</h2>
        {/* 題目列表 */}
        <ul className="divide-y divide-line">
          {/* 逐一顯示每題的評分 */}
          {evaluation.questions.map((q, i) => (
            // 單一題目
            <li key={i} className="flex flex-col gap-3 p-6">
              {/* 題號、題目與分數 */}
              <div className="flex items-start gap-4">
                {/* 題號，例如 01 */}
                <span className="font-mono text-xs text-muted">0{i + 1}</span>
                {/* 題目摘要 */}
                <span className="flex-1 font-medium">{q.question}</span>
                {/* 分數 */}
                <span className="shrink-0 font-serif text-2xl leading-none text-accent">
                  {/* 此題得分 */}
                  {q.score}
                  {/* 滿分標示 */}
                  <span className="font-sans text-xs text-muted"> /10</span>
                </span>
              </div>
              {/* 分數長條的底軌 */}
              <div className="ml-8 h-1.5 overflow-hidden rounded-full bg-soft">
                {/* 分數長條，寬度依分數比例 */}
                <div className="h-full rounded-full bg-accent" style={{ width: `${q.score * 10}%` }} />
              </div>
              {/* 此題評語 */}
              <p className="ml-8 text-sm leading-relaxed text-muted">{q.feedback}</p>
            </li>
          ))}
        </ul>
      </div>

      {/* 優點與改進建議，寬螢幕時並排 */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* 優點列表 */}
        <List title="優點" mark="+" items={evaluation.strengths} />
        {/* 改進建議列表（強調樣式） */}
        <List title="改進建議" mark="→" items={evaluation.improvements} accent />
      </div>

      {/* 再練一場按鈕區 */}
      <div className="flex justify-center pt-2">
        {/* 點擊後重新開始 */}
        <PrimaryButton onClick={onRestart}>再練一場 ↺</PrimaryButton>
      </div>
    </section>
  ); // return 結束
} // EvaluationView 結束

// 條列清單元件，用於優點與改進建議
function List({ title, mark, items, accent }: { title: string; mark: string; items: string[]; accent?: boolean }) {
  // 回傳畫面
  return (
    // 清單卡片，accent 為 true 時使用強調色
    <div className={`rounded-3xl border p-6 ${accent ? "border-accent/30 bg-accent/5" : "border-line bg-card"}`}>
      {/* 清單標題 */}
      <h2 className="mb-4 font-semibold">{title}</h2>
      {/* 清單內容 */}
      <ul className="flex flex-col gap-3 text-sm leading-relaxed">
        {/* 逐一顯示每個項目 */}
        {items.map((item, i) => (
          // 單一項目
          <li key={i} className="flex gap-3">
            {/* 項目前的符號 */}
            <span className={`shrink-0 font-mono ${accent ? "text-accent" : "text-muted"}`}>{mark}</span>
            {/* 項目文字 */}
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  ); // return 結束
} // List 結束
