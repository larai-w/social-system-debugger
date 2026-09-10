#!/usr/bin/env python3
"""Reject private working material, business strategy, and credentials from a public repo.

Generic across VEAI repositories. Blocks a commit when a staged file looks private by
path/name, carries an explicit private marker, contains secrets, OR reads like business
strategy by content (even if the filename is neutral).

Escape hatch for a reviewed false positive: put the literal token `check-public-repo: allow`
somewhere in the file. That clears the strategy-content check and the private *filename*
convention (a substring guess such as `handoff`). It never clears a private *path component*
(`private/`, `.private/`) and never clears secrets.
Do not use `--no-verify`; keep strategy material in docs-private/ (gitignored) instead.
"""

from __future__ import annotations

import argparse
import re
import subprocess
import sys
from pathlib import Path, PurePosixPath

ROOT = Path(__file__).resolve().parents[1]

PRIVATE_PATH_PARTS = {
    ".private",
    "private",
    "docs-private",
    "internal",
    "confidential",
    "strategy-notes",
    "blog_drafts",
    "blog-drafts",
}

PRIVATE_NAME_TERMS = (
    "strategy",
    "strategic",
    "handoff",
    "worklog",
    "interview-notes",
    "戦略",
    "内部",
    "機密",
    "引き継ぎ",
    "ヒアリング",
    "見積",
)

CONTENT_EXEMPTIONS = {
    "scripts/check_public_repo.py",
    "docs/PUBLIC_REPOSITORY_POLICY.md",
    # gitleaks の許可リストは、検出させたくない値を**リテラルで**書く場所なので、
    # 秘密情報のパターンに当たるのが正常。ここでは AWS 公式ドキュメントのサンプル値。
    ".gitleaks.toml",
}

ALLOW_TOKEN = "check-public-repo: allow"

PRIVATE_MARKERS = (
    re.compile(r"(?im)^\s*repo-visibility\s*:\s*private\s*$"),
    re.compile(r"(?im)^\s*(?:internal only|confidential|do not distribute)\s*$"),
    re.compile(r"(?m)(?:社外秘|内部限定|外部共有禁止)"),
)

# 確度の高い主要シークレットパターン（網羅検出は gitleaks が担う。
# ここでは公開リポジトリへの混入を確実に防ぎたい高頻度・高精度のものに絞る。
# 追加: Slack / Google / JWT / Stripe / OpenAI / npm / PyPI）
SECRET_PATTERNS = (
    ("private key", re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY(?: BLOCK)?-----")),
    ("AWS access key", re.compile(r"\b(?:AKIA|ASIA)[A-Z0-9]{16}\b")),
    ("GitHub token", re.compile(r"\bgithub_pat_[A-Za-z0-9_]{20,}\b|\bgh[opusr]_[A-Za-z0-9]{20,}\b")),
    ("Slack token", re.compile(r"\bxox[baprs]-[A-Za-z0-9-]{10,}\b")),
    ("Slack webhook", re.compile(r"https://hooks\.slack\.com/services/T[A-Z0-9]{8,}/B[A-Z0-9]{8,}/[A-Za-z0-9]{24}")),
    ("Google API key", re.compile(r"\bAIza[0-9A-Za-z\-_]{35}\b")),
    ("JWT", re.compile(r"\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b")),
    ("Stripe key", re.compile(r"\b(?:sk|pk|rk)_(?:live|test)_[0-9a-zA-Z]{24,}\b")),
    ("OpenAI key", re.compile(r"\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b")),
    ("npm token", re.compile(r"\bnpm_[A-Za-z0-9]{36}\b")),
    ("PyPI token", re.compile(r"\bpypi-[A-Za-z0-9_-]{16,}\b")),
)

# Public documentation may name the private repository, but implementation paths reveal
# internal operating material and do not belong in a public repository.
PRIVATE_REPO_PATH = re.compile(
    r"(?i)(?:~/Developer/)?veai-private/"
    r"(?:governance|knowledge|security|carequest|setup|strategy|marketing|career)(?:/|\b)"
)

# Strong, multi-word strategy phrases: a single hit blocks. These are deliberately specific so
# they essentially never appear in code, config, blog copy, or design docs — only in the kind of
# business/growth planning that must stay private. (Single ambiguous words like "戦略" or acronyms
# like "cac" are intentionally NOT used: they matched cache/AGENTS/gitignore text and were useless.)
STRATEGY_STRONG = (
    "事業戦略", "収益モデル", "価格戦略", "料金戦略", "成長戦略", "グロース戦略", "グロース計画",
    "マネタイズ戦略", "資金調達", "投資家向け", "売上目標", "収益目標", "市場参入戦略",
    "go-to-market", "go to market", "revenue model", "pricing strategy",
    "fundraising", "cap table", "unit economics", "sales pipeline", "monetization strategy",
    "business model canvas",
)


def git_paths(*args: str) -> list[str]:
    result = subprocess.run(["git", *args, "-z"], cwd=ROOT, check=True, capture_output=True)
    return [item.decode("utf-8") for item in result.stdout.split(b"\0") if item]


def staged_content(path: str) -> bytes:
    return subprocess.run(
        ["git", "show", f":{path}"], cwd=ROOT, check=True, capture_output=True
    ).stdout


def tracked_content(path: str) -> bytes:
    return (ROOT / path).read_bytes()


def file_reasons(path: str, content: bytes) -> list[str]:
    """Policy reasons for a file whose content could be read.

    The private *path component* case is handled by the caller: it must not depend on
    content at all, and it is never escapable.

    A private *filename convention* is a substring guess (`handoff`, `strategy`, …) and is
    the most common false positive: a repository may legitimately ship tooling called
    `handoff-check.sh`, or a doc named `session-handoff.md` that is a procedure rather than
    private material. Before 2026-09-09 the reviewed-false-positive token could not reach
    this case, because the check returned before the content was read. Secrets are still
    scanned when the token clears the name, so the token never lets a credential through.
    """
    name_reason = private_path_reason(path)
    if name_reason and name_reason != "private path component":
        # `content` is bytes here, like everywhere else in this script. Decode before
        # looking for the token: comparing a str token against bytes raises TypeError,
        # and this branch only runs for files whose *name* matched, so a repository
        # without such names would never hit it in local testing.
        if ALLOW_TOKEN not in content.decode("utf-8", errors="replace"):
            return [name_reason]
    return content_reasons(path, content)


def private_path_reason(path: str) -> str | None:
    normalised = PurePosixPath(path)
    lower_parts = {part.lower() for part in normalised.parts}
    lower_name = normalised.name.lower()
    if lower_parts & PRIVATE_PATH_PARTS:
        return "private path component"
    if any(term in lower_name for term in PRIVATE_NAME_TERMS):
        return "private filename convention"
    if ".private." in lower_name or ".internal." in lower_name:
        return "private filename suffix"
    return None


def content_reasons(path: str, content: bytes) -> list[str]:
    if path in CONTENT_EXEMPTIONS or b"\0" in content:
        return []
    text = content.decode("utf-8", errors="replace")
    lower = text.lower()
    reasons = ["private classification marker" for p in PRIVATE_MARKERS if p.search(text)]
    reasons.extend(label for label, p in SECRET_PATTERNS if p.search(text))
    if PRIVATE_REPO_PATH.search(text):
        reasons.append("internal private-repository path")

    if ALLOW_TOKEN not in text:
        hits = sorted({term for term in STRATEGY_STRONG if term in lower})
        if hits:
            reasons.append("business-strategy content (" + ", ".join(hits) + ")")
    return sorted(set(reasons))


def main() -> int:
    parser = argparse.ArgumentParser()
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--staged", action="store_true", help="check files staged for commit")
    mode.add_argument("--tracked", action="store_true", help="check all tracked files")
    mode.add_argument(
        "--working-tree", action="store_true", help="check tracked and untracked non-ignored files"
    )
    args = parser.parse_args()

    if args.staged:
        paths = git_paths("diff", "--cached", "--name-only", "--diff-filter=ACMR")
        read_content = staged_content
    elif args.tracked:
        paths = git_paths("ls-files")
        read_content = tracked_content
    else:
        paths = git_paths("ls-files", "--cached", "--others", "--exclude-standard")
        read_content = tracked_content

    errors: list[str] = []
    for path in paths:
        # `git ls-files` still lists working-tree deletions until they are staged. A deleted file
        # has no content left to inspect and should not make local preflight checks unusable.
        if not args.staged and not (ROOT / path).is_file():
            continue
        # A private *path component* (`private/`, `.private/`) is a deliberate location.
        # There is no reviewed-false-positive case for it, so it is decided without
        # reading the file and is never escapable.
        if private_path_reason(path) == "private path component":
            errors.append(f"{path}: private path component")
            continue
        try:
            content = read_content(path)
        except (OSError, subprocess.CalledProcessError) as error:
            errors.append(f"{path}: cannot inspect content ({error})")
            continue
        errors.extend(f"{path}: {reason}" for reason in file_reasons(path, content))

    if errors:
        print("Public repository policy violation:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        print(
            "\nMove strategy/working material into docs-private/ (gitignored), or write a "
            "sanitised public summary. For a reviewed false positive, add the token "
            f"'{ALLOW_TOKEN}' to the file. Do not use --no-verify.",
            file=sys.stderr,
        )
        return 1

    print(f"public repository policy OK: {len(paths)} file(s) checked")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
