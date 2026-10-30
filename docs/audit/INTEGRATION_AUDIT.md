# CHCN — Integration Audit

Identified by scanning the source for external references. No integration was
modified; none was assumed to "work" without evidence.

| Integration | Where | Purpose | Auth / secrets | Status |
|-------------|-------|---------|----------------|--------|
| Leaflet (maps) | `leaflet.js/.css`, `images/*` | vendored map library | none | WORKS (local vendor) |
| OpenStreetMap tiles | implied by Leaflet usage | map tiles | none | NETWORK-DEPENDENT, not tested here |
| Device email (mailto) | `app.js` `sendMessage()` | contact the Founder | none | WORKS (hands off to OS mail app) |
| WhatsApp deep link | `app.js` | fallback contact | none | UI link only |
| Payment UI | `global-payment.js` | enrolment/payment surface | none wired | UI-ONLY — no live gateway |
| Web Speech / SpeechSynthesis | `global-voice.js`, `voice-accessibility.js` | voice features | browser API | BROWSER-DEPENDENT |
| three.js CDN (added) | `chcn-3d-lab.js` | 3D rendering | none | loads on demand; accessible fallback if offline |
| Supabase (proposed) | `database/`, docs | real backend/auth/DB | service role server-side only | DESIGNED — NOT CONFIGURED |

## Notes
- No API keys, tokens or `.env` files are present in the archive (good).
- The three.js CDN is the only new outbound dependency; the 3D lab degrades to
  an accessible text version if the CDN or WebGL is unavailable, so it never
  blocks the platform.
- `.env.example` (placeholders only) is provided for the proposed Supabase
  wiring. Real credentials must be configured by the Founder out-of-band.
