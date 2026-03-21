import { Rajdhani } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { ScreenSizeProvider } from "@/providers";
import "@/styles/globals.scss";
import { Metadata } from "next";

const rajdhani = Rajdhani({
  subsets: ["latin"],
  variable: "--font-rajdhani",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Kauã Villa Nova - Portfolio",
  description:
    "Welcome to my portfolio! I'm a passionate software developer with experience in web development, mobile apps, and more. Explore my projects and skills to see how I can contribute to your next venture.",
};

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
