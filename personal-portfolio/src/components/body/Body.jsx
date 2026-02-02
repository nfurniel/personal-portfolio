import Antigravity from "./Antigravity";
import LogoLoop from "./LogoLoop";
import {
  SiReact,
  SiNextdotjs,
  SiTypescript,
  SiTailwindcss,
} from "react-icons/si";

export default function Body() {
  const techLogos = [
    { node: <SiReact />, title: "React", href: "https://react.dev" },
    { node: <SiNextdotjs />, title: "Next.js", href: "https://nextjs.org" },
    {
      node: <SiTypescript />,
      title: "TypeScript",
      href: "https://www.typescriptlang.org",
    },
    {
      node: <SiTailwindcss />,
      title: "Tailwind CSS",
      href: "https://tailwindcss.com",
    },
  ];

  // Alternative with image sources
  const imageLogos = [
    {
      src: "/logos/company1.png",
      alt: "Company 1",
      href: "https://company1.com",
    },
    {
      src: "/logos/company2.png",
      alt: "Company 2",
      href: "https://company2.com",
    },
    {
      src: "/logos/company3.png",
      alt: "Company 3",
      href: "https://company3.com",
    },
  ];
  return (
    <>
      <div style={{ width: "100%", height: "400px", position: "relative" }}>
        <Antigravity
          count={300}
          magnetRadius={6}
          ringRadius={7}
          waveSpeed={0.4}
          waveAmplitude={1}
          particleSize={1.5}
          lerpSpeed={0.05}
          color="#5227FF"
          autoAnimate
          particleVariance={1}
          rotationSpeed={0}
          depthFactor={1}
          pulseSpeed={3}
          particleShape="capsule"
          fieldStrength={10}
        />
      </div>
      <div
        style={{ height: "200px", position: "relative", overflow: "hidden" }}
      >
        {/* Basic horizontal loop */}
        <LogoLoop
          logos={techLogos}
          speed={100}
          direction="left"
          logoHeight={60}
          gap={60}
          hoverSpeed={0}
          scaleOnHover
          fadeOut
          fadeOutColor="#ffffff"
          ariaLabel="Technology partners"
        />

        {/* Vertical loop with deceleration on hover */}
        <LogoLoop
          logos={techLogos}
          speed={100}
          direction="left"
          logoHeight={60}
          gap={60}
          hoverSpeed={0}
          fadeOut
          useCustomRender={false}
        />
      </div>
    </>
  );
}
