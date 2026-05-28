import Image from "next/image";

import { AvailabilityStatus } from "@/components/sections/control-center/availability-status";
import { FocusTrack } from "@/components/sections/control-center/focus-track";
import { GitHubContributions } from "@/components/sections/control-center/github-contributions";
import { GlobeWidget } from "@/components/sections/control-center/globe-widget";
import { LocalTimeClock } from "@/components/sections/control-center/local-time-clock";
import { LocationCard } from "@/components/sections/control-center/location-card";
import { SpotifyWidget } from "@/components/sections/control-center/spotify-widget";
import { WeatherWidget } from "@/components/sections/control-center/weather-widget";
import { SectionShell } from "@/components/ui/section-shell";
import { portfolioContent } from "@/content/portfolio-content";

const controlCenterRoomSrc =
  "/adaline-scenes/hero-sequence/desktop/graded_4K_100_gm_50_1080_3-281.jpg";

function ControlCenterOverview() {
  return (
    <div className="overflow-hidden rounded-[2rem] border border-[rgba(255,255,255,0.54)] bg-[rgba(255,251,245,0.66)] p-5 shadow-[0_24px_70px_rgba(87,60,29,0.14)] backdrop-blur-[18px] sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[rgba(40,90,94,0.9)]">
            Control Center
          </p>
          <h2 id="control-center-title" className="text-balance text-2xl font-semibold tracking-tight text-[#3c2b1d] sm:text-3xl">
            Live engineering snapshot, not a placeholder frame.
          </h2>
          <p className="max-w-2xl text-sm leading-relaxed text-[rgba(68,65,59,0.84)] sm:text-base">
            The hero now lands on a real portfolio control center with current availability, location, activity, and recruiter-facing signals.
          </p>
        </div>

        <div className="w-full max-w-sm rounded-[1.5rem] border border-[rgba(188,152,112,0.32)] bg-[rgba(255,247,238,0.78)] px-4 py-3 shadow-[0_12px_32px_rgba(112,74,37,0.1)]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[rgba(40,90,94,0.9)]">
            Current Role
          </p>
          <p className="mt-1 text-sm font-semibold text-[#3c2b1d]">
            {portfolioContent.identity.role} at {portfolioContent.identity.currentlyAt}
          </p>
          <p className="mt-1 text-xs text-[rgba(68,65,59,0.76)]">
            Recruiter-first highlights backed by live widgets instead of the static product screenshot.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {portfolioContent.controlCenter.modules.map((module) => (
          <div
            key={module.title}
            className="rounded-[1.35rem] border border-[rgba(188,152,112,0.28)] bg-[rgba(255,250,244,0.82)] px-4 py-4 shadow-[0_12px_28px_rgba(112,74,37,0.08)]"
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[rgba(40,90,94,0.9)]">
              {module.title}
            </p>
            <p className="mt-2 text-sm font-semibold text-[#3c2b1d]">{module.detail}</p>
            <p className="mt-2 text-xs leading-relaxed text-[rgba(68,65,59,0.78)]">{module.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ControlCenterSection() {
  const isSpotifyConfigured = Boolean(
    process.env.SPOTIFY_CLIENT_ID?.trim() &&
      process.env.SPOTIFY_CLIENT_SECRET?.trim() &&
      process.env.SPOTIFY_REFRESH_TOKEN?.trim(),
  );
  const { location, timezone } = portfolioContent.identity.controlCenter;

  return (
    <SectionShell
      id="control-center"
      labelledBy="control-center-title"
      className="items-start bg-[#f2ebde] py-0 sm:py-0"
      animateOnView={false}
    >
      <div className="w-full pb-20 pt-4 sm:pb-24 sm:pt-6">
        <div className="relative overflow-hidden rounded-[2rem] border border-[rgba(188,152,112,0.36)] bg-[#f4ede2] shadow-[0_34px_90px_rgba(108,76,40,0.18)] sm:rounded-[2.5rem]">
          <div className="relative w-full min-h-[40rem] sm:min-h-[48rem]">
            <Image
              src={controlCenterRoomSrc}
              alt=""
              fill
              sizes="(min-width: 1280px) 1200px, 100vw"
              className="object-cover object-center"
              priority={false}
            />

            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(255,248,235,0.72)_0%,rgba(255,248,235,0.22)_22%,transparent_58%),linear-gradient(180deg,rgba(255,251,246,0.22)_0%,rgba(255,251,246,0.08)_26%,rgba(82,55,31,0.24)_100%)]" />
            <div className="absolute left-[2.5%] top-[64%] h-[20%] w-[12%] rounded-full bg-[radial-gradient(circle,rgba(255,196,120,0.5)_0%,rgba(255,196,120,0.12)_34%,transparent_72%)] blur-[26px]" />
            <div className="absolute right-[1.5%] top-[19%] h-[26%] w-[20%] rounded-full bg-[radial-gradient(circle,rgba(255,244,222,0.82)_0%,rgba(255,244,222,0.18)_28%,transparent_72%)] blur-[40px]" />
            <div className="absolute inset-x-[16%] bottom-[5.5%] h-[12%] rounded-full bg-[radial-gradient(circle,rgba(112,74,37,0.22)_0%,rgba(112,74,37,0.08)_34%,transparent_72%)] blur-[36px]" />

            <div className="relative z-10 px-4 py-8 sm:px-6 sm:py-10 lg:px-10 lg:py-12">
              <div className="mx-auto max-w-6xl space-y-4 sm:space-y-5">
                <ControlCenterOverview />

                <div className="grid gap-4 xl:grid-cols-[minmax(0,1.16fr)_minmax(0,0.84fr)]">
                  <div className="grid gap-4">
                    <GitHubContributions />

                    <div className="grid gap-4 sm:grid-cols-2">
                      <FocusTrack />
                      <SpotifyWidget isConfigured={isSpotifyConfigured} />
                    </div>
                  </div>

                  <div className="grid gap-4">
                    <GlobeWidget markerLocation={[32.7767, -96.797]} label={location} sublabel={timezone} />

                    <div className="grid gap-4 sm:grid-cols-2">
                      <AvailabilityStatus />
                      <LocationCard />
                      <LocalTimeClock />
                      <WeatherWidget />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
