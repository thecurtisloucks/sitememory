SiteMemory — Engineering Implementation Plan

Project Overview

Project: SiteMemory
Hackathon: Meta Global AI Developer Hackathon 2026
Track: Indie Developer
Theme: Push the Frontier
Submission deadline: November 4, 2026
Repository: sitememory

Mission

Build an AI-powered spatial memory application that allows users to record physical environments, identify objects, track changes between observations, and ask natural-language questions about what the system has previously seen.

SiteMemory should demonstrate how computer vision, multimodal reasoning, and persistent structured memory can work together to give AI a useful understanding of physical environments over time.

The project must use Meta’s AI tooling meaningfully, particularly SAM 3.1 and Muse models through the Meta Model API.

The objective is to deliver a polished, functional hackathon prototype that demonstrates real AI capabilities, sound engineering, and practical usefulness.

⸻

1. Core Product Requirements

1.1 Room Management

Users should be able to:

- Create a room or workspace.
- Assign a name and optional description.
- View previously created rooms.
- Open a room to inspect its scan history.
- Delete a room and its associated data.

Example rooms include a home office, living room, kitchen, garage, or workshop.

Acceptance Criteria

- Users can create, view, and delete rooms.
- Each room has a unique identifier.
- Rooms persist between application restarts.
- Each room displays its most recent scan.

1.2 Room Scanning

Users should be able to upload photographs of physical environments.

For the initial MVP, prioritize images rather than video.

Supported formats:

- JPEG
- PNG
- WebP

Each scan should contain:

- Unique scan identifier
- Associated room
- Original image
- Capture or upload timestamp
- Processing status
- AI-generated observations

Acceptance Criteria

- Users can upload an image to an existing room.
- Uploaded images are validated and stored.
- The application displays processing progress.
- Failed processing can be retried.
- Previous scans remain accessible.

1.3 Object Detection and Segmentation

Integrate Meta SAM 3.1 through the Meta Model API.

The system should identify objects within uploaded photographs and generate segmentation information.

For the initial prototype, prioritize common household objects:

- Headphones
- Coffee mugs
- Notebooks
- Keyboards
- Computer mice
- Backpacks
- Books
- Water bottles
- Tools

Use supported text prompts or other documented SAM 3.1 input methods.

The application should normalize model outputs into an internal representation containing:

- Object label
- Bounding box
- Segmentation mask reference
- Confidence, if provided by the model
- Scan identifier
- Approximate image coordinates

Do not fabricate confidence scores if the model does not provide them.

Acceptance Criteria

- At least three object categories can be segmented in a real photograph.
- Segmentation results are persisted.
- Detected objects can be highlighted on the original image.
- The UI distinguishes actual model results from mock data.
- Failed or uncertain detections are handled gracefully.

1.4 Persistent Object Memory

Build a structured memory system that maintains object observations across scans.

Separate the concepts of:

TrackedObject: A persistent identity representing a physical object.

ObjectObservation: A detection of an object within one particular scan.

An object may have multiple observations over time.

For example, the same pair of headphones may appear in several scans at different positions.

Each observation should preserve:

- Object category
- Visual description
- Bounding box
- Scan timestamp
- Supporting image
- Matching confidence or uncertainty
- Relationship to a persistent tracked object, when established

Do not assume that two objects with the same category are necessarily the same physical object.

Acceptance Criteria

- Observations persist across application restarts.
- Users can inspect an object’s observation history.
- The system can retrieve the last known observation of an object.
- Uncertain identity matches are represented explicitly.

1.5 Change Detection

Implement a comparison engine that analyzes two scans of the same room.

The engine should classify objects as:

1. Unchanged: The object appears in approximately the same location.
2. Moved: The same object appears in a different location.
3. Newly visible: An object appears in the newer scan but not the earlier one.
4. No longer visible: An object appeared previously but is not detected in the newer scan.
5. Uncertain: The system cannot reliably determine what happened.

Use object labels, visual descriptions, normalized coordinates, and available segmentation data to estimate correspondences.

For the MVP, assume photographs are captured from approximately the same camera position.

Do not claim that an object has been removed from the room simply because it is no longer visible.

Acceptance Criteria

- Users can compare two scans.
- The application identifies at least one moved object.
- The application identifies an object that is no longer visible.
- Unchanged objects are recognized.
- The UI displays both scans side by side.
- Comparison results reference the supporting observations.

1.6 Natural-Language Assistant

Integrate a supported Muse model through the Meta Model API.

Users should be able to ask questions such as:

- Where did I last see my headphones?
- What changed between these scans?
- Which objects are no longer visible?
- What was on my desk yesterday?
- When was my notebook last detected?
- Summarize the changes in this room.

The assistant must use structured room observations and scan history as its primary evidence.

Do not rely on conversational memory alone.

Implement a retrieval layer that selects relevant observations before calling the reasoning model.

The assistant should return structured answers containing:

- Natural-language response
- Relevant object references
- Supporting scan identifiers
- Supporting observation identifiers
- Uncertainty notes when appropriate

Acceptance Criteria

- The assistant can answer questions using stored observations.
- Answers reference real scans.
- The UI can display supporting visual evidence.
- The assistant does not invent object locations when no evidence exists.
- Questions outside the available evidence are handled appropriately.

⸻

2. Technology Stack

Use a TypeScript-first monorepo.

Frontend

- React
- Vite
- TypeScript
- Tailwind CSS
- shadcn/ui
- TanStack Query
- React Router
- Lucide icons

Backend

- Node.js
- Fastify
- TypeScript
- Zod
- Prisma
- SQLite

AI

- Meta Model API
- SAM 3.1
- Muse Spark or another documented Muse reasoning model
- Official Meta SDKs or supported OpenAI-compatible interfaces

Testing

- Vitest
- React Testing Library
- Playwright

Development

- npm workspaces
- ESLint
- Prettier
- GitHub Actions

Avoid introducing additional infrastructure unless it directly improves the working prototype.

⸻

3. Repository Structure

Use the following structure:

sitememory/
├── apps/
│ ├── web/
│ │ ├── src/
│ │ │ ├── components/
│ │ │ ├── features/
│ │ │ │ ├── rooms/
│ │ │ │ ├── scans/
│ │ │ │ ├── objects/
│ │ │ │ ├── comparisons/
│ │ │ │ └── assistant/
│ │ │ ├── hooks/
│ │ │ ├── lib/
│ │ │ └── pages/
│ │ └── package.json
│ │
│ └── api/
│ ├── src/
│ │ ├── routes/
│ │ ├── services/
│ │ │ ├── ai/
│ │ │ ├── vision/
│ │ │ ├── memory/
│ │ │ └── comparison/
│ │ ├── repositories/
│ │ ├── middleware/
│ │ └── lib/
│ └── package.json
│
├── packages/
│ └── shared/
│ └── src/
│
├── prisma/
│ └── schema.prisma
│
├── docs/
│ ├── architecture.md
│ ├── api.md
│ └── demo-plan.md
│
├── tests/
├── .github/
│ └── workflows/
├── .env.example
├── .gitignore
├── package.json
└── README.md

⸻

4. Database Design

Implement the following entities.

Room

id
name
description
createdAt
updatedAt

Scan

id
roomId
imagePath
capturedAt
createdAt
status
errorMessage

TrackedObject

id
roomId
label
description
createdAt
updatedAt

ObjectObservation

id
scanId
trackedObjectId (nullable)
label
description
boundingBox
maskReference
confidence (nullable)
createdAt

ScanComparison

id
roomId
sourceScanId
targetScanId
results
createdAt

Store bounding boxes in normalized image coordinates.

Use JSON serialization where appropriate.

Maintain foreign-key relationships and appropriate cascading deletion behavior.

⸻

5. API Design

Implement REST endpoints.

Rooms

GET /api/rooms
POST /api/rooms
GET /api/rooms/:id
DELETE /api/rooms/:id

Scans

GET /api/rooms/:roomId/scans
POST /api/rooms/:roomId/scans
GET /api/scans/:scanId
POST /api/scans/:scanId/process

Objects

GET /api/rooms/:roomId/objects
GET /api/objects/:objectId/history

Comparisons

POST /api/rooms/:roomId/compare
GET /api/comparisons/:comparisonId

Assistant

POST /api/rooms/:roomId/ask

Use Zod for request validation.

Return consistent JSON response formats and meaningful HTTP status codes.

⸻

6. Meta AI Integration

Create two provider interfaces:

interface VisionProvider {
segmentImage(
input: SegmentImageInput
): Promise<SegmentationResult>;
}
interface ReasoningProvider {
answerQuestion(
input: ReasoningInput
): Promise<ReasoningResult>;
}

Implement:

MetaVisionProvider
MetaReasoningProvider
MockVisionProvider
MockReasoningProvider

Use mock providers for deterministic development and testing.

However, the final hackathon demonstration must use actual Meta inference.

Do not present mock outputs as live model results.

Important implementation requirements

Before implementing Meta API calls:

1. Consult the current official Meta documentation.
2. Verify supported model identifiers.
3. Verify authentication requirements.
4. Verify supported request and response formats.
5. Confirm image upload and segmentation workflows.
6. Confirm API availability and usage limitations.

Do not invent endpoints or model capabilities.

Keep API keys exclusively on the backend.

Implement timeouts, retries for transient errors, and clear error reporting.

Preserve raw model responses for debugging when appropriate, without exposing sensitive credentials.

⸻

7. Object Matching Strategy

Implement a conservative matching algorithm.

Start with:

1. Category compatibility.
2. Visual description similarity.
3. Bounding-box position.
4. Bounding-box dimensions.
5. Optional appearance embeddings if practical.

Use a weighted matching score.

For the initial prototype, a simple deterministic approach is acceptable.

Avoid matching multiple observations to the same tracked object within one scan unless explicitly supported by the data model.

Introduce an uncertainty threshold.

If the matching score is insufficient, classify the relationship as uncertain rather than forcing a match.

Keep the matching implementation modular so it can be improved later.

⸻

8. Frontend Design

Create a modern, polished interface suitable for a technical product demonstration.

Design Direction

- Dark theme
- Minimal, professional styling
- Clear typography
- Subtle accent colors
- Responsive layout
- Clean cards and panels
- Limited animations

Main Screens

Dashboard

Displays rooms, recent scans, and a clear action to create a room.

Room Details

Displays scan history, room information, and available actions.

Scan Viewer

Displays an uploaded image with interactive object overlays.

Users can select an object to view its label, description, and observation history.

Comparison Viewer

Displays two scans side by side.

Highlights detected changes.

AI Assistant

Provides a chat interface for asking questions about the room.

Answers include clickable evidence references.

User Experience Requirements

- Clear loading states.
- Useful error messages.
- Visible AI processing status.
- No broken navigation.
- No placeholder functionality presented as complete.
- Responsive desktop and mobile layouts.

⸻

9. Security and Privacy

Because the GitHub repository will be public:

- Never commit API credentials.
- Never expose Meta API keys in frontend code.
- Add environment files to .gitignore.
- Provide .env.example with placeholder values.
- Validate uploaded image types and sizes.
- Generate safe filenames.
- Prevent path traversal.
- Avoid logging private image contents.
- Do not include private room photographs in the repository.
- Do not use proprietary employer code or data.

The application should clearly communicate that uploaded images are processed using AI services.

⸻

10. Testing Strategy

Prioritize meaningful automated tests.

Unit Tests

- Bounding-box normalization
- Object matching
- Change classification
- Observation retrieval
- Input validation

Integration Tests

- Room creation
- Image upload
- Scan processing with mock providers
- Comparison persistence
- Evidence-backed question answering

End-to-End Tests

Use Playwright to verify:

1. Create a room.
2. Upload an image.
3. Process the scan.
4. View detected objects.
5. Upload a second image.
6. Compare scans.
7. Ask a question.
8. View supporting evidence.

Use deterministic fixtures for automated tests.

Validate real Meta inference separately.

⸻

11. Implementation Milestones

Milestone 1 — Project Foundation

Target: October 30

Tasks:

- Initialize monorepo.
- Configure TypeScript.
- Configure React and Fastify.
- Configure Prisma and SQLite.
- Implement Room model.
- Create room CRUD endpoints.
- Create basic dashboard.
- Configure environment variables.
- Add README and development instructions.

Definition of done:

The application starts locally, and users can create and view rooms.

Run type checking and tests before proceeding.

Milestone 2 — Image Scanning

Target: October 31

Tasks:

- Implement image upload.
- Persist scan metadata.
- Integrate SAM 3.1.
- Normalize segmentation results.
- Store object observations.
- Display object overlays.

Definition of done:

A real photograph can be uploaded, processed through SAM 3.1, and displayed with segmentation overlays.

Milestone 3 — Spatial Memory

Target: November 1

Tasks:

- Implement tracked objects.
- Associate observations across scans.
- Build object history retrieval.
- Implement comparison logic.
- Create comparison interface.

Definition of done:

Two photographs of the same room can be compared, and SiteMemory can identify visible changes.

Milestone 4 — AI Assistant

Target: November 2

Tasks:

- Integrate Muse reasoning.
- Implement observation retrieval.
- Build question-answering endpoint.
- Add assistant interface.
- Connect answers to visual evidence.

Definition of done:

Users can ask where an object was last observed and receive an evidence-backed answer.

Milestone 5 — Polish and Validation

Target: November 3

Tasks:

- Improve UI.
- Fix critical bugs.
- Add automated tests.
- Validate real model inference.
- Test multiple room scenarios.
- Prepare deployment.
- Record demonstration.

Definition of done:

The complete application works reliably through the primary demonstration workflow.

Milestone 6 — Submission

Target: November 4

Tasks:

- Complete final testing.
- Prepare GitHub README.
- Document architecture.
- Include setup instructions.
- Finalize demo video.
- Verify submission requirements.
- Submit before the official deadline.

Do not introduce major new features on submission day.

⸻

12. Hackathon Demonstration

Build toward the following scenario.

Initial Scan

The user uploads a photograph of a desk containing:

- Headphones
- Notebook
- Coffee mug
- Keyboard

SiteMemory identifies and highlights the objects.

Second Scan

The user rearranges the desk:

- Moves the notebook.
- Removes the headphones from view.
- Leaves the coffee mug unchanged.

The user uploads a second photograph.

Comparison

SiteMemory identifies:

- Notebook moved.
- Headphones no longer visible.
- Coffee mug unchanged.

Natural-Language Question

The user asks:

“Where did I last see my headphones?”

SiteMemory retrieves the previous observation and displays the original image with the headphones highlighted.

Final Demonstration

Show how SiteMemory combines:

- Meta computer vision
- Multimodal reasoning
- Persistent structured memory
- Temporal comparisons
- Evidence-backed answers

The demonstration must use genuine model results.

⸻

13. Development Rules for Codex

Follow these instructions throughout implementation.

1. Work incrementally and complete one milestone at a time.
2. Inspect the repository before making changes.
3. Prefer simple, maintainable solutions.
4. Avoid unnecessary abstractions.
5. Do not introduce microservices.
6. Do not implement authentication or billing.
7. Do not fabricate AI results.
8. Verify external API contracts against official documentation.
9. Keep the application runnable after each milestone.
10. Run relevant tests and type checks.
11. Fix errors before moving to the next milestone.
12. Document important architectural decisions.
13. Use clear commit messages.
14. Avoid unrelated refactoring.
15. Prioritize the working demonstration over additional features.
16. Explain blockers and assumptions rather than silently guessing.

When a task is completed, provide:

- Summary of changes
- Files created or modified
- Tests executed
- Known limitations
- Next recommended task

⸻

14. Immediate Instructions

Begin with Milestone 1 — Project Foundation.

First inspect the repository and determine whether any project files already exist.

Then:

1. Initialize the npm workspace.
2. Create the React frontend.
3. Create the Fastify backend.
4. Configure shared TypeScript types.
5. Configure Prisma and SQLite.
6. Implement room CRUD.
7. Build the initial dashboard.
8. Add mock AI provider interfaces.
9. Configure linting and testing.
10. Verify the application runs locally.

Do not attempt to implement the complete application in a single iteration.

After Milestone 1 is complete, stop and report the results.

The next priority will be validating a real SAM 3.1 request through the Meta Model API.
