"""Lightweight loopback-only Stageplot preview. No CDN or iframe runtime."""
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit, parse_qs
import argparse
import gzip
import hashlib

parser = argparse.ArgumentParser()
parser.add_argument("--port", type=int, default=8872)
args = parser.parse_args()
root = Path(__file__).resolve().parent
cache = {}


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        route = urlsplit(self.path)
        if route.path == "/favicon.ico":
            self.send_response(204)
            self.end_headers()
            return
        if route.path == "/stageplot-account-v1.js":
            asset = root / "stageplot-account-v1.js"
            if not asset.is_file():
                self.send_error(404)
                return
            body = asset.read_bytes()
            self.send_response(200)
            self.send_header("Content-Type", "text/javascript; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-cache")
            self.send_header("X-Content-Type-Options", "nosniff")
            self.end_headers()
            self.wfile.write(body)
            return
        if route.path.startswith("/stageplot-assets/drums/"):
            asset_root = (root / "stageplot-assets" / "drums").resolve()
            asset = (root / route.path.lstrip("/")).resolve()
            if asset.parent != asset_root or asset.suffix not in (".png", ".webp", ".svg") or not asset.is_file():
                self.send_error(404)
                return
            body = asset.read_bytes()
            self.send_response(200)
            content_type = {".webp": "image/webp", ".png": "image/png", ".svg": "image/svg+xml"}[asset.suffix]
            self.send_header("Content-Type", content_type)
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "public, max-age=31536000, immutable")
            self.end_headers()
            self.wfile.write(body)
            return
        if route.path.startswith("/stageplot-assets/mics/"):
            asset_root = (root / "stageplot-assets" / "mics").resolve()
            asset = (root / route.path.lstrip("/")).resolve()
            if asset.parent != asset_root or asset.suffix != ".png" or not asset.is_file():
                self.send_error(404)
                return
            body = asset.read_bytes()
            self.send_response(200)
            self.send_header("Content-Type", "image/png")
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "public, max-age=31536000, immutable")
            self.end_headers()
            self.wfile.write(body)
            return
        if route.path != "/":
            self.send_error(404)
            return
        query = parse_qs(route.query)
        baseline = args.port != 8872 and query.get("baseline") == ["1"]
        path = root / ("stageplot-studio-v2.html" if baseline else "stageplot-studio.html")
        theme = query.get("theme", ["auto"])[0]
        scheme = theme if theme in ("light", "dark") else "light dark"
        account_runtime = root / "stageplot-account-v1.js"
        key = (path.name, path.stat().st_mtime_ns, account_runtime.stat().st_mtime_ns, scheme)
        if key not in cache:
            fragment = path.read_text(encoding="utf-8")
            # The preview is deliberately a single self-contained response. Public builds
            # may serve the same runtime as a file, while this path keeps local validation
            # independent of additional requests and the browser's extension filters.
            fragment = fragment.replace(
                '<script src="./stageplot-account-v1.js"></script>',
                "<script>" + account_runtime.read_text(encoding="utf-8") + "</script>",
            )
            document = '<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Stageplot Studio</title><style>html{color-scheme:' + scheme + '}body{margin:0;padding:16px;background:light-dark(#fff,#171b1d)}</style></head><body>' + fragment + '</body></html>'
            raw = document.encode("utf-8")
            cache.clear()
            cache[key] = (raw, gzip.compress(raw, compresslevel=6, mtime=0), '"' + hashlib.sha256(raw).hexdigest()[:20] + '"')
        raw, compressed, etag = cache[key]
        if self.headers.get("If-None-Match") == etag:
            self.send_response(304)
            self.send_header("ETag", etag)
            self.end_headers()
            return
        use_gzip = "gzip" in self.headers.get("Accept-Encoding", "")
        body = compressed if use_gzip else raw
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-cache")
        self.send_header("ETag", etag)
        self.send_header("Vary", "Accept-Encoding")
        if use_gzip:
            self.send_header("Content-Encoding", "gzip")
        self.send_header("Content-Security-Policy", "default-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'unsafe-inline'; img-src 'self' data:; connect-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'self'")
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *_args):
        pass


print("http://127.0.0.1:" + str(args.port), flush=True)
ThreadingHTTPServer(("127.0.0.1", args.port), Handler).serve_forever()
