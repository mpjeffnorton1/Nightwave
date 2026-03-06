// =========================================
//  Nightwave Linktree - script.js
// =========================================

// ---- Intro Canvas Animation ----
// Draws rainbow ribbons fanning from the bottom-center (like the Nightwave logo),
// then fades out to reveal the background image.
(function () {
    const canvas = document.getElementById('intro-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    function resize() {
        canvas.width  = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    // Ribbon colors matching the Nightwave logo palette (left → right)
    const COLORS = [
        [192,  57,  43],  // deep red
        [210,  75,  18],  // orange-red
        [225, 138,  25],  // orange
        [195, 168,  18],  // gold / yellow
        [ 28, 105,  48],  // forest green
        [ 18,  88,  88],  // dark teal
        [ 28,  78, 150],  // deep blue
        [ 98,  38, 122],  // purple
    ];

    const NUM_RIBBONS  = COLORS.length;
    const SPREAD_RAD   = (162 * Math.PI) / 180; // total fan angle
    const GROW_MS      = 2000;   // ribbons bloom for 2 s
    const HOLD_MS      = 300;    // brief pause at full size
    const FADE_MS      = 1000;   // fade to reveal background.png
    const TOTAL_MS     = GROW_MS + HOLD_MS + FADE_MS;

    let startTime = null;

    function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

    function drawRibbon(cx, oy, angle, length, halfW, color, baseAlpha) {
        const [r, g, b] = color;

        // Perpendicular direction (for ribbon thickness)
        const px = -Math.sin(angle);
        const py =  Math.cos(angle);

        // Tip of the ribbon
        const ex = cx + Math.cos(angle) * length;
        const ey = oy + Math.sin(angle) * length;

        // Quadratic control point — follows the ribbon direction
        const cpX = cx + Math.cos(angle) * length * 0.45;
        const cpY = oy + Math.sin(angle) * length * 0.45;

        // Gradient: opaque at base, transparent at tip
        const grad = ctx.createLinearGradient(cx, oy, ex, ey);
        grad.addColorStop(0,   `rgba(${r},${g},${b},${baseAlpha})`);
        grad.addColorStop(0.55,`rgba(${r},${g},${b},${baseAlpha * 0.75})`);
        grad.addColorStop(1,   `rgba(${r},${g},${b},0)`);

        ctx.save();
        ctx.beginPath();
        // Left edge → tip → right edge → close
        ctx.moveTo(cx + px * halfW, oy + py * halfW);
        ctx.quadraticCurveTo(
            cpX + px * halfW * 0.22, cpY + py * halfW * 0.22,
            ex, ey
        );
        ctx.quadraticCurveTo(
            cpX - px * halfW * 0.22, cpY - py * halfW * 0.22,
            cx - px * halfW, oy - py * halfW
        );
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.restore();
    }

    function frame(ts) {
        if (!startTime) startTime = ts;
        const elapsed = ts - startTime;

        const W = canvas.width;
        const H = canvas.height;

        // Dark base — same tone as the background image
        ctx.fillStyle = '#0d0d0d';
        ctx.fillRect(0, 0, W, H);

        const cx      = W / 2;
        const oy      = H + 40;                      // origin just below viewport
        const maxLen  = Math.hypot(W, H) * 0.92;    // reach corners
        const halfW   = W * 0.055;                   // ribbon half-width at base

        // Outer ribbons bloom slightly ahead of inner ones for a "spread" feel
        for (let i = 0; i < NUM_RIBBONS; i++) {
            const t     = i / (NUM_RIBBONS - 1);
            const angle = -Math.PI / 2 + (-SPREAD_RAD / 2 + t * SPREAD_RAD);

            // Outer ribbons lead by up to 150 ms
            const lead      = 150 * Math.abs(t - 0.5) * 2;
            const growInput = Math.max(elapsed - lead, 0) / GROW_MS;
            const growP     = easeOut(Math.min(growInput, 1));
            const length    = maxLen * growP;

            if (length > 0) {
                drawRibbon(cx, oy, angle, length, halfW, COLORS[i], 0.9);
            }
        }

        // Glowing origin point
        const globalGrow = easeOut(Math.min(elapsed / GROW_MS, 1));
        if (globalGrow > 0) {
            const gr = Math.min(90 * globalGrow, 90);
            const glow = ctx.createRadialGradient(cx, oy, 0, cx, oy, gr);
            glow.addColorStop(0,   `rgba(255,235,180,${0.95 * globalGrow})`);
            glow.addColorStop(0.35,`rgba(255,165, 50,${0.55 * globalGrow})`);
            glow.addColorStop(1,   'rgba(255,80,0,0)');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(cx, oy, gr, 0, Math.PI * 2);
            ctx.fill();
        }

        // Subtle vignette so edges blend into dark bg
        const vignette = ctx.createRadialGradient(
            cx, H / 2, H * 0.3,
            cx, H / 2, H * 0.85
        );
        vignette.addColorStop(0, 'rgba(0,0,0,0)');
        vignette.addColorStop(1, 'rgba(0,0,0,0.55)');
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, W, H);

        // Fade out — revealing background.png underneath
        if (elapsed >= GROW_MS + HOLD_MS) {
            const fadeP = Math.min((elapsed - GROW_MS - HOLD_MS) / FADE_MS, 1);
            canvas.style.opacity = String(1 - fadeP);
            if (fadeP >= 1) {
                canvas.remove();
                return;
            }
        }

        if (elapsed < TOTAL_MS) {
            requestAnimationFrame(frame);
        }
    }

    requestAnimationFrame(frame);
})();


// ---- Button interactions (after DOM ready) ----
document.addEventListener('DOMContentLoaded', () => {

    // Ripple effect on button click
    const buttons = document.querySelectorAll('.btn');

    buttons.forEach(btn => {
        btn.addEventListener('click', function (e) {
            const existing = this.querySelector('.ripple');
            if (existing) existing.remove();

            const ripple = document.createElement('span');
            ripple.classList.add('ripple');

            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            ripple.style.width  = ripple.style.height = `${size}px`;
            ripple.style.left   = `${e.clientX - rect.left - size / 2}px`;
            ripple.style.top    = `${e.clientY - rect.top  - size / 2}px`;

            this.appendChild(ripple);
            ripple.addEventListener('animationend', () => ripple.remove());
        });
    });

    // Staggered entrance — delayed to sync with canvas fade-out start (~2 s)
    const linkItems = document.querySelectorAll('.links .btn');

    setTimeout(() => {
        linkItems.forEach((btn, index) => {
            btn.style.opacity    = '0';
            btn.style.transform  = 'translateY(16px)';
            btn.style.transition = `opacity 0.45s ease ${index * 0.12}s, transform 0.45s ease ${index * 0.12}s`;

            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    btn.style.opacity   = '1';
                    btn.style.transform = 'translateY(0)';
                });
            });
        });
    }, 2050); // starts just after container begins fading in

});
