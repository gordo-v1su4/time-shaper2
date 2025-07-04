# Product Requirements Document (PRD)

## Web TimeShaper Product Requirements Document (PRD)

### Goals and Background Context

#### Goals

- [ ] **User Goal:** Enable creative individuals to produce a compelling, narrative-driven music video from their raw materials with minimal technical effort.
- [ ] **Product Goal:** To have the AI act as a creative partner, intelligently assembling video drafts based on a chosen narrative theme, thus moving beyond the capabilities of traditional timeline-based editors.
- [ ] **Business Goal:** Establish Web TimeShaper as the premier tool for AI-assisted creative video editing by providing a unique, story-focused workflow.

#### Background Context

The core problem this PRD addresses is the significant barrier to entry—in terms of time, cost, and technical skill—for creating high-quality music videos. Independent artists often have the raw visual and audio assets but lack the tools to weave them into a coherent story. Web TimeShaper aims to solve this by automating the most laborious parts of the editing process and focusing the user's effort on high-level creative direction.

### Requirements

#### Functional

- [ ] **FR1:** The system must allow users to upload one audio file and multiple video files.
- [ ] **FR2:** The system's AI must perform a basic analysis of the audio's tempo and the visual content of the clips.
- [ ] **FR3:** The system must present the user with at least three distinct narrative archetypes to choose from.
- [ ] **FR4:** The system must automatically generate a single, complete video sequence based on the user's chosen narrative.
- [ ] **FR5:** The system must allow the user to preview the generated video.
- [ ] **FR6:** The system must allow the user to export the final video in .mp4 format.

#### Non-Functional

- [ ] **NFR1:** All media processing and analysis should occur on the client-side to ensure user privacy and reduce server costs.
- [ ] **NFR2:** The user interface must be responsive and functional on modern web browsers on desktop platforms.
- [ ] **NFR3:** The application should provide clear feedback during long-running processes like media analysis and video rendering.

### User Interface Design Goals

#### Overall UX Vision

The user experience should feel like a creative collaboration. The UI will be minimalist, focusing the user on making high-level creative choices rather than managing a complex timeline. The app should feel intuitive, "magical," and empowering.

#### Key Interaction Paradigms

The user flow is a simple, three-step process:

1. [ ] **Upload:** User provides all media assets in one go.
2. [ ] **Direct:** User makes a single, high-impact creative choice (the narrative).
3. [ ] **Review:** User watches and exports the final product.

#### Core Screens and Views

- [ ] **Media Upload Screen:** A clean, drag-and-drop interface for the song and video clips.
- [ ] **Narrative Choice Screen:** A visually engaging screen presenting the 2-3 narrative options for the user to select.
- [ ] **Review & Export Screen:** A screen featuring a large video player for the final creation and a clear "Export" button.

#### Branding

The aesthetic should be clean, modern, and professional, befitting a creative tool. A dark mode is preferred to make visual content stand out.

#### Target Device and Platforms

The MVP will target desktop web browsers, with a responsive layout for various screen sizes.

### Technical Assumptions

- [ ] **Repository Structure:** Monorepo
- [ ] **Service Architecture:** Client-side, single-page application (SPA). No backend services for the MVP; all logic and processing handled in the browser using JavaScript and WebAssembly.

#### Testing requirements

- [ ] **Unit tests** for core logic (e.g., AI analysis rules)
- [ ] **End-to-end tests** for the primary user flow (upload → choose → export)

#### Additional Technical Assumptions and Requests

- [ ] The project will heavily utilize client-side processing to maintain user privacy and avoid server costs. This requires leveraging modern browser APIs.
- [ ] The initial technology stack will be based on the preferences noted in the Project Brief.

---

## Epics & Story Points Checklist

### Epic 1: Project Foundation & Media Ingestion

- [ ] **Goal:** Establish the core project structure and enable users to upload their audio and video files into the application.

#### Story 1.1: Project Scaffolding

- [ ] As a developer, I want a new SvelteKit project initialized with TypeScript and Tailwind CSS, so that I have a clean foundation to build upon.
  - [ ] A new SvelteKit project is created.
  - [ ] Tailwind CSS is configured and functional.
  - [ ] The project is committed to a Git repository.

#### Story 1.2: Media Upload UI

- [ ] As a user, I want a simple interface where I can select one audio file and multiple video files from my computer.
  - [ ] The UI displays a clear area for audio file selection.
  - [ ] The UI displays a clear area for selecting a folder or multiple video files.
  - [ ] Selected files are displayed in a list before processing.

#### Story 1.3: Client-Side File Handling

- [ ] As a user, I want the selected media files to be loaded into the browser, so they are ready for AI analysis.
  - [ ] The audio file is loaded into an AudioBuffer.
  - [ ] Video files are loaded and accessible by the application.
  - [ ] The UI provides feedback when loading is complete.

### Epic 2: AI Narrative Engine & Generation

- [ ] **Goal:** Implement the core AI logic to analyze media, present narrative choices, and generate a video draft.

#### Story 2.1: Basic Audio Analysis

- [ ] As the AI, I want to analyze the uploaded audio to identify its primary tempo and overall energy level, so that I can use this data for editing decisions.
  - [ ] The system can extract an estimated BPM from the audio.
  - [ ] The system can classify sections of the song as "low," "medium," or "high" energy.

#### Story 2.2: Narrative Selection UI

- [ ] As a user, I want to be presented with three distinct narrative choices after my media is analyzed, so that I can direct the creative vision of my video.
  - [ ] A screen displays three clickable options (e.g., "Tragic," "Happy," "Slice of Life").
  - [ ] Each option has a short, evocative description.
  - [ ] The user's selection is captured by the application.

#### Story 2.3: MVP "Smart Cut" Logic

- [ ] As the AI, I want to select and order video clips based on the user's chosen narrative, so that I can create a coherent video draft.
  - [ ] The AI uses a set of hardcoded rules to map narrative choice to clip characteristics (e.g., "Happy" uses brighter, more stable clips).
  - [ ] The AI uses the audio energy data to influence the pacing of the selected clips.
  - [ ] A final list of video clips, in order, is produced.

### Epic 3: Video Rendering & Export

- [ ] **Goal:** Enable the user to watch the AI-generated music video and export it as a downloadable file.

#### Story 3.1: Video Assembly & Preview

- [ ] As a user, I want to see the final, assembled music video in a video player, so I can review the AI's creation.
  - [ ] The ordered clips from the "Smart Cut" logic are stitched into a single video stream.
  - [ ] The user's original audio is synchronized with the new video sequence.
  - [ ] The complete video plays smoothly in a standard HTML5 video player.

#### Story 3.2: Final Export

- [ ] As a user, I want to download my finished music video as an .mp4 file, so that I can share it.
  - [ ] An "Export" button is present on the review screen.
  - [ ] Clicking the button initiates a client-side render of the video.
  - [ ] The user is prompted to download a single, correctly formatted .mp4 file.

---

## Checklist Results Report

This section will be populated after the PRD is approved and the PM-Checklist has been executed against it.

---

## Next Steps

**Architect Prompt:**
> Based on this PRD, please design a comprehensive technical architecture for the Web TimeShaper application. The architecture should be entirely client-side, detailing the integration of SvelteKit, Web Audio API, WebCodecs, and potentially FFmpeg.wasm. Please provide a clear plan for managing media state, handling client-side processing, and structuring the code within a monorepo.