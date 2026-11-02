# Meta model access validation

Checked: November 2, 2026

## Confirmed from official public Meta material

- SAM 3.1 exists and is described as supporting detection, segmentation, and tracking across images and video using text prompts.
- SAM 3.1 is presented in Meta's current AI developer model catalog and Playground.
- The Meta Model API is described as OpenAI-compatible for Muse models.
- Meta's official `meta-models/meta-sam` repository documents image requests to `POST https://api.meta.ai/v1/responses` using model `sam-3.1`, an inline image data URL, a noun-phrase `input_text`, and optional string metadata such as `include_confidence`.
- The official `@meta-sam/parser` package parses the SAM 3.1 output-text wire format and decodes its mask payloads.

## Verified with the configured developer credential

- `GET /v1/models` succeeded and included `sam-3.1`.
- A non-streaming `POST /v1/responses` completed through the application's `MetaVisionProvider` and official parser.
- The validation used Meta's public `assets/images/test_image.jpg` with the noun phrase `child`; six segmented objects were parsed in approximately 2.6 seconds.
- No credential or raw response was printed or committed.
- The model catalog included `muse-spark-1.3` and the other current Muse Spark variants.
- A low-effort `muse-spark-1.3` Responses API request completed through the application's `MetaReasoningProvider` with a non-empty evidence-grounded answer in approximately 2.4 seconds.

The live provider is therefore available when `VISION_PROVIDER="meta"`. Mock inference remains useful for deterministic development and tests.

## Still required before judging

- Run the intended room-photo demo flow with the four configured object prompts.
- Run assistant questions against those real room observations and retain the evidence-linked result for the demo.
- Confirm current account quota and pricing in the Meta developer console.
- Keep a mock-provider fallback ready in case the external service is unavailable during judging.

## Official references

- https://ai.meta.com/blog/segment-anything-model-3/
- https://ai.meta.com/llama/
- https://github.com/meta-models/meta-sam
- https://dev.meta.ai/docs/sam/client-libraries
- https://dev.meta.ai/docs/protocols/responses
- https://dev.meta.ai/docs/models
