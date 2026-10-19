// Use the preview directly: Next's "blur" mode adds another SVG Gaussian blur.
export function getWorkImagePlaceholder(dataURL?: string): "empty" | `data:image/${string}` {
  return dataURL?.startsWith("data:image/") ? dataURL as `data:image/${string}` : "empty";
}
