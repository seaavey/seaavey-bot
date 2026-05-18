import { checkAsahOtak } from "../commands/game/asahotak";
import { checkFamily100 } from "../commands/game/family100";
import { checkMathAnswer } from "../commands/game/math";
import { checkSiapakahAku } from "../commands/game/siapakahaku";
import { checkTebakBendera } from "../commands/game/tebakbendera";
import { checkTebakGambar } from "../commands/game/tebakgambar";
import { checkTebakKata } from "../commands/game/tebakkata";
import { checkTekaTeki } from "../commands/game/tekateki";
import { checkTrivia } from "../commands/game/trivia";

export function checkGameAnswer(jid: string, text: string, sender: string): string | null {
  const input = text.trim();
  if (!input) return null;

  return (
    checkMathAnswer(jid, input, sender) ||
    checkTebakKata(jid, input, sender) ||
    checkTrivia(jid, input, sender) ||
    checkTebakBendera(jid, input, sender) ||
    checkTebakGambar(jid, input, sender) ||
    checkFamily100(jid, input, sender) ||
    checkAsahOtak(jid, input, sender) ||
    checkSiapakahAku(jid, input, sender) ||
    checkTekaTeki(jid, input, sender)
  );
}
