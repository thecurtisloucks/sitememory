export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface MaskReference {
  kind: "svg-path";
  path: string;
  width: number;
  height: number;
}

export interface SegmentationObject {
  label: string;
  description: string;
  boundingBox: BoundingBox;
  mask: MaskReference | null;
  confidence?: number;
}

export interface SegmentImageInput {
  bytes: Buffer;
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  width: number;
  height: number;
  prompts: readonly string[];
}

export interface SegmentationResult {
  provider: "mock" | "meta";
  objects: SegmentationObject[];
  rawResponse?: unknown;
}

export interface VisionProvider {
  readonly name: "mock" | "meta";
  segmentImage(input: SegmentImageInput): Promise<SegmentationResult>;
}
