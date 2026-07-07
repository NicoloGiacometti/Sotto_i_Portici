/**
 * placeholderTexture.js — generates a labeled colored-rectangle texture
 * on a canvas, used as a stand-in wherever real sprite art doesn't exist
 * yet (NPCs, objects). Shared by SpriteBillboard consumers so every
 * placeholder looks consistent until real PNGs replace them.
 */
export function makePlaceholderTexture(label, bg = '#7a2e2e') {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 384;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.lineWidth = 6;
  ctx.strokeRect(3, 3, canvas.width - 6, canvas.height - 6);
  ctx.fillStyle = '#ffffff';
  ctx.font = '26px Georgia';
  ctx.textAlign = 'center';
  // Support multi-line labels (split on \n) so longer names still fit.
  const lines = label.split('\n');
  const lineHeight = 32;
  const startY = canvas.height / 2 - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((line, i) => {
    ctx.fillText(line, canvas.width / 2, startY + i * lineHeight);
  });
  return canvas.toDataURL();
}
