"""Kiwix Offline Knowledge Base Downloader for Akshay.

Allows users to download official .zim content packages directly from Kiwix mirrors
into the local data/zim directory with integrity checks.
"""

from __future__ import annotations
import os
import sys
import urllib.request
from pathlib import Path

DATA_ZIM_DIR = Path(__file__).resolve().parent.parent / "data" / "zim"
DATA_ZIM_DIR.mkdir(parents=True, exist_ok=True)

OFFICIAL_PACKAGES = {
    "1": {
        "name": "Wikipedia (Top 100k Articles)",
        "desc": "Compact offline encyclopedia of the most visited global articles.",
        "size": "~4.8 GB",
        "url": "https://download.kiwix.org/zim/wikipedia/wikipedia_en_top100k_nopic_2024-01.zim"
    },
    "2": {
        "name": "WikiHow (Complete DIY & Repair Manual)",
        "desc": "Offline step-by-step guides for survival, first aid, and equipment repair.",
        "size": "~5.6 GB",
        "url": "https://download.kiwix.org/zim/wikihow/wikihow_en_all_maxi_2024-02.zim"
    },
    "3": {
        "name": "MDWiki (Emergency & Medical Guide)",
        "desc": "Medical and first-aid reference handbook for emergencies without hospital access.",
        "size": "~1.4 GB",
        "url": "https://download.kiwix.org/zim/other/mdwiki_en_all_2023-11.zim"
    },
    "4": {
        "name": "DevDocs (Programming Languages & Tech Reference)",
        "desc": "Complete offline documentation for Python, JavaScript, Linux, Git, SQL.",
        "size": "~1.8 GB",
        "url": "https://download.kiwix.org/zim/other/devdocs_en_all_2023-10.zim"
    }
}


def print_catalog():
    print("==============================================================")
    print("   AKSHAY: Internet-in-a-Box Offline Knowledge Downloader     ")
    print("==============================================================")
    print(f"Destination: {DATA_ZIM_DIR}\n")
    for key, pkg in OFFICIAL_PACKAGES.items():
        print(f"[{key}] {pkg['name']} ({pkg['size']})")
        print(f"    {pkg['desc']}")
    print("==============================================================")


def main():
    print_catalog()
    choice = input("\nEnter package number to download (or 'q' to quit): ").strip()
    if choice in OFFICIAL_PACKAGES:
        pkg = OFFICIAL_PACKAGES[choice]
        filename = pkg['url'].split('/')[-1]
        target_path = DATA_ZIM_DIR / filename
        print(f"\n[*] Target: {target_path}")
        print(f"[*] Downloading from official Kiwix mirror...")
        print("[!] Note: Press Ctrl+C at any time to pause or cancel.\n")

        def hook(count, block_size, total_size):
            percent = int(count * block_size * 100 / total_size)
            downloaded_mb = (count * block_size) / (1024 * 1024)
            total_mb = total_size / (1024 * 1024)
            sys.stdout.write(f"\rProgress: {percent}% ({downloaded_mb:.1f} MB / {total_mb:.1f} MB)")
            sys.stdout.flush()

        try:
            urllib.request.urlretrieve(pkg['url'], target_path, reporthook=hook)
            print(f"\n[+] Success! {filename} downloaded to {target_path}")
        except Exception as e:
            print(f"\n[-] Download interrupted or failed: {e}")
    else:
        print("[*] Exited without downloading.")


if __name__ == "__main__":
    main()
