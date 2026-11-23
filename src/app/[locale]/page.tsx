import { setRequestLocale } from "next-intl/server";
import CaseDialogs from "@components/case/CaseDialogs";
import About from "@components/sections/About";
import Contact from "@components/sections/Contact";
import Hero from "@components/sections/Hero";
import Journey from "@components/sections/Journey";
import Skills from "@components/sections/Skills";
import Work from "@components/sections/Work";
import Footer from "@components/shell/Footer";
import Hud from "@components/shell/Hud";
import Locator from "@components/shell/Locator";
import NavRail from "@components/shell/NavRail";

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Hud />
      <NavRail />
      <Locator />
      <main id="main" tabIndex={-1}>
        <Hero />
        <About />
        <Work />
        <Skills />
        <Journey />
        <Contact />
      </main>
      <Footer />
      <CaseDialogs />
    </>
  );
}
