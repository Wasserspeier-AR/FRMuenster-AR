import { initI18n } from "./i18n.js";
initI18n();

//Slider animation
const slider = document.getElementById("manual-slider");
const dots = document.querySelectorAll("#manual-dots span");

if (slider && dots.length > 0) {
  slider.addEventListener("scroll", () => {
    const slideWidth = slider.clientWidth;
    const currentSlide = Math.round(slider.scrollLeft / slideWidth);

    dots.forEach((dot, index) => {
      dot.classList.toggle("bg-brand", index === currentSlide);
      dot.classList.toggle("bg-stone-300", index !== currentSlide);
    });
  });
}
