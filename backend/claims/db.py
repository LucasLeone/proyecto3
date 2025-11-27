from functools import lru_cache
from typing import Any, Dict, Optional

from bson import ObjectId
from django.conf import settings
from pymongo import ASCENDING, MongoClient


@lru_cache(maxsize=1)
def get_main_client() -> MongoClient:
    return MongoClient(settings.MONGODB_MAIN_URI)


@lru_cache(maxsize=1)
def get_audit_client() -> MongoClient:
    return MongoClient(settings.MONGODB_AUDIT_URI)


def get_main_db():
    return get_main_client()[settings.MONGODB_MAIN_DB]


def get_audit_db():
    return get_audit_client()[settings.MONGODB_AUDIT_DB]


def to_object_id(value: Any) -> ObjectId:
    if isinstance(value, ObjectId):
        return value
    return ObjectId(str(value))


def serialize(document: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    if not document:
        return None
    doc = document.copy()
    if "_id" in doc:
        doc["id"] = str(doc.pop("_id"))
    return doc


def ensure_indexes():
    db = get_main_db()
    db.users.create_index("email", unique=True, sparse=True)
    db.areas.create_index("name", unique=True, sparse=True)
    db.projects.create_index([("client_id", ASCENDING)], sparse=True)
    db.claims.create_index([("created_by", ASCENDING), ("created_at", ASCENDING)])
    db.claims.create_index([("status", ASCENDING)])
    db.client_feedback_messages.create_index([("claim_id", ASCENDING), ("created_at", ASCENDING)])
    audit_db = get_audit_db()
    audit_db.claim_events.create_index([("claim_id", ASCENDING), ("created_at", ASCENDING)])
