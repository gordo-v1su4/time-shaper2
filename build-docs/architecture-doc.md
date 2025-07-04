# Full-Stack Architecture (JS Version)

## Web TimeShaper Fullstack Architecture Document (v1.1 - JS Version)

### Introduction

This document outlines the complete fullstack architecture for the Web TimeShaper application. Given the project's nature, this is primarily a client-side architecture, with all significant processing handled within the user's browser. It serves as the single source of truth for AI-driven development, ensuring consistency across the entire technology stack.

### Starter Template or Existing Project

This is a greenfield project. We will use the standard SvelteKit starter template (`pnpm create svelte@latest`) as a foundation, configured for JavaScript with JSDoc type-checking. This aligns with the technology choices outlined in the initial project checklists.

### High Level Architecture

#### Technical Summary

Web TimeShaper is architected as a high-performance, browser-based application that leverages modern web APIs for all core functionality. The architecture is designed for privacy and cost-effectiveness by performing all audio analysis, video processing, and rendering on the client side. The system is broken into distinct services for audio, video, and state management, with a reactive UI built in SvelteKit that reflects the application's state.

#### Platform and Infrastructure Choice

- **Platform:** Vercel or Cloudflare Pages.
- **Key Services:** Static hosting, Edge CDN.
- **Rationale:** As a fully client-side application, there is no need for a traditional backend server. A static hosting platform provides optimal performance, global distribution via CDN, and zero server-side operational costs, which aligns perfectly with the project's requirements.
- **Crucial Requirement:** The hosting platform MUST support setting custom HTTP headers for Cross-Origin Isolation (`Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp`) to enable SharedArrayBuffer, which is a dependency for ffmpeg.wasm.

### Repository Structure

- **Structure:** Monorepo.
- **Rationale:** While the initial project is a single application, a monorepo structure (managed via pnpm workspaces) is forward-thinking. It will allow for easy addition of shared libraries (e.g., for custom analysis logic) or other packages in the future.

### High Level Architecture Diagram

```mermaid
graph TD
    subgraph User's Browser
        User -- Interacts with --> UI_Views[UI Views (SvelteKit)]
        UI_Views -- Manages --> StateService[State Service (Runes)]
        UI_Views -- Calls --> AudioEngine[Audio Engine Service]
        UI_Views -- Calls --> VideoEngine[Video Engine Service]
        UI_Views -- Calls --> RenderingEngine[Rendering Engine]
        AudioEngine -- Uses --> WebAudioAPI[Web Audio API / AudioWorklet]
        VideoEngine -- Uses --> WebCodecsAPI[WebCodeacs API]
        RenderingEngine -- Uses --> FFmpegWasm[FFmpeg.wasm]
        StateService -- Notifies --> UI_Views
    end
    style User_s_Browser fill:#222,stroke:#333,stroke-width:2px,color:#fff
```

### Architectural Patterns

- [ ] **Service-Oriented Client:** The application's core logic is encapsulated in distinct, framework-agnostic services (AudioEngine, VideoEngine, RenderingEngine). This separates concerns and makes the logic easier to test and maintain.
- [ ] **Reactive UI:** The SvelteKit UI will be purely reactive. It will read from a central state service and will not contain business logic. This creates a predictable and performant user interface.

### Tech Stack

| Category           | Technology         | Version | Rationale                                                                 |
|--------------------|-------------------|---------|---------------------------------------------------------------------------|
| Language           | JavaScript (ESNext)| Latest  | Pure JS for maximum compatibility with Svelte 5 Runes. JSDoc for types.   |
| Framework          | SvelteKit         | ~5.0    | High-performance, great developer experience.                             |
| UI Library         | Bits UI & shadcn-svelte | Latest  | Headless, accessible, fully stylable for custom "DAW" look.              |
| Styling            | Tailwind CSS      | Latest  | Utility-first CSS for rapid, consistent styling.                          |
| Canvas             | Konva.js          | Latest  | 2D canvas for complex UI (Narrative Map view).                            |
| Audio Processing   | Web Audio API     | Native  | High-performance, low-level audio analysis.                               |
| Video Decoding     | WebCodecs API     | Native  | Efficient video frame decoding and analysis.                              |
| Video Rendering    | FFmpeg.wasm       | Latest  | In-browser video manipulation and encoding.                               |
| Unit Testing       | Vitest            | Latest  | High-performance test runner for SvelteKit.                               |
| E2E Testing        | Playwright        | Latest  | Robust end-to-end testing tool for SvelteKit.                             |

### Data Models

All data models are defined using JSDoc for type-checking in a pure JavaScript environment.

```js
// src/lib/types.js
/**
 * @typedef {{
 *   id: string;
 *   fileHandle: File;
 *   name: string;
 *   type: 'audio' | 'video';
 * }} MediaFile
 */
/**
 * @typedef {MediaFile & {
 *   type: 'audio';
 *   duration: number;
 *   analysis?: {
 *     bpm: number;
 *     energy: ('low' | 'medium' | 'high')[];
 *   };
 * }} AudioTrack
 */
/**
 * @typedef {MediaFile & {
 *   type: 'video';
 *   duration: number;
 *   analysis?: object;
 * }} VideoClip
 */
/**
 * @typedef {{
 *   id: 'tragic' | 'happy' | 'slice-of-life';
 *   title: string;
 *   description: string;
 * }} NarrativeChoice
 */
/**
 * @typedef {{
 *   audioTrack: AudioTrack | null;
 *   videoClips: VideoClip[];
 *   selectedNarrative: NarrativeChoice | null;
 *   status: 'empty' | 'loading' | 'analyzing' | 'choosing' | 'rendering' | 'done';
 * }} ProjectState
 */
```

### REST API Spec

Not applicable for the MVP. The application is fully client-side and does not communicate with a backend API.

### Source Tree

The project will follow a standard SvelteKit structure with a clear separation for our core services, using `.js` file extensions.

```
web-timeshaper/
├── static/
│   └── audio/
│       └── time-shaper-processor.js  # The AudioWorklet processor
├── src/
│   ├── lib/
│   │   ├── components/               # Custom UI components (Tabs, Modals, etc.)
│   │   ├── services/                 # Core application logic
│   │   │   ├── AudioEngine.js        # Manages Web Audio API
│   │   │   ├── VideoEngine.js        # Manages WebCodecs
│   │   │   ├── RenderingEngine.js    # Manages FFmpeg.wasm
│   │   │   └── StateService.js       # Manages application state with Runes
│   │   ├── styles/                   # Global CSS, custom fonts
│   │   └── types.js                  # JSDoc type definitions
│   ├── routes/                       # Application pages/views
│   │   ├── +layout.svelte            # Main layout
│   │   ├── +page.svelte              # Main application view container
│   │   └── ...
│   └── app.html
├── tests/
│   ├── services/                     # Unit tests for our engines
│   └── e2e/                          # Playwright tests for user flows
├── package.json
├── svelte.config.js
└── jsconfig.json                     # JS project configuration
```

### Infrastructure and Deployment

#### Infrastructure as Code

Not applicable for a client-side only project.

#### Deployment Strategy

- [ ] **Strategy:** Continuous Deployment via Git.
- [ ] **CI/CD Platform:** Vercel or Cloudflare Pages integrated with GitHub.
- [ ] **Pipeline:**
  - [ ] Push to main branch: Triggers a new deployment.
  - [ ] Build: The platform runs `pnpm install` and `pnpm build`.
  - [ ] Deploy: The resulting build directory is deployed to the global edge network.

### Testing Strategy and Standards

- [ ] **Unit Tests:** Vitest will be used to test the core logic within each service (AudioEngine, VideoEngine, etc.) in isolation. Mocks will be used for browser APIs.
- [ ] **Component Tests:** Svelte's component testing library will be used to verify that UI components render correctly and respond to state changes.
- [ ] **End-to-End Tests:** Playwright will script user journeys, such as uploading files, selecting a narrative, and verifying that a video is generated and can be downloaded.