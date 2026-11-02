# Hackathon demo runbook

## Preflight

1. Use Node 22 and run `npm ci`.
2. Confirm `.env` uses `VISION_PROVIDER="meta"` and `REASONING_PROVIDER="meta"`.
3. Run `npm run db:deploy`, then `npm run dev`.
4. Confirm `GET http://127.0.0.1:3001/api/health` returns `ok`.
5. Keep the mock-provider Docker command ready as an external-service fallback, but label mock output clearly if it is used.

## Rehearsal assets

The privacy-safe generated fixtures are:

- `demo/images/desk-before.jpg`: headphones, notebook, coffee mug, keyboard
- `demo/images/desk-after.jpg`: notebook moved left, headphones out of view, mug and keyboard unchanged

These fixtures were generated for repeatability and contain no private room data. For judging, a live camera capture is preferable; the fixtures provide a reliable rehearsal and backup.

## Demonstration sequence

1. Create a room named **Demo Office**.
2. Upload `desk-before.jpg`, select **Analyze with AI**, and show the four live Meta overlays.
3. Return to the room and upload `desk-after.jpg`; analyze it.
4. Select **Compare scans**. Point out:
   - headphones: no longer visible
   - notebook: moved
   - coffee mug: unchanged
   - keyboard: unchanged
5. Select **Ask SiteMemory** and ask: “Where did I last see my headphones?”
6. Open the supporting evidence card and show the original highlighted scan.
7. Call out the live provider badges so judges can distinguish genuine Meta inference from mock development data.

Do not claim that “no longer visible” means an item was removed from the room; it means the newer scan did not detect it.

## Validated result

On November 2, 2026, both rehearsal images completed the full live flow. SAM detected all four expected labels in the first image, omitted headphones in the second, and the comparison classified notebook moved, headphones no longer visible, and mug/keyboard unchanged. Muse Spark returned a grounded headphones answer with the earlier observation as evidence.
