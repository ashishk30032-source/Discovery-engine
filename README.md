# Retrieval Insights Engine (Google Photos Search Discovery)

> An AI-powered qualitative research intelligence tool designed for Product Managers to analyze user complaints, bug reports, and forum feedback concerning **Google Photos search and retrieval failures**.

![Status](https://img.shields.io/badge/Status-Complete-success?style=flat-square)
![Stack](https://img.shields.io/badge/Stack-React_18_%7C_Tailwind_CSS_%7C_Babel-blue?style=flat-square)
![LLM](https://img.shields.io/badge/LLM-Gemini_2.5_Flash_%2F_1.5_Flash-orange?style=flat-square)
![Hosting](https://img.shields.io/badge/Deploy-GitHub_Pages_Ready-2ea44f?style=flat-square)

---

## 📸 Overview

When users can't find their photos, the failure is rarely a technical index error—it is an **episodic memory mismatch**. Humans recall relative events, emotions, composition, and people combinations (*"that weekend before Thanksgiving"*, *"the yellow car outside the diner"*), while search engines often look for literal calendar stamps and discrete labels.

The **Retrieval Insights Engine** ingests raw user feedback (Play Store reviews, Reddit threads from `r/googlephotos`, forum questions, interview transcripts) and applies LLM synthesis to extract:
1. **Distinct Failure Themes**: Grouped by cognitive and technical failure modes.
2. **Memory Breakdown**: Contrast between **What User DID Remember** vs. **What User Was MISSING**.
3. **Verbatim Evidence**: Real quotes pulled directly from the feedback text.
4. **Reported Workarounds**: Extreme friction behaviors (e.g. *"scrolled for 30 minutes manually"*, *"gave up and asked friend to text photo"*).
5. **Ranked Opportunity Comparison Table**: Sortable by Frequency, Severity, and Theme Name with root-cause hypotheses.
6. **Top 3 Strategic Opportunities**: Executive briefing for product and engineering leadership.

---

## 🚀 Live Demo & Zero-Build Architecture

This application is built as a **zero-build Single Page Application (SPA)** that runs natively on **GitHub Pages** or any static host:
- **No Node.js or build step required**: React 18, Babel Standalone, and Tailwind CSS 3 are loaded via modern CDNs.
- **Works offline or without API keys**: Includes a dynamic heuristic thematic analyzer that evaluates real pasted text immediately.
- **Optional Live Cloud Intelligence**: Add your own Google Gemini API key (via Google AI Studio) in the in-app settings modal. Your API key is stored only in browser `localStorage` and is **never** committed or transmitted elsewhere.

---

## 📁 Repository Structure

```
google-photos-retrieval-insights/
├── index.html        # Entry point configuring CDNs, layout, and mounting React
├── app.jsx           # Main React application component (Dashboard, Table, Quote Cards, Filters)
├── llmService.js     # Gemini API integration and local dynamic discovery engine
├── sampleData.js     # Curated real-world feedback datasets (12 mixed reviews, temporal, sensory)
├── .gitignore        # Ignores sensitive environment variables, caches, and system files
└── README.md         # Documentation and usage guide
```

---

## 🛠️ Getting Started Locally

### Option 1: Direct File Opening
Simply double-click `index.html` or open it in Google Chrome, Microsoft Edge, or Firefox.

### Option 2: Local Static Server
If you prefer running a local HTTP server:
```bash
# Using Python
python -m http.server 3000

# Using Node / npx
npx serve .
```
Then visit `http://localhost:3000`.

---

## 💡 How to Use

1. **Paste Feedback**: Paste raw reviews separated by blank lines into the input area, or click one of the **Preload sample** buttons to try curated datasets.
2. **Analyze**: Click **"Analyze Feedback with LLM"**.
3. **Explore Dashboard**:
   - Inspect the **Top 3 Opportunity Areas** executive summary.
   - Sort the **Ranked Opportunity-Comparison Table** by Frequency, Severity, or Theme Name.
   - Click any row to expand the verbatim user quotes, root-cause hypothesis, and memory gap analysis.
4. **Export Findings**:
   - Click **"Copy as text"** to grab a Markdown executive briefing formatted for Slack or Google Docs.
   - Click **"Copy results as JSON"** for programmatic consumption.
   - Click **"CSV"** to download a spreadsheet report.

---

## 🔒 Security & Privacy

- **No Hardcoded Keys**: The repository contains no API keys or secrets.
- **Client-Side Processing**: Any entered Gemini API key stays strictly on your local browser machine via `localStorage`.

---

## 📄 License
MIT License
