# Contributing to Freegenda

Thanks for your interest in improving Freegenda! This guide explains how to propose changes, report issues, and keep the project healthy.

**Licensing note:** By contributing you agree to the Freegenda GitHub Source-Available License (FGSAL). Keep any forks private and submit changes via pull requests to this repository. Contributions are assigned to the maintainers as described in the license.

## Code of Conduct
Be respectful, constructive, and inclusive. Assume good intent and help others grow. If you see behavior that conflicts with this spirit, please open a confidential issue or contact the maintainer directly.

## Getting Started
1. Create a private fork of the repository and branch from `main` (for example, `feat/activity-filters`). Public distribution of forks or mirrors is not permitted.
2. Clone your fork locally and install any tooling you need (no dependencies are required by default).
3. Run a static server or open `index.html` directly in a browser to develop and verify changes.

## Reporting Issues
- Use the issue tracker to report bugs, accessibility concerns, or feature ideas.
- Include reproduction steps, expected vs. actual behavior, and screenshots or screen recordings where helpful.
- Label issues appropriately (`bug`, `enhancement`, `a11y`, etc.) to streamline triage.

## Pull Requests
- Keep each pull request focused on a single change. Separate refactors from feature work.
- Update documentation and the changelog when you introduce user-visible changes.
- Reference related issues with `Fixes #123` or `Closes #123` when applicable.
- Ensure the UI remains accessible (keyboard navigation, sensible ARIA attributes, readable contrast).

## Coding Guidelines
- Favor clear, descriptive function and variable names over abbreviations.
- Follow the existing formatting style (2-space indentation, single quotes in JavaScript literals where practical).
- Keep logic in `script.js` modular by extracting helpers rather than expanding large functions.
- When editing CSS, test at multiple breakpoints to confirm layout stability.

## Testing
- Manually verify agenda interactions in each view (Day, Week, Month) before opening a pull request.
- Confirm that custom activities can be added, sorted by duration, and scheduled in timeslots.
- Test keyboard flows: navigation buttons, date inputs, form submission, and the `Esc` key for clearing selections.

## Release Process
- Update `CHANGELOG.md` with a new version section that summarizes user-visible changes.
- Bump the version reference (if applicable) and tag the release once merged into `main`.
- Draft release notes that highlight the main improvements and link to any relevant issues.

## Questions?
Feel free to open a discussion thread or ping the maintainer in the issue tracker if anything is unclear. Happy hacking!
