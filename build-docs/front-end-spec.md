# UI/UX Specification

## Web TimeShaper UI/UX Specification

### Introduction

This document defines the user experience goals, information architecture, user flows, and visual design specifications for the Web TimeShaper application. It serves as the foundation for visual design and frontend development, ensuring a cohesive and user-centered experience.

### Overall UX Goals & Principles

1. [ ] **Story First, Tools Second:** The interface will always prioritize the user's narrative choices over complex technical controls.
2. [ ] **AI as a Creative Partner:** The UI will present the AI's suggestions as a collaborative dialogue, not a "black box."
3. [ ] **Focused Power:** The interface will be minimalist and clean but also information-dense, consolidating powerful options into a single, unified workspace.
4. [ ] **Dynamic Visual Feedback:** The interface will use illumination, glows, and pulses to make the application feel responsive and transparent about its processes.
5. [ ] **Subtle Motion:** All animations and transitions will be simple, quick, and functional, designed to provide feedback without being distracting.

### Information Architecture (IA)

The application is built on a Multi-View Interface contained within a single page. The user can switch between different views to interact with their project in different ways.

#### View Structure

- [ ] **Narrative Map View:** A node-based canvas for visualizing and choosing high-level story structure and branching narrative paths.
- [ ] **Storyboard View:** A grid-based view of video clip thumbnails, allowing the user to review the visual sequence of scenes.
- [ ] **Timeline View:** An audio-waveform-centric timeline for fine-tuning the rhythm and timing of cuts.
- [ ] **Color & Effects View:** A dedicated view for applying final "polishing" effects like LUTs and film grain.

### Core User Flows

The application supports two primary user paths:

- [ ] **The Director's Path (Interactive):** A step-by-step workflow where the user makes decisions at each stage, utilizing the Multi-View Interface.
- [ ] **The YOLO Path (Automatic):** A "one-click" option where the AI makes all creative choices and presents a fully rendered video, which the user can then choose to export or refine via the Director's Path.

### Branding & Style Guide

The overall aesthetic is a professional, polished, and modern "DAW/VST" feel.

#### Color Palette

- **Background:** A deep, dark theme using shades of true black and charcoal grey to create depth. The blue/navy "slate" color is to be avoided.
- **Primary Interaction Color:** `#00A9FF` (Electric Blue). Used for all key interactive elements, including active buttons, sliders, highlights, and glows.
- **Secondary Accent Colors:** Subtle purples and cyans for secondary information or states.
- **Text & Icons:** High-contrast off-white (`#F8F8F8`) for readability.

#### Typography

- **Font Family:** Space Grotesk. This font provides a unique, "engineered" character that is clean, modern, and legible.
- **Type Scale:** A standard typographic scale will be used for headings, body text, and labels to ensure visual hierarchy.

#### Component Library / Design System

All components will be custom-styled to match the "DAW/VST" aesthetic. They should feel tactile and responsive.

##### Core Component Style

- **Default State:** Components have subtle gradients and soft inner shadows to create a 3D effect, making them appear to sit just above the surface.
- **Hover State:** Components brighten slightly, and a subtle Electric Blue glow appears.
- **Pressed State:** Shadows and gradients invert to give a "pressed-in" look, with an intensified glow to confirm the action.

##### Component List

- [ ] Buttons
- [ ] View Tabs
- [ ] Nodes (for Narrative Map)
- [ ] Clip Cards (for Storyboard)
- [ ] Timeline Component (with Waveform)
- [ ] Effect Sliders/Knobs
- [ ] Modals/Popovers

### Accessibility Requirements

- [ ] **Compliance Target:** The application will target WCAG 2.1 AA compliance to ensure it is professional-grade and usable by people with disabilities.

### Responsiveness Strategy

- [ ] **Target Platform:** The application will be designed as a desktop-only experience for the MVP to provide a powerful, uncompromised interface.