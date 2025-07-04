# Project Brief: Web TimeShaper

## Executive Summary

Web TimeShaper is a revolutionary, AI-powered web application that transforms a user's song and a collection of video clips into a compelling music video narrative. Unlike traditional editors, it acts as a creative partner, analyzing the emotional and structural content of the music and visuals to discover and propose distinct storylines. The user chooses a narrative direction, and the AI assembles a first cut, which can then be refined at a high level, enabling the creation of powerful, story-driven music videos with unprecedented ease.

## Problem Statement

For independent musicians and creative individuals, producing a music video is a complex, time-consuming, and often expensive process. Traditional video editing software requires significant technical skill and a clear vision from the start. It forces the user to manually find connections between their music and visuals, a daunting task that can stifle creativity. There is no tool that can intelligently analyze a creator's raw materials and help them discover the story hidden within. This leaves a gap for a tool that can automate the difficult parts of editing while elevating the user's role to that of a creative director.

## Proposed Solution

The Web TimeShaper application will be an AI-driven narrative engine. The user journey is designed to be simple and creatively empowering:

1. **Simple Input:** The user uploads a single audio file (their song) and a folder of video clips.
2. **AI Narrative Discovery:** The AI analyzes the assets, listening to the song to understand its emotional arc, lyrics, and energy, while simultaneously analyzing the video clips for motion, color, continuity, and subject matter.
3. **The Narrative Crossroads:** Based on its analysis, the AI proposes 2-3 distinct narrative paths for the music video (e.g., "Tragic Love Story," "Happily Ever After," "A Slice of Life").
4. **Story-Based Assembly:** Once the user selects a narrative path, the AI intelligently assembles a complete music video draft that follows the chosen emotional and story structure, using a framework based on proven narrative structures (like the "Save the Cat" beats).
5. **High-Level Refinement:** The user can then review the video and request high-level changes or weave in new elements (such as specific performance clips), acting as a director guiding their AI editor.

## Target Users

Our primary user is "Casey," a creative individual (musician, artist, vlogger) who has produced a piece of music and has a collection of video clips. Casey is passionate about storytelling but may lack the time, budget, or technical expertise for professional video editing software. They are looking for a tool that can help them realize a creative vision quickly and intuitively.

## Goals & Success Metrics

**Business Goal:**

- Establish Web TimeShaper as the leading tool for AI-assisted creative video editing.

**User Success Goal:**

- Enable users to create a compelling, share-worthy music video narrative in under an hour.

**Key Performance Indicators (KPIs):**

- Number of videos created and exported
- User retention rate (users returning to create new projects)
- Average session time for active users

## MVP Scope

To validate the core concept quickly, the Minimum Viable Product (MVP) will focus exclusively on the core narrative generation.

### Core Features (Must Have)

### Feature 1: Media Upload

- Simple interface to upload one audio file (.mp3, .wav)
- Ability to select and upload multiple video files (.mp4)
- Display selected files in a list before processing

### Feature 2: Core AI Analysis

- Basic analysis of the audio's tempo
- Analysis of the audio's energy
- High-level visual analysis of the video clips

### Feature 3: Narrative Choice

- Presentation of three pre-defined narrative archetypes for the user to choose from
- Short, evocative description for each option
- Capture of the user's selection

### Feature 4: Automated Assembly

- AI generates a single, non-editable "first cut" of the video based on the user's choice
- Synchronization of the user's original audio with the new video sequence

### Feature 5: Video Export

- Export button for the final video
- Export the final video as a single .mp4 file

## Out of Scope for MVP

- Granular, beat-by-beat editing or timeline manipulation
- AI-powered video generation to fill gaps
- Advanced controls for weaving in performance pieces
- Advanced color grading or visual effects
- Multiple export formats or social media integration

## Post-MVP Vision

- Introduce the "Beat Sheet" timeline for high-level editing and refinement
- Allow the AI to present multiple versions of specific story beats for the user to choose from
- Implement AI video generation (e.g., style transfer, abstract visuals) to fill narrative gaps
- Develop advanced tools for "weaving" in specific clips (like performances) with more user control
- Expand the library of narrative archetypes and editing styles

## Technical Considerations

Initial thoughts based on the provided engineering checklists. These are not final decisions and are subject to the Architect's review.

- **Frontend:** SvelteKit v5 (Runes) with Tailwind CSS for rapid UI development
- **Canvas/Visuals:** Konva.js for any potential canvas-based interactions
- **Media Processing:** The application will rely heavily on modern browser APIs like the Web Audio API (AudioWorklet) for music analysis and WebCodecs for video processing
- **Offline/Heavy Lifting:** FFmpeg.wasm will likely be required for any intensive video transcoding or manipulation that cannot be handled by WebCodecs

## Risks & Open Questions

- **Primary Risk:** The complexity of the core AI narrative engine is the biggest technical challenge. The MVP analysis will need to be simplified significantly while still providing a "magical" result.
- **Open Question:** How do we best visualize the "Narrative Crossroads" choices to the user in a way that is clear and compelling? (e.g., with titles, descriptions, representative thumbnails, or short "trailers").

