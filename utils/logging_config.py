"""
Structured Logging and Error Tracking Configuration
Integrates python-json-logger, request correlation IDs, and Sentry monitoring.
"""

import json
import logging
import os
import sys
import uuid
from datetime import datetime
from typing import Any, Dict, Optional

from flask import Flask, g, request

try:
    from pythonjsonlogger import jsonlogger
except ImportError:
    jsonlogger = None


class StructuredJSONFormatter(logging.Formatter):
    """Formats standard logging records as structured JSON entries"""

    def format(self, record: logging.LogRecord) -> str:
        log_entry: Dict[str, Any] = {
            "timestamp": datetime.fromtimestamp(record.created).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "line": record.lineno,
        }

        # Extra structured parameters passed via extra={...}
        for attr in ["path", "error", "duration_ms", "risk_score", "patient_id"]:
            if hasattr(record, attr):
                log_entry[attr] = getattr(record, attr)

        # Add Flask request context if available
        try:
            if request:
                log_entry["http_method"] = request.method
                log_entry["path"] = request.path
                log_entry["ip"] = request.remote_addr
                if hasattr(g, "request_id"):
                    log_entry["request_id"] = g.request_id
                else:
                    g.request_id = str(uuid.uuid4())
                    log_entry["request_id"] = g.request_id
        except RuntimeError:
            pass

        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)

        return json.dumps(log_entry)


JSONFormatter = StructuredJSONFormatter


def setup_structured_logging(app: Optional[Flask] = None, log_level: int = logging.INFO) -> None:
    """Initialize structured JSON logging with python-json-logger and Sentry"""
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)

    # Avoid duplicate handlers
    if not any(isinstance(h.formatter, StructuredJSONFormatter) for h in root_logger.handlers):
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(StructuredJSONFormatter())
        root_logger.addHandler(handler)

    # Sentry / external error tracking hook
    sentry_dsn = os.getenv("SENTRY_DSN")
    if sentry_dsn:
        try:
            import sentry_sdk
            from sentry_sdk.integrations.flask import FlaskIntegration

            sentry_sdk.init(
                dsn=sentry_dsn,
                integrations=[FlaskIntegration()],
                traces_sample_rate=0.2,
                profiles_sample_rate=0.2,
            )
            root_logger.info("Sentry error tracking initialized successfully.")
        except ImportError:
            root_logger.warning("sentry-sdk not installed; skipping external error tracking setup.")

    if app:
        app.logger.setLevel(log_level)
