// =========================================
//  Nightwave Linktree - script.js
// =========================================

// ---- Intro Canvas Animation ----
// Transparent overlay: content is visible beneath. Ribbons fan from
// the bottom-center with soft S-curves and glowing edges, then fade out.
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

    // Nightwave logo color palette — left → right ribbon order
    // Each entry: [r, g, b, shadow-r, shadow-g, shadow-b]
    const COLORS = [
        [210,  50,  35, 255,  60,  40],  // deep red
        [220,  85,  15, 255, 110,  20],  // orange-red
        [230, 145,  20, 255, 170,  30],  // orange
        [200, 175,  15, 240, 210,  20],  // gold
        [ 25, 110,  45,  35, 160,  60],  // forest green
        [ 15,  90,  90,  20, 140, 130],  // dark teal
        [ 25,  80, 155,  40, 110, 210],  // deep blue
        [105,  35, 130, 160,  50, 190],  // purple
    ];

    const NUM_RIBBONS = COLORS.length;
    const SPREAD_RAD  = (158 * Math.PI) / 180; // total fan angle
    const GROW_MS     = 2200;   // ribbons bloom
    const HOLD_MS     = 200;    // brief pause
    const FADE_MS     = 900;    // fade out
    const TOTAL_MS    = GROW_MS + HOLD_MS + FADE_MS;

    let startTime = null;

    function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
    function easeInOut(t) { return t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2; }

    // Draw one ribbon with a glow pass (wide, soft) + core pass (narrower, solid)
    function drawRibbon(cx, oy, angle, length, halfW, color) {
        const [r, g, b, sr, sg, sb] = color;

        // Perpendicular direction for ribbon width
        const px = -Math.sin(angle);
        const py =  Math.cos(angle);

        // End point of the ribbon
        const ex = cx + Math.cos(angle) * length;
        const ey = oy + Math.sin(angle) * length;

        // S-curve control points
        // cp1 starts close and sweeps inward, cp2 follows the outward angle
        const sway = length * 0.18 * (angle < -Math.PI / 2 ? -1 : 1);
        const cp1x = cx + Math.cos(angle) * length * 0.25 + Math.sin(angle) * sway * 0.5;
        const cp1y = oy + Math.sin(angle) * length * 0.25 - Math.cos(angle) * sway * 0.5;
        const cp2x = cx + Math.cos(angle) * length * 0.65 + Math.sin(angle) * sway * 0.2;
        const cp2y = oy + Math.sin(angle) * length * 0.65 - Math.cos(angle) * sway * 0.2;

        function buildPath(widthMult) {
            const hw = halfW * widthMult;
            ctx.beginPath();
            ctx.moveTo(cx + px * hw, oy + py * hw);
            ctx.bezierCurveTo(
                cp1x + px * hw * 0.6, cp1y + py * hw * 0.6,
                cp2x + px * hw * 0.2, cp2y + py * hw * 0.2,
                ex, ey
            );
            ctx.bezierCurveTo(
                cp2x - px * hw * 0.2, cp2y - py * hw * 0.2,
                cp1x - px * hw * 0.6, cp1y - py * hw * 0.6,
                cx - px * hw, oy - py * hw
            );
            ctx.closePath();
        }

        // Gradient: rich at base, transparent at tip
        // Note: rr/gg/bb used to avoid shadowing the loop's r/g/b in nested scope
        const [rr, gg, bb] = color;
        function makeGrad(alpha) {
            const grad = ctx.createLinearGradient(cx, oy, ex, ey);
            grad.addColorStop(0,    `rgba(${rr},${gg},${bb},${alpha})`);
            grad.addColorStop(0.45, `rgba(${rr},${gg},${bb},${alpha * 0.8})`);
            grad.addColorStop(1,    `rgba(${rr},${gg},${bb},0)`);
            return grad;
        }

        // -- Glow pass (wide, blurred) --
        ctx.save();
        ctx.shadowBlur   = 38;
        ctx.shadowColor  = `rgba(${sr},${sg},${sb},0.95)`;
        buildPath(1.9);
        ctx.fillStyle = makeGrad(0.22);
        ctx.fill();
        ctx.restore();

        // -- Core pass (tighter, more opaque) --
        ctx.save();
        ctx.shadowBlur   = 18;
        ctx.shadowColor  = `rgba(${sr},${sg},${sb},0.7)`;
        buildPath(1.0);
        ctx.fillStyle = makeGrad(0.82);
        ctx.fill();
        ctx.restore();
    }

    function frame(ts) {
        if (!startTime) startTime = ts;
        const elapsed = ts - startTime;

        const W = canvas.width;
        const H = canvas.height;

        // Clear to fully transparent — page content shows through
        ctx.clearRect(0, 0, W, H);

        const cx     = W / 2;
        const oy     = H + 35;                        // origin just below viewport
        const maxLen = Math.hypot(W, H) * 0.92;
        const halfW  = W * 0.065;                     // ribbon half-width at base

        for (let i = 0; i < NUM_RIBBONS; i++) {
            const t     = i / (NUM_RIBBONS - 1);
            const angle = -Math.PI / 2 + (-SPREAD_RAD / 2 + t * SPREAD_RAD);

            // Outer ribbons lead slightly for a natural "bloom" effect
            const lead  = 180 * Math.abs(t - 0.5) * 2;
            const growP = easeOut(Math.min(Math.max(elapsed - lead, 0) / GROW_MS, 1));
            const length = maxLen * growP;

            if (length > 1) {
                drawRibbon(cx, oy, angle, length, halfW, COLORS[i]);
            }
        }

        // Warm glow at the origin point
        const globalGrow = easeOut(Math.min(elapsed / GROW_MS, 1));
        if (globalGrow > 0) {
            const gr = 75 * globalGrow;
            const glow = ctx.createRadialGradient(cx, oy, 0, cx, oy, gr);
            glow.addColorStop(0,   `rgba(255,235,180,${0.9 * globalGrow})`);
            glow.addColorStop(0.4, `rgba(255,160, 50,${0.5 * globalGrow})`);
            glow.addColorStop(1,   'rgba(255,80,0,0)');
            ctx.save();
            ctx.shadowBlur  = 30;
            ctx.shadowColor = 'rgba(255,200,80,0.8)';
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(cx, oy, gr, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // Fade canvas out — background.png and content beneath are already visible
        if (elapsed >= GROW_MS + HOLD_MS) {
            const fadeP = Math.min((elapsed - GROW_MS - HOLD_MS) / FADE_MS, 1);
            canvas.style.opacity = String(1 - fadeP);
            if (fadeP >= 1) {
                canvas.remove();
                return;
            }
        }

        if (elapsed < TOTAL_MS) requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
})();


// ---- Button interactions ----
document.addEventListener('DOMContentLoaded', () => {

    // Ripple on click
    document.querySelectorAll('.btn').forEach(btn => {
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

    // Staggered button entrance — starts immediately alongside the canvas animation
    document.querySelectorAll('.links .btn').forEach((btn, index) => {
        btn.style.opacity    = '0';
        btn.style.transform  = 'translateY(16px)';
        btn.style.transition = `opacity 0.45s ease ${0.25 + index * 0.12}s, transform 0.45s ease ${0.25 + index * 0.12}s`;

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                btn.style.opacity   = '1';
                btn.style.transform = 'translateY(0)';
            });
        });
    });

    // ---- Rust Application Form Submission ----
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.textContent;
            const siteKey = contactForm.dataset.sitekey;

            submitBtn.disabled = true;
            submitBtn.textContent = 'Sending...';

            try {
                // Get reCAPTCHA v3 token
                const token = await new Promise((resolve) => {
                    grecaptcha.ready(() => {
                        grecaptcha.execute(siteKey, { action: 'apply' }).then(resolve);
                    });
                });

                // Build payload — player type is a multi-checkbox so collect all checked values
                const playerType = [...contactForm.querySelectorAll('[name="playerType"]:checked')]
                    .map(el => el.value).join(', ');

                const payload = {
                    name:             contactForm.querySelector('#name').value,
                    email:            contactForm.querySelector('#email').value,
                    discordUsername:  contactForm.querySelector('#discordUsername').value,
                    twitchName:       contactForm.querySelector('#twitchName').value,
                    rustUsername:     contactForm.querySelector('#rustUsername').value,
                    steamName:        contactForm.querySelector('#steamName').value,
                    steamLink:        contactForm.querySelector('#steamLink').value,
                    streamingLinks:   contactForm.querySelector('#streamingLinks').value || null,
                    age:              contactForm.querySelector('#age').value,
                    timezoneCountry:  contactForm.querySelector('#timezoneCountry').value,
                    rustHours:        contactForm.querySelector('#rustHours').value,
                    playerType:       playerType || null,
                    rpExperience:     contactForm.querySelector('#rpExperience').value || null,
                    playStyle:        contactForm.querySelector('[name="playStyle"]:checked')?.value || null,
                    whatYouBring:     contactForm.querySelector('#whatYouBring').value,
                    createsContent:   contactForm.querySelector('#createsContent').value || null,
                    okToFeature:      contactForm.querySelector('#okToFeature').checked ? 'Yes' : null,
                    handlesConflict:  contactForm.querySelector('#handlesConflict').value,
                    everBanned:       contactForm.querySelector('#everBanned').value,
                    everCheated:      contactForm.querySelector('[name="everCheated"]:checked')?.value || null,
                    understandsRules: contactForm.querySelector('#understandsRules').checked,
                    whyJoin:          contactForm.querySelector('#whyJoin').value,
                    funnyFact:        contactForm.querySelector('#funnyFact').value,
                    rustBusiness:     contactForm.querySelector('#rustBusiness').value,
                    agreedToRules:    contactForm.querySelector('#agreedToRules').checked,
                    recaptchaToken:   token,
                };

                const response = await fetch('/api/apply', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });

                if (!response.ok) {
                    const errData = await response.json().catch(() => ({}));
                    throw new Error(errData.error || 'Failed to send');
                }

                contactForm.reset();
                submitBtn.textContent = 'Application Sent!';
                submitBtn.style.backgroundColor = '#27ae60';

                setTimeout(() => {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalBtnText;
                    submitBtn.style.backgroundColor = '';
                }, 3000);

            } catch (err) {
                console.error('Submission error:', err);
                submitBtn.textContent = err.message ? `Error: ${err.message}` : 'Error! Try Again';
                submitBtn.style.backgroundColor = '#c0392b';

                setTimeout(() => {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalBtnText;
                    submitBtn.style.backgroundColor = '';
                }, 3000);
            }
        });
    }

});
