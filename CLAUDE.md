# Project: "Future-Commit" AI Version Control System (Demo MVP)

## Overview
A novel version control system built for creative prototyping and text generation. Instead of just tracking past changes, it predicts and generates "future commits." It allows users to visually explore AI-generated branches, adjust directions via prompts, and merge/blend different branches to create a final document. 

## Core Demo Features
* **Future Branching:** AI generates multiple upcoming commits/branches based on deterministic models or user prompts.
* **Branch Blending (Cherry-Picking):** UI to merge or blend aspects from different AI-generated branches into the main working path.
* **Granular Prediction:** Ranges from high-level full-branch generation down to localized inline text completions within a single commit.
* **Partial Locking:** Ability to highlight and lock specific sections of text from being altered by AI generations.
* **Modular UI:** Container-based split views, specifically needing:
  * A central text editor view.
  * A visualizer displaying the commit tree (past, current, and suggested future commits).
* **Advanced Visualizations:** Support for rendering selected content (e.g., graphs, 3D models, or LaTeX math representations).
* **Modular "Skills":** Downloadable presets/plugins tailored for specific tasks (e.g., diagramming, creative writing, cold outreach).

## Technical Architecture Context
* **Core Stack:** React and Vite, structured as a local Monorepo.
* **Backend (The "Git Manager"):** A local backend that exposes a simple API. It needs to handle programmatic Git operations (branching, merging, committing) so that both the frontend UI and the separate AI prediction backend can easily manipulate the repository. 
* **Frontend:** Needs to support diffing, split panes, and interactive graph visualizations seamlessly within the React/Vite ecosystem.

## Current Objective
Please recommend the best open-source libraries (e.g., React components, Node.js Git wrappers like `isomorphic-git`, editor engines like Monaco, and graph visualizers) to quickly prototype this frontend and backend. I need to know what to download, how to optimally structure the Vite monorepo for this, and how to wire up the core branching/merging API.