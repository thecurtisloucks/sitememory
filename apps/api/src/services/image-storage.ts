import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileTypeFromBuffer } from "file-type";
import { imageSize } from "image-size";
import { HttpError } from "../lib/errors.js";

const allowedTypes = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

export type AllowedImageType = keyof typeof allowedTypes;

export interface ValidatedImage {
  bytes: Buffer;
  mimeType: AllowedImageType;
  width: number;
  height: number;
}

export class ImageStorage {
  constructor(
    private readonly uploadDir: string,
    private readonly maxBytes: number,
  ) {}

  async validate(bytes: Buffer): Promise<ValidatedImage> {
    if (bytes.length === 0 || bytes.length > this.maxBytes) {
      throw new HttpError(
        400,
        "INVALID_IMAGE_SIZE",
        `Images must be between 1 byte and ${this.maxBytes} bytes.`,
      );
    }
    const detected = await fileTypeFromBuffer(bytes);
    if (!detected || !(detected.mime in allowedTypes)) {
      throw new HttpError(
        415,
        "UNSUPPORTED_IMAGE_TYPE",
        "Only JPEG, PNG, and WebP images are supported.",
      );
    }
    const dimensions = imageSize(bytes);
    if (!dimensions.width || !dimensions.height) {
      throw new HttpError(
        400,
        "INVALID_IMAGE",
        "The image dimensions are invalid.",
      );
    }
    const rotated =
      dimensions.orientation !== undefined &&
      dimensions.orientation >= 5 &&
      dimensions.orientation <= 8;
    return {
      bytes,
      mimeType: detected.mime as AllowedImageType,
      width: rotated ? dimensions.height : dimensions.width,
      height: rotated ? dimensions.width : dimensions.height,
    };
  }

  async save(image: ValidatedImage) {
    await mkdir(this.uploadDir, { recursive: true });
    const filename = `${randomUUID()}.${allowedTypes[image.mimeType]}`;
    await writeFile(path.join(this.uploadDir, filename), image.bytes, {
      flag: "wx",
    });
    return filename;
  }

  read(filename: string) {
    return readFile(this.safePath(filename));
  }

  async remove(filename: string) {
    await unlink(this.safePath(filename)).catch(
      (error: NodeJS.ErrnoException) => {
        if (error.code !== "ENOENT") throw error;
      },
    );
  }

  private safePath(filename: string) {
    if (!/^[0-9a-f-]{36}\.(?:jpg|png|webp)$/.test(filename)) {
      throw new HttpError(
        400,
        "INVALID_IMAGE_PATH",
        "The image path is invalid.",
      );
    }
    return path.join(this.uploadDir, filename);
  }
}
