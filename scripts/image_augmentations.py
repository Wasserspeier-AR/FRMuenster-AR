"""
Transforms images in a directory to simulate AR capture conditions
(sensor noise, lighting variation, lens effects, perspective distortion).

Reads images from a directory and writes the transformed variants back
into that same directory, alongside the originals.
"""

import argparse
from pathlib import Path

import albumentations as A
import cv2
from tqdm import tqdm

IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg"}


def build_transforms() -> A.Compose:
    return A.Compose([
        # Sensor
        A.ISONoise(color_shift_range=(0.01, 0.08), intensity_range=(0.1, 0.6), p=0.4),
        A.GaussNoise(std_range=(0.02, 0.12), p=0.3),
        A.Defocus(radius_range=(1, 4), alias_blur_range=(0.1, 0.3), p=0.2),
        A.Downscale(scale_range=(0.15, 0.8), p=0.3),

        # Lighting
        A.ColorJitter(brightness_range=(0.7, 1.3), contrast_range=(0.8, 1.4),
                      saturation_range=(0.7, 1.5), hue_range=(-0.05, 0.05), p=0.5),
        A.RandomBrightnessContrast(brightness_range=(-0.4, 0.4), contrast_range=(-0.4, 0.4), p=0.4),
        A.RandomShadow(shadow_roi=(0.0, 0.5, 1.0, 1.0), num_shadows_range=(1, 3), p=0.3),
        A.RandomGamma(gamma_range=(50, 150), p=0.3),

        # Optics
        A.ChromaticAberration(primary_distortion_range=(-0.05, 0.05),
                               secondary_distortion_range=(-0.03, 0.03), p=0.2),
        A.GaussianBlur(blur_range=(3, 15), p=0.25),
        A.MotionBlur(blur_range=(3, 9), p=0.25),

        # Perspective / camera pose
        A.Perspective(scale=(0.05, 0.15), border_mode=cv2.BORDER_REFLECT, p=0.4),
        A.Affine(rotate=(-25, 25), scale=(0.85, 1.15), translate_percent=(-0.15, 0.15),
                 shear=(-10, 10), interpolation=cv2.INTER_LINEAR,
                 fill=128, fill_mask=0, p=0.35),
    ])


def transform_images(directory: str, num_variants: int = 10) -> None:
    folder = Path(directory)
    image_paths = sorted(p for p in folder.iterdir() if p.suffix.lower() in IMAGE_EXTENSIONS)

    if not image_paths:
        raise ValueError(f"No matching images found in {directory}")

    transform = build_transforms()
    created, failed = 0, 0

    print(f"{len(image_paths)} images => {len(image_paths) * num_variants} variants\n")

    for path in tqdm(image_paths, desc="Transforming"):
        image = cv2.imread(str(path))
        if image is None:
            print(f"[WARN] Failed to read: {path}")
            failed += 1
            continue

        image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

        for i in range(num_variants):
            try:
                tr_image = transform(image=image)["image"]
                out_path = folder / f"{path.stem}_variant{i:02d}.png"
                cv2.imwrite(str(out_path), cv2.cvtColor(tr_image, cv2.COLOR_RGB2BGR))
                created += 1
            except Exception as e:  # noqa: BLE001
                print(f"[ERROR] Variant {i} failed for {path.name}: {e}")

    print("\n")
    print(f"Input images processed: {len(image_paths)}")
    print(f"Variants created:       {created}")
    print(f"Failed to read:         {failed}")


def main():
    parser = argparse.ArgumentParser(description="Transform images in place for AR training.")
    parser.add_argument("directory", type=str, help="Directory containing images.")
    parser.add_argument("--num-variants", "-n", type=int, default=10, help="Variants per image (default: 10).")
    args = parser.parse_args()

    transform_images(args.directory, args.num_variants)


if __name__ == "__main__":
    main()