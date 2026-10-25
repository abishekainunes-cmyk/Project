"""Local Zero-Config Launcher for Akshay AI Personal Assistant.
Serves the local PWA HUD on localhost and opens the default web browser.
"""

import http.server
import socketserver
import webbrowser
from pathlib import Path

PORT = 8085
DIRECTORY = Path(__file__).parent.resolve()


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(DIRECTORY), **kwargs)

    def log_message(self, format, *args):
        # Clean logging
        print(f"[AKSHAY LOCAL HUD] {args[0]} - {args[1]} - {args[2]}")


def main():
    print(f"==================================================")
    print(f"  AKSHAY: Autonomous Personal AI & FinOS Engine  ")
    print(f"==================================================")
    print(f"[*] Serving HUD from: {DIRECTORY}")
    print(f"[*] Access URL: http://localhost:{PORT}")
    print(f"[*] Press Ctrl+C to terminate.")
    print(f"==================================================")

    webbrowser.open(f"http://localhost:{PORT}")

    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n[!] Shutting down Akshay local server.")


if __name__ == "__main__":
    main()
