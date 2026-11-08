---
title: THE CHEZ: running the engine from npm in a separate project
date: 2026-11-08
project: gamemaker-sandbox
images:
  - src: /img/posts/the-chez.png | THE CHEZ, a tomato-red CitiCar, drawn in pixel art | 120 | 56 | pixel
link: https://lewismoten.github.io/the-chez/
linklabel: Open THE CHEZ
---
THE CHEZ is a small Vite and TypeScript app that tests whether the Game-Maker Sandbox engine can be installed from npm and run in a project of its own. Its bundled sample game, The Stripe Hypothesis, is there to prove the integration: Doc Leo swears racing stripes make THE CHEZ faster, Teddy has doubts, and the speedometer gets the last word.

Version 0.2.0 now takes the engine, archive, and tools packages from npm. The game downloads as one ZIP and is unpacked by the archives package.
