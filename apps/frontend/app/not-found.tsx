


"use client";

import { useRouter } from "next/navigation";

export default function NotFound() {
    const router = useRouter();

    const handleGoBack = () => {
        if (typeof window !== "undefined" && window.history.length > 1) {
            router.back();
        } else {
            router.push("/");
        }
    };

    return (
        <>
            {/* Editorial Didone font import with local fallbacks */}
            <style>{`
        @import url("https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap");

        .font-didone {
          font-family: "Playfair Display", Didot, "Bodoni MT", "Cinzel", Georgia, serif;
        }

        .font-body-sans {
          font-family: var(--font-sans, "Inter", system-ui, -apple-system, sans-serif);
        }
      `}</style>

            <main
                className="min-h-screen w-full bg-[#FFFFFF] text-[#1A1A1A] flex flex-col justify-between items-center relative overflow-hidden select-none"
                style={{ WebkitFontSmoothing: "antialiased", MozOsxFontSmoothing: "grayscale" }}
            >
                {/* Subtle noise canvas overlay (3% opacity per design system) */}
                <div
                    className="absolute inset-0 pointer-events-none opacity-[0.03] z-0"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                    }}
                    aria-hidden="true"
                />

                {/* ── DESKTOP VIEW (>= md screens) ── */}
                {/* Massive 404 spanning viewport with perfectly balanced, symmetrical glyph spacing and no overlaps */}
                <section className="hidden md:flex flex-1 w-full max-w-[1400px] mx-auto items-center justify-center px-6 lg:px-12 relative my-auto">
                    <div className="relative w-full aspect-[1200/580] max-h-[82vh] flex items-center justify-center">
                        {/* Vector 404 Artwork with balanced spacing on both 4s */}
                        <svg
                            viewBox="0 0 1200 580"
                            className="w-full h-full select-none overflow-visible"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            aria-hidden="true"
                        >
                            {/* Left '4' — moved right to eliminate excess gap */}
                            <g id="left-four">
                                {/* Vertical stem with bracketed baseline serif */}
                                <path
                                    d="M 255 120 L 293 120 L 293 475 C 293 505 307 516 333 516 L 333 520 L 215 520 L 215 516 C 241 516 255 505 255 475 Z"
                                    fill="#1A1A1A"
                                />
                                {/* Diagonal outer stroke & apex */}
                                <path
                                    d="M 255 120 L 95 412 L 116 412 L 255 152 Z"
                                    fill="#1A1A1A"
                                />
                                {/* Horizontal crossbar extending to x=365 (balanced 18px gap to '0') */}
                                <path
                                    d="M 95 404 L 365 404 L 365 412 L 95 412 Z"
                                    fill="#1A1A1A"
                                />
                            </g>

                            {/* Center '0' with generous 404px wide inner counter */}
                            <g id="center-zero">
                                <path
                                    fillRule="evenodd"
                                    clipRule="evenodd"
                                    d="M 600 60 C 738.07 60 850 162.97 850 290 C 850 417.03 738.07 520 600 520 C 461.93 520 350 417.03 350 290 C 350 162.97 461.93 60 600 60 Z M 600 64 C 488.44 64 398 165.18 398 290 C 398 414.82 488.44 516 600 516 C 711.56 516 802 414.82 802 290 C 802 165.18 711.56 64 600 64 Z"
                                    fill="#1A1A1A"
                                />
                            </g>

                            {/* Right '4' — repositioned to start at x=835 (balanced 18px gap to '0', zero overlap) */}
                            <g id="right-four">
                                {/* Vertical stem with bracketed baseline serif */}
                                <path
                                    d="M 995 120 L 1033 120 L 1033 475 C 1033 505 1047 516 1073 516 L 1073 520 L 955 520 L 955 516 C 981 516 995 505 995 475 Z"
                                    fill="#1A1A1A"
                                />
                                {/* Diagonal stroke starting at x=835 (clear of the '0' curve) */}
                                <path
                                    d="M 995 120 L 835 412 L 856 412 L 995 152 Z"
                                    fill="#1A1A1A"
                                />
                                {/* Horizontal crossbar extending from x=835 to x=1105 */}
                                <path
                                    d="M 835 404 L 1105 404 L 1105 412 L 835 412 Z"
                                    fill="#1A1A1A"
                                />
                            </g>
                        </svg>

                        {/* Desktop Center Text framed inside the spacious '0' aperture */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-20 pointer-events-none px-4">
                            <div className="pointer-events-auto flex flex-col items-center max-w-[280px] lg:max-w-[320px]">
                                <h1
                                    className="font-didone text-[#1A1A1A] text-[26px] lg:text-[30px] xl:text-[32px] font-normal tracking-[-0.02em] leading-tight select-text whitespace-nowrap"
                                >
                                    Page Not Available
                                </h1>

                                <p
                                    className="font-body-sans text-[#666666] text-[13px] lg:text-[14px] leading-relaxed mt-2.5 max-w-[240px] lg:max-w-[260px] select-text"
                                >
                                    Sorry, this page isn&apos;t available anymore or an error occured.
                                </p>

                                <button
                                    type="button"
                                    onClick={handleGoBack}
                                    className="mt-6 px-8 py-2.5 rounded-full border border-[#1A1A1A] text-[#1A1A1A] bg-white hover:bg-[#1A1A1A] hover:text-white font-body-sans text-[13px] lg:text-[14px] font-medium tracking-[0.02em] transition-all duration-300 ease-out active:scale-95 cursor-pointer shadow-xs"
                                >
                                    Go Back
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── MOBILE VIEW (< md screens) ── */}
                {/* Centered text message + bottom anchored massive 404 numbers */}
                <section className="md:hidden flex-1 w-full flex flex-col justify-between px-6 pt-12 pb-0">
                    {/* Centered message in upper-mid portion */}
                    <div className="my-auto flex flex-col items-center text-center max-w-[320px] mx-auto py-8">
                        <h1 className="font-didone text-[#1A1A1A] text-[26px] sm:text-[28px] font-normal tracking-[-0.02em] leading-tight select-text">
                            Page Not Available
                        </h1>

                        <p className="font-body-sans text-[#666666] text-[13px] leading-relaxed mt-2.5 max-w-[260px] select-text">
                            Sorry, this page isn&apos;t available anymore or an error occured.
                        </p>

                        <button
                            type="button"
                            onClick={handleGoBack}
                            className="mt-6 px-8 py-2.5 rounded-full border border-[#1A1A1A] text-[#1A1A1A] bg-white hover:bg-[#1A1A1A] hover:text-white font-body-sans text-[13px] font-medium tracking-[0.02em] transition-all duration-300 ease-out active:scale-95 cursor-pointer shadow-xs"
                        >
                            Go Back
                        </button>
                    </div>

                    {/* Bottom anchored 404 SVG numbers with balanced spacing */}
                    <div className="w-full flex items-end justify-center select-none overflow-hidden pb-1">
                        <svg
                            viewBox="0 0 400 170"
                            className="w-full max-w-[420px] h-auto max-h-[38vh] overflow-visible"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            aria-hidden="true"
                        >
                            {/* Left '4' */}
                            <g id="mobile-left-four">
                                <path
                                    d="M 94 25 L 108 25 L 108 148 C 108 156 112 159 122 159 L 122 161 L 80 161 L 80 159 C 90 159 94 156 94 148 Z"
                                    fill="#1A1A1A"
                                />
                                <path
                                    d="M 94 25 L 24 125 L 32 125 L 94 36 Z"
                                    fill="#1A1A1A"
                                />
                                <path
                                    d="M 24 121 L 136 121 L 136 125 L 24 125 Z"
                                    fill="#1A1A1A"
                                />
                            </g>

                            {/* Center '0' */}
                            <g id="mobile-center-zero">
                                <path
                                    fillRule="evenodd"
                                    clipRule="evenodd"
                                    d="M 200 12 C 238 12 268 48 268 90 C 268 132 238 168 200 168 C 162 168 132 132 132 90 C 132 48 162 12 200 12 Z M 200 14 C 170 14 148 49 148 90 C 148 131 170 166 200 166 C 230 166 252 131 252 90 C 252 49 230 14 200 14 Z"
                                    fill="#1A1A1A"
                                />
                            </g>

                            {/* Right '4' */}
                            <g id="mobile-right-four">
                                <path
                                    d="M 334 25 L 348 25 L 348 148 C 348 156 352 159 362 159 L 362 161 L 320 161 L 320 159 C 330 159 334 156 334 148 Z"
                                    fill="#1A1A1A"
                                />
                                <path
                                    d="M 334 25 L 264 125 L 272 125 L 334 36 Z"
                                    fill="#1A1A1A"
                                />
                                <path
                                    d="M 264 121 L 376 121 L 376 125 L 264 125 Z"
                                    fill="#1A1A1A"
                                />
                            </g>
                        </svg>
                    </div>
                </section>
            </main>
        </>
    );
}
