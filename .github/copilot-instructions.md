<!-- Workspace Copilot instructions - generated from init.prompt.md -->
# Copilot Instructions for todo-app

Purpose
-------
Provide concise guidance so Copilot / AI assistants can be productive in this small static frontend repo.

Quick start
-----------
- Serve locally: `python -m http.server 8000` and open `http://localhost:8000`.
- Or open `index.html` in a browser for a quick preview.

Project structure
-----------------
- `index.html` — main app UI.
- `login.html` — login page.
- `login.js` — login page script.
- `script.js` — app frontend logic.
- `style.css` — styles.

Conventions & scope
-------------------
- This repository is a small static frontend; there is no backend or build step.
- Tests and CI are not present.
- Keep changes minimal and focused on HTML/CSS/JS.

How to use Copilot Chat effectively
----------------------------------
- Ask for specific code edits (file + brief change). Example: "Update `script.js` to persist todos in localStorage." 
- When requesting new features, include desired user flows and where to change UI.

Example prompts
---------------
- "Add a 'clear completed' button and implement its handler in `script.js`."
- "Make the login page (`login.html`) validate email format and show an inline error message."
- "Refactor `script.js` to separate DOM rendering and data logic into two functions."

Next suggested customizations
---------------------------
- Add an `AGENTS.md` or expand this file with `applyTo` rules for frontend-only tasks.
- Add a short `README.md` with the same quick-start and browser support notes.

If you want, I can:
- create the `AGENTS.md` with `applyTo` filters for `*.html`/`*.js` work,
- implement one of the example prompts as a live change.

Contact
-------
If anything is unclear, ask here in the repo chat and include the exact file path and change request.
