import {
  DEFAULT_DOT_LAYOUT,
  DOT_LAYOUT_HEIGHT,
  DOT_LAYOUT_WIDTH,
  generateDotPositions,
  getYearLabelPosition
} from "@/lib/dot-layout";

export function LifePoster() {
  const points = generateDotPositions(DEFAULT_DOT_LAYOUT);

  const yearLabels = Array.from({ length: 100 }, (_, rowIndex) => {
    const { x, y } = getYearLabelPosition(rowIndex, DEFAULT_DOT_LAYOUT);
    const year = String(rowIndex + 1).padStart(2, "0");
    return { rowIndex, x, y, year };
  });

  return (
    <main className="min-h-screen bg-[#e3352d] px-4 py-6 text-[#fff8f0] md:px-8 md:py-10">
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.45em] text-white/70">Poster</p>
            <h1 className="mt-2 text-3xl font-black uppercase tracking-tight md:text-5xl">
              Life Poster
            </h1>
          </div>

          <a
            className="rounded-full border border-white/25 px-5 py-3 text-sm uppercase tracking-[0.25em] transition hover:bg-white/10"
            href="/"
          >
            Volver
          </a>
        </div>

        <div className="overflow-auto rounded-[2rem] border border-white/15 bg-[#e3352d] p-4 shadow-[0_30px_80px_rgba(0,0,0,0.25)] md:p-6">
          <div className="mx-auto w-full max-w-[1200px]">
            <div
              className="relative w-full"
              style={{ aspectRatio: `${DOT_LAYOUT_WIDTH} / ${DOT_LAYOUT_HEIGHT}` }}
            >
              <div className="absolute inset-0 rounded-[1.75rem] border border-white/10 bg-[#ea362e]" />

              <header className="absolute left-[3%] right-[3%] top-[2.3%] flex items-center justify-between text-white">
                <span className="text-5xl font-light leading-none">+</span>
                <span className="text-4xl font-black tracking-[-0.08em]">***</span>
                <p
                  className="flex-1 px-6 text-center text-[clamp(16px,1.8vw,28px)] font-black uppercase leading-none tracking-tight"
                  style={{ fontFamily: '"Arial Black", "Avenir Next Condensed", sans-serif' }}
                >
                  Each circle is a week of your life /// move on
                </p>
                <span className="text-4xl font-black tracking-[-0.08em]">***</span>
                <span className="text-5xl font-light leading-none">+</span>
              </header>

              <div className="absolute bottom-[4.2%] left-[3%] right-[3%] flex items-center justify-between text-white">
                <span className="text-5xl font-light leading-none">+</span>
                <p
                  className="px-6 text-center text-[clamp(14px,1.6vw,24px)] font-black uppercase leading-none tracking-tight"
                  style={{ fontFamily: '"Arial Black", "Avenir Next Condensed", sans-serif' }}
                >
                  Life dot calendar /// health insurance not included
                </p>
                <span className="text-5xl font-light leading-none">+</span>
              </div>

              <div
                className="absolute bottom-[8.5%] left-[4.2%] top-[8.5%] flex items-center justify-center"
                style={{ width: "22%" }}
              >
                <div
                  className="flex h-full items-center justify-center text-white"
                  style={{
                    writingMode: "vertical-rl",
                    transform: "rotate(180deg)",
                    fontFamily: '"Arial Black", "Avenir Next Condensed", sans-serif'
                  }}
                >
                  <span className="text-[clamp(54px,7vw,138px)] font-black uppercase leading-[0.84] tracking-[-0.08em]">
                    Don&apos;t waste your time making your days count
                  </span>
                </div>
              </div>

              <svg
                aria-label="Life poster"
                className="absolute inset-0 h-full w-full"
                viewBox={`0 0 ${DOT_LAYOUT_WIDTH} ${DOT_LAYOUT_HEIGHT}`}
              >
                {points.map((point) => (
                  <circle
                    cx={point.x}
                    cy={point.y}
                    fill="#fff8f0"
                    key={point.weekIndex}
                    r={DEFAULT_DOT_LAYOUT.pointRadius}
                  />
                ))}

                {yearLabels.map((label) => (
                  <g key={label.rowIndex}>
                    <text
                      fill="#fff8f0"
                      fontFamily={'"Arial Black", "Avenir Next Condensed", sans-serif'}
                      fontSize="17"
                      fontWeight="900"
                      textAnchor="start"
                      x={label.x}
                      y={label.y + 5}
                    >
                      {label.year}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
