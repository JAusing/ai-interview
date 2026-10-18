import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { ScoreRing } from "@/components/score-ring";
import { SiteHeader } from "@/components/site-header";
import { TOTAL_QUESTIONS } from "@/lib/interview";

const steps = [
  {
    no: "01",
    title: "貼上職缺描述",
    body: "把 104、LinkedIn 上的 JD 直接貼進來。技能、年資、工作內容，越完整，題目越貼近真實。",
  },
  {
    no: "02",
    title: "與 AI 面試官對談",
    body: `面試官會依職缺出 ${TOTAL_QUESTIONS} 題，並針對你的回答即時回應、深入追問，就像真人面試一樣。`,
  },
  {
    no: "03",
    title: "拿到評分報告",
    body: "結束後立即產出總分、逐題評語、優點與具體可行的改進建議，知道下一次該怎麼答。",
  },
];

const features = [
  {
    title: "為你的職缺量身出題",
    body: "不是通用題庫。每一題都從你貼上的 JD 推導，聚焦該職位真正在意的能力。",
    icon: "◎",
  },
  {
    title: "會追問的面試官",
    body: "回答空泛？面試官會像真人一樣追問細節，逼你把經驗講具體。",
    icon: "↻",
  },
  {
    title: "誠實的評分",
    body: "離題或空洞的回答會如實反映在分數上，不給安慰獎，只給你真正有用的回饋。",
    icon: "◐",
  },
  {
    title: "繁體中文全程對話",
    body: "從開場到評語都使用自然的繁體中文，貼近台灣職場語境。",
    icon: "文",
  },
  {
    title: "免註冊，打開就練",
    body: "不用建立帳號，不用填資料。貼上 JD，五分鐘內完成一場完整模擬。",
    icon: "→",
  },
  {
    title: "無限次重來",
    body: "答得不好就再來一次。同一個職缺，每次都會有不同的切入角度。",
    icon: "∞",
  },
];

const faqs = [
  {
    q: "需要付費或註冊嗎？",
    a: "不需要。打開頁面、貼上職缺描述，就可以直接開始模擬面試。",
  },
  {
    q: "一場面試大概多久？",
    a: `共 ${TOTAL_QUESTIONS} 題，依回答長度大約 5 到 15 分鐘，結束後會立即產出評分報告。`,
  },
  {
    q: "我的回答會被保存嗎？",
    a: "面試內容只存在你目前的瀏覽器分頁中，重新整理或按「重新開始」後就會清除。",
  },
  {
    q: "適合哪些職位？",
    a: "任何有職缺描述的職位都適用：工程、設計、產品、行銷、業務、行政……只要貼上 JD 即可。",
  },
];

export default function Landing() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <Marquee />
        <HowItWorks />
        <Features />
        <ReportPreview />
        <Faq />
        <FinalCta />
      </main>
      <SiteFooter />
    </>
  );
}

function PrimaryCta({ children = "免費開始模擬面試" }: { children?: React.ReactNode }) {
  return (
    <Link
      href="/interview"
      className="group inline-flex items-center gap-3 rounded-full bg-accent py-3 pr-3 pl-6 font-medium text-accent-ink shadow-[0_10px_30px_-10px_var(--accent)] transition-transform hover:-translate-y-0.5"
    >
      {children}
      <span className="grid h-8 w-8 place-items-center rounded-full bg-accent-ink/20 transition-transform group-hover:translate-x-1">
        →
      </span>
    </Link>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="grain pointer-events-none absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-5 pt-16 pb-20 md:pt-24 lg:grid-cols-[1.1fr_1fr]">
        <div className="rise flex flex-col items-start gap-7">
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-3 py-1 text-xs text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            AI 面試模擬器 · 免費使用
          </span>
          <h1 className="text-[2.6rem] leading-[1.15] font-semibold tracking-tight sm:text-6xl">
            面試前，
            <br />
            先<span className="font-serif font-normal text-accent italic"> rehearse </span>一次。
          </h1>
          <p className="max-w-md text-lg leading-relaxed text-muted">
            貼上職缺描述，AI 面試官會針對這個職位出題、追問，並在結束時給你逐題評分與具體的改進建議。
          </p>
          <div className="flex flex-wrap items-center gap-5">
            <PrimaryCta />
            <a href="#how" className="text-sm font-medium underline decoration-line underline-offset-4 hover:decoration-ink">
              看看怎麼運作
            </a>
          </div>
          <dl className="mt-4 grid grid-cols-3 gap-8 border-t border-line pt-6">
            {[
              [`${TOTAL_QUESTIONS}`, "道客製題目"],
              ["~5", "分鐘一場"],
              ["0", "註冊步驟"],
            ].map(([v, l]) => (
              <div key={l}>
                <dt className="font-serif text-4xl leading-none">{v}</dt>
                <dd className="mt-1 text-xs text-muted">{l}</dd>
              </div>
            ))}
          </dl>
        </div>
        <ChatMock />
      </div>
    </section>
  );
}

function ChatMock() {
  return (
    <div className="rise relative [animation-delay:150ms]">
      <div className="absolute -inset-4 -z-10 rotate-2 rounded-[2rem] bg-soft" />
      <div className="overflow-hidden rounded-3xl border border-line bg-card shadow-[0_30px_60px_-30px_rgba(0,0,0,0.25)]">
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-line" />
            <span className="h-2.5 w-2.5 rounded-full bg-line" />
            <span className="h-2.5 w-2.5 rounded-full bg-line" />
          </div>
          <span className="font-mono text-[11px] text-muted">前端工程師 · 第 2 / {TOTAL_QUESTIONS} 題</span>
        </div>
        <div className="flex flex-col gap-3 p-5 text-sm leading-relaxed">
          <Bubble who="ai">
            你提到用 React Query 處理快取，能具體說明當時遇到什麼問題、為什麼選擇它而不是自己寫嗎？
          </Bubble>
          <Bubble who="me">
            當時列表頁每次切換分頁都重新請求，API 負載很高。導入後設定 staleTime，請求量降了大約 60%……
          </Bubble>
          <Bubble who="ai">
            <span className="typing inline-flex gap-1">
              <span>●</span>
              <span>●</span>
              <span>●</span>
            </span>
          </Bubble>
        </div>
      </div>
      <div className="absolute -bottom-6 -left-4 flex items-center gap-3 rounded-2xl border border-line bg-card px-4 py-3 shadow-lg sm:-left-8">
        <span className="font-serif text-3xl leading-none text-accent">86</span>
        <span className="text-xs leading-tight text-muted">
          總分
          <br />
          表現優於多數練習者
        </span>
      </div>
    </div>
  );
}

function Bubble({ who, children }: { who: "ai" | "me"; children: React.ReactNode }) {
  return who === "ai" ? (
    <div className="flex max-w-[88%] gap-2.5 self-start">
      <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ink font-serif text-sm text-paper italic">
        R
      </span>
      <div className="rounded-2xl rounded-tl-sm bg-soft px-4 py-2.5">{children}</div>
    </div>
  ) : (
    <div className="max-w-[80%] self-end rounded-2xl rounded-tr-sm bg-ink px-4 py-2.5 text-paper">{children}</div>
  );
}

function Marquee() {
  const roles = ["前端工程師", "產品經理", "UI/UX 設計師", "數據分析師", "行銷企劃", "業務專員", "後端工程師", "專案經理", "人資專員"];
  return (
    <div className="border-y border-line bg-card py-5">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-2 px-5 text-sm text-muted">
        <span className="font-mono text-xs tracking-widest uppercase">適用於</span>
        {roles.map((r) => (
          <span key={r} className="font-medium">
            {r}
          </span>
        ))}
      </div>
    </div>
  );
}

function SectionTitle({ eyebrow, title, desc }: { eyebrow: string; title: React.ReactNode; desc?: string }) {
  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <span className="font-mono text-xs tracking-widest text-accent uppercase">{eyebrow}</span>
      <h2 className="text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">{title}</h2>
      {desc && <p className="leading-relaxed text-muted">{desc}</p>}
    </div>
  );
}

function HowItWorks() {
  return (
    <section id="how" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-24">
      <SectionTitle
        eyebrow="How it works"
        title={
          <>
            三個步驟，<span className="font-serif font-normal italic">完整</span>排練一場面試
          </>
        }
      />
      <ol className="mt-14 grid gap-px overflow-hidden rounded-3xl border border-line bg-line md:grid-cols-3">
        {steps.map((s) => (
          <li key={s.no} className="flex flex-col gap-4 bg-card p-8">
            <span className="font-serif text-5xl leading-none text-accent">{s.no}</span>
            <h3 className="text-lg font-semibold">{s.title}</h3>
            <p className="text-sm leading-relaxed text-muted">{s.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Features() {
  return (
    <section id="features" className="scroll-mt-20 bg-ink py-24 text-paper">
      <div className="mx-auto max-w-6xl px-5">
        <div className="flex flex-col gap-4">
          <span className="font-mono text-xs tracking-widest text-accent uppercase">Features</span>
          <h2 className="max-w-2xl text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
            不只是題庫，是一位
            <span className="font-serif font-normal text-accent italic"> 會思考 </span>
            的面試官
          </h2>
        </div>
        <div className="mt-14 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="flex flex-col gap-3 border-t border-paper/15 pt-6">
              <span className="grid h-10 w-10 place-items-center rounded-full border border-paper/20 text-lg">{f.icon}</span>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="text-sm leading-relaxed text-paper/60">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ReportPreview() {
  const rows = [
    { q: "React 效能優化經驗", score: 9 },
    { q: "API 快取策略與取捨", score: 8 },
    { q: "跨部門溝通的衝突處理", score: 6 },
  ];
  return (
    <section id="report" className="mx-auto grid max-w-6xl scroll-mt-20 items-center gap-14 px-5 py-24 lg:grid-cols-2">
      <SectionTitle
        eyebrow="The report"
        title={
          <>
            知道自己<span className="font-serif font-normal italic">哪裡好</span>，更知道下一次怎麼改
          </>
        }
        desc="每場面試結束後，你會拿到一份結構化的評分報告：總分、逐題評語、優點清單，以及可以立刻練習的改進建議。"
      />
      <div className="rounded-3xl border border-line bg-card p-7 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.2)]">
        <div className="flex items-center gap-5 border-b border-line pb-6">
          <ScoreRing score={78} />
          <p className="text-sm leading-relaxed text-muted">
            技術深度扎實，能用數據佐證成果；但在情境題中較少說明自己的決策過程。
          </p>
        </div>
        <ul className="flex flex-col divide-y divide-line">
          {rows.map((r, i) => (
            <li key={r.q} className="flex items-center gap-4 py-4 text-sm">
              <span className="font-mono text-xs text-muted">0{i + 1}</span>
              <span className="flex-1">{r.q}</span>
              <span className="h-1.5 w-24 overflow-hidden rounded-full bg-soft">
                <span className="block h-full rounded-full bg-accent" style={{ width: `${r.score * 10}%` }} />
              </span>
              <span className="w-10 text-right font-mono">{r.score}/10</span>
            </li>
          ))}
        </ul>
        <div className="mt-2 rounded-2xl bg-soft p-4 text-sm leading-relaxed">
          <span className="font-semibold text-accent">改進建議 · </span>
          回答情境題時，試著用 STAR 架構：先交代背景與任務，再說明你的行動與結果。
        </div>
      </div>
    </section>
  );
}

function Faq() {
  return (
    <section id="faq" className="scroll-mt-20 border-t border-line">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 py-24 lg:grid-cols-[1fr_1.4fr]">
        <SectionTitle eyebrow="FAQ" title="常見問題" />
        <div className="flex flex-col divide-y divide-line border-y border-line">
          {faqs.map((f) => (
            <details key={f.q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                {f.q}
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-line text-muted transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 pr-10 text-sm leading-relaxed text-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="px-5 pb-24">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-accent px-8 py-16 text-center text-accent-ink sm:py-20">
        <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full border-[40px] border-accent-ink/10" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full border-[40px] border-accent-ink/10" />
        <h2 className="relative text-3xl leading-tight font-semibold tracking-tight sm:text-5xl">
          下一場面試，
          <br className="sm:hidden" />
          從<span className="font-serif font-normal italic">今天</span>開始準備。
        </h2>
        <p className="relative mx-auto mt-5 max-w-md opacity-80">免費、免註冊，貼上職缺描述就能開始。</p>
        <Link
          href="/interview"
          className="relative mt-9 inline-flex items-center gap-3 rounded-full bg-ink px-7 py-3.5 font-medium text-paper transition-transform hover:-translate-y-0.5"
        >
          立即開始模擬面試 →
        </Link>
      </div>
    </section>
  );
}
