import { InlineMath, BlockMath } from "react-katex";
import "katex/dist/katex.min.css";

/**
 * Auto-wrap unmarked math expressions in `$...$` so things like
 * `2x^2-4x-3=0` written by lecturers (no LaTeX delimiters) still render.
 * Heuristic: any whitespace-delimited token containing `^` is treated as math.
 * Skipped if the text already contains `$` (author opted in to manual LaTeX).
 */
function autoLatex(text: string): string {
  if (!text || text.includes("$")) return text;
  // Match contiguous non-space runs that include a caret (e.g. 2x^2-4x-3=0, X^2+2x-8=0)
  return text.replace(/\S*\^\S+/g, (m) => `$${m}$`);
}

/**
 * Renders a string containing optional LaTeX math expressions using KaTeX.
 *
 * Supports two modes:
 *   - Block math:  $$...$$ — renders as a full-width centered equation
 *   - Inline math: $...$  — renders flowing within surrounding text
 *
 * Falls back to plain text if KaTeX cannot parse the expression,
 * so a bad formula will never crash the UI.
 */
export function renderWithMath(text: string): React.ReactNode {
  if (!text) return text;

  text = autoLatex(text);

  // Split on $$...$$ (block math) first
  const blockParts = text.split(/(\$\$[\s\S]+?\$\$)/g);

  return blockParts.map((bp, bi) => {
    if (bp.startsWith("$$") && bp.endsWith("$$")) {
      const tex = bp.slice(2, -2).trim();
      try {
        return <BlockMath key={`b${bi}`} math={tex} />;
      } catch {
        return bp;
      }
    }

    // Within each non-block segment, split on $...$ (inline math)
    const inlineParts = bp.split(/(\$[^$\n]+?\$)/g);
    return inlineParts.map((ip, ii) => {
      if (ip.startsWith("$") && ip.endsWith("$") && ip.length > 2) {
        const tex = ip.slice(1, -1);
        try {
          return <InlineMath key={`b${bi}-i${ii}`} math={tex} />;
        } catch {
          return ip;
        }
      }
      return <span key={`b${bi}-t${ii}`}>{ip}</span>;
    });
  });
}
