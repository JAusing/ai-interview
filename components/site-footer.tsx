import Link from "next/link";
import { Logo } from "./site-header";

const columns = [
  {
    title: "產品",
    links: [
      { label: "開始面試", href: "/interview" },
      { label: "運作方式", href: "/#how" },
      { label: "功能", href: "/#features" },
    ],
  },
  {
    title: "資源",
    links: [
      { label: "評分報告範例", href: "/#report" },
      { label: "常見問題", href: "/#faq" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-[2fr_1fr_1fr]">
        <div className="flex flex-col gap-4">
          <Logo />
          <p className="max-w-xs text-sm leading-relaxed text-muted">
            在真正的面試之前，先和 AI 面試官排練一次。針對你的職缺出題、追問、評分。
          </p>
        </div>
        {columns.map((col) => (
          <div key={col.title} className="flex flex-col gap-3 text-sm">
            <span className="font-mono text-xs tracking-widest text-muted uppercase">{col.title}</span>
            {col.links.map((l) => (
              <Link key={l.label} href={l.href} className="w-fit transition-colors hover:text-accent">
                {l.label}
              </Link>
            ))}
          </div>
        ))}
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-6 text-xs text-muted sm:flex-row sm:justify-between">
          <span>© 2026 Rehearse. All rights reserved.</span>
          <span>Made for job seekers, with care.</span>
        </div>
      </div>
    </footer>
  );
}
