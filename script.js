(() => {
  const canvas = document.querySelector(".star-canvas");

  if (!canvas) {
    return;
  }

  const context = canvas.getContext("2d");

  if (!context) {
    return;
  }

  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const compactQuery = window.matchMedia("(max-width: 640px)");
  const hoverQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
  const colors = ["210, 228, 255", "242, 247, 255", "154, 197, 255", "182, 214, 255"];
  const pointer = { active: false, x: 0, y: 0, vx: 0, vy: 0 };
  let stars = [];
  let width = 0;
  let height = 0;
  let frame = 0;
  let paused = false;
  let previousTime = 0;

  const clamp = (value, minimum, maximum) => Math.min(Math.max(value, minimum), maximum);

  const getStarPoint = () => {
    let x = Math.random() * width;
    let y = Math.random() * height;

    if (Math.random() < 0.72) {
      const edge = Math.pow(Math.random(), 2.1) * 0.42;
      const side = Math.floor(Math.random() * 4);

      if (side === 0) {
        x = width * edge;
      } else if (side === 1) {
        x = width * (1 - edge);
      } else if (side === 2) {
        y = height * edge;
      } else {
        y = height * (1 - edge);
      }
    }

    return { x, y };
  };

  const isNearCopy = (x, y) => {
    return Math.abs(x - width / 2) < width * 0.29 && Math.abs(y - height / 2) < height * 0.22;
  };

  const createStar = () => {
    const point = getStarPoint();
    const depth = 0.18 + Math.pow(Math.random(), 0.68) * 0.82;
    const nearCopy = isNearCopy(point.x, point.y);
    // More distant pinpoints enrich the field without making bright stars compete with the copy.
    const bright = Math.random() < 0.055 + depth * 0.037;

    return {
      originX: point.x,
      originY: point.y,
      x: point.x,
      y: point.y,
      vx: 0,
      vy: 0,
      driftX: (Math.random() - 0.5) * (0.012 + depth * 0.052),
      driftY: (Math.random() - 0.5) * (0.012 + depth * 0.052),
      wobble: 0.8 + depth * 8,
      wobbleSpeed: 0.00025 + Math.random() * 0.00055,
      phase: Math.random() * Math.PI * 2,
      pulseSpeed: 0.00055 + Math.random() * 0.0011,
      radius: (bright ? 0.75 : 0.18) + depth * (bright ? 1.15 : 0.62),
      alpha: (bright ? 0.58 : 0.22) + depth * (bright ? 0.34 : 0.4),
      color: colors[Math.floor(Math.random() * colors.length)],
      spin: Math.random() < 0.5 ? -1 : 1,
      copyWeight: nearCopy ? 0.26 : 1,
    };
  };

  const wrapOrigin = (star) => {
    const buffer = 28;

    if (star.originX < -buffer) {
      star.originX = width + buffer;
      star.x = star.originX;
    } else if (star.originX > width + buffer) {
      star.originX = -buffer;
      star.x = star.originX;
    }

    if (star.originY < -buffer) {
      star.originY = height + buffer;
      star.y = star.originY;
    } else if (star.originY > height + buffer) {
      star.originY = -buffer;
      star.y = star.originY;
    }
  };

  const resetCanvas = () => {
    const bounds = canvas.getBoundingClientRect();
    const scale = Math.min(window.devicePixelRatio || 1, 2);

    width = Math.max(1, bounds.width);
    height = Math.max(1, bounds.height);
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    context.setTransform(scale, 0, 0, scale, 0, 0);

    const minimum = compactQuery.matches ? 300 : 560;
    const maximum = compactQuery.matches ? 440 : 820;
    const targetCount = Math.max(minimum, Math.min(maximum, Math.round((width * height) / 1950)));

    stars = Array.from({ length: targetCount }, createStar);
  };

  const update = (delta, time) => {
    const interactionRadius = compactQuery.matches ? 170 : 290;

    stars.forEach((star) => {
      star.originX += star.driftX * delta;
      star.originY += star.driftY * delta;
      wrapOrigin(star);

      const targetX = star.originX + Math.sin(time * star.wobbleSpeed + star.phase) * star.wobble;
      const targetY = star.originY + Math.cos(time * star.wobbleSpeed * 0.86 + star.phase) * star.wobble;

      star.vx += (targetX - star.x) * 0.0065 * delta;
      star.vy += (targetY - star.y) * 0.0065 * delta;

      if (pointer.active) {
        const dx = star.x - pointer.x;
        const dy = star.y - pointer.y;
        const distance = Math.hypot(dx, dy);

        if (distance > 0 && distance < interactionRadius) {
          const force = Math.pow(1 - distance / interactionRadius, 2);
          const awayX = dx / distance;
          const awayY = dy / distance;
          const orbitX = -awayY * star.spin;
          const orbitY = awayX * star.spin;
          const depthForce = 0.18 + star.radius * 0.24;

          star.vx += (awayX * 0.38 + orbitX * 0.62 + pointer.vx * 0.012) * force * depthForce * delta;
          star.vy += (awayY * 0.38 + orbitY * 0.62 + pointer.vy * 0.012) * force * depthForce * delta;
        }
      }

      star.vx *= Math.pow(0.915, delta);
      star.vy *= Math.pow(0.915, delta);
      star.x += star.vx * delta;
      star.y += star.vy * delta;
    });

    pointer.vx *= Math.pow(0.76, delta);
    pointer.vy *= Math.pow(0.76, delta);
  };

  const draw = (time) => {
    context.clearRect(0, 0, width, height);
    context.fillStyle = "#030609";
    context.fillRect(0, 0, width, height);

    stars.forEach((star) => {
      const pulse = 0.76 + Math.sin(time * star.pulseSpeed + star.phase) * 0.24;
      const alpha = star.alpha * pulse * star.copyWeight;
      const velocity = Math.hypot(star.vx, star.vy);

      if (velocity > 0.35 && star.radius > 0.65) {
        const trail = clamp(velocity * 8, 2, 18);

        context.beginPath();
        context.moveTo(star.x - star.vx * trail, star.y - star.vy * trail);
        context.lineTo(star.x, star.y);
        context.strokeStyle = "rgba(" + star.color + ", " + alpha * 0.32 + ")";
        context.lineWidth = Math.max(0.35, star.radius * 0.42);
        context.stroke();
      }

      context.beginPath();
      context.fillStyle = "rgba(" + star.color + ", " + alpha + ")";

      if (star.radius > 0.92) {
        context.shadowColor = "rgba(" + star.color + ", " + alpha * 0.7 + ")";
        context.shadowBlur = star.radius * 5;
      }

      context.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      context.fill();
      context.shadowBlur = 0;
    });
  };

  const animate = (time) => {
    if (paused || motionQuery.matches) {
      frame = 0;
      return;
    }

    const delta = previousTime ? Math.min(2, (time - previousTime) / 16.67) : 1;

    previousTime = time;
    update(delta, time);
    draw(time);
    frame = window.requestAnimationFrame(animate);
  };

  const start = () => {
    if (!frame && !paused && !motionQuery.matches) {
      previousTime = 0;
      frame = window.requestAnimationFrame(animate);
    }
  };

  const stop = () => {
    if (frame) {
      window.cancelAnimationFrame(frame);
      frame = 0;
    }
  };

  const clearPointer = () => {
    pointer.active = false;
    pointer.vx = 0;
    pointer.vy = 0;
  };

  const onPointerMove = (event) => {
    if (!hoverQuery.matches || event.pointerType === "touch") {
      return;
    }

    const bounds = canvas.getBoundingClientRect();
    const nextX = event.clientX - bounds.left;
    const nextY = event.clientY - bounds.top;

    pointer.vx = clamp(nextX - pointer.x, -32, 32);
    pointer.vy = clamp(nextY - pointer.y, -32, 32);
    pointer.x = nextX;
    pointer.y = nextY;
    pointer.active = true;
  };

  resetCanvas();
  draw(0);
  start();

  window.addEventListener("resize", () => {
    resetCanvas();
    draw(0);
  });
  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("blur", clearPointer);
  document.addEventListener("mouseleave", clearPointer);
  document.addEventListener("copy", (event) => event.preventDefault());
  document.addEventListener("cut", (event) => event.preventDefault());
  document.addEventListener("dragstart", (event) => event.preventDefault());
  document.addEventListener("visibilitychange", () => {
    paused = document.hidden;

    if (paused) {
      stop();
    } else {
      start();
    }
  });
  motionQuery.addEventListener("change", () => {
    if (motionQuery.matches) {
      stop();
      draw(0);
    } else {
      start();
    }
  });
})();
