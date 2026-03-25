---
name: "webtestskills"
description: "Executes frontend testing (unit, component, e2e) and checks for UI rendering or accessibility issues. Invoke when user asks to test frontend interface."
---

# Web Test Skills

This skill helps you test frontend web interfaces automatically.

## When to Use
- User asks to test the frontend interface.
- User wants to run component tests or end-to-end (e2e) tests.
- User requests visual UI checks, responsiveness testing, or accessibility checks.

## Usage Guidelines
1. **Identify Framework**: Check the project for testing frameworks (e.g., Playwright, Cypress, Jest, Vitest).
2. **Run Tests**: Execute the test commands (e.g., `npm run test:e2e` or `npx playwright test`).
3. **Report Issues**: If tests fail, summarize the failures and suggest fixes.
4. **Visual & UI Checks**: If running a dev server, you can check the DOM and CSS rendering to identify any uncoordinated or broken UI elements.
