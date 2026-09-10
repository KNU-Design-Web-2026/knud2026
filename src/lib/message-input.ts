export const MESSAGE_MAX_LENGTH = 130;
export const MESSAGE_LINE_BREAK_WEIGHT = 20;

export function getMessageUsage(value: string) {
  return Array.from(value).reduce(
    (usage, character) => usage + (character === "\n" ? MESSAGE_LINE_BREAK_WEIGHT : 1),
    0,
  );
}

export function normalizeMessageBody(value: string) {
  const normalizedNewlines = value.replace(/\r\n?/g, "\n");
  let usage = 0;
  let result = "";

  for (const character of normalizedNewlines) {
    const characterWeight = character === "\n" ? MESSAGE_LINE_BREAK_WEIGHT : 1;

    if (usage + characterWeight <= MESSAGE_MAX_LENGTH) {
      result += character;
      usage += characterWeight;
    } else if (character === "\n" && usage < MESSAGE_MAX_LENGTH) {
      if (result.at(-1) !== " ") {
        result += " ";
        usage += 1;
      }
    } else {
      break;
    }
  }

  return result;
}
