---
description: "Generate a comprehensive enterprise test strategy from Solution Design, Product Catalog, and requirements documents. Use for risk-based QA planning, security/performance validation, governance, and traceability." 
mode: "agent"
tools: [read, search]
---

# Startergist Test Strategy Prompt

Use this prompt when you need a fully structured enterprise-grade test strategy based on product design and requirement artifacts.

## Goal
Produce a practical, implementation-ready Test Strategy document covering:
- Product understanding and scope
- Functional and non-functional testing coverage
- Risk analysis and security posture
- Integration, data, API, regression, and UAT considerations
- Environment and test data strategy
- Entry/exit criteria
- Defect management and reporting
- Metrics and governance

## Inputs to analyze
- Solution Design Document
- Product Catalog Documentation
- Functional requirements or user stories
- Integration/API documentation if available

## Required output sections
1. Executive Summary
2. Product Understanding
3. Scope and Objectives
4. Risks and Priorities
5. Functional Test Types
6. Non-Functional Test Types
7. API, Data, and Integration Validation
8. Key Focus Areas for Validation
9. Test Environment and Data Strategy
10. Test Levels and Approach
11. Entry and Exit Criteria
12. Defect Management Strategy
13. Reporting and Governance
14. Metrics and KPI Dashboard
15. Open Issues and Assumptions

## Quality bar
- State assumptions separately from facts
- Highlight high-risk areas with impact/likelihood
- Include OWASP-aligned and data-protection considerations
- Keep the output enterprise-ready, highly structured, and stakeholder friendly
- Prefer evidence-based statements tied to the documents provided

## Output format
Deliver the result as a polished Markdown document with headings, bullet lists, tables where useful, and an appendix or traceability matrix if the sources support it.
