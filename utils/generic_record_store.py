"""
Generic Record Store Module
Standard in-memory and persisted storage for clinical and laboratory records.
"""

from utils.base_record_store import (
    BaseRecordStore,
    DuplicateRecordError,
    RecordNotFoundError,
)

__all__ = ["BaseRecordStore", "RecordNotFoundError", "DuplicateRecordError", "GenericRecordStore"]


class GenericRecordStore(BaseRecordStore):
    """Alias implementation of BaseRecordStore for generic clinical entity management"""

    pass
