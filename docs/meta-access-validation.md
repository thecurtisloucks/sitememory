# Meta model access validation

Checked: November 1, 2026

## Confirmed from official public Meta material

- SAM 3.1 exists and is described as supporting detection, segmentation, and tracking across images and video using text prompts.
- SAM 3.1 is presented in Meta's current AI developer model catalog and Playground.
- The Meta Model API is described as OpenAI-compatible for Muse models.
- Meta's official `meta-models/meta-sam` repository documents image requests to `POST https://api.meta.ai/v1/responses` using model `sam-3.1`, an inline image data URL, a noun-phrase `input_text`, and optional string metadata such as `include_confidence`.
- The official `@meta-sam/parser` package parses the SAM 3.1 output-text wire format and decodes its mask payloads.

## Still required before the live demo

- Confirm that this developer account has SAM 3.1 API access (Playground access alone is not sufficient evidence).
- Confirm the account's model catalog includes `sam-3.1`, plus current quota and pricing.
- Run and retain a minimal real-image inference result before connecting the application.

The Milestone 2 live provider follows Meta's published official example and parser. It remains opt-in until a real credential successfully exercises the deployment.

## Official references

- https://ai.meta.com/blog/segment-anything-model-3/
- https://ai.meta.com/llama/
- https://github.com/meta-models/meta-sam
- https://dev.meta.ai/docs/sam/client-libraries
