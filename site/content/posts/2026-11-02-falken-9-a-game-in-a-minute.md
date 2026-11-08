---
title: Falken-9: a whole AI-vs-AI game in just over a minute
date: 2026-11-02
project: falken-9
images:
  - src: /img/projects/falken-9.jpg | Crystal Palace 9 title screen on the Commodore 64 | 640 | 320 | pixel
  - src: /img/posts/falken-9-tensor-workflow.jpg | Falken-9 tensor workflow: decoded weights for each layer, from the board embeddings through attention, the router and four experts to the output | 1200 | 897
link: https://github.com/lewismoten/falken-9/blob/main/report.md
linklabel: Read the Falken-9 research report
---
Crystal Palace 9, my Commodore 64 tic-tac-toe game, now runs on Falken-9, a new model I trained for the C64's arithmetic and memory from the start. The whole 5,195-byte model stays in RAM, so a complete AI-vs-AI game takes just over a minute in an emulator. The earlier model took about 20 minutes.

The second picture is the tensor workflow: every decoded weight, from the board embeddings through attention, the router and the four experts. The research report probes the network with interventions and charts what it found.
