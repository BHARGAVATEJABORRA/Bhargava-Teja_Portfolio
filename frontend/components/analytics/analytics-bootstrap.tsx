import Script from "next/script";

const gaId = process.env.NEXT_PUBLIC_GA_ID;

export function AnalyticsBootstrap() {
  return (
    <>
      <Script id="data-layer-bootstrap" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];`}
      </Script>
      {gaId ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            strategy="afterInteractive"
          />
          <Script id="ga-gtag" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              window.gtag = gtag;
              gtag('js', new Date());
              gtag('config', '${gaId}', { anonymize_ip: true });
            `}
          </Script>
        </>
      ) : null}
    </>
  );
}
