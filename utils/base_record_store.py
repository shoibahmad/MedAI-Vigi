"""
Base Record Store Module for Healthcare and Clinical Modules
Provides standardized CRUD, audit logging, checksum validation, and search capabilities.
"""

import hashlib
import json
import logging
from datetime import datetime
from threading import RLock
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


class RecordNotFoundError(Exception):
    """Raised when a requested record identifier is not found"""

    pass


class DuplicateRecordError(Exception):
    """Raised when attempting to create a record with an existing identifier"""

    pass


class BaseRecordStore:
    """
    Standardized, thread-safe base record manager for clinical and healthcare datasets.
    Subclasses can override domain-specific validation or indexing behavior.
    """

    def __init__(self, store_name: str = "GenericRecordStore") -> None:
        self.store_name = store_name
        self._records: Dict[str, Dict[str, Any]] = {}
        self._audit_log: List[Dict[str, Any]] = []
        self._lock = RLock()

    def _calculate_checksum(self, data: Dict[str, Any]) -> str:
        """Compute SHA-256 integrity checksum of record content"""
        serialized = json.dumps(data, sort_keys=True, default=str)
        return hashlib.sha256(serialized.encode("utf-8")).hexdigest()

    def _log_audit(
        self, action: str, record_id: str, details: Optional[Dict[str, Any]] = None
    ) -> None:
        """Append immutable audit log entry"""
        entry = {
            "store": self.store_name,
            "action": action,
            "record_id": record_id,
            "timestamp": datetime.now().isoformat(),
            "details": details or {},
        }
        self._audit_log.append(entry)
        logger.debug(f"Audit log [{self.store_name}]: {action} on {record_id}")

    def create_record(self, record_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Insert a new clinical record with automatic checksum and timestamp"""
        with self._lock:
            if record_id in self._records:
                raise DuplicateRecordError(
                    f"Record with ID '{record_id}' already exists in {self.store_name}"
                )

            checksum = self._calculate_checksum(data)
            record_payload = {
                "id": record_id,
                "data": dict(data),
                "checksum": checksum,
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat(),
                "version": 1,
            }
            self._records[record_id] = record_payload
            self._log_audit("CREATE", record_id, {"checksum": checksum})
            return dict(record_payload)

    def get_record(self, record_id: str) -> Dict[str, Any]:
        """Retrieve record by ID with integrity verification"""
        with self._lock:
            if record_id not in self._records:
                raise RecordNotFoundError(f"Record '{record_id}' not found in {self.store_name}")

            record = self._records[record_id]
            current_checksum = self._calculate_checksum(record["data"])
            if current_checksum != record["checksum"]:
                logger.warning(
                    f"Integrity checksum mismatch for record {record_id} in {self.store_name}"
                )
            return dict(record)

    def update_record(self, record_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Update existing record and increment version"""
        with self._lock:
            if record_id not in self._records:
                raise RecordNotFoundError(f"Cannot update non-existent record '{record_id}'")

            existing = self._records[record_id]
            existing["data"].update(data)
            existing["checksum"] = self._calculate_checksum(existing["data"])
            existing["updated_at"] = datetime.now().isoformat()
            existing["version"] += 1

            self._log_audit("UPDATE", record_id, {"version": existing["version"]})
            return dict(existing)

    def delete_record(self, record_id: str) -> bool:
        """Remove record from store"""
        with self._lock:
            if record_id not in self._records:
                raise RecordNotFoundError(f"Cannot delete non-existent record '{record_id}'")

            del self._records[record_id]
            self._log_audit("DELETE", record_id)
            return True

    def search_records(
        self, filter_key: Optional[str] = None, filter_val: Optional[Any] = None
    ) -> List[Dict[str, Any]]:
        """Query records matching key-value criteria"""
        with self._lock:
            if filter_key is None:
                return [dict(r) for r in self._records.values()]

            results = []
            for r in self._records.values():
                if filter_key in r["data"] and r["data"][filter_key] == filter_val:
                    results.append(dict(r))
            return results

    def get_audit_trail(self, record_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Retrieve audit history entries"""
        with self._lock:
            if record_id is None:
                return list(self._audit_log)
            return [log for log in self._audit_log if log["record_id"] == record_id]

    def count(self) -> int:
        """Return total record count"""
        with self._lock:
            return len(self._records)
