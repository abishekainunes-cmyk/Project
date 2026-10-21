Purpose: Bypasses strict anti-bot captchas by handling the heavy lifting locally—taking a single product seed name, using Generative AI to craft descriptions, features, applications, and keywords, generating visuals, filling the PDF catalog template, and preparing the exact text fields for manual or semi-automated posting.

Tech Stack: Python, Google Gemini API / OpenAI API, Pillow (PIL) / OpenCV for image processing, ReportLab (for PDF catalog generation).

Key Features:

    AI Content Synthesis: Input a single product name to automatically generate 5 descriptive angles/image concepts, rich product descriptions, key features, industrial applications, and high-ranking search keywords.

    Catalog Auto-Assembly: Automatically drops product assets and names into a standardized master PDF template.

    Security Workaround: Explicitly documents how it solves the IndiaMART automation bottleneck—automating the asset generation and template preparation phases locally to streamline manual uploading when captchas block full browser automation.
