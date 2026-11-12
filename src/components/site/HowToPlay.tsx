const STEPS = [
  {
    title: "Hold a chord key",
    body: "C, D, E, F, G and A give you C, Dm, Em, F, G and Am. Let go and the strings ring open. Click a key on screen to keep a chord held.",
  },
  {
    title: "Sweep across the strings",
    body: "Move the pointer up or down over the neck. Faster sweeps play louder. On a phone, drag a finger.",
  },
  {
    title: "Or strum with Space",
    body: "Space strums down. Hold Shift to strum up.",
  },
] as const;

export function HowToPlay() {
  return (
    <section id="how-to-play" aria-labelledby="how-heading" className="scroll-mt-6">
      <h2
        id="how-heading"
        className="mb-7 text-[clamp(2rem,4vw,2.75rem)] font-extrabold leading-none tracking-[-0.02em] font-stretch-expanded"
      >
        Three moves
      </h2>
      <ol className="grid grid-cols-[repeat(auto-fit,minmax(16rem,1fr))] gap-4">
        {STEPS.map((step, index) => (
          <li key={step.title} className="border-t border-edge pt-5">
            <p className="font-mono text-xs font-semibold text-accent">{String(index + 1).padStart(2, "0")}</p>
            <h3 className="mb-2 mt-2.5 text-xl font-bold">{step.title}</h3>
            <p className="text-[15px] leading-relaxed text-muted">{step.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
