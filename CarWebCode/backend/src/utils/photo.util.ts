import { mkdir, rm, writeFile } from "node:fs/promises";

export const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5 MB
export const PHOTOS_FOLDER = "uploads/cars";

export interface Photo {
    buffer: Buffer;
    extension: "jpg" | "png";
}

// Reads a photo sent as "data:image/jpeg;base64,...." or "data:image/png;base64,...."
// Returns null if it is not a real JPG or PNG of up to 5 MB.
export function readPhoto(dataUrl: unknown): Photo | null {
    if (typeof dataUrl !== "string") return null;

    const match = /^data:image\/(jpeg|jpg|png);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
    if (!match) return null;

    const buffer = Buffer.from(match[2]!, "base64");
    if (buffer.length === 0 || buffer.length > MAX_PHOTO_BYTES) return null;

    // the first bytes say what the file really is, whatever its name says
    const isJpg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
    if (isJpg) return { buffer, extension: "jpg" };
    if (isPng) return { buffer, extension: "png" };
    return null;
}

// Saves the photos in uploads/cars and returns their paths
export async function savePhotos(photos: Photo[], prefix: string): Promise<string[]> {
    await mkdir(PHOTOS_FOLDER, { recursive: true });
    const paths: string[] = [];
    for (const [index, photo] of photos.entries()) {
        const filePath = `${PHOTOS_FOLDER}/${prefix}-${index + 1}.${photo.extension}`;
        await writeFile(filePath, photo.buffer);
        paths.push(filePath);
    }
    return paths;
}

// Deletes photos that were saved for a request that failed
export async function deletePhotos(paths: string[]): Promise<void> {
    for (const filePath of paths) {
        await rm(filePath, { force: true });
    }
}