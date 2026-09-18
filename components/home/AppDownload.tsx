import { APP_STORES } from "@/data/site";

// "Get the app" banner shown on the storefront. Reads its links from
// data/site.ts (APP_STORES) — an empty URL hides that badge.
export default function AppDownload() {
  const { playStore, appStore } = APP_STORES;
  if (!playStore && !appStore) return null;

  return (
    <section className="bg-brand text-cream">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 md:grid-cols-2">
        {/* Copy */}
        <div className="text-center md:text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cream/60">
            Odia Kitchen, on the go
          </p>
          <h2 className="mt-3 font-serif text-3xl leading-tight sm:text-4xl">
            Get our app for a faster, tastier order
          </h2>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-cream/80 md:mx-0">
            Browse authentic Odisha flavours, track your orders in real time, and
            never miss a festival special. Download the Odia Kitchen app today.
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-4 md:justify-start">
            {appStore ? (
              <a
                href={appStore}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Download on the App Store"
                className="inline-flex items-center gap-3 rounded-xl bg-black px-5 py-2.5 text-white ring-1 ring-white/15 transition hover:bg-black/85"
              >
                <svg className="h-7 w-7 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M16.5 12.7c0-2 1.6-3 1.7-3-1-1.4-2.4-1.6-3-1.6-1.3-.1-2.5.7-3.1.7-.7 0-1.6-.7-2.7-.7-1.4 0-2.7.8-3.4 2-1.4 2.5-.4 6.2 1 8.2.7 1 1.5 2.1 2.5 2 1-.1 1.4-.6 2.6-.6s1.6.6 2.7.6 1.8-1 2.4-2c.8-1.1 1.1-2.2 1.1-2.3 0 0-2.1-.8-2.1-3.2ZM14.6 6.4c.6-.7 1-1.6.9-2.5-.8 0-1.8.5-2.4 1.2-.5.6-1 1.5-.9 2.4.9.1 1.8-.4 2.4-1.1Z" />
                </svg>
                <span className="text-left leading-none">
                  <span className="block text-[10px] tracking-wide text-white/70">Download on the</span>
                  <span className="block text-lg font-semibold">App Store</span>
                </span>
              </a>
            ) : null}

            {playStore ? (
              <a
                href={playStore}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Get it on Google Play"
                className="inline-flex items-center gap-3 rounded-xl bg-black px-5 py-2.5 text-white ring-1 ring-white/15 transition hover:bg-black/85"
              >
                <svg className="h-7 w-7 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M3.6 2.3c-.3.3-.5.7-.5 1.3v16.8c0 .6.2 1 .5 1.3l.1.1L13 12.6v-.2L3.7 2.2l-.1.1Z" fill="#00D0FF" />
                  <path d="m16.3 15.8-3.3-3.2v-.2l3.3-3.3.1.1 3.9 2.2c1.1.6 1.1 1.7 0 2.3l-4 2.1Z" fill="#FFC800" />
                  <path d="m16.4 15.7-3.4-3.4L3.6 21.7c.4.4 1 .4 1.7 0l11.1-6" fill="#FF3D44" />
                  <path d="M5.3 2.3c-.7-.4-1.3-.4-1.7 0L13 12l3.4-3.4L5.3 2.3Z" fill="#00F076" />
                </svg>
                <span className="text-left leading-none">
                  <span className="block text-[10px] tracking-wide text-white/70">GET IT ON</span>
                  <span className="block text-lg font-semibold">Google Play</span>
                </span>
              </a>
            ) : null}
          </div>
        </div>

        {/* Phone mock */}
        <div className="flex justify-center md:justify-end">
          <div className="relative h-72 w-40 rounded-[2rem] border-[6px] border-cream/20 bg-cream/10 p-2 shadow-2xl sm:h-80 sm:w-44">
            <div className="absolute left-1/2 top-2 h-1.5 w-14 -translate-x-1/2 rounded-full bg-cream/30" />
            <div className="flex h-full w-full flex-col items-center justify-center gap-3 rounded-[1.5rem] bg-brand-dark/40 text-center">
              <span className="text-4xl">🍛</span>
              <p className="px-4 font-serif text-lg leading-tight text-cream">
                Odia <span className="text-[#f06aa8]">Kitchen</span>
              </p>
              <p className="text-[10px] uppercase tracking-widest text-cream/60">
                Authentic. Homemade.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
