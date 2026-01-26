Complia Financial Promotion Agent (CFPA) is a regulatory control and assurance platform that maps 60+ UK financial promotion obligations (FSMA, COBS, PRIN 2A, PERG, SYSC, SM&CR) to testable control objectives, automated agents, and FCA‑defensible audit evidence.
​

Vision

CFPA is not a faster approval workflow or keyword scanner. It is regulatory control infrastructure that turns financial promotions from audit‑trail liabilities into evidence‑rich control artifacts regulators can rely on.
​

Key outcomes:

Systematic control testing before and at approval (and post‑approval in Phase 2).

SYSC 9‑compliant, WORM‑backed audit trail for 7+ years.

SM&CR‑grade sign‑off evidence for CF30/SMF roles.

Scalable AR network governance across 10–50+ Appointed Representatives.
​

Core Capabilities
CFPA implements a multi‑agent control engine aligned to UK financial promotion obligations.
​

8 Regulatory Control Agents
Agent 1 – Target Market Classifier
Classifies audience (Retail / Professional / Eligible Counterparty) and hard‑stops if undefined (COBS 1.2R, PROD 3.2.1R).
​

Agent 2 – Data Consistency Verifier
Cross‑references marketing claims against “truth sources” (KIID, factsheet, Excel) and flags mismatches (COBS 4.2.1R).
​

Agent 3 – Visual Prominence Analyzer
Scores risk warning placement using PDF/OCR coordinates and flags warnings buried at the bottom of the page (COBS 4.5.2R).
​

Agent 4 – Consumer Duty & Readability
Scores readability, flags jargon, and tests suitability indicators under PRIN 2A (baseline heuristic → FinBERT fine‑tuned).
​

Agent 5 – AR Governance
Validates AR permissions in real time against the FCA Register and enforces prohibited terms and audience restrictions (PERG 8, FSMA s.21).
​

Agent 6 – Mandatory Disclosure Scanner
Detects FSCS, capital‑at‑risk, and past‑performance disclaimers via patterns/NER (COBS 4.6).
​

Agent 7 – LLM Orchestrator
Synthesizes all agent results into a regulatory analysis, assigns RED/AMBER/GREEN status, and cites relevant FCA rules.
​

Agent 8 – Immutable Audit Trail
Writes an HMAC‑chained Evidence Pack to Google Cloud Storage Bucket Lock for 7‑year WORM retention (SYSC 9).
​

Key Features
Obligation‑to‑Control Mapping
60+ FCA obligations mapped to deterministic control objectives and test procedures instead of generic “themes.”
​

Multi‑Checkpoint Controls

Pre‑approval: automated checks for claims, risk warnings, readability, audience suitability.

At approval: CF30/SMF sign‑off with digital attestation and evidence lock.

Post‑approval (Phase 2): drift detection, re‑testing, and attestation automation.
​

FCA‑Defensible Evidence Packs
One‑click export that shows: which controls ran, the results, who approved, when, and on what basis, with a 7‑year immutable log.
​

AR Network Governance
Central permission matrix and blocking of out‑of‑scope promotions at submission time, with centralized AR risk reporting.
​

Architecture Overview
At a high level CFPA consists of:
​

Frontend: Workflow UI for submissions, review, overrides, and CF30 sign‑off.

Control Engine: 8 specialized agents plus an LLM orchestration layer (Gemini‑3) running control tests in parallel.

Evidence Layer: Evidence Pack JSON plus hash chain stored in GCS Bucket Lock with 7‑year retention.

Integration Layer: FCA Register API, data substantiation sources (e.g. factsheets), and downstream reporting/export.
​

Core design principles:

Deterministic control logic where possible (regex, rules, NER), LLMs only for synthesis and edge cases.

Immutable, queryable audit history for all tests, overrides, and sign‑offs.

Per‑tenant configuration of thresholds, policies, and AR permission matrices.
​

Getting Started
Note: Replace placeholder commands and env vars with your actual stack (e.g. Next.js/Node, Python services).

Prerequisites
Node.js and package manager (npm, pnpm, or yarn).

Access to:

Google Cloud project with GCS Bucket Lock enabled (for audit trail).

LLM provider credentials (e.g. Gemini‑3 Pro / Flash).

FCA Register API or equivalent AR status feed.
​

Installation
bash
git clone https://github.com/<org>/complia-financial-promotion-agent.git
cd complia-financial-promotion-agent

# Install dependencies
npm install

# or
yarn install
Configuration
Set environment variables (for example via .env.local):

bash
# LLM / Orchestrator
LLM_PROVIDER_API_KEY=<your_llm_key>

# Google Cloud / Audit Trail
GCP_PROJECT_ID=<project_id>
GCS_AUDIT_BUCKET=cfpa-evidence-archive
GCS_BUCKET_RETENTION_YEARS=7

# FCA / AR Governance
FCA_REGISTER_API_KEY=<key>
These values must align with the SYSC 9 requirements and the GCS Bucket Lock configuration defined in the PRD (7‑year hold, Compliance Mode, full access & deletion logging).
​

Running Locally
bash
# Start dev server
npm run dev

# or
yarn dev
Then open your browser at http://localhost:3000 (adjust if your framework differs).

Testing
CFPA’s UAT strategy is designed to validate both technical accuracy and regulatory defensibility:
​

3‑firm UAT cohort (principal firm, asset manager, wealth advisory).

50–60 real promotions across different use cases.

Agent‑level success criteria (e.g. Agent 2 ≥98% claim extraction accuracy, Agent 3 ≥95% prominence accuracy on digital PDFs).
​

Example commands (adapt to your stack):

bash
# Unit tests
npm test

# Linting
npm run lint

# End-to-end / integration tests
npm run test:e2e
Roadmap
High‑level roadmap as defined in the PRD:
​

Phase 1 (Q1–Q2 2026):

UAT with 3 firms, 50–60 promotions.

Production launch with 5+ beta customers.

Target: 20+ customers and £800k+ ARR run‑rate by end of Q2.
​

Phase 2 (Q3–Q4 2026):

Post‑publication monitoring (web, LinkedIn, RNS).

Consumer Duty outcome testing agent.

ESG substantiation and attestation automation.
​

Phase 3 (2027):

EU MiFID II and non‑investment regimes (ICOBS, MCOB).

API ecosystem and integrations (CMS, design tools, investor portals).
​

Contributing
Contributions should preserve CFPA’s core regulatory guarantees:

No changes that weaken SYSC 9 auditability or SM&CR evidencing.

New controls must reference specific FCA obligations and have clear testable objectives.

UX changes must keep CF30 / compliance officer workflows transparent and explainable.
​

Proposed changes should be raised via:

Issue describing the problem, regulatory context, and proposed solution.

PR linked to the issue, including tests and, where relevant, updated control logic documentation.
<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1Bh498LcUkDUrWy3bPrxBrXjSK9kA0H6U

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
