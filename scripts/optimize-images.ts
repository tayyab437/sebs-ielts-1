import fs from "fs";
import path from "path";
import sharp from "sharp";

async function optimizeImages() {
  const publicDir = path.join(process.cwd(), "public");

  // 1. Optimize SEB's official logo into lightweight WebP variants
  // Input sources: sebs_official_logo_315.png or sebs_logo_official_1780388848004.png
  const logoSource = path.join(publicDir, "sebs_official_logo_315.png");
  if (fs.existsSync(logoSource)) {
    // 315px width logo (high-res display)
    await sharp(logoSource)
      .resize(315, null, { withoutEnlargement: true })
      .webp({ quality: 80, effort: 6 })
      .toFile(path.join(publicDir, "sebs_official_logo_315.webp"));

    // 160px width logo (header/mobile display - exact rendered size ~110px-160px)
    await sharp(logoSource)
      .resize(160, null, { withoutEnlargement: true })
      .webp({ quality: 80, effort: 6 })
      .toFile(path.join(publicDir, "sebs_official_logo_160.webp"));

    console.log("Created optimized logo variants: sebs_official_logo_315.webp, sebs_official_logo_160.webp");
  }

  // 2. Optimize Hero Banner into properly dimensioned WebP variants
  const bannerSource = path.join(publicDir, "ielts_prep_banner_1781330535098.jpg");
  if (fs.existsSync(bannerSource)) {
    // 480w for mobile screens (rendered size ~458x250)
    await sharp(bannerSource)
      .resize(480, null, { withoutEnlargement: true })
      .webp({ quality: 75, effort: 6 })
      .toFile(path.join(publicDir, "ielts_prep_banner_480.webp"));

    // 640w for tablet screens
    await sharp(bannerSource)
      .resize(640, null, { withoutEnlargement: true })
      .webp({ quality: 75, effort: 6 })
      .toFile(path.join(publicDir, "ielts_prep_banner_640.webp"));

    // 960w for standard desktop screens (lossy compressed)
    await sharp(bannerSource)
      .resize(960, null, { withoutEnlargement: true })
      .webp({ quality: 75, effort: 6 })
      .toFile(path.join(publicDir, "ielts_prep_banner_960.webp"));

    console.log("Created optimized hero banner variants: 480w, 640w, 960w");
  }
}

optimizeImages()
  .then(() => console.log("Image optimization complete!"))
  .catch(err => console.error("Error optimizing images:", err));
