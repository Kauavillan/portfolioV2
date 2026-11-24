import { JetBrains_Mono, Manrope, Unbounded } from "next/font/google";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { PRE_HYDRATION_SCRIPT } from "@lib/pre-hydration";
import { ScreenSizeProvider } from "@/providers";
import AnchorController from "@controllers/AnchorController";
import Intro from "@controllers/Intro";
import RevealController from "@controllers/RevealController";
import WorldCanvas from "@controllers/WorldCanvas";
import ScrollProvider from "@controllers/ScrollProvider";
import SoundProvider from "@controllers/SoundProvider";
import SkipLink from "@components/shell/SkipLink";
import WorldSlot from "@components/shell/WorldSlot";
import "@/styles/globals.scss";

const fontDisplay = Unbounded({
  subsets: ["latin", "latin-ext"],
  variable: "--font-display",
  display: "swap",
});
const fontBody = Manrope({
  subsets: ["latin", "latin-ext"],
  variable: "--font-body",
  display: "swap",
});
const fontMono = JetBrains_Mono({
  subsets: ["latin", "latin-ext"],
  variable: "--font-mono",
  display: "swap",
});

type LayoutProps = { params: Promise<{ locale: string }> };

// Static rendering: `/` (en) and `/pt` are generated at build time.
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: LayoutProps): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "Meta" });
  return { title: t("title"), description: t("description") };
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{ children: React.ReactNode } & LayoutProps>) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    // `suppressHydrationWarning`: the pre-hydration script adds `motion` /
    // `is-intro` to <html> before React hydrates.
    <html
      lang={locale}
      className={`${fontDisplay.variable} ${fontBody.variable} ${fontMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: PRE_HYDRATION_SCRIPT }} />
      </head>
      <body>
        <ScreenSizeProvider>
          <NextIntlClientProvider>
            <ScrollProvider>
              <SoundProvider>
                <SkipLink />
                <WorldSlot />
                <Intro />
                {children}
                <AnchorController />
                <RevealController />
                <WorldCanvas />
              </SoundProvider>
            </ScrollProvider>
          </NextIntlClientProvider>
        </ScreenSizeProvider>
      </body>
    </html>
  );
}
