
import { format } from 'date-fns';
import type { CapturedData } from '@/app/page';

interface OverlayData extends CapturedData {
  address: string;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // Important for canvas security
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

/**
 * Draws the photo and a data overlay onto a canvas and returns a data URL.
 * The overlay is always placed at the bottom, adapting to the photo's width.
 */
export async function drawOverlayOnCanvas(data: OverlayData): Promise<string> {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Could not get canvas context');
  }

  const [img, logoImg] = await Promise.all([
    loadImage(data.imageSrc),
    loadImage(`/logo.png?t=${new Date().getTime()}`), // Load the app logo
  ]);

  // Set canvas dimensions to match the image
  canvas.width = data.width;
  canvas.height = data.height;

  // Draw the original image
  context.drawImage(img, 0, 0);

  // --- Style definitions ---
  const referenceWidth = canvas.width;

  let padding = referenceWidth * 0.035;
  let borderRadius = referenceWidth * 0.02;
  let logoHeight = referenceWidth * 0.06;
  let textBaseSize = referenceWidth * 0.025;
  let iconSize = textBaseSize * 1.15;
  let lineSpacing = textBaseSize * 1.8;
  let separatorMargin = textBaseSize;

  // --- Calculate required height ---
  const addressText = data.address || 'Locating...';
  
  context.font = `400 ${textBaseSize}px sans-serif`;
  const addressMaxWidth = referenceWidth * 0.9 - padding * 2 - (iconSize + textBaseSize * 0.7);

  const addressLines = getWrappedTextLines(context, addressText, addressMaxWidth);

  let topSectionHeight = Math.max(lineSpacing * 2, logoHeight);

  let requiredHeight =
    padding +
    topSectionHeight + // Timestamp, Coords, and Logo section
    separatorMargin * 2 + // Separator
    (addressLines.length * textBaseSize * 1.25) + // Address
    padding;

  const maxHeight = canvas.height * 0.3; // Max 30% of image height
  let scaleFactor = 1;
  if (requiredHeight > maxHeight) {
    scaleFactor = maxHeight / requiredHeight;
  }
  
  // Apply scaling
  padding *= scaleFactor;
  borderRadius *= scaleFactor;
  logoHeight *= scaleFactor;
  textBaseSize *= scaleFactor;
  iconSize *= scaleFactor;
  lineSpacing *= scaleFactor;
  separatorMargin *= scaleFactor;

  // Recalculate final content height with scaled values
  context.font = `400 ${textBaseSize}px sans-serif`;
  const finalAddressMaxWidth = referenceWidth * 0.9 - padding * 2 - (iconSize + textBaseSize * 0.7);
  const finalAddressLines = getWrappedTextLines(context, addressText, finalAddressMaxWidth);

  const finalTopSectionHeight = Math.max(lineSpacing * 2, logoHeight);

  const contentHeight =
    padding +
    finalTopSectionHeight +
    separatorMargin * 2 +
    (finalAddressLines.length * textBaseSize * 1.25) +
    padding;

  const boxWidth = referenceWidth * 0.9;
  const boxX = (referenceWidth - boxWidth) / 2;
  const boxY = canvas.height - contentHeight - (canvas.height * 0.015);

  // Draw the semi-transparent background box
  context.fillStyle = 'rgba(0, 0, 0, 0.5)';
  context.beginPath();
  context.moveTo(boxX + borderRadius, boxY);
  context.lineTo(boxX + boxWidth - borderRadius, boxY);
  context.quadraticCurveTo(boxX + boxWidth, boxY, boxX + boxWidth, boxY + borderRadius);
  context.lineTo(boxX + boxWidth, boxY + contentHeight - borderRadius);
  context.quadraticCurveTo(boxX + boxWidth, boxY + contentHeight, boxX + boxWidth - borderRadius, boxY + contentHeight);
  context.lineTo(boxX + borderRadius, boxY + contentHeight);
  context.quadraticCurveTo(boxX, boxY + contentHeight, boxX, boxY + contentHeight - borderRadius);
  context.lineTo(boxX, boxY + borderRadius);
  context.quadraticCurveTo(boxX, boxY, boxX + borderRadius, boxY);
  context.closePath();
  context.fill();

  // --- Draw Content ---
  const contentStartX = boxX + padding;
  let currentY = boxY + padding;

  // 1. Top Section (Timestamp, Coords, Logo)
  const timeText = format(new Date(data.timestamp), 'yyyy-MM-dd HH:mm:ss');
  drawIconText(
    context,
    'clock',
    timeText,
    contentStartX,
    currentY,
    iconSize,
    textBaseSize
  );

  const coordsText = `${data.location.latitude.toFixed(
    6
  )}, ${data.location.longitude.toFixed(6)}`;
  drawIconText(
    context,
    'map-pin',
    coordsText,
    contentStartX,
    currentY + lineSpacing,
    iconSize,
    textBaseSize
  );

  const logoWidth = (logoImg.width / logoImg.height) * logoHeight;
  const logoX = boxX + boxWidth - padding - logoWidth;
  const logoY = currentY + (finalTopSectionHeight - logoHeight) / 2;
  drawLogo(context, logoImg, logoX, logoY, logoHeight);

  currentY += finalTopSectionHeight;

  // 2. Separator
  currentY += separatorMargin;
  context.fillStyle = 'rgba(255, 255, 255, 0.2)';
  context.fillRect(contentStartX, currentY, boxWidth - padding * 2, 1);
  currentY += separatorMargin;
  
  // 3. Address
  const addressIconY = currentY + textBaseSize * 0.1;
  drawIconText(
    context,
    'home',
    '',
    contentStartX,
    addressIconY,
    iconSize,
    textBaseSize
  );
  
  const addressX = contentStartX + iconSize + textBaseSize * 0.7;
  context.font = `400 ${textBaseSize}px sans-serif`;
  context.fillStyle = 'white';
  context.textAlign = 'left';
  context.textBaseline = 'top';

  for (let i = 0; i < finalAddressLines.length; i++) {
    context.fillText(
      finalAddressLines[i],
      addressX,
      currentY + (i * textBaseSize * 1.25)
    );
  }

  // Return the final image as a JPEG data URL
  return canvas.toDataURL('image/jpeg', 0.95);
}

// ===================================================================
//                          DRAWING HELPERS
// ===================================================================

function drawLogo(
  ctx: CanvasRenderingContext2D,
  logoImg: HTMLImageElement,
  x: number,
  y: number,
  height: number
) {
  const logoWidth = (logoImg.width / logoImg.height) * height;
  ctx.drawImage(logoImg, x, y, logoWidth, height);
}


type IconName = 'clock' | 'map-pin' | 'home';

function drawIconText(
  ctx: CanvasRenderingContext2D,
  iconName: IconName,
  text: string,
  x: number,
  y: number,
  iconSize: number,
  textBaseSize: number
) {
  const textY = y;
  const iconPath = getIconPath(iconName);
  
  // Draw Icon
  const p = new Path2D(iconPath);
  ctx.save();
  ctx.translate(x, textY);
  const scale = iconSize / 24;
  ctx.scale(scale, scale);

  ctx.strokeStyle = '#5885AF'; // accent color
  ctx.lineWidth = 2 / scale;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke(p);
  
  ctx.restore();

  // Draw Text
  if (text) {
    ctx.font = `400 ${textBaseSize}px sans-serif`;
    ctx.fillStyle = 'white';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(text, x + iconSize + textBaseSize * 0.7, textY);
  }
}

function getWrappedTextLines(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  if (maxWidth <= 0) return [text];
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const testLine = currentLine === '' ? word : currentLine + ' ' + word;
    const metrics = context.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && currentLine !== '') {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  lines.push(currentLine);
  return lines;
}

// SVG Paths from Lucide v0.395.0
function getIconPath(name: IconName): string {
  switch (name) {
    case 'clock':
      return 'M22 12A10 10 0 1 1 12 2a10 10 0 0 1 10 10ZM12 6v6l4 2';
    case 'map-pin':
      return 'M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z';
    case 'home':
      return 'm3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z';
  }
}
