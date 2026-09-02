"""
Unit Tests for BaseRecordStore Core CRUD and Integrity Mechanisms
"""

import pytest

from utils.base_record_store import BaseRecordStore, DuplicateRecordError, RecordNotFoundError
from utils.generic_record_store import GenericRecordStore


def test_generic_record_store_instantiation() -> None:
    """Test GenericRecordStore subclass functionality"""
    store = GenericRecordStore("GenericStore")
    rec = store.create_record("G1", {"type": "vitals", "value": 120})
    assert rec["id"] == "G1"
    assert store.get_record("G1")["data"]["value"] == 120


def test_create_and_get_record() -> None:
    """Test standard record creation and retrieval"""
    store = BaseRecordStore("TestLabStore")
    record = store.create_record(
        "REC-001", {"patient_name": "Alice", "test_type": "CBC", "result": 14.2}
    )

    assert record["id"] == "REC-001"
    assert record["version"] == 1
    assert "checksum" in record
    assert store.count() == 1

    fetched = store.get_record("REC-001")
    assert fetched["data"]["patient_name"] == "Alice"
    assert fetched["checksum"] == record["checksum"]


def test_duplicate_record_error() -> None:
    """Test duplicate record creation raises DuplicateRecordError"""
    store = BaseRecordStore("TestStore")
    store.create_record("REC-001", {"val": 10})

    with pytest.raises(DuplicateRecordError):
        store.create_record("REC-001", {"val": 20})


def test_update_record() -> None:
    """Test record update increments version and recalculates checksum"""
    store = BaseRecordStore("TestStore")
    orig = store.create_record("REC-002", {"status": "Pending"})

    updated = store.update_record("REC-002", {"status": "Completed", "verified": True})
    assert updated["version"] == 2
    assert updated["data"]["status"] == "Completed"
    assert updated["checksum"] != orig["checksum"]


def test_delete_record() -> None:
    """Test record deletion and not found checks"""
    store = BaseRecordStore("TestStore")
    store.create_record("REC-003", {"data": 123})
    assert store.delete_record("REC-003") is True
    assert store.count() == 0

    with pytest.raises(RecordNotFoundError):
        store.get_record("REC-003")

    with pytest.raises(RecordNotFoundError):
        store.delete_record("NON-EXISTENT")


def test_search_records() -> None:
    """Test querying records by key/value"""
    store = BaseRecordStore("SearchStore")
    store.create_record("R1", {"dept": "Cardiology", "value": 100})
    store.create_record("R2", {"dept": "Oncology", "value": 200})
    store.create_record("R3", {"dept": "Cardiology", "value": 300})

    cardio_results = store.search_records(filter_key="dept", filter_val="Cardiology")
    assert len(cardio_results) == 2

    all_records = store.search_records()
    assert len(all_records) == 3


def test_audit_trail() -> None:
    """Test audit log tracking across operations"""
    store = BaseRecordStore("AuditStore")
    store.create_record("R1", {"status": "Initial"})
    store.update_record("R1", {"status": "Updated"})
    store.delete_record("R1")

    trail = store.get_audit_trail("R1")
    assert len(trail) == 3
    assert [entry["action"] for entry in trail] == ["CREATE", "UPDATE", "DELETE"]
