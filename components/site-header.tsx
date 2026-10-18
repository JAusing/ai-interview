import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="group flex items-center gap-2.5">
      <span className="grid h-8 w-8 place-items-center rounded-full bg-ink text-paper transition-transform group-hover:-rotate-12">
        <span className="font-serif text-xl leading-none italic">R</span>
      </span>
      <span className="text-[15px] font-semibold tracking-tight">Rehearse</span>
    </Link>
  );
}

export function SiteHeader({ showNav = true }: { showNav?: boolean }) {
  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-paper/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Logo />
        {showNav && (
          <nav className="hidden items-center gap-8 text-sm text-muted md:flex">
            <Link href="/#how" className="transition-colors hover:text-ink">
              運作方式
            </Link>
            <Link href="/#features" className="transition-colors hover:text-ink">
              功能
            </Link>
            <Link href="/#report" className="transition-colors hover:text-ink">
              評分報告
            </Link>
            <Link href="/#faq" className="transition-colors hover:text-ink">
              常見問題
            </Link>
          </nav>
        )}
        {showNav ? (
          <Link
            href="/interview"
            className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper transition-transform hover:-translate-y-0.5"
          >
            開始模擬面試
          </Link>
        ) : (
          <Link href="/" className="text-sm text-muted transition-colors hover:text-ink">
            ← 回首頁
          </Link>
        )}
      </div>
    </header>
  );
}
