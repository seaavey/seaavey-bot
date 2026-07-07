import { describe, expect, it } from "bun:test";
import { parseCommandBody } from "@/utils/command-parser";

describe("parseCommandBody", () => {
  it("parses prefixed commands with normalized args", () => {
    const result = parseCommandBody(".gemini   hello   world", ["."]);

    expect(result).toEqual({
      isCommand: true,
      prefix: ".",
      commandName: "gemini",
      args: ["hello", "world"],
      text: "hello   world",
    });
  });

  it("marks prefix-only messages as command syntax without a command name", () => {
    const result = parseCommandBody(".", ["."]);

    expect(result).toEqual({
      isCommand: true,
      prefix: ".",
      commandName: undefined,
      args: [],
      text: "",
    });
  });

  it("parses eval shortcuts without a configured prefix", () => {
    expect(parseCommandBody("> 1 + 1", ["."])).toEqual({
      isCommand: true,
      prefix: undefined,
      commandName: ">",
      args: ["1", "+", "1"],
      text: "1 + 1",
    });

    expect(parseCommandBody("=> await work()", ["."])).toEqual({
      isCommand: true,
      prefix: undefined,
      commandName: "=>",
      args: ["await", "work()"],
      text: "await work()",
    });
  });

  it("ignores non-command messages", () => {
    expect(parseCommandBody("hello world", ["."])).toEqual({
      isCommand: false,
      prefix: undefined,
      commandName: undefined,
      args: [],
      text: "",
    });
  });
});
