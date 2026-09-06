import Script from "next/script";

const gaId = process.env.NEXT_PUBLIC_GA_ID?.trim();

export function AnalyticsBootstrap({ nonce }: { nonce?: string }) {
  if (!gaId || !/^G-[A-Z0-9]+$/.test(gaId)) {
    return null;
  }

  return (
    <>
      <Script nonce={nonce} id="data-layer-bootstrap" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];`}
      </Script>
      <Script
        nonce={nonce}
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script nonce={nonce} id="ga-gtag" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${gaId}', { anonymize_ip: true });
        `}
      </Script>
    </>
  );
}
