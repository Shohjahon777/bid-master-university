/**
 * Generate a blur placeholder data URL for images
 * Returns a tiny 1x1 base64 encoded image for next/image placeholder
 */
export function generateBlurPlaceholder(): string {
  // Tiny 1x1 transparent PNG as base64
  return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
}

