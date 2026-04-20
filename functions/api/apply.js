/**
 * Nightwave — Rust Application (Cloudflare Pages Function)
 * Route: POST /api/apply
 *
 * Bindings required in Cloudflare Pages dashboard
 * (Settings → Functions → D1 database bindings / Environment variables):
 *   DB                   — D1 database: nightwave_db
 *   RECAPTCHA_SECRET_KEY — reCAPTCHA v3 secret key (secret)
 *   DISCORD_WEBHOOK_URL  — Discord channel webhook URL (secret)
 *   RECAPTCHA_MIN_SCORE  — e.g. "0.5" (plain variable, optional)
 */

const MAX_LENGTHS = {
  name: 100,
  steam64Id: 30,
  discordUsername: 80,
  twitchName: 80,
  rustUsername: 100,
  steamName: 100,
  steamLink: 500,
  streamingLinks: 500,
  timezoneCountry: 80,
  playerType: 150,
  rpExperience: 2000,
  playStyle: 50,
  whatYouBring: 2000,
  createsContent: 2000,
  okToFeature: 50,
  handlesConflict: 2000,
  everBanned: 2000,
  everCheated: 10,
  whyJoin: 2000,
  funnyFact: 500,
  rustBusiness: 500,
};

const REQUIRED_FIELDS = [
  'name', 'steam64Id', 'discordUsername', 'twitchName', 'rustUsername',
  'steamName', 'steamLink', 'timezoneCountry', 'whatYouBring',
  'handlesConflict', 'everBanned', 'whyJoin', 'funnyFact', 'rustBusiness',
];

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

function truncate(str, n = 1024) {
  if (!str) return '—';
  return str.length > n ? str.slice(0, n - 1) + '…' : str;
}

function parseIntField(value, name, min, max) {
  if (!value && value !== 0) return null;
  const n = parseInt(value, 10);
  if (isNaN(n) || n < min || n > max) {
    throw new RangeError(`${name} must be a number between ${min} and ${max}`);
  }
  return n;
}

function isValidSteam64Id(id) {
  return /^7656119\d{10}$/.test(String(id).trim());
}

function isValidSteamUrl(url) {
  try {
    const u = new URL(url);
    return u.protocol === 'https:' && u.hostname === 'steamcommunity.com';
  } catch {
    return false;
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const {
      name, email, discordUsername, twitchName, rustUsername,
      steamName, steamLink, streamingLinks,
      age, timezoneCountry, rustHours,
      playerType, rpExperience, playStyle, whatYouBring,
      createsContent, okToFeature, handlesConflict,
      everBanned, everCheated, understandsRules,
      whyJoin, funnyFact, rustBusiness,
      agreedToRules, recaptchaToken,
    } = body;

    // reCAPTCHA token presence
    if (!recaptchaToken) {
      return json({ error: 'reCAPTCHA token missing' }, 400);
    }

    // Required fields
    const fields = {
      name, email, discordUsername, twitchName, rustUsername,
      steamName, steamLink, timezoneCountry, whatYouBring,
      handlesConflict, everBanned, whyJoin, funnyFact, rustBusiness,
    };
    for (const field of REQUIRED_FIELDS) {
      if (!fields[field] || String(fields[field]).trim() === '') {
        return json({ error: `${field} is required` }, 400);
      }
    }

    // Format validation
    if (!isValidEmail(email)) {
      return json({ error: 'Invalid email address' }, 400);
    }
    if (!isValidSteamUrl(steamLink)) {
      return json({ error: 'Steam link must be a valid https://steamcommunity.com URL' }, 400);
    }

    // Length validation
    const allFields = {
      name, email, discordUsername, twitchName, rustUsername,
      steamName, steamLink, streamingLinks, timezoneCountry,
      playerType, rpExperience, playStyle, whatYouBring,
      createsContent, okToFeature, handlesConflict,
      everBanned, everCheated, whyJoin, funnyFact, rustBusiness,
    };
    for (const [field, maxLen] of Object.entries(MAX_LENGTHS)) {
      const val = allFields[field];
      if (val && String(val).length > maxLen) {
        return json({ error: `${field} exceeds maximum allowed length` }, 400);
      }
    }

    // Integer validation
    let parsedAge, parsedHours;
    try {
      parsedAge   = parseIntField(age, 'age', 13, 99);
      parsedHours = parseIntField(rustHours, 'rustHours', 0, 100000);
    } catch (rangeErr) {
      return json({ error: rangeErr.message }, 400);
    }

    // Verify reCAPTCHA v3
    if (!env.RECAPTCHA_SECRET_KEY) {
      console.error('reCAPTCHA: RECAPTCHA_SECRET_KEY is not set');
      return json({ error: 'Server configuration error' }, 500);
    }
    const recaptchaRes = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${encodeURIComponent(env.RECAPTCHA_SECRET_KEY)}&response=${encodeURIComponent(recaptchaToken)}`,
    });
    const recaptchaData = await recaptchaRes.json();
    const minScore = parseFloat(env.RECAPTCHA_MIN_SCORE || '0.5');
    console.log(`reCAPTCHA: success=${recaptchaData.success}, score=${recaptchaData.score}, errors=${JSON.stringify(recaptchaData['error-codes'])}`);
    if (!recaptchaData.success || recaptchaData.score < minScore) {
      return json({ error: 'reCAPTCHA verification failed' }, 400);
    }

    // Store in D1
    await env.DB.prepare(`
      INSERT INTO applications (
        name, email, discord_username, twitch_name, rust_username,
        steam_name, steam_link, streaming_links,
        age, timezone_country, rust_hours,
        player_type, rp_experience, play_style, what_you_bring,
        creates_content, ok_to_feature, handles_conflict,
        ever_banned, ever_cheated, understands_rules,
        why_join, funny_fact, rust_business,
        agreed_to_rules, created_at
      ) VALUES (
        ?, ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?,
        ?, CURRENT_TIMESTAMP
      )
    `).bind(
      name.trim(), email.trim(), discordUsername.trim(), twitchName.trim(), rustUsername.trim(),
      steamName.trim(), steamLink.trim(), streamingLinks || null,
      parsedAge, timezoneCountry.trim(), parsedHours,
      playerType || null, rpExperience || null, playStyle || null, whatYouBring.trim(),
      createsContent || null, okToFeature || null, handlesConflict.trim(),
      everBanned.trim(), everCheated || null, understandsRules ? 1 : 0,
      whyJoin.trim(), funnyFact.trim(), rustBusiness.trim(),
      agreedToRules ? 1 : 0
    ).run();

    // Discord webhook (non-blocking on failure)
    const embed = {
      title: '🎮 New Rust Application',
      color: 0xcd6133,
      fields: [
        { name: 'Name',           value: truncate(name, 256),           inline: true },
        { name: 'Discord',        value: truncate(discordUsername, 256), inline: true },
        { name: 'Twitch',         value: truncate(twitchName, 256),      inline: true },
        { name: 'Email',          value: truncate(email, 256),           inline: true },
        { name: 'Rust Username',  value: truncate(rustUsername, 256),    inline: true },
        { name: 'Steam',          value: `[Profile](${steamLink})`,      inline: true },
        { name: 'Age',            value: parsedAge ? String(parsedAge) : '—',     inline: true },
        { name: 'Rust Hours',     value: parsedHours ? String(parsedHours) : '—', inline: true },
        { name: 'Time Zone',      value: truncate(timezoneCountry, 256), inline: true },
        { name: 'Player Type',    value: truncate(playerType),           inline: true },
        { name: 'Play Style',     value: truncate(playStyle, 256),       inline: true },
        { name: 'Featured OK?',   value: truncate(okToFeature, 256),     inline: true },
        { name: 'Ever Cheated?',  value: truncate(everCheated, 256),     inline: true },
        { name: 'Streaming Links',value: truncate(streamingLinks),       inline: false },
        { name: 'RP Experience',  value: truncate(rpExperience),         inline: false },
        { name: 'What You Bring', value: truncate(whatYouBring),         inline: false },
        { name: 'Creates Content',value: truncate(createsContent),       inline: false },
        { name: 'Handles Conflict',value: truncate(handlesConflict),     inline: false },
        { name: 'Ever Banned?',   value: truncate(everBanned),           inline: false },
        { name: 'Why Join',       value: truncate(whyJoin),              inline: false },
        { name: 'Agreed to Rules',value: agreedToRules ? 'Yes ✅' : 'No ❌', inline: true },
      ],
      timestamp: new Date().toISOString(),
      footer: { text: 'Nightwaves Nation Application' },
    };

    try {
      const discordRes = await fetch(env.DISCORD_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embeds: [embed] }),
        signal: AbortSignal.timeout(5000),
      });
      if (!discordRes.ok) {
        console.error(`Discord webhook returned ${discordRes.status}`);
      }
    } catch (discordErr) {
      console.error('Discord webhook failed:', discordErr.message);
    }

    return json({ success: true });

  } catch (err) {
    console.error('Submission error:', err);
    return json({ error: 'Submission failed. Please try again.' }, 500);
  }
}
