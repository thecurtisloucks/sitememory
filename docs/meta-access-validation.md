# Meta model access validation

Checked: October 30, 2026

## Confirmed from official public Meta material

- SAM 3.1 exists and is described as supporting detection, segmentation, and tracking across images and video using text prompts.
- SAM 3.1 is presented in Meta's current AI developer model catalog and Playground.
- The Meta Model API is described as OpenAI-compatible for Muse models.

## Still required before Milestone 2 implementation

- Confirm that this developer account has SAM 3.1 API access (Playground access alone is not sufficient evidence).
- Capture the exact SAM 3.1 model identifier, authentication scheme, image upload format, request schema, response schema, quotas, and pricing from the authenticated developer documentation.
- Run and retain a minimal real-image inference result before connecting the application.

No endpoint, model identifier, or response shape is guessed in the Milestone 1 codebase.

## Official references

- https://ai.meta.com/blog/segment-anything-model-3/
- https://ai.meta.com/llama/
