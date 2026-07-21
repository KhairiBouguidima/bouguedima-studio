import os
import logging
from logging.handlers import RotatingFileHandler
import json
from datetime import datetime, timezone

class JsonFormatter(logging.Formatter):
    """Formats log records as JSON strings for Loki/Grafana ingestion."""
    def format(self, record):
        log_record = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        if record.exc_info:
            log_record["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_record)

def setup_logging():
    """Configure structured logging to stdout and a rotating file."""
    log_level = os.environ.get("LOG_LEVEL", "INFO").upper()
    log_format = os.environ.get("LOG_FORMAT", "json").lower()
    log_dir = os.environ.get("LOG_DIR", "logs")
    log_file = os.environ.get("LOG_FILE", "server.log")

    # Ensure log directory exists
    if not os.path.exists(log_dir):
        os.makedirs(log_dir, exist_ok=True)

    log_path = os.path.join(log_dir, log_file)

    # Base logging config
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)
    root_logger.handlers = []  # Reset existing handlers

    # Console Handler (Write to stdout/stderr in Docker)
    console_handler = logging.StreamHandler()
    if log_format == "json":
        console_formatter = JsonFormatter()
    else:
        console_formatter = logging.Formatter(
            "[%(asctime)s] %(levelname)s in %(module)s: %(message)s"
        )
    console_handler.setFormatter(console_formatter)
    console_handler.setLevel(log_level)
    root_logger.addHandler(console_handler)

    # Rotating File Handler
    file_handler = RotatingFileHandler(
        log_path, maxBytes=10 * 1024 * 1024, backupCount=5, encoding="utf-8"
    )
    if log_format == "json":
        file_formatter = JsonFormatter()
    else:
        file_formatter = logging.Formatter(
            "[%(asctime)s] %(levelname)s in %(module)s: %(message)s"
        )
    file_handler.setFormatter(file_formatter)
    file_handler.setLevel(log_level)
    root_logger.addHandler(file_handler)

    # Redirect FastAPI and Uvicorn log messages to standard logging root
    for logger_name in ("uvicorn", "uvicorn.access", "uvicorn.error", "fastapi"):
        l = logging.getLogger(logger_name)
        l.handlers = []
        l.propagate = True
