import re
import textwrap
from pathlib import Path
from collections import OrderedDict

from PyPDF2 import PdfReader  # pip install PyPDF2 if needed


# Path to your rules PDF  (raw string to handle backslashes)
PDF_PATH = Path(r"C:\nexusarchive\tools\Riftbound Core Rules v1.1-100125.pdf")

# Where to write the TS file (relative to project root)
OUT_TS_PATH = Path("src/data/rules-index.ts")


# Matches: 000.   051.   053.1.   103.4.c.
RULE_HEADER_RE = re.compile(r"^\s*(\d{3}(?:\.\d+)*(?:\.[a-z])?)\.\s*$")


def normalize_body(text: str) -> str:
    """
    Turn a bunch of one-word-per-line text into nicer paragraphs.

    - Joins non-empty lines into sentences separated by spaces.
    - Keeps blank lines as paragraph breaks.
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

    # Join paragraphs with a blank line between
    return "\n\n".join(paragraphs).strip()


def extract_pdf_text(pdf_path: Path) -> str:
    reader = PdfReader(str(pdf_path))
    chunks = []
    for page in reader.pages:
        t = page.extract_text() or ""
        chunks.append(t)
    return "\n".join(chunks)


def build_section_label(rule_id: str, body: str) -> str:
    """
    Try to build a human-friendly section label like:
      "000. Golden and Silver Rules"
    by taking the first few words of the rule body.
    """
    words = []
    for line in body.splitlines():
        line = line.strip()
        if not line:
            # stop at first blank line *after* we've collected some words
            if words:
                break
            else:
                continue
        for w in line.split():
            words.append(w)
            if len(words) >= 8:  # cap title to ~8 words
                break
        if len(words) >= 8:
            break

    title = " ".join(words)
    if title:
        return f"{rule_id}. {title}"
    else:
        return f"{rule_id}."


def parse_rules(raw_text: str):
    """
    Find rule headers that look like:
      000.
      001.
      053.1.
      103.4.c.
    and collect all following lines as that rule's body
    until the next header.
    """
    rules = []
    current_id = None
    current_lines = []

    for line in raw_text.splitlines():
        line = line.rstrip()

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

            current_id = m.group(1)  # "000" or "053.1" or "103.4.c"
            current_lines = []
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
    Merge multiple segments with the same rule id into a single rule.

    - Keeps the first section label we saw.
    - Appends any new text that isn't already in the rule body.
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
// AUTO-GENERATED from Riftbound Core Rules PDF.
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
    if not PDF_PATH.exists():
        raise SystemExit(f"PDF not found at {PDF_PATH}")
    print(f"Reading PDF: {PDF_PATH} ...")
    raw = extract_pdf_text(PDF_PATH)
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
