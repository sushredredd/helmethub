# HelmetHub India — static Amazon-affiliate site

81 static pages · 60 helmet reviews · 15 buying guides · compare tool · zero dependencies, zero build step.

## Deploy (pick one)
- **Netlify:** drag the folder into app.netlify.com/drop
- **Vercel:** `vercel deploy` from this folder (framework: Other)
- **GitHub Pages:** push contents to a repo, enable Pages
- **S3/Cloudflare Pages:** upload as-is

## Before going live — 3 find-and-replace steps
1. **Affiliate tag:** replace every `YOURAFFILIATETAG-21` with your Amazon Associates tag
   (`grep -rl 'YOURAFFILIATETAG-21' . | xargs sed -i 's/YOURAFFILIATETAG-21/yourtag-21/g'`)
2. **ASINs:** product links use placeholder ASINs (B0HH00001…). Replace with real ASINs from each
   product's Amazon.in listing — they're in `data.json` (`asin` field) and baked into each page's links.
   Easiest path: edit `asin` values in `data.json` + find-replace the old ASIN in the matching HTML files.
3. **Domain:** replace `https://helmethubindia.in` (canonical URLs, sitemap, OG tags) with your domain.

## Notes
- Product images are original stylized SVGs. For real product photos, drop JPGs into `/img/`
  named `<slug>-1.jpg` etc. and update the `img/...svg` references (Amazon product images may not be
  hot-linked outside their API — use Amazon's SiteStripe/PA-API images to stay within ToS).
- Prices/specs in `data.json` are indicative (July 2026 street prices). Review before launch.
- Amazon Associates requires the affiliate disclosure to remain visible (footer + /affiliate-disclosure.html).
- Structure: `index.html`, `helmets.html` (filterable catalogue), `compare.html`, `guides/*`,
  `helmets/*` (60 review pages), `data.json` (single source of truth for client-side features),
  `sitemap.xml`, `robots.txt`.
