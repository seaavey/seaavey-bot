export interface ParsedCommandBody {
  isCommand: boolean;
  prefix: string | undefined;
  commandName: string | undefined;
  args: string[];
  text: string;
}

function splitArgs(text: string): string[] {
  return text ? text.split(/\s+/) : [];
}

function noCommand(): ParsedCommandBody {
  return {
    isCommand: false,
    prefix: undefined,
    commandName: undefined,
    args: [],
    text: "",
  };
}

function parseSpecialCommand(body: string, commandName: ">" | "=>"): ParsedCommandBody {
  const text = body.slice(commandName.length).trim();

  return {
    isCommand: true,
    prefix: undefined,
    commandName,
    args: splitArgs(text),
    text,
  };
}

function parsePrefixedCommand(body: string, prefix: string): ParsedCommandBody {
  const content = body.slice(prefix.length).trimStart();
  const commandName = content.split(/\s+/, 1)[0];

  if (!commandName) {
    return {
      isCommand: true,
      prefix,
      commandName: undefined,
      args: [],
      text: "",
    };
  }

  const text = content.slice(commandName.length).trim();

  return {
    isCommand: true,
    prefix,
    commandName,
    args: splitArgs(text),
    text,
  };
}

export function parseCommandBody(body: string, prefixes: readonly string[]): ParsedCommandBody {
  if (body === "=>" || body.startsWith("=> ")) return parseSpecialCommand(body, "=>");
  if (body === ">" || body.startsWith("> ")) return parseSpecialCommand(body, ">");

  const prefix = prefixes.find((item) => body.startsWith(item));
  if (!prefix) return noCommand();

  return parsePrefixedCommand(body, prefix);
}
