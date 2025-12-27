declare module "*.module.scss" {
  const classes: { [key: string]: string };
  export default classes;
}

declare module "*.module.css" {
  const classes: { [key: string]: string };
  export default classes;
}

declare module "*.scss" {
  const content: { [className: string]: string };
  export default content;
}

declare module "*.css" {
  const content: { [className: string]: string };
  export default content;
}
// Swiper CSS modules
declare module 'swiper/css' {
  const content: string;
  export default content;
}

declare module 'swiper/css/pagination' {
  const content: string;
  export default content;
}

declare module 'swiper/css/navigation' {
  const content: string;
  export default content;
}

declare module 'swiper/css/autoplay' {
  const content: string;
  export default content;
}

declare module 'swiper/css/scrollbar' {
  const content: string;
  export default content;
}

declare module 'swiper/css/effect-fade' {
  const content: string;
  export default content;
}

declare module 'swiper/css/effect-cube' {
  const content: string;
  export default content;
}

declare module 'swiper/css/effect-flip' {
  const content: string;
  export default content;
}

declare module 'swiper/css/effect-coverflow' {
  const content: string;
  export default content;
}