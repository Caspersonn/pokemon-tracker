// Helper function to format tcgdex image URLs
// tcgdex requires quality and extension to be appended to image URLs
// Cards: https://assets.tcgdex.net/en/swsh/swsh3/136/high.png
// Logos: https://assets.tcgdex.net/en/swsh/swsh3/logo.jpg

export function formatImageUrl(url: string, quality: 'low' | 'high' = 'low', extension: 'jpg' | 'png' | 'webp' = 'png'): string {
  if (!url) return '';

  // If URL already has extension, return as is
  if (url.match(/\.(jpg|jpeg|png|webp)$/i)) {
    return url;
  }

  // Check if it's a logo or symbol URL (these don't use quality path)
  if (url.endsWith('/logo') || url.endsWith('/symbol')) {
    return `${url}.jpg`;
  }

  // For card images, add quality and extension
  return `${url}/${quality}.${extension}`;
}
