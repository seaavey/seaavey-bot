import sharp from "sharp";
export async function generateRankCard(
  ppUrl: string | null,
  userName: string,
  level: number,
  xp: number,
  nextLevel: number,
): Promise<Buffer> {
  let ppBuffer: Buffer;

  if (ppUrl) {
    try {
      const res = await fetch(ppUrl);
      const arr = await res.arrayBuffer();
      const circleMask = Buffer.from('<svg><circle cx="60" cy="60" r="60" fill="white" /></svg>');
      ppBuffer = await sharp(Buffer.from(arr))
        .resize(120, 120, { fit: "cover" })
        .composite([{ input: circleMask, blend: "dest-in" }])
        .png()
        .toBuffer();
    } catch {
      ppBuffer = await createDefaultAvatar();
    }
  } else {
    ppBuffer = await createDefaultAvatar();
  }

  const cleanUser = userName.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const progressPercent = Math.min(Math.max((xp / nextLevel) * 100, 0), 100);
  // Bar width max 400px
  const barWidth = (progressPercent / 100) * 400;

  const bgSvg = `
    <svg width="600" height="200">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#1e1e2f;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#2a2a40;stop-opacity:1" />
        </linearGradient>
        <linearGradient id="bar" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#00c6ff;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#0072ff;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="600" height="200" fill="url(#bg)" rx="15" ry="15" />
      
      <!-- Name -->
      <text x="170" y="70" font-family="Arial, sans-serif" font-size="28" fill="#ffffff" font-weight="bold">${cleanUser}</text>
      
      <!-- Level -->
      <text x="560" y="70" font-family="Arial, sans-serif" font-size="32" fill="#00c6ff" font-weight="bold" text-anchor="end" font-style="italic">Level ${level}</text>
      
      <!-- XP Text -->
      <text x="560" y="115" font-family="Arial, sans-serif" font-size="16" fill="#a0a0b0" text-anchor="end">${xp} / ${nextLevel} XP</text>

      <!-- Progress Bar Background -->
      <rect x="170" y="130" width="400" height="20" fill="#404050" rx="10" ry="10" />
      
      <!-- Progress Bar Fill -->
      <rect x="170" y="130" width="${Math.max(barWidth, 20)}" height="20" fill="url(#bar)" rx="10" ry="10" />
    </svg>
  `;

  return await sharp(Buffer.from(bgSvg))
    .composite([
      { input: ppBuffer, top: 40, left: 30 }, // Position avatar on the left
    ])
    .png()
    .toBuffer();
}

async function createDefaultAvatar(): Promise<Buffer> {
  const circleMask = Buffer.from('<svg><circle cx="60" cy="60" r="60" fill="white" /></svg>');
  const base = await sharp({
    create: { width: 120, height: 120, channels: 4, background: { r: 80, g: 80, b: 80, alpha: 1 } },
  })
    .png()
    .toBuffer();

  return await sharp(base)
    .composite([{ input: circleMask, blend: "dest-in" }])
    .png()
    .toBuffer();
}
