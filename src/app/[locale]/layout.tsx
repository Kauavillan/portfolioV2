import { Rajdhani } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { ScreenSizeProvider } from "@/providers";
import "@/styles/globals.scss";

const rajdhani = Rajdhani({
  subsets: ["latin"],
  variable: "--font-rajdhani",
  weight: ["300", "400", "500", "600", "700"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className={rajdhani.className}>
      <body>
        {/*className={`${geistSans.variable} ${geistMono.variable}`} />*/}
        <ScreenSizeProvider>
          <NextIntlClientProvider>{children}</NextIntlClientProvider>
        </ScreenSizeProvider>
      </body>
    </html>
  );
}
