"use client";

import { LuArrowUpRight } from "react-icons/lu";

import { AdalineFooterScene } from "@/components/scenes/adaline-scenes";
import { ContactReveal } from "@/components/sections/contact-reveal";
import { portfolioContent } from "@/content/portfolio-content";
import { getResolvedSocialLink, getResumeHref, isExternalUrl } from "@/lib/profile-links";
import { coreSectionLinks } from "@/lib/site";

export function ContactFooterSection() {
  const github = getResolvedSocialLink("github");
  const linkedIn = getResolvedSocialLink("linkedin");
  const resumeHref = getResumeHref();

  const contactLinks = [
    {
      label: "Email",
      href: `mailto:${portfolioContent.identity.contactEmail}`,
      configured: true,
    },
    {
      label: "GitHub",
      href: github.href,
      configured: github.isConfigured,
    },
    {
      label: "LinkedIn",
      href: linkedIn.href,
      configured: linkedIn.isConfigured,
    },
    {
      label: "Resume",
      href: resumeHref,
      configured: true,
    },
  ];

  return (
    <section aria-labelledby="contact-title" className="relative isolate -mt-px overflow-hidden">
      <h2 id="contact-title" className="sr-only">
        Contact
      </h2>

      <AdalineFooterScene
        contactId="contact"
        contact={<ContactReveal />}
        footer={
          <>
            <div className="max-w-sm">
              <p className="text-[clamp(2.3rem,5vw,4.85rem)] font-semibold leading-none tracking-normal text-white">
                Bhargav
              </p>
              <p className="mt-4 max-w-[22rem] text-sm leading-6 text-white/68">
                Software Engineer focused on cloud, platform, and reliable systems.
              </p>
              <p className="py-7 text-xs text-white/52">Copyright 2026 {portfolioContent.identity.name}. All rights reserved.</p>
            </div>

            <div className="flex basis-full flex-wrap gap-12 gap-y-9 pt-10 text-sm md:pt-0 lg:basis-auto xl:gap-28">
              <div className="flex min-w-[8rem] flex-col gap-4">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-white/54">Navigate</p>
                <nav aria-label="Footer section links" className="grid gap-2">
                  {coreSectionLinks.map((item) => (
                    <a key={item.href} href={item.href} className="text-white/78 transition-colors hover:text-white">
                      {item.label}
                    </a>
                  ))}
                </nav>
              </div>

              <div className="flex min-w-[8rem] flex-col gap-4">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-white/54">Contact</p>
                <div className="grid gap-2">
                  {contactLinks.map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      target={isExternalUrl(link.href) ? "_blank" : undefined}
                      rel={isExternalUrl(link.href) ? "noopener noreferrer" : undefined}
                      className="flex items-center gap-2 text-white/78 transition-colors hover:text-white"
                    >
                      <span>{link.label}</span>
                      {!link.configured ? <span className="text-[10px] uppercase tracking-[0.12em] text-white/48">on request</span> : null}
                    </a>
                  ))}
                </div>
              </div>

              <div className="flex min-w-[11rem] flex-col gap-4">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-white/54">Identity</p>
                <div className="grid gap-2 text-white/78">
                  <p className="text-white/92">{portfolioContent.identity.name}</p>
                  <p>{portfolioContent.identity.role}</p>
                  <p>{portfolioContent.identity.currentlyAt}</p>
                  <a
                    href={`mailto:${portfolioContent.identity.contactEmail}`}
                    className="mt-3 inline-flex items-center gap-2 font-semibold text-white underline underline-offset-4"
                  >
                    Start a conversation
                    <LuArrowUpRight size={14} aria-hidden />
                  </a>
                </div>
              </div>
            </div>

            <p className="basis-full pt-10 text-center text-[0.7rem] font-medium uppercase tracking-[0.32em] text-white/40">
              Built with Accuracy and Precision
            </p>
          </>
        }
      />
    </section>
  );
}
