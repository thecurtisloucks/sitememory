# Evaluation

SiteMemory includes a small, transparent baseline for the primary hackathon workflow. It is intentionally a scenario test rather than a claim of broad model accuracy.

Run it with:

```bash
npm run evaluate
```

## Dataset

The two generated, privacy-safe desk images under `demo/images` contain seven expected detections across two scans. The second image moves the notebook, removes the headphones from view, and leaves the mug and keyboard in place.

The committed baseline contains only labels, normalized boxes, and confidence values returned by live `sam-3.1` inference on November 2, 2026. It excludes masks, raw model responses, credentials, and private data.

## Baseline results

| Metric                         | Result |
| ------------------------------ | -----: |
| Detection recall               | 100.0% |
| Detection precision            | 100.0% |
| Mean SAM confidence            |  93.3% |
| Cross-scan identity accuracy   | 100.0% |
| Change classification accuracy | 100.0% |

Expected changes were reproduced exactly: headphones no longer visible, notebook moved, coffee mug unchanged, and keyboard unchanged.

## What this establishes

- The configured SAM prompts detect every target in the controlled demo pair.
- The conservative matcher preserves the three identities visible in both scans.
- The comparison engine produces the intended four change classifications.
- Existing automated tests separately verify uncertain identities, duplicate-match prevention, unknown-object assistant questions, API validation, and mobile/browser behavior.

## Limitations

Two controlled images are not representative of different lighting, camera angles, occlusion, multiple same-category objects, or arbitrary rooms. Confidence is model-provided and is not calibrated by this project. A larger labeled dataset and human correction workflow would be required before production claims.
