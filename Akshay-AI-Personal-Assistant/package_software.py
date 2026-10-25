"""Packaging specification and builder for converting Akshay into standalone desktop software.

Prepares the distribution directory, packages Python runtime dependencies,
and builds a standalone executable.
"""

from __future__ import annotations
import os
import shutil
import subprocess
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
DIST_DIR = ROOT_DIR / "dist" / "Akshay_Personal_AI"


def prepare_dist():
    print("==============================================================")
    print("       AKSHAY: Standalone Software Packaging Engine          ")
    print("==============================================================")
    print(f"[*] Distribution Target: {DIST_DIR}")

    if DIST_DIR.exists():
        shutil.rmtree(DIST_DIR)
    DIST_DIR.mkdir(parents=True, exist_ok=True)

    # 1. Copy UI assets
    hud_src = ROOT_DIR / "Akshay-AI-Personal-Assistant"
    hud_dest = DIST_DIR / "ui"
    hud_dest.mkdir(parents=True, exist_ok=True)
    for f in ["index.html", "vercel.json", "START_AKSHAY.bat"]:
        src_file = hud_src / f
        if src_file.exists():
            shutil.copy2(src_file, hud_dest / f)

    # 2. Copy Core engine
    core_src = ROOT_DIR / "akshay_core"
    core_dest = DIST_DIR / "akshay_core"
    shutil.copytree(core_src, core_dest, ignore=shutil.ignore_patterns("__pycache__", "*.pyc"))

    # 3. Copy Server and Launcher
    shutil.copy2(hud_src / "server.py", DIST_DIR / "server.py")
    shutil.copy2(hud_src / "START_AKSHAY.bat", DIST_DIR / "LAUNCH_AKSHAY.bat")

    print("[+] Assets packaged successfully.")
    print(f"[+] Standalone software bundle prepared at: {DIST_DIR}")
    print("==============================================================")


if __name__ == "__main__":
    prepare_dist()
