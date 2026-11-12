export function SiteFooter() {
  return (
    <footer className="mx-auto mt-12 flex w-full max-w-[85rem] flex-wrap justify-between gap-3 border-t border-line px-4 pb-10 pt-6 text-[13px] text-dim sm:px-10">
      <span>Stringroom · a browser guitar</span>
      <a
        href="https://github.com/nbrosowsky/tonejs-instruments"
        target="_blank"
        rel="noreferrer"
        className="underline decoration-edge underline-offset-4 hover:text-muted"
      >
        Samples adapted from tonejs-instruments · CC BY 3.0
      </a>
    </footer>
  );
}
