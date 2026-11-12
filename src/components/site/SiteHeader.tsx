import Link from "next/link";

const NAV = [
  { href: "/#play", label: "Play" },
  { href: "/guitars", label: "Guitars" },
  { href: "/library", label: "Library" },
  { href: "/#how-to-play", label: "How to play" },
] as const;

export function PickMark({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} width="22" height="26" viewBox="0 0 22 26" fill="none">
      <path
        d="M11 25C6 21 1 14 1 8.5 1 3.5 5.5 1 11 1s10 2.5 10 7.5C21 14 16 21 11 25Z"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

export function SiteHeader() {
  return (
    <header className="border-b border-line">
      <a
        href="#main-content"
        className="sr-only rounded-full bg-fg px-4 py-2 text-sm font-bold text-ground focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50"
      >
        Skip to content
      </a>
      <div className="mx-auto flex max-w-[85rem] flex-wrap items-center justify-between gap-x-8 gap-y-3 px-4 py-4 sm:px-10">
        <Link href="/" aria-label="Stringroom home" className="flex items-center gap-2.5">
          <PickMark className="text-accent" />
          <span className="text-[17px] font-extrabold tracking-[0.06em] font-stretch-expanded">STRINGROOM</span>
        </Link>
        <nav aria-label="Main" className="flex gap-6 text-sm sm:gap-7">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="border-b-2 border-transparent pb-1 text-muted transition-colors hover:border-accent hover:text-fg"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
