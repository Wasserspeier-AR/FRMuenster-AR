import * as THREE from "three";

const rotateSpeed = 0.01; // Radians per pixel dragged
const maxTilt = Math.PI / 2;
const scale = { min: 0.2, max: 5 };

function touchDistance([a, b]) {
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
}

export function bindGestures(el, getPivot) {
  let last = null;
  let lastDist = null;

  // Re-baseline from whatever fingers are down, so lifting or adding a finger never causes a jump
  const sync = (touches) => {
    last =
      touches.length === 1
        ? { x: touches[0].clientX, y: touches[0].clientY }
        : null;
    lastDist = touches.length === 2 ? touchDistance(touches) : null;
  };

  const onTouchChange = (e) => sync(e.touches);
  el.addEventListener("touchstart", onTouchChange, { passive: true });
  el.addEventListener("touchend", onTouchChange, { passive: true });
  el.addEventListener("touchcancel", onTouchChange, { passive: true });

  el.addEventListener(
    "touchmove",
    (e) => {
      const { touches } = e;
      const pivot = getPivot();
      if (!pivot) return sync(touches);

      if (touches.length === 1 && last !== null) {
        const x = touches[0].clientX;
        const y = touches[0].clientY;
        pivot.rotation.y += (x - last.x) * rotateSpeed;
        pivot.rotation.x = THREE.MathUtils.clamp(
          pivot.rotation.x + (y - last.y) * rotateSpeed,
          -maxTilt,
          maxTilt
        );
        last = { x, y };
      } else if (touches.length === 2 && lastDist !== null) {
        const dist = touchDistance(touches);
        pivot.scale.multiplyScalar(dist / lastDist);
        pivot.scale.clampScalar(scale.min, scale.max);
        lastDist = dist;
      }
    },
    { passive: true }
  );
}
