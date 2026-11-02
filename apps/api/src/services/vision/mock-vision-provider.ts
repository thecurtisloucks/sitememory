import type {
  SegmentationObject,
  SegmentImageInput,
  VisionProvider,
} from "./types.js";

const detections: ReadonlyArray<
  Omit<SegmentationObject, "description"> & { aliases: string[] }
> = [
  {
    label: "headphones",
    aliases: ["headphones"],
    boundingBox: { x: 0.08, y: 0.12, width: 0.28, height: 0.25 },
    mask: {
      kind: "svg-path",
      path: "M170 830C40 720 20 380 180 170C350 -40 650 -40 820 170C980 380 960 720 830 830L710 670C790 560 770 330 650 220C560 135 440 135 350 220C230 330 210 560 290 670Z",
      width: 1000,
      height: 1000,
    },
  },
  {
    label: "coffee mug",
    aliases: ["coffee mug", "mug"],
    boundingBox: { x: 0.66, y: 0.2, width: 0.2, height: 0.3 },
    mask: {
      kind: "svg-path",
      path: "M120 80H720V240H850C960 240 1000 350 1000 500C1000 650 930 760 780 760H720V920H120Z M720 360V640H790C850 640 880 580 880 500C880 420 850 360 790 360Z",
      width: 1000,
      height: 1000,
    },
  },
  {
    label: "notebook",
    aliases: ["notebook", "book"],
    boundingBox: { x: 0.37, y: 0.52, width: 0.27, height: 0.31 },
    mask: {
      kind: "svg-path",
      path: "M80 110L870 20L960 870L170 980Z",
      width: 1000,
      height: 1000,
    },
  },
  {
    label: "keyboard",
    aliases: ["keyboard"],
    boundingBox: { x: 0.16, y: 0.72, width: 0.48, height: 0.2 },
    mask: {
      kind: "svg-path",
      path: "M50 170L930 40L1000 790L100 940Z",
      width: 1000,
      height: 1000,
    },
  },
];

export class MockVisionProvider implements VisionProvider {
  readonly name = "mock" as const;

  async segmentImage(input: SegmentImageInput) {
    const prompts = new Set(
      input.prompts.map((prompt) => prompt.toLowerCase()),
    );
    const objects = detections
      .filter((detection) =>
        detection.aliases.some((alias) => prompts.has(alias)),
      )
      .map(({ aliases: _aliases, ...detection }) => ({
        ...detection,
        description: `Mock ${detection.label} observation for deterministic development`,
      }));

    return {
      provider: this.name,
      objects,
      rawResponse: {
        mode: "mock",
        detectedLabels: objects.map(({ label }) => label),
      },
    };
  }
}
