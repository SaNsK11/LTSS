#!/usr/bin/env python3
"""
LTSS Blog Post Generator
Picks the next pending topic, calls Claude API, generates a full HTML post,
updates the blog index, and marks the topic as published.
"""

import anthropic
import json
import os
import re
import sys
import math
from datetime import datetime
from pathlib import Path

SITE_ROOT = Path(__file__).parent.parent
TOPICS_FILE = SITE_ROOT / "topics.json"
POSTS_FILE = SITE_ROOT / "blog" / "posts.json"
BLOG_DIR = SITE_ROOT / "blog"

CATEGORY_LABEL = {
    "laser-marking": "Laser Marking",
    "laser-welding": "Laser Welding",
    "laser-cutting": "Laser Cutting",
    "laser-cleaning": "Laser Cleaning",
    "laser-bending": "Laser Bending",
    "dos-and-donts": "Do's & Don'ts",
    "cost-comparison": "Cost Comparison",
    "buyer-guide": "Buyer's Guide",
    "industry": "Industry Applications",
    "technical": "Technical Guide",
    "india-market": "India Market",
}

CATEGORY_PRODUCT_LINK = {
    "laser-marking": ("Explore Laser Marking Machines", "../products/marking.html"),
    "laser-welding": ("Explore Laser Welding Machines", "../products/welding.html"),
    "laser-cutting": ("Explore Laser Cutting Machines", "../products/cutting.html"),
    "laser-cleaning": ("Explore Laser Cleaning Machines", "../products/cleaning.html"),
    "laser-bending": ("Explore Laser Bending Machines", "../products/bending.html"),
    "dos-and-donts": ("Book a Free Demo", "../contact.html#demo"),
    "cost-comparison": ("Get a Quote", "../contact.html#demo"),
    "buyer-guide": ("Talk to Our Experts", "../contact.html#demo"),
    "industry": ("Enquire for Your Industry", "../contact.html#demo"),
    "technical": ("Speak to a Technical Expert", "../contact.html#demo"),
    "india-market": ("Get in Touch", "../contact.html#demo"),
}


def load_json(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def save_json(path, data):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def pick_topic(topics):
    for t in topics:
        if t["status"] == "pending":
            return t
    return None


def estimate_read_time(html_body):
    text = re.sub(r"<[^>]+>", " ", html_body)
    words = len(text.split())
    return max(4, math.ceil(words / 200))


def generate_post_content(topic):
    client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

    cat_label = CATEGORY_LABEL.get(topic["category"], topic["category"])
    cta_text, cta_link = CATEGORY_PRODUCT_LINK.get(
        topic["category"], ("Get in Touch", "../contact.html#demo")
    )

    prompt = f"""You are writing a blog post for Laser Tech Systems and Solutions (LTSS), a New Delhi-based laser machine manufacturer and supplier. Their tagline is "Service Before Sales."

Topic title: {topic["title"]}
Category: {cat_label}
Target audience: Production managers, plant engineers, purchase managers at Indian manufacturing companies (automotive, fabrication, food equipment, jewelry, pharmaceuticals, etc.)

Write a complete blog post. Requirements:
- Length: 950–1150 words of body content
- Tone: Authoritative, practical, helpful. Write as an industry expert advising a buyer — not a salesperson.
- Include relevant Indian context (INR cost estimates where logical, Indian manufacturing sectors, BIS/ISO standards where relevant, Indian industry names)
- Structure with clear H2 sections and H3 subsections where needed
- Use bullet lists (ul/li) for comparisons, checklists, or lists of 3+ items
- End the post body with a short "Key Takeaway" paragraph that summarises the main point
- Internal CTA: Include ONE natural in-text link to LTSS's relevant product/contact page using anchor text "{cta_text}" and href "{cta_link}"

HTML rules:
- Use only: <p>, <h2>, <h3>, <ul>, <li>, <ol>, <strong>, <em>, <a href="...">
- Do NOT include <html>, <head>, <body>, <header>, <footer>, <nav>, <article>, <section>, <div>
- Do NOT include any CSS, style attributes, or class attributes
- Write clean, semantic prose HTML only

Output a JSON object with exactly these keys (no markdown, no code fences — raw JSON only):
{{
  "title": "refined post title (can keep or improve the given title, max 70 chars)",
  "meta_description": "SEO meta description, max 155 characters",
  "excerpt": "2-3 sentence excerpt for the blog index card",
  "html_body": "the full post body HTML as described above"
}}"""

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=4096,
        messages=[{"role": "user", "content": prompt}],
    )

    raw = message.content[0].text.strip()
    # Strip markdown code fences if present
    raw = re.sub(r"^```(?:json)?\s*", "", raw)
    raw = re.sub(r"\s*```$", "", raw)
    return json.loads(raw)


def build_post_html(topic, content, pub_date):
    cat_label = CATEGORY_LABEL.get(topic["category"], topic["category"])
    cta_text, cta_link = CATEGORY_PRODUCT_LINK.get(
        topic["category"], ("Get in Touch", "../contact.html#demo")
    )
    read_time = estimate_read_time(content["html_body"])
    formatted_date = datetime.strptime(pub_date, "%Y-%m-%d").strftime("%d %B %Y")

    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>{content["title"]} | Laser Tech Systems and Solutions</title>
<meta name="description" content="{content["meta_description"]}" />
<link rel="canonical" href="https://lasertechsystems.co.in/blog/{topic["slug"]}.html" />
<meta property="og:title" content="{content["title"]}" />
<meta property="og:description" content="{content["meta_description"]}" />
<meta property="og:url" content="https://lasertechsystems.co.in/blog/{topic["slug"]}.html" />
<meta property="og:type" content="article" />
<link rel="icon" type="image/png" href="../images/favicon-32.png" />
<link rel="apple-touch-icon" href="../images/apple-touch-icon.png" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="../css/style.css" />
<link rel="stylesheet" href="../css/v2.css" />
<link rel="stylesheet" href="../css/v3.css" />
<link rel="stylesheet" href="blog.css" />
</head>
<body>
<header class="site-header">
  <div class="topbar">
    <div class="container">
      <div class="topbar-links">
        <a href="tel:+918851534795">&#128222; +91 88515 34795</a>
        <a href="mailto:info@lasertechsystems.co.in">&#9993; info@lasertechsystems.co.in</a>
      </div>
      <span class="tagline">Service Before Sales</span>
    </div>
  </div>
  <div class="container">
    <nav class="navbar">
      <a href="../index.html" class="brand"><img src="../images/logo_new.png" alt="Laser Tech Systems and Solutions" /></a>
      <ul class="nav-links" id="navLinks">
        <li class="nav-item"><a href="../index.html">Home</a></li>
        <li class="nav-item has-menu"><a href="../products.html">Products</a>
          <div class="dropdown mega"><div class="nav-cat"><a href="../products/marking.html">Laser Marking Machine</a></div><div class="nav-cat"><a href="../products/welding.html">Laser Welding Machine</a></div><div class="nav-cat"><a href="../products/cutting.html">Laser Cutting Machine</a></div><div class="nav-cat"><a href="../products/cleaning.html">Laser Cleaning Machine</a></div><div class="nav-cat"><a href="../products/bending.html">Laser Bending Machine</a></div><div class="nav-cat"><a href="../products/spares.html">Spare Parts &amp; Consumables</a></div></div>
        </li>
        <li class="nav-item has-menu"><a href="../about.html">About Us</a>
          <div class="dropdown">
            <a href="../about.html">Who We Are</a>
            <a href="../about/technical-training.html">Technical Training &amp; Support</a>
            <a href="../about/pre-sales.html">Pre-Sales Consultation</a>
            <a href="../about/tig-mig-vs-laser.html">TIG/MIG vs Laser Welding</a>
          </div>
        </li>
        <li class="nav-item has-menu"><a href="../library.html">Library</a>
          <div class="dropdown">
            <a href="../library/gallery.html">Gallery</a>
            <a href="../library/faqs.html">FAQs</a>
            <a href="../library/brochures.html">Brochures</a>
          </div>
        </li>
        <li class="nav-item"><a href="index.html" class="active">Blog</a></li>
        <li class="nav-item"><a href="../contact.html">Contact</a></li>
      </ul>
      <div class="nav-cta">
        <a href="../contact.html#demo" class="btn btn-primary btn-sm">Book a Demo</a>
        <button class="nav-toggle" id="navToggle" aria-label="Toggle menu"><span></span><span></span><span></span></button>
      </div>
    </nav>
  </div>
</header>

<div class="blog-hero section--dark">
  <div class="container">
    <span class="eyebrow">{cat_label}</span>
    <h1>{content["title"]}</h1>
    <div class="blog-meta">
      <span>By LTSS Editorial Team</span>
      <span>&bull;</span>
      <span>{formatted_date}</span>
      <span>&bull;</span>
      <span>{read_time} min read</span>
    </div>
  </div>
</div>

<div class="section">
  <div class="container">
    <div class="blog-layout">
      <article class="blog-content">
        {content["html_body"]}
      </article>
      <aside class="blog-sidebar">
        <div class="blog-cta-card">
          <span class="eyebrow" style="font-size:0.7rem;">Get Expert Advice</span>
          <h3>Interested in a Laser Machine?</h3>
          <p>Talk to our team. We'll recommend the right machine for your material and application — no sales pressure.</p>
          <a href="{cta_link}" class="btn btn-primary" style="width:100%;text-align:center;">{cta_text}</a>
          <a href="https://wa.me/918851534795" target="_blank" rel="noopener" class="btn btn-outline" style="width:100%;text-align:center;margin-top:10px;">WhatsApp Us</a>
        </div>
        <div class="blog-cta-card" style="margin-top:24px;background:var(--grey-50);border:1px solid var(--grey-200);">
          <span class="eyebrow" style="font-size:0.7rem;">More Posts</span>
          <h3 style="font-size:1.1rem;">Read the Blog</h3>
          <p>Guides on laser marking, welding, cutting, and cleaning for Indian manufacturers.</p>
          <a href="index.html" class="btn btn-outline" style="width:100%;text-align:center;">All Articles</a>
        </div>
      </aside>
    </div>
  </div>
</div>

<section class="section--tight">
  <div class="container">
    <div class="cta-band">
      <div><h2>Ready to See It in Action?</h2><p>Book a free demo at our New Delhi facility. Bring your own sample parts.</p></div>
      <div style="display:flex;gap:14px;flex-wrap:wrap;">
        <a href="../contact.html#demo" class="btn btn-outline-light" style="border-color:#fff;">Book a Demo</a>
        <a href="https://wa.me/918851534795" target="_blank" rel="noopener" class="btn" style="background:#fff;color:var(--red);">WhatsApp Us</a>
      </div>
    </div>
  </div>
</section>

<footer class="site-footer">
  <div class="container">
    <div class="footer-grid">
      <div>
        <a href="../index.html" class="brand"><img src="../images/logo_new.png" alt="Laser Tech Systems and Solutions" /></a>
        <p>New Delhi based specialists in fiber laser marking, welding, cutting, cleaning and bending systems. Service Before Sales.</p>
        <div class="social-row">
          <a href="https://wa.me/918851534795" target="_blank" rel="noopener" aria-label="WhatsApp"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 00-8.5 15.3L2 22l4.8-1.5A10 10 0 1012 2zm0 18a8 8 0 01-4.1-1.1l-.3-.2-3 .9.9-2.9-.2-.3A8 8 0 1112 20zm4.4-5.8c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1-.2.2-.6.8-.8 1-.1.2-.3.2-.5.1-.2-.1-1-.4-1.9-1.2-.7-.6-1.2-1.4-1.3-1.6-.1-.2 0-.4.1-.5l.4-.4c.1-.1.2-.3.2-.4.1-.2 0-.3 0-.5l-.7-1.7c-.2-.4-.4-.4-.5-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 2s.8 2.3.9 2.5c.1.2 1.6 2.4 3.8 3.4.5.2.9.4 1.3.5.5.2 1 .1 1.4.1.4-.1 1.4-.6 1.6-1.1.2-.5.2-1 .1-1.1-.1-.1-.2-.2-.4-.3z"/></svg></a>
          <a href="mailto:info@lasertechsystems.co.in" aria-label="Email"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M2 5a2 2 0 012-2h16a2 2 0 012 2v14a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm2 0l8 6 8-6H4zm16 2.4l-8 6-8-6V19h16V7.4z"/></svg></a>
          <a href="tel:+918851534795" aria-label="Phone"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M6.6 10.8a15.1 15.1 0 006.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.4.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 013 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1l-2.3 2.2z"/></svg></a>
        </div>
      </div>
      <div>
        <h4>Products</h4>
        <ul class="footer-links">
          <li><a href="../products/marking.html">Laser Marking Machines</a></li>
          <li><a href="../products/welding.html">Laser Welding Machines</a></li>
          <li><a href="../products/cutting.html">Laser Cutting Machines</a></li>
          <li><a href="../products/cleaning.html">Laser Cleaning Machines</a></li>
          <li><a href="../products/bending.html">Laser Bending Machines</a></li>
          <li><a href="../products/spares.html">Spares &amp; Consumables</a></li>
        </ul>
      </div>
      <div>
        <h4>Company</h4>
        <ul class="footer-links">
          <li><a href="../about.html">About Us</a></li>
          <li><a href="../about/technical-training.html">Technical Training</a></li>
          <li><a href="../about/pre-sales.html">Pre-Sales Consultation</a></li>
          <li><a href="../library/faqs.html">FAQs</a></li>
          <li><a href="index.html">Blog</a></li>
          <li><a href="../contact.html">Contact Us</a></li>
        </ul>
      </div>
      <div>
        <h4>Get in touch</h4>
        <ul class="footer-links">
          <li>D-13/23, Ground Floor, Sector-7, Rohini, New Delhi - 110085</li>
          <li><a href="tel:+918851534795">+91 88515 34795</a></li>
          <li><a href="https://wa.me/918851534795" target="_blank" rel="noopener">WhatsApp: +91 88515 34795</a></li>
          <li><a href="mailto:info@lasertechsystems.co.in">info@lasertechsystems.co.in</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <span>&copy; <span id="year"></span> Laser Tech Systems and Solutions. All rights reserved.</span>
      <span>GST No. 07AHKPG6062B1ZN</span>
    </div>
  </div>
</footer>

<a href="https://wa.me/918851534795" target="_blank" rel="noopener" class="whatsapp-float" aria-label="Chat on WhatsApp">
  <svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 00-8.5 15.3L2 22l4.8-1.5A10 10 0 1012 2zm0 18a8 8 0 01-4.1-1.1l-.3-.2-3 .9.9-2.9-.2-.3A8 8 0 1112 20zm4.4-5.8c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1-.2.2-.6.8-.8 1-.1.2-.3.2-.5.1-.2-.1-1-.4-1.9-1.2-.7-.6-1.2-1.4-1.3-1.6-.1-.2 0-.4.1-.5l.4-.4c.1-.1.2-.3.2-.4.1-.2 0-.3 0-.5l-.7-1.7c-.2-.4-.4-.4-.5-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 2s.8 2.3.9 2.5c.1.2 1.6 2.4 3.8 3.4.5.2.9.4 1.3.5.5.2 1 .1 1.4.1.4-.1 1.4-.6 1.6-1.1.2-.5.2-1 .1-1.1-.1-.1-.2-.2-.4-.3z"/></svg>
</a>

<script src="../js/main.js"></script>
<script src="../js/v2.js"></script>
<script src="../js/v3.js"></script>
</body>
</html>"""


def build_index_html(posts):
    if not posts:
        cards_html = """
      <div class="blog-empty">
        <p>Our first articles are on the way. Check back soon.</p>
        <a href="../contact.html#demo" class="btn btn-primary">Talk to Our Team</a>
      </div>"""
    else:
        cards = []
        for p in reversed(posts):
            cat_label = CATEGORY_LABEL.get(p["category"], p["category"])
            formatted_date = datetime.strptime(p["date"], "%Y-%m-%d").strftime("%d %b %Y")
            cards.append(f"""
        <a class="blog-card" href="{p["slug"]}.html">
          <span class="blog-card__cat">{cat_label}</span>
          <h3 class="blog-card__title">{p["title"]}</h3>
          <p class="blog-card__excerpt">{p["excerpt"]}</p>
          <div class="blog-card__meta">
            <span>{formatted_date}</span>
            <span>&bull;</span>
            <span>{p.get("read_time", 6)} min read</span>
          </div>
          <span class="blog-card__cta">Read article &rarr;</span>
        </a>""")
        cards_html = "\n".join(cards)

    post_count = len(posts)
    count_line = f"{post_count} article{'s' if post_count != 1 else ''}" if post_count else "Articles coming soon"

    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Blog | Laser Tech Systems and Solutions</title>
<meta name="description" content="Guides, comparisons, and industry insights on laser marking, welding, cutting, and cleaning machines for Indian manufacturers. By LTSS." />
<link rel="canonical" href="https://lasertechsystems.co.in/blog/" />
<link rel="icon" type="image/png" href="../images/favicon-32.png" />
<link rel="apple-touch-icon" href="../images/apple-touch-icon.png" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="../css/style.css" />
<link rel="stylesheet" href="../css/v2.css" />
<link rel="stylesheet" href="../css/v3.css" />
<link rel="stylesheet" href="blog.css" />
</head>
<body>
<header class="site-header">
  <div class="topbar">
    <div class="container">
      <div class="topbar-links">
        <a href="tel:+918851534795">&#128222; +91 88515 34795</a>
        <a href="mailto:info@lasertechsystems.co.in">&#9993; info@lasertechsystems.co.in</a>
      </div>
      <span class="tagline">Service Before Sales</span>
    </div>
  </div>
  <div class="container">
    <nav class="navbar">
      <a href="../index.html" class="brand"><img src="../images/logo_new.png" alt="Laser Tech Systems and Solutions" /></a>
      <ul class="nav-links" id="navLinks">
        <li class="nav-item"><a href="../index.html">Home</a></li>
        <li class="nav-item has-menu"><a href="../products.html">Products</a>
          <div class="dropdown mega"><div class="nav-cat"><a href="../products/marking.html">Laser Marking Machine</a></div><div class="nav-cat"><a href="../products/welding.html">Laser Welding Machine</a></div><div class="nav-cat"><a href="../products/cutting.html">Laser Cutting Machine</a></div><div class="nav-cat"><a href="../products/cleaning.html">Laser Cleaning Machine</a></div><div class="nav-cat"><a href="../products/bending.html">Laser Bending Machine</a></div><div class="nav-cat"><a href="../products/spares.html">Spare Parts &amp; Consumables</a></div></div>
        </li>
        <li class="nav-item has-menu"><a href="../about.html">About Us</a>
          <div class="dropdown">
            <a href="../about.html">Who We Are</a>
            <a href="../about/technical-training.html">Technical Training &amp; Support</a>
            <a href="../about/pre-sales.html">Pre-Sales Consultation</a>
            <a href="../about/tig-mig-vs-laser.html">TIG/MIG vs Laser Welding</a>
          </div>
        </li>
        <li class="nav-item has-menu"><a href="../library.html">Library</a>
          <div class="dropdown">
            <a href="../library/gallery.html">Gallery</a>
            <a href="../library/faqs.html">FAQs</a>
            <a href="../library/brochures.html">Brochures</a>
          </div>
        </li>
        <li class="nav-item"><a href="index.html" class="active">Blog</a></li>
        <li class="nav-item"><a href="../contact.html">Contact</a></li>
      </ul>
      <div class="nav-cta">
        <a href="../contact.html#demo" class="btn btn-primary btn-sm">Book a Demo</a>
        <button class="nav-toggle" id="navToggle" aria-label="Toggle menu"><span></span><span></span><span></span></button>
      </div>
    </nav>
  </div>
</header>

<div class="blog-hero section--dark">
  <div class="container">
    <span class="eyebrow">Knowledge Base</span>
    <h1>Laser Machine Insights</h1>
    <p class="blog-hero__sub">Practical guides on laser marking, welding, cutting, and cleaning for Indian manufacturers. {count_line}.</p>
  </div>
</div>

<div class="section">
  <div class="container">
    <div class="blog-grid">
      {cards_html}
    </div>
  </div>
</div>

<section class="section--tight">
  <div class="container">
    <div class="cta-band">
      <div><h2>Have a Specific Question?</h2><p>Our technical team can advise on the right machine for your application.</p></div>
      <div style="display:flex;gap:14px;flex-wrap:wrap;">
        <a href="../contact.html#demo" class="btn btn-outline-light" style="border-color:#fff;">Book a Demo</a>
        <a href="https://wa.me/918851534795" target="_blank" rel="noopener" class="btn" style="background:#fff;color:var(--red);">WhatsApp Us</a>
      </div>
    </div>
  </div>
</section>

<footer class="site-footer">
  <div class="container">
    <div class="footer-grid">
      <div>
        <a href="../index.html" class="brand"><img src="../images/logo_new.png" alt="Laser Tech Systems and Solutions" /></a>
        <p>New Delhi based specialists in fiber laser marking, welding, cutting, cleaning and bending systems. Service Before Sales.</p>
        <div class="social-row">
          <a href="https://wa.me/918851534795" target="_blank" rel="noopener" aria-label="WhatsApp"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 00-8.5 15.3L2 22l4.8-1.5A10 10 0 1012 2zm0 18a8 8 0 01-4.1-1.1l-.3-.2-3 .9.9-2.9-.2-.3A8 8 0 1112 20zm4.4-5.8c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1-.2.2-.6.8-.8 1-.1.2-.3.2-.5.1-.2-.1-1-.4-1.9-1.2-.7-.6-1.2-1.4-1.3-1.6-.1-.2 0-.4.1-.5l.4-.4c.1-.1.2-.3.2-.4.1-.2 0-.3 0-.5l-.7-1.7c-.2-.4-.4-.4-.5-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 2s.8 2.3.9 2.5c.1.2 1.6 2.4 3.8 3.4.5.2.9.4 1.3.5.5.2 1 .1 1.4.1.4-.1 1.4-.6 1.6-1.1.2-.5.2-1 .1-1.1-.1-.1-.2-.2-.4-.3z"/></svg></a>
          <a href="mailto:info@lasertechsystems.co.in" aria-label="Email"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M2 5a2 2 0 012-2h16a2 2 0 012 2v14a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm2 0l8 6 8-6H4zm16 2.4l-8 6-8-6V19h16V7.4z"/></svg></a>
          <a href="tel:+918851534795" aria-label="Phone"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M6.6 10.8a15.1 15.1 0 006.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.4.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 013 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1l-2.3 2.2z"/></svg></a>
        </div>
      </div>
      <div>
        <h4>Products</h4>
        <ul class="footer-links">
          <li><a href="../products/marking.html">Laser Marking Machines</a></li>
          <li><a href="../products/welding.html">Laser Welding Machines</a></li>
          <li><a href="../products/cutting.html">Laser Cutting Machines</a></li>
          <li><a href="../products/cleaning.html">Laser Cleaning Machines</a></li>
          <li><a href="../products/bending.html">Laser Bending Machines</a></li>
          <li><a href="../products/spares.html">Spares &amp; Consumables</a></li>
        </ul>
      </div>
      <div>
        <h4>Company</h4>
        <ul class="footer-links">
          <li><a href="../about.html">About Us</a></li>
          <li><a href="../about/technical-training.html">Technical Training</a></li>
          <li><a href="../about/pre-sales.html">Pre-Sales Consultation</a></li>
          <li><a href="../library/faqs.html">FAQs</a></li>
          <li><a href="index.html">Blog</a></li>
          <li><a href="../contact.html">Contact Us</a></li>
        </ul>
      </div>
      <div>
        <h4>Get in touch</h4>
        <ul class="footer-links">
          <li>D-13/23, Ground Floor, Sector-7, Rohini, New Delhi - 110085</li>
          <li><a href="tel:+918851534795">+91 88515 34795</a></li>
          <li><a href="https://wa.me/918851534795" target="_blank" rel="noopener">WhatsApp: +91 88515 34795</a></li>
          <li><a href="mailto:info@lasertechsystems.co.in">info@lasertechsystems.co.in</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <span>&copy; <span id="year"></span> Laser Tech Systems and Solutions. All rights reserved.</span>
      <span>GST No. 07AHKPG6062B1ZN</span>
    </div>
  </div>
</footer>

<a href="https://wa.me/918851534795" target="_blank" rel="noopener" class="whatsapp-float" aria-label="Chat on WhatsApp">
  <svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 00-8.5 15.3L2 22l4.8-1.5A10 10 0 1012 2zm0 18a8 8 0 01-4.1-1.1l-.3-.2-3 .9.9-2.9-.2-.3A8 8 0 1112 20zm4.4-5.8c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1-.2.2-.6.8-.8 1-.1.2-.3.2-.5.1-.2-.1-1-.4-1.9-1.2-.7-.6-1.2-1.4-1.3-1.6-.1-.2 0-.4.1-.5l.4-.4c.1-.1.2-.3.2-.4.1-.2 0-.3 0-.5l-.7-1.7c-.2-.4-.4-.4-.5-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 2s.8 2.3.9 2.5c.1.2 1.6 2.4 3.8 3.4.5.2.9.4 1.3.5.5.2 1 .1 1.4.1.4-.1 1.4-.6 1.6-1.1.2-.5.2-1 .1-1.1-.1-.1-.2-.2-.4-.3z"/></svg>
</a>

<script src="../js/main.js"></script>
<script src="../js/v2.js"></script>
<script src="../js/v3.js"></script>
</body>
</html>"""


def main():
    topics = load_json(TOPICS_FILE)
    topic = pick_topic(topics)

    if not topic:
        print("No pending topics found. All topics have been published.")
        sys.exit(0)

    print(f"Generating post: [{topic['id']}] {topic['title']}")

    content = generate_post_content(topic)
    pub_date = datetime.utcnow().strftime("%Y-%m-%d")
    read_time = estimate_read_time(content["html_body"])

    post_html = build_post_html(topic, content, pub_date)
    post_path = BLOG_DIR / f"{topic['slug']}.html"
    with open(post_path, "w", encoding="utf-8") as f:
        f.write(post_html)
    print(f"Saved: blog/{topic['slug']}.html")

    posts = load_json(POSTS_FILE)
    posts.append({
        "slug": topic["slug"],
        "title": content["title"],
        "category": topic["category"],
        "excerpt": content["excerpt"],
        "date": pub_date,
        "read_time": read_time,
    })
    save_json(POSTS_FILE, posts)

    index_html = build_index_html(posts)
    with open(BLOG_DIR / "index.html", "w", encoding="utf-8") as f:
        f.write(index_html)
    print("Updated: blog/index.html")

    for t in topics:
        if t["id"] == topic["id"]:
            t["status"] = "published"
            t["published_date"] = pub_date
    save_json(TOPICS_FILE, topics)
    print(f"Marked topic {topic['id']} as published.")


if __name__ == "__main__":
    main()
