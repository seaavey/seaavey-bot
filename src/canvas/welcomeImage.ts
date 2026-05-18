import sharp from "sharp";
export async function generateWelcomeImage(
  ppUrl: string | null,
  userName: string,
  groupName: string,
): Promise<Buffer> {
  let ppBuffer: Buffer;

  if (ppUrl) {
    try {
      const res = await fetch(ppUrl);
      const arr = await res.arrayBuffer();
      const circleMask = Buffer.from(
        '<svg><circle cx="100" cy="100" r="100" fill="white" /></svg>',
      );
      ppBuffer = await sharp(Buffer.from(arr))
        .resize(200, 200, { fit: "cover" })
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
  const cleanGroup = groupName.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const bgSvg = `
    <svg width="800" height="250">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#141E30;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#243B55;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="800" height="250" fill="url(#bg)" rx="15" ry="15" />
      <text x="250" y="90" font-family="Arial, sans-serif" font-size="45" fill="#00e676" font-weight="bold">WELCOME TO THE SQUAD</text>
      <text x="250" y="150" font-family="Arial, sans-serif" font-size="38" fill="#ffffff" font-weight="bold">${cleanUser}</text>
      <text x="250" y="200" font-family="Arial, sans-serif" font-size="22" fill="#b0c4de">You have joined ${cleanGroup}</text>
    </svg>
  `;

  return await sharp(Buffer.from(bgSvg))
    .composite([
      { input: ppBuffer, top: 25, left: 25 }, // Position avatar on the left
    ])
    .png()
    .toBuffer();
}

async function createDefaultAvatar(): Promise<Buffer> {
  const circleMask = Buffer.from('<svg><circle cx="100" cy="100" r="100" fill="white" /></svg>');
  const base = await sharp({
    create: { width: 200, height: 200, channels: 4, background: { r: 80, g: 80, b: 80, alpha: 1 } },
  })
    .png()
    .toBuffer();

  return await sharp(base)
    .composite([{ input: circleMask, blend: "dest-in" }])
    .png()
    .toBuffer();
}

export async function generateGoodbyeImage(
  ppUrl: string | null,
  userName: string,
  groupName: string,
): Promise<Buffer> {
  let ppBuffer: Buffer;

  if (ppUrl) {
    try {
      const res = await fetch(ppUrl);
      const arr = await res.arrayBuffer();
      const circleMask = Buffer.from(
        '<svg><circle cx="100" cy="100" r="100" fill="white" /></svg>',
      );
      ppBuffer = await sharp(Buffer.from(arr))
        .resize(200, 200, { fit: "cover" })
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
  const cleanGroup = groupName.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const bgSvg = `
    <svg width="800" height="250">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#2a0808;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#1a0000;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="800" height="250" fill="url(#bg)" rx="15" ry="15" />
      <text x="250" y="90" font-family="Arial, sans-serif" font-size="45" fill="#ff4d4d" font-weight="bold">FAREWELL</text>
      <text x="250" y="150" font-family="Arial, sans-serif" font-size="38" fill="#ffffff" font-weight="bold">${cleanUser}</text>
      <text x="250" y="200" font-family="Arial, sans-serif" font-size="22" fill="#b08080">Just left ${cleanGroup}</text>
    </svg>
  `;

  return await sharp(Buffer.from(bgSvg))
    .composite([{ input: ppBuffer, top: 25, left: 25 }])
    .png()
    .toBuffer();
}
