(() => {
  const root = document.documentElement;
  const year = document.querySelector("#year");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  let frame = 0;
  let pointerX = 0;
  let pointerY = 0;

  if (year) {
    year.textContent = String(new Date().getFullYear());
  }

  const resetPointer = () => {
    window.cancelAnimationFrame(frame);
    frame = 0;
    root.style.setProperty("--parallax-x", "0px");
    root.style.setProperty("--parallax-y", "0px");
  };

  const syncMotion = () => {
    root.dataset.motion = document.hidden || reducedMotion.matches ? "paused" : "running";
    resetPointer();
  };

  window.addEventListener("pointermove", (event) => {
    if (!finePointer.matches || reducedMotion.matches || document.hidden || event.pointerType === "touch") {
      return;
    }

    pointerX = (event.clientX / window.innerWidth - 0.5) * 12;
    pointerY = (event.clientY / window.innerHeight - 0.5) * 12;

    // Schedule only while the pointer moves; the artwork has no continuous JS render loop.
    if (!frame) {
      frame = window.requestAnimationFrame(() => {
        root.style.setProperty("--parallax-x", pointerX.toFixed(2) + "px");
        root.style.setProperty("--parallax-y", pointerY.toFixed(2) + "px");
        frame = 0;
      });
    }
  }, { passive: true });

  window.addEventListener("blur", resetPointer);
  window.addEventListener("resize", resetPointer, { passive: true });
  document.addEventListener("mouseleave", resetPointer);
  document.addEventListener("visibilitychange", syncMotion);
  reducedMotion.addEventListener("change", syncMotion);
  finePointer.addEventListener("change", resetPointer);
  syncMotion();
})();
