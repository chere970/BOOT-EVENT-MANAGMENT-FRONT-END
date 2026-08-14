import Link from "next/link";
import { Archivo_Black, Space_Grotesk } from "next/font/google";

const headingFont = Archivo_Black({
  subsets: ["latin"],
  weight: "400",
});

const bodyFont = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export default function Home() {
  return (
    <div
      className={`${bodyFont.className} min-h-screen bg-[#f6f1e8] text-[#1f2a37]`}
      style={{
        backgroundImage:
          "radial-gradient(circle at 8% 10%, rgba(239, 113, 52, 0.15), transparent 28%), radial-gradient(circle at 90% 15%, rgba(18, 173, 178, 0.2), transparent 30%), linear-gradient(180deg, #f6f1e8 0%, #fdf7ef 100%)",
      }}
    >
      <main className="mx-auto flex w-full max-w-6xl flex-col px-6 pb-16 pt-8 sm:px-10 lg:px-14">
        <header className="mb-16 flex items-center justify-between rounded-full border border-[#1f2a37]/10 bg-white/80 px-6 py-3 backdrop-blur">
          <p
            className={`${headingFont.className} text-sm tracking-wide text-[#ef7134]`}
          >
            BOOT EVENT
          </p>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/login"
              className="rounded-full border border-[#1f2a37]/20 px-4 py-2 text-sm font-medium transition hover:border-[#1f2a37]/40"
            >
              Sign in
            </Link>
            <Link
              href="/registration"
              className="rounded-full bg-[#1f2a37] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#121a24]"
            >
              Join now
            </Link>
          </div>
        </header>

        <section className="grid items-center gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="mb-4 inline-flex rounded-full border border-[#12adb2]/30 bg-[#12adb2]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#0d7f83]">
              Plan. Share. Celebrate.
            </p>
            <h1
              className={`${headingFont.className} max-w-2xl text-4xl leading-tight text-[#1f2a37] sm:text-5xl lg:text-6xl`}
            >
              Launch events that feel alive from first invite to final check-in.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-[#3d4b5c] sm:text-lg">
              Boot Event Management helps organizers create polished event
              pages, monitor registrations in real time, and keep every attendee
              in the loop.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/create-event"
                className="rounded-full bg-[#ef7134] px-7 py-3 text-center text-sm font-bold uppercase tracking-wide text-white transition hover:bg-[#d95f24]"
              >
                Create an event
              </Link>
              <Link
                href="/events"
                className="rounded-full border border-[#1f2a37]/20 bg-white/70 px-7 py-3 text-center text-sm font-semibold text-[#1f2a37] transition hover:bg-white"
              >
                Explore events
              </Link>
            </div>

            <div className="mt-10 grid max-w-lg grid-cols-3 gap-4">
              <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm">
                <p
                  className={`${headingFont.className} text-2xl text-[#ef7134]`}
                >
                  10K+
                </p>
                <p className="mt-1 text-xs uppercase tracking-wide text-[#526173]">
                  Attendees managed
                </p>
              </div>
              <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm">
                <p
                  className={`${headingFont.className} text-2xl text-[#12adb2]`}
                >
                  320+
                </p>
                <p className="mt-1 text-xs uppercase tracking-wide text-[#526173]">
                  Events launched
                </p>
              </div>
              <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm">
                <p
                  className={`${headingFont.className} text-2xl text-[#1f2a37]`}
                >
                  99.9%
                </p>
                <p className="mt-1 text-xs uppercase tracking-wide text-[#526173]">
                  Check-in uptime
                </p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-8 top-8 h-20 w-20 rounded-full bg-[#ef7134]/25 blur-xl" />
            <div className="absolute -right-6 top-1/2 h-24 w-24 rounded-full bg-[#12adb2]/25 blur-xl" />
            <div className="relative overflow-hidden rounded-3xl border border-[#1f2a37]/10 bg-white p-6 shadow-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6b7a8b]">
                Live Dashboard
              </p>
              <div className="mt-5 rounded-2xl bg-[#1f2a37] p-5 text-white">
                <p className="text-sm uppercase tracking-wide text-white/70">
                  Spring Product Bootcamp
                </p>
                <p className={`${headingFont.className} mt-2 text-3xl`}>
                  1,284 registered
                </p>
                <p className="mt-2 text-sm text-white/70">+112 this week</p>
              </div>

              <div className="mt-5 space-y-3">
                <div className="rounded-xl bg-[#f9fafb] p-4">
                  <p className="text-sm font-semibold">Seat availability</p>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#dbe4ee]">
                    <div className="h-full w-4/5 rounded-full bg-[#12adb2]" />
                  </div>
                  <p className="mt-2 text-xs text-[#637286]">80% filled</p>
                </div>
                <div className="rounded-xl bg-[#f9fafb] p-4">
                  <p className="text-sm font-semibold">Organizer tasks</p>
                  <p className="mt-1 text-xs text-[#637286]">
                    8 pending tasks in your workflow
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
