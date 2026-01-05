"use client";
import { Mousewheel, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/pagination";
import styles from "@styles/Skills.module.scss";
import { AcceptedIconNames, IconsProvider } from "@/providers";
import { useScreenSize } from "@/hooks";

export default function SkillsSwiper() {
  const { breakpoints } = useScreenSize();
  const { isMobile } = breakpoints;
  const perPage = isMobile ? 6 : 8;
  const rowsAmount = isMobile ? 3 : 2;
  const colsAmount = perPage / rowsAmount;

  const skills: { name: string; icon: AcceptedIconNames }[] = [
    {
      name: isMobile ? "TypeScript e JS" : "JavaScript/TypeScript",
      icon: "typescriptColored",
    },
    { name: "Expo", icon: "expoColored" },
    { name: "React", icon: "reactColored" },
    { name: "Next.js", icon: "nextColored" },
    { name: "HTML5", icon: "html5Colored" },
    { name: "CSS3", icon: "css3Colored" },
    { name: "Sass", icon: "sassColored" },
    { name: "C#", icon: "csharpColored" },
    { name: "Git", icon: "gitColored" },
    { name: "MariaDB", icon: "mariadbColored" },
    { name: "PHP", icon: "phpColored" },
    { name: "Java", icon: "javaColored" },
    { name: "C/C++", icon: "cColored" },
    { name: "Stripe", icon: "stripeColored" },
    { name: "RevenueCat", icon: "revenuecatColored" },
  ];

  const pages = Array.from(
    {
      length: Math.ceil(skills.length / perPage),
    },
    (_, i) => skills.slice(i * perPage, i * perPage + perPage)
  );

  return (
    <Swiper
      direction="vertical"
      slidesPerView={1}
      spaceBetween={0}
      mousewheel={{
        forceToAxis: true,
        sensitivity: 1,
        releaseOnEdges: true,
      }}
      touchReleaseOnEdges={true}
      touchStartPreventDefault={false}
      pagination={{
        clickable: true,
        dynamicBullets: true,
      }}
      modules={[Mousewheel, Pagination]}
      grabCursor={true}
      speed={600}
      className={styles.skillSwiper}
    >
      {pages.map((group, pageIndex) => (
        <SwiperSlide key={pageIndex} className={styles.slide}>
          <div
            className={styles.skillsGrid}
            style={{
              gridTemplateColumns: `repeat(${colsAmount}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${rowsAmount}, minmax(0, 1fr))`,
            }}
          >
            {group.map((skill, itemIndex) => (
              <div
                key={`${pageIndex}-${itemIndex}`}
                className={styles.skillItem}
              >
                <IconsProvider name={skill.icon} width={50} height={50} />
                <span>{skill.name}</span>
              </div>
            ))}
          </div>
        </SwiperSlide>
      ))}
    </Swiper>
  );
}
