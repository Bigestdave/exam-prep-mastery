import { InlineMath, BlockMath } from "react-katex";
import "katex/dist/katex.min.css";

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
