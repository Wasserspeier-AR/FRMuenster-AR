import { initI18n } from './i18n.js';
initI18n();

//Slider animation
const slider = document.getElementById("manual-slider");
const dots = document.querySelectorAll("#manual-dots span");

if (slider && dots.length > 0) {
  slider.addEventListener("scroll", () => {
    const slideWidth = slider.clientWidth;
    const currentSlide = Math.round(
      slider.scrollLeft / slideWidth
    );
    
    dots.forEach((dot, index) => {
      if (index === currentSlide) {
        dot.classList.remove("bg-stone-300");
        dot.classList.add("bg-[rgb(118,23,23)]");
      } else {
        dot.classList.remove("bg-[rgb(118,23,23)]");
        dot.classList.add("bg-stone-300");
      }
    });

  });
}