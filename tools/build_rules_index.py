import re
import textwrap
from pathlib import Path
from collections import OrderedDict

# Use the TXT you just exported
TXT_PATH = Path(r"C:\nexusarchive\tools\Riftbound Core Rules.txt")
OUT_TS_PATH = Path("src/data/rules-index.ts")

# Match things like:
# 000.
# 101.
# 103.2.
# 352.8.a.
# and also allow text after the number on the same line:
# 101. Deck Construction
RULE_HEADER_RE = re.compile(
    r"^\s*(\d{3}(?:\.\d+)*(?:\.[a-z])?)\.\s*(.*)$"
)


def normalize_body(text: str) -> str:
    """
    Join wrapped lines into paragraphs.

    The TXT export still has one sentence broken across multiple lines,
    so we:
      - treat blank lines as paragraph breaks
      - join non-blank lines with spaces
    """
    paragraphs = []
    current = []

    for line in text.splitlines():
        stripped = line.strip()
        if not stripped:
            if current:
                paragraphs.append(" ".join(current))
                current = []
        else:
            current.append(stripped)

    if current:
        paragraphs.append(" ".join(current))

    return "\n\n".join(paragraphs).strip()


def extract_txt_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def build_section_label(rule_id: str, body: str) -> str:
    """
    Build a human-friendly section label like:
      "103. To play Riftbound"
    using the first line of the rule's body, trimmed at the first comma/period.
    """
    body = (body or "").strip()
    if not body:
        return f"{rule_id}."

    # First non-empty line
    first_line = ""
    for line in body.splitlines():
        line = line.strip()
        if line:
            first_line = line
            break

    if not first_line:
        return f"{rule_id}."

    # Cut at the first comma or period (whichever comes first)
    import re
    head = re.split(r"[.,]", first_line, maxsplit=1)[0].strip()

    # Fallback: if somehow empty, just use a few words
    if not head:
        words = first_line.split()
        head = " ".join(words[:6])

    return f"{rule_id}. {head}"

def parse_rules(raw_text: str):
    """
    Parse the flat TXT into numbered rules.

    Each rule starts at a line that looks like:

      101. Deck Construction
      103.2.a. Chosen Champion

    We capture the id ("101", "103.2.a") and treat the rest of that line
    plus any following non-header lines as the rule body until the next header.
    """
    rules = []
    current_id = None
    current_lines = []

    for line in raw_text.splitlines():
        line = line.rstrip("\n")

        m = RULE_HEADER_RE.match(line)
        if m:
            # flush previous rule
            if current_id is not None:
                body = "\n".join(current_lines).strip()
                body = normalize_body(body)
                section = build_section_label(current_id, body)
                rules.append(
                    {
                        "id": current_id,
                        "section": section,
                        "text": body,
                    }
                )

            current_id = m.group(1)
            inline_text = m.group(2).strip()
            current_lines = []
            if inline_text:
                current_lines.append(inline_text)
        else:
            if current_id is not None:
                current_lines.append(line)

    # flush last rule
    if current_id is not None:
        body = "\n".join(current_lines).strip()
        body = normalize_body(body)
        section = build_section_label(current_id, body)
        rules.append(
            {
                "id": current_id,
                "section": section,
                "text": body,
            }
        )

    return rules


def escape_ts_string(s: str) -> str:
    s = s.replace("\\", "\\\\")
    s = s.replace("`", "\\`")
    return s


def merge_rules_by_id(rules):
    """
    Keep your existing merging behavior in case any ids are split
    across pages (they probably aren’t in the TXT, but it's harmless).
    """
    merged = OrderedDict()

    for r in rules:
        rid = r["id"]
        if rid in merged:
            existing = merged[rid]
            extra = r["text"].strip()
            if extra and extra not in existing["text"]:
                existing["text"] = (existing["text"] + "\n\n" + extra).strip()
        else:
            merged[rid] = r

    return list(merged.values())


def write_ts(rules, out_path: Path):
    out_path.parent.mkdir(parents=True, exist_ok=True)

    with out_path.open("w", encoding="utf-8") as f:
        f.write(
            textwrap.dedent(
                """\
// AUTO-GENERATED from Riftbound Core Rules TXT.
// Do not edit by hand; run tools/build_rules_index.py instead.

export type RuleEntry = {
  id: string;
  section: string;
  text: string;
};

export const rulesIndex: RuleEntry[] = [
"""
            )
        )

        for rule in rules:
            f.write("  {\n")
            f.write(f"    id: `{escape_ts_string(rule['id'])}`,\n")
            f.write(
                f"    section: `{escape_ts_string(rule['section'])}`,\n"
            )
            f.write(
                "    text: `"
                + escape_ts_string(rule["text"])
                + "`,\n"
            )
            f.write("  },\n")

        f.write("];\n")


def main():
    if not TXT_PATH.exists():
        raise SystemExit(f"TXT not found at {TXT_PATH}")
    print(f"Reading TXT: {TXT_PATH} ...")
    raw = extract_txt_text(TXT_PATH)
    print("Parsing rules...")
    rules = parse_rules(raw)
    print(f"Parsed {len(rules)} raw rule segments.")
    rules = merge_rules_by_id(rules)
    print(f"After merging by id, {len(rules)} unique rules.")
    print(f"Writing TS index to {OUT_TS_PATH} ...")
    write_ts(rules, OUT_TS_PATH)
    print("Done.")


if __name__ == "__main__":
    main()
