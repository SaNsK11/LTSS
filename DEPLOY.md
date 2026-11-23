# Deploying to Hostinger

The site is a plain static site (HTML/CSS/JS, no build step) — Hostinger shared hosting runs this natively.

## Package
`ltss-website.zip` (in this folder) contains the whole site with `index.html` at the top level, ready to extract straight into your hosting root.

## Steps (hPanel File Manager — easiest, no FTP app needed)

1. Log in to Hostinger → **hPanel**.
2. Go to **Websites** → pick the domain (or add a new one first if this is going on a fresh domain/subdomain).
3. Open **File Manager**.
4. Navigate into `public_html` (this is the web root for your main domain — for a subdomain use its own folder, e.g. `public_html/site-subdomain`).
5. **Check what's already in there first.** If there's an existing site you want to keep, back it up or deploy to a subdomain/subfolder instead of overwriting.
6. Click **Upload**, select `ltss-website.zip`, and upload it into `public_html`.
7. Once uploaded, right-click the zip → **Extract**, extract into the current folder (`public_html`).
8. Delete `ltss-website.zip` after extracting (keep the root tidy).
9. Confirm `public_html/index.html`, `public_html/css/`, `public_html/images/`, `public_html/js/`, `public_html/products/` all sit directly under `public_html` (not nested one level deeper — if the zip extracted into a `website/` subfolder, move the contents up one level).
10. Visit your domain — the homepage should load.

## Alternative: FTP (FileZilla etc.)
Hostinger hPanel → **Files → FTP Accounts** gives you host/username/password. Connect and upload the *contents* of this `website/` folder (not the folder itself) into `public_html`.

## Contact form
The enquiry form on `contact.html` posts to [FormSubmit](https://formsubmit.co) → `info@lasertechsystems.co.in` — no backend needed. **First submission after going live will trigger a one-time confirmation email to `info@lasertechsystems.co.in`** that someone must click to activate the form; after that, submissions arrive normally by email.

## Domain / DNS
If this is a new domain, point its nameservers/DNS to Hostinger (usually automatic if the domain was bought through Hostinger) and allow up to 24 hours to propagate.

## Updating the site later
Edit the HTML/CSS files locally, then re-upload the changed files via File Manager or FTP — no rebuild step required.

## What still needs your input (placeholders to replace before/after launch)
These are built and styled, but contain placeholder or assumed content — send them over and I'll drop them in:

1. **Customer testimonials** (homepage "What our customers say"): currently a clearly-marked sample layout with `[Customer Name]` / `[Company, City]` placeholders and a yellow "sample layout" flag. Replace with 3 real quotes + names/companies (and I can add photos/logos if you have them). *Until replaced, consider hiding this section so the placeholder flag isn't public.*
2. **Trust bar / warranty & certifications**: the homepage trust bar only makes claims your catalogues actually back (installation, training, pan-India support, genuine spares, Service Before Sales). If you have a **warranty period, AMC terms, CE/ISO certifications, or an installation count** ("500+ machines installed"), send them and I'll add a stronger trust row.
3. **Real photos**: office/factory, team, and real customer installations — to replace the catalogue-cropped product shots where useful.
4. **Savings calculator assumptions** (welding page): the laser-vs-TIG/MIG estimate uses reasonable default figures (300 working days/yr, ~half electricity, no filler wire, ~1/4 operator time — all from your catalogue's own comparison claims). Tell me if you'd prefer different assumptions.

## New assets included
- `videos/laser-tech-showcase.mp4` — your existing promo video, embedded on the homepage (loads only when the visitor clicks play, so it doesn't slow the page).
- `brochures/*.pdf` — your catalogues, offered as "Download Brochure" buttons on each product page.

## Contact form note (repeat)
The form and the "Book a Free Demo" flow both post to FormSubmit → info@lasertechsystems.co.in. Remember the one-time activation click on the first real submission after going live.
