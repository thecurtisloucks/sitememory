# API reference

All JSON success responses use `{ "data": ... }`. Errors use `{ "error": { "code", "message", "details?" } }`.

## Rooms

- `GET /api/rooms`
- `POST /api/rooms` with `{ "name": string, "description"?: string }`
- `GET /api/rooms/:id`
- `PATCH /api/rooms/:id` with `{ "objectPrompts": string[] }`
- `DELETE /api/rooms/:id` (also removes scan rows, observations, and stored image files)

Room responses include `latestScan` when available and a validated `objectPrompts` tracking vocabulary. Rooms default to headphones, coffee mug, notebook, and keyboard; users can configure 1–12 unique noun phrases of up to 40 characters. New processing requests use the room's current vocabulary.

## Scans

- `GET /api/rooms/:roomId/scans`
- `POST /api/rooms/:roomId/scans` as `multipart/form-data` with one `image` file
- `GET /api/scans/:scanId`
- `GET /api/scans/:scanId/image`
- `POST /api/scans/:scanId/process`

Uploads accept byte-validated JPEG, PNG, or WebP images up to `MAX_UPLOAD_BYTES` (10 MB by default). A new scan begins in `PENDING`. Processing moves it through `PROCESSING` to `COMPLETED` or `FAILED`; the processing endpoint can retry failed or completed scans.

Each observation contains a normalized bounding box, optional decoded SVG mask, and optional confidence only when the selected provider supplied one.

## Object memory

- `GET /api/rooms/:roomId/objects`
- `GET /api/objects/:objectId/history`

Completed scans associate high-confidence detections with a persistent tracked object. A room object response includes its latest observation and observation count; the history response includes every confirmed observation and the source scan needed to inspect its image evidence. Ambiguous matches remain unattached rather than silently merging two physical objects.

## Comparisons

- `POST /api/rooms/:roomId/compare` with `{ "sourceScanId": string, "targetScanId": string }`
- `GET /api/comparisons/:comparisonId`

Both scans must be completed, distinct, and belong to the requested room. Comparisons are persisted and classify changes as `UNCHANGED`, `MOVED`, `NEWLY_VISIBLE`, `NO_LONGER_VISIBLE`, or `UNCERTAIN`. `NO_LONGER_VISIBLE` means the object was not detected in the newer image; it does not claim the object was removed from the room.

## Assistant

- `POST /api/rooms/:roomId/ask` with `{ "question": string }`

The retrieval layer selects at most 12 relevant observations before invoking the configured reasoning provider. Change questions derive classifications from the two most recent completed scans. The response contains the natural-language answer, provider provenance, supporting scan and observation identifiers, visual evidence records, and uncertainty notes. A specific object question with no matching observation returns no substitute evidence.
