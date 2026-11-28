/**
 * Starfield and glowing planet horizon behind the interview session, matching the
 * landing hero. Purely decorative (aria-hidden, pointer-events-none). `fixed` pins it to
 * the viewport (the live interview); otherwise it sits at the bottom of a scrolling page.
 * Stars are seeded so server and client render identical markup.
 */

const STARS = (() => {
  let seed = 11;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  return Array.from({ length: 120 }, (_, i) => ({
    x: rand() * 100,
    y: rand() * 82,
    r: [0.5, 0.6, 0.7, 0.9][i % 4] ?? 0.6,
    o: [0.25, 0.4, 0.55, 0.75][i % 4] ?? 0.4,
    t: 3 + rand() * 4,
    d: rand() * 5,
  }));
})();

export function SpaceBackdrop({ fixed = true }: { fixed?: boolean }) {
  return (
    <div aria-hidden="true" className={`pointer-events-none ${fixed ? "fixed" : "absolute"} inset-0 -z-10 overflow-hidden bg-[#08080a]`}>
      <svg className="absolute inset-0 h-full w-full">
        {STARS.map((s, i) => (
          <circle
            key={i}
            cx={`${s.x.toFixed(2)}%`}
            cy={`${s.y.toFixed(2)}%`}
            r={s.r}
            fill="#fff"
            opacity={s.o}
            className="animate-[dp-cta-twinkle_var(--t)_ease-in-out_infinite] motion-reduce:animate-none"
            style={{ ["--t" as string]: `${s.t.toFixed(1)}s`, animationDelay: `-${s.d.toFixed(1)}s` }}
          />
        ))}
      </svg>
      {/* blue atmosphere (the dashboard accent), strongest at the centre of the horizon */}
      <div className="absolute bottom-[-30vh] left-1/2 h-[90vh] w-[110vw] -translate-x-1/2 bg-[radial-gradient(ellipse_42%_46%_at_50%_64%,rgba(77,124,255,0.42),rgba(45,85,210,0.22)_38%,rgba(25,45,120,0.08)_62%,rgba(8,8,10,0)_80%)]" />
      {/* the planet: a very large circle whose top edge forms the horizon */}
      <div className="absolute left-1/2 top-[calc(100%-min(14.5vh,130px))] h-[448vw] w-[448vw] -translate-x-1/2 rounded-full bg-[#08080a] shadow-[0_-16px_80px_8px_rgba(120,160,255,0.2)]" />
      {/* lit rim, brightest at the centre and fading toward the screen edges */}
      <div className="absolute left-1/2 top-[calc(100%-min(14.5vh,130px))] h-[448vw] w-[448vw] -translate-x-1/2 rounded-full shadow-[inset_0_3px_3px_#fff,inset_0_7px_18px_rgba(220,232,255,0.8)] [mask-image:radial-gradient(ellipse_14%_5%_at_50%_0%,#000_25%,rgba(0,0,0,0.3)_100%)]" />
      {/* light cresting the horizon: a wide cool-blue halo and a small white hot spot */}
      <div className="absolute left-1/2 top-[calc(100%-min(14.5vh,130px)-150px)] h-[220px] w-[64vw] -translate-x-1/2 bg-[radial-gradient(ellipse_50%_50%_at_50%_68%,rgba(170,195,255,0.4),rgba(77,124,255,0.15)_50%,rgba(8,8,10,0)_75%)]" />
      <div className="absolute left-1/2 top-[calc(100%-min(14.5vh,130px)-62px)] h-[124px] w-[34vw] -translate-x-1/2 bg-[radial-gradient(ellipse_50%_50%_at_50%_50%,rgba(255,255,255,0.62),rgba(205,220,255,0.26)_42%,rgba(8,8,10,0)_72%)] blur-[2px]" />
    </div>
  );
}
