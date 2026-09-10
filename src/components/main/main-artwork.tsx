import { HeroMotion } from "./hero-motion";
import { heroScenes } from "./hero-scenes.generated";
import "./hero-motion.css";

export function MainArtwork() {
  return (
    <HeroMotion>
      {heroScenes.map((scene) => (
        <div
          aria-hidden="true"
          className={`hero-scene hero-scene-${scene.width}`}
          // Trusted, checked-in Figma vectors; never interpolate user HTML here.
          dangerouslySetInnerHTML={{ __html: scene.markup }}
          key={scene.width}
        />
      ))}
    </HeroMotion>
  );
}
