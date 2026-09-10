export const MESSAGE_MAX_LENGTH = 130;
export const MESSAGE_MAX_LINE_BREAKS = 4;

export function normalizeMessageBody(value: string) {
  const normalizedNewlines = value.replace(/\r\n?/g, "\n").replace(/\n{3,}/g, "\n\n");
  let lineBreakCount = 0;
  let result = "";

  for (const character of normalizedNewlines) {
    if (character === "\n") {
      if (lineBreakCount < MESSAGE_MAX_LINE_BREAKS) {
        result += character;
        lineBreakCount += 1;
      } else if (result.at(-1) !== " ") {
        result += " ";
      }
    } else {
      result += character;
    }

    if (result.length >= MESSAGE_MAX_LENGTH) {
      break;
    }
  }

  return result.slice(0, MESSAGE_MAX_LENGTH);
}

export function countMessageLineBreaks(value: string) {
  return (value.match(/\n/g) ?? []).length;
}
