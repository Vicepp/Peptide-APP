"""Convert the PepGuide Reference Guide .docx into JSON data for the app.

Usage:  python scripts/parse_doc.py "path/to/PepGuide Reference Guide.docx"
Writes: src/data/peptides.json, peptide-index.json, guides.json, glossary.json
Re-run it whenever the Word document is updated.
"""
import html
import json
import os
import re
import sys
import zipfile

APP = "this guide"
src = sys.argv[1]
xml = zipfile.ZipFile(src).read("word/document.xml").decode("utf8")
lines = []
for p in re.findall(r"<w:p[ >].*?</w:p>", xml, flags=re.S):
    t = html.unescape("".join(re.findall(r"<w:t[^>]*>([^<]*)</w:t>", p))).strip()
    st = re.search(r'<w:pStyle w:val="([^"]+)"', p)
    if t:
        lines.append((st.group(1) if st else "", t))

PROMO = ("More atpepguide", "Vendor reviews", "Global network map", "Price tracking")


def clean(t):
    t = re.sub(r"(?i)on the pepguide\.net website", "on any website", t)
    return re.sub(r"PepGuide", APP, t)


def slugify(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


h1_idx = [i for i, (s, _) in enumerate(lines) if s == "Heading1"]


def h1_range(name):
    for k, i in enumerate(h1_idx):
        if lines[i][1] == name:
            end = h1_idx[k + 1] if k + 1 < len(h1_idx) else len(lines)
            return i + 1, end
    raise KeyError(name)


def split_h2(a, b):
    out, cur = [], None
    for s, t in lines[a:b]:
        if s == "Heading2":
            if cur and cur["title"] == t:
                continue  # merge duplicated slide titles
            cur = {"title": t, "lines": []}
            out.append(cur)
        elif cur is not None:
            cur["lines"].append((s, t))
    return out


def blocks(ls):
    out = []
    for s, t in ls:
        if t == "!" or t.startswith(PROMO):
            continue
        t = clean(t)
        if s == "Heading3":
            out.append({"t": "h", "x": t})
        elif s == "ListBullet":
            out.append({"t": "li", "x": t})
        elif t.startswith("Briefing "):
            out.append({"t": "brief", "x": t[9:]})
        elif re.fullmatch(r"\d{4}", t):
            out.append({"t": "year", "x": t})
        else:
            out.append({"t": "p", "x": t})
    return out


# ---------- guides ----------
guide_groups = []
for name, key, blurb in [
    ("Getting Started", "getting-started", "Peptide basics, receptors, dosing concepts and stacking"),
    ("Foundations", "foundations", "Sourcing, COAs, testing, storage and injection safety"),
    ("Steady State and Half Life", "steady-state", "Half-life, steady state, PK and PD explained"),
]:
    a, b = h1_range(name)
    arts = []
    for sec in split_h2(a, b):
        bl = blocks(sec["lines"])
        brief = next((x["x"] for x in bl if x["t"] == "brief"), "")
        arts.append({"id": slugify(sec["title"]), "title": clean(sec["title"]), "summary": brief[:220], "blocks": bl})
    guide_groups.append({"id": key, "title": name, "blurb": blurb, "articles": arts})

a, b = h1_range("Peptide Index")
secs = split_h2(a, b)
legend = []
for s, t in secs[0]["lines"]:
    m = re.match(r"^([A-H])([A-Z].*)$", t)
    if m and not s:
        legend.append({"grade": m.group(1), "label": m.group(2)})

# ---------- peptides ----------
SEC_MAP = {
    "Overview": "overview", "Origin & Classification": "origin", "Primary Mechanism": "mechanism",
    "Key Research Findings": "research", "Dosing Reports & Optimal Delivery": "dosing",
    "Pharmacokinetics": "pk", "Synergy & Stacking": "synergy", "Safety & Contraindications": "safety",
    "Monitoring & Biomarkers": "monitoring", "Regulatory Status": "regulatory", "Works Cited": "cited",
}
URL_RE = re.compile(r"(https?://\S+|(?:www\.)?pubmed\.ncbi\.nlm\.nih\.gov/\d+/?|doi\.org/\S+)")


def parse_protocol(t):
    m = re.match(r"Protocol\s*(\d+)\s*:\s*(.*)", t)
    if not m:
        return None
    parts = [p.strip() for p in m.group(2).split(";")]
    head = parts[0]
    tag = re.search(r"\[([^\]]+)\]", head)
    pr = {"n": int(m.group(1)), "name": re.sub(r"\s*\[[^\]]+\]", "", head).strip(), "tag": tag.group(1) if tag else ""}
    last = None
    for p in parts[1:]:
        kv = re.match(r"^(Route|Dose|Frequency|Timing|Duration|Status)\s*:\s*(.*)$", p)
        if kv:
            last = kv.group(1).lower()
            pr[last] = kv.group(2)
        elif last:
            pr[last] += "; " + p
    return pr


def dose_guess(protos):
    for pr in protos:
        d = pr.get("dose", "")
        if "/kg" in d:
            continue
        m = re.search(r"(\d+(?:\.\d+)?)\s*(mcg|µg|mg)\b", d)
        if m:
            v = float(m.group(1))
            return round(v * 1000 if m.group(2) == "mg" else v, 2)
    return None


disclaimer = ""
peptides = []
for sec in secs[1:]:
    title = sec["title"]
    if title.startswith("Research Reference Disclaimer"):
        disclaimer = " ".join(t for _, t in sec["lines"])
        continue
    ls = sec["lines"]
    sub = ls[0][1] if ls and ls[0][0] == "" else ""
    parts = [p.strip() for p in sub.split("•")] if sub else []
    alias, category, status = "", "", ""
    if len(parts) >= 3:
        alias, category, status = " • ".join(parts[:-2]), parts[-2], parts[-1]
    elif len(parts) == 2:
        category, status = parts
    elif parts:
        status = parts[0]
    sections, cur = {}, None
    protocols, cites = [], []
    for s, t in ls[1:]:
        if s == "Heading3":
            cur = SEC_MAP.get(t, slugify(t))
            if cur.startswith("safety"):
                cur = "safety"
            elif cur.startswith("origin"):
                cur = "origin"
            sections.setdefault(cur, [])
            continue
        if cur is None:
            continue
        t = clean(t)
        if cur == "cited":
            g = re.match(r"^\[([A-H])\]\s*(.*)$", t)
            if g:
                s, t = g.group(1), g.group(2)
                m = URL_RE.search(t)
                url, text = "", t
                if m:
                    url = m.group(1).rstrip(".,;)")
                    text = t[: m.start()].strip()
                    if not url.startswith("http"):
                        url = "https://" + url
                cites.append({"g": s, "x": text.rstrip(" ."), "u": url})
            continue
        if cur == "dosing":
            if s == "ListBullet":
                pr = parse_protocol(t)
                if pr:
                    protocols.append(pr)
                else:
                    sections[cur].append({"t": "li", "x": t})
            elif len(t) > 140:
                mm = re.match(r"^([^:]{6,60}):(.*)$", t)
                sections[cur].append({"t": "note", "k": mm.group(1) if mm else "", "x": (mm.group(2) if mm else t).strip()})
            continue
        if cur == "overview":
            found = re.findall(r"(Brief Overview|Evidence lens):\s*(.*?)(?=(?:Brief Overview|Evidence lens):|$)", t)
            for k, v in found:
                sections[cur].append({"t": "note", "k": k, "x": v.strip()})
            if not found:
                sections[cur].append({"t": "p", "x": t})
            continue
        sections[cur].append({"t": "li" if s == "ListBullet" else "p", "x": t})
    hl = next((b["x"] for b in sections.get("pk", []) if b["x"].startswith("Half-life basis")), "")
    ov = sections.get("overview", [])
    short = next((b["x"] for b in ov if b.get("k") == "Brief Overview"), ov[0]["x"] if ov else "")
    peptides.append({
        "slug": slugify(title), "name": title, "alias": alias, "category": category, "status": status,
        "short": short[:260], "halfLifeText": hl.replace("Half-life basis:", "").strip(),
        "sections": sections, "protocols": protocols, "cited": cites, "doseMcg": dose_guess(protocols),
    })

# ---------- glossary ----------
a, b = h1_range("Glossary and Unit Conversion")
glossary, cat = [], ""
for s, t in split_h2(a, b)[0]["lines"]:
    if s == "Heading3":
        cat = t
    elif not s and not t.startswith(("Briefing", "Key terms")):
        m = re.match(r"^(.+?\))\s+(.*)$", t) if ")" in t[:40] else None
        if not m:
            m = re.match(r"^((?:\S+\s?){1,4}?)\s([A-Z].*)$", t)
        if m:
            glossary.append({"term": m.group(1).strip(), "def": m.group(2).strip(), "cat": cat})

a, b = h1_range("Interactive Tool Notes")
tools = {sec["title"]: " ".join(t for _, t in sec["lines"]) for sec in split_h2(a, b)}

out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "src", "data")
os.makedirs(out, exist_ok=True)


def dump(name, obj):
    with open(os.path.join(out, name), "w", encoding="utf8") as f:
        json.dump(obj, f, ensure_ascii=False, separators=(",", ":"))


dump("peptides.json", peptides)
dump("peptide-index.json", [{k: p[k] for k in ("slug", "name", "alias", "category", "status", "short", "doseMcg")} for p in peptides])
dump("guides.json", {"groups": guide_groups, "legend": legend, "disclaimer": clean(disclaimer), "tools": tools})
dump("glossary.json", glossary)
print(len(peptides), "peptides;", sum(len(g["articles"]) for g in guide_groups), "articles;", len(glossary), "terms;",
      sum(len(p["protocols"]) for p in peptides), "protocols;", sum(len(p["cited"]) for p in peptides), "citations")
