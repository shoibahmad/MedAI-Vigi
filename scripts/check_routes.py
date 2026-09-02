"""
Check if all routes are properly registered in Flask app
"""

import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app import app

print("=" * 60)
print("REGISTERED ROUTES IN FLASK APP")
print("=" * 60)

routes = []
for rule in app.url_map.iter_rules():
    routes.append({"endpoint": rule.endpoint, "methods": ",".join(rule.methods), "path": str(rule)})

# Sort by path
routes.sort(key=lambda x: x["path"])

# Print routes
for route in routes:
    if route["endpoint"] not in ["static"]:
        print(f"[OK] {route['path']:<40} -> {route['endpoint']}")

print("=" * 60)

# Check specific routes we need
required_routes = [
    "/documentation",
    "/api_reference",
    "/research_papers",
    "/faqs",
    "/privacy_policy",
    "/terms_of_service",
    "/cookie_policy",
    "/health",
    "/predict",
    "/generate_report",
]

print("\nCHECKING REQUIRED ROUTES:")
print("-" * 60)

for route in required_routes:
    found = any(r["path"] == route for r in routes)
    status = "[FOUND]" if found else "[MISSING]"
    print(f"{status:<15} {route}")

print("=" * 60)
