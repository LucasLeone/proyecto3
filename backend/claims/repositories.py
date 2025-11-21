from datetime import datetime
from typing import Any, Dict, List, Optional

from bson import ObjectId
from django.contrib.auth.hashers import check_password, make_password
from pymongo.errors import DuplicateKeyError

from .db import get_audit_db, get_main_db, serialize, to_object_id


# -------- Users --------
def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    doc = get_main_db().users.find_one({"email": email})
    return serialize(doc)


def get_user_by_id(user_id: Any) -> Optional[Dict[str, Any]]:
    if not user_id:
        return None
    doc = get_main_db().users.find_one({"_id": to_object_id(user_id)})
    return serialize(doc)


def list_users(role: Optional[str] = None, active_only: bool = True) -> List[Dict[str, Any]]:
    query: Dict[str, Any] = {}
    if role:
        query["role"] = role
    if active_only:
        query["is_active"] = {"$ne": False}
    docs = get_main_db().users.find(query).sort("email", 1)
    return [serialize(doc) for doc in docs]


def create_user(
    *,
    role: str,
    email: str,
    password: str,
    full_name: str = "",
    area_id: Optional[str] = None,
    company_name: Optional[str] = None,
) -> Dict[str, Any]:
    now = datetime.utcnow()
    payload: Dict[str, Any] = {
        "email": email.lower().strip(),
        "password": make_password(password),
        "role": role,
        "full_name": full_name,
        "area_id": to_object_id(area_id) if area_id else None,
        "company_name": company_name,
        "is_active": True,
        "created_at": now,
        "updated_at": now,
    }
    db = get_main_db()
    try:
        inserted = db.users.insert_one(payload)
    except DuplicateKeyError:
        raise ValueError("Ya existe un usuario con ese email")
    return get_user_by_id(inserted.inserted_id)


def update_user(user_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
    updates = updates.copy()
    if "password" in updates:
        updates["password"] = make_password(updates["password"])
    if "area_id" in updates and updates["area_id"]:
        updates["area_id"] = to_object_id(updates["area_id"])
    updates["updated_at"] = datetime.utcnow()
    db = get_main_db()
    try:
        db.users.update_one({"_id": to_object_id(user_id)}, {"$set": updates})
    except DuplicateKeyError:
        raise ValueError("Ya existe un usuario con ese email")
    return get_user_by_id(user_id)


def soft_delete_user(user_id: str):
    db = get_main_db()
    db.users.update_one(
        {"_id": to_object_id(user_id)},
        {"$set": {"is_active": False, "updated_at": datetime.utcnow()}},
    )


def verify_password(raw_password: str, hashed_password: str) -> bool:
    return check_password(raw_password, hashed_password)


# -------- Areas --------
def list_areas(active_only: bool = True) -> List[Dict[str, Any]]:
    query: Dict[str, Any] = {}
    if active_only:
        query["is_active"] = {"$ne": False}
    docs = get_main_db().areas.find(query).sort("name", 1)
    return [serialize(doc) for doc in docs]


def get_area(area_id: Any) -> Optional[Dict[str, Any]]:
    doc = get_main_db().areas.find_one({"_id": to_object_id(area_id)})
    return serialize(doc)


def create_area(name: str, description: str = "") -> Dict[str, Any]:
    now = datetime.utcnow()
    payload = {
        "name": name.strip(),
        "description": description.strip(),
        "is_active": True,
        "created_at": now,
        "updated_at": now,
    }
    db = get_main_db()
    try:
        res = db.areas.insert_one(payload)
    except DuplicateKeyError:
        raise ValueError("Ya existe un área con ese nombre")
    return get_area(res.inserted_id)


def update_area(area_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
    updates = updates.copy()
    updates["updated_at"] = datetime.utcnow()
    db = get_main_db()
    try:
        db.areas.update_one({"_id": to_object_id(area_id)}, {"$set": updates})
    except DuplicateKeyError:
        raise ValueError("Ya existe un área con ese nombre")
    return get_area(area_id)


def delete_area(area_id: str):
    db = get_main_db()
    # Regla de negocio: no eliminar si tiene empleados activos
    employee_count = db.users.count_documents(
        {"role": "employee", "area_id": to_object_id(area_id), "is_active": {"$ne": False}}
    )
    if employee_count > 0:
        raise ValueError("El área tiene empleados activos asociados y no puede eliminarse")
    db.areas.update_one(
        {"_id": to_object_id(area_id)},
        {"$set": {"is_active": False, "updated_at": datetime.utcnow()}},
    )


# -------- Projects --------
def list_projects(
    *,
    client_id: Optional[str] = None,
    active_only: bool = True,
) -> List[Dict[str, Any]]:
    query: Dict[str, Any] = {}
    if client_id:
        query["client_id"] = to_object_id(client_id)
    if active_only:
        query["is_active"] = {"$ne": False}
    docs = get_main_db().projects.find(query).sort("created_at", -1)
    return [serialize(doc) for doc in docs]


def get_project(project_id: Any) -> Optional[Dict[str, Any]]:
    doc = get_main_db().projects.find_one({"_id": to_object_id(project_id)})
    return serialize(doc)


def create_project(*, name: str, project_type: str, client_id: str) -> Dict[str, Any]:
    now = datetime.utcnow()
    payload = {
        "name": name.strip(),
        "project_type": project_type.strip(),
        "client_id": to_object_id(client_id),
        "is_active": True,
        "created_at": now,
        "updated_at": now,
    }
    res = get_main_db().projects.insert_one(payload)
    return get_project(res.inserted_id)


def update_project(project_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
    updates = updates.copy()
    if "client_id" in updates and updates["client_id"]:
        updates["client_id"] = to_object_id(updates["client_id"])
    updates["updated_at"] = datetime.utcnow()
    get_main_db().projects.update_one({"_id": to_object_id(project_id)}, {"$set": updates})
    return get_project(project_id)


def delete_project(project_id: str):
    get_main_db().projects.update_one(
        {"_id": to_object_id(project_id)},
        {"$set": {"is_active": False, "updated_at": datetime.utcnow()}},
    )


# -------- Claims --------
ALLOWED_STATUSES = ["Ingresado", "En Proceso", "Resuelto"]
ALLOWED_PRIORITIES = ["Baja", "Media", "Alta"]
PUBLIC_ACTIONS = {"created", "status_changed", "area_changed"}


def log_claim_event(
    *,
    claim_id: Any,
    actor_id: Optional[str],
    actor_role: Optional[str],
    action: str,
    visibility: str = "internal",
    details: Dict[str, Any],
) -> None:
    payload = {
        "claim_id": to_object_id(claim_id),
        "actor_id": to_object_id(actor_id) if actor_id else None,
        "actor_role": actor_role,
        "action": action,
        "visibility": visibility,
        "details": details,
        "created_at": datetime.utcnow(),
    }
    get_audit_db().claim_events.insert_one(payload)


def list_claim_events(claim_id: Any, public_only: bool = False) -> List[Dict[str, Any]]:
    query: Dict[str, Any] = {"claim_id": to_object_id(claim_id)}
    if public_only:
        query["visibility"] = "public"
    events = get_audit_db().claim_events.find(query).sort("created_at", 1)
    results: List[Dict[str, Any]] = []
    
    # Caches para evitar lookups repetidos
    user_cache: Dict[str, Optional[Dict[str, Any]]] = {}
    area_cache: Dict[str, Optional[Dict[str, Any]]] = {}
    
    for ev in events:
        data = serialize(ev)
        data["claim_id"] = str(ev["claim_id"])
        
        # Enriquecer con información del actor
        if ev.get("actor_id"):
            actor_id_str = str(ev["actor_id"])
            data["actor_id"] = actor_id_str
            
            if actor_id_str not in user_cache:
                user_doc = get_main_db().users.find_one({"_id": ev["actor_id"]})
                user_cache[actor_id_str] = serialize(user_doc) if user_doc else None
            
            user = user_cache[actor_id_str]
            if user:
                data["actor_name"] = user.get("full_name") or user.get("email")
        
        # Enriquecer eventos de cambio de área con nombres de áreas
        if ev.get("action") == "area_changed" and ev.get("details"):
            details = ev["details"]
            
            # Área origen
            if details.get("from"):
                from_id = details["from"]
                if from_id not in area_cache:
                    area_doc = get_main_db().areas.find_one({"_id": to_object_id(from_id)})
                    area_cache[from_id] = serialize(area_doc) if area_doc else None
                
                from_area = area_cache[from_id]
                if from_area:
                    data["details"]["from_area_name"] = from_area.get("name")
            
            # Área destino
            if details.get("to"):
                to_id = details["to"]
                if to_id not in area_cache:
                    area_doc = get_main_db().areas.find_one({"_id": to_object_id(to_id)})
                    area_cache[to_id] = serialize(area_doc) if area_doc else None
                
                to_area = area_cache[to_id]
                if to_area:
                    data["details"]["to_area_name"] = to_area.get("name")
            
            # Empleado que derivó
            if details.get("employee_id"):
                emp_id = details["employee_id"]
                if emp_id not in user_cache:
                    user_doc = get_main_db().users.find_one({"_id": to_object_id(emp_id)})
                    user_cache[emp_id] = serialize(user_doc) if user_doc else None
                
                employee = user_cache[emp_id]
                if employee:
                    data["details"]["employee_name"] = employee.get("full_name") or employee.get("email")
        
        results.append(data)
    
    if public_only:
        results = [ev for ev in results if ev.get("action") in PUBLIC_ACTIONS]
    return results


def _validate_status_transition(old: str, new: str) -> None:
    if old == new:
        return
    if old == "Ingresado" and new == "En Proceso":
        return
    if old == "En Proceso" and new == "Resuelto":
        return
    raise ValueError("Transición de estado no permitida")


def list_claims(
    *,
    role: str,
    user_id: str,
    client_id: Optional[str] = None,
    status: Optional[str] = None,
) -> List[Dict[str, Any]]:
    query: Dict[str, Any] = {}
    if role == "client":
        query["created_by"] = to_object_id(user_id)
    elif client_id:
        query["created_by"] = to_object_id(client_id)
    if status:
        query["status"] = status
    docs = get_main_db().claims.find(query).sort("created_at", -1)
    return [serialize(doc) for doc in docs]


def get_claim(claim_id: Any) -> Optional[Dict[str, Any]]:
    doc = get_main_db().claims.find_one({"_id": to_object_id(claim_id)})
    return serialize(doc)


def create_claim(
    *,
    project_id: str,
    claim_type: str,
    urgency: str,
    severity: str,
    description: str,
    created_by: str,
    sub_area: Optional[str] = None,
) -> Dict[str, Any]:
    now = datetime.utcnow()
    payload = {
        "project_id": to_object_id(project_id),
        "claim_type": claim_type.strip(),
        "urgency": urgency,
        "severity": severity,
        "description": description.strip(),
        "status": "Ingresado",
        "priority": "Media",
        "area_id": None,
        "sub_area": sub_area.strip() if sub_area else None,
        "created_by": to_object_id(created_by),
        "created_at": now,
        "updated_at": now,
    }
    res = get_main_db().claims.insert_one(payload)
    claim = get_claim(res.inserted_id)
    log_claim_event(
        claim_id=claim["id"],
        actor_id=created_by,
        actor_role="client",
        action="created",
        visibility="public",
        details={"status": "Ingresado"},
    )
    return claim


def update_claim(claim_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
    updates = updates.copy()
    if "project_id" in updates and updates["project_id"]:
        updates["project_id"] = to_object_id(updates["project_id"])
    if "area_id" in updates and updates["area_id"]:
        updates["area_id"] = to_object_id(updates["area_id"])
    updates["updated_at"] = datetime.utcnow()
    get_main_db().claims.update_one({"_id": to_object_id(claim_id)}, {"$set": updates})
    updated = get_claim(claim_id)
    if not updated:
        raise ValueError("Reclamo no encontrado al actualizar")
    return updated


def update_claim_with_rules(
    *,
    claim: Dict[str, Any],
    actor_id: str,
    actor_role: str,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    area_id: Optional[str] = None,
    sub_area: Optional[str] = None,
    reason: Optional[str] = None,
) -> Dict[str, Any]:
    if claim["status"] == "Resuelto":
        raise ValueError("El reclamo está resuelto y no admite cambios")

    updates: Dict[str, Any] = {}
    events: List[Dict[str, Any]] = []
    current_area = claim.get("area_id")
    current_area_str = str(current_area) if current_area else None

    if status:
        _validate_status_transition(claim["status"], status)
        updates["status"] = status
        events.append(
            {
                "action": "status_changed",
                "visibility": "public",
                "details": {"from": claim["status"], "to": status},
            }
        )

    if priority:
        updates["priority"] = priority
        events.append(
            {
                "action": "priority_changed",
                "visibility": "internal",
                "details": {"from": claim.get("priority"), "to": priority},
            }
        )

    if area_id is not None:
        if area_id:
            area = get_area(area_id)
            if not area or not area.get("is_active", True):
                raise ValueError("Área no encontrada o inactiva")
        # motivo solo cuando ya había un área y la cambiamos
        if current_area_str and str(area_id or "") != current_area_str and not reason:
            raise ValueError("La derivación requiere motivo")
        updates["area_id"] = to_object_id(area_id) if area_id else None
        events.append(
            {
                "action": "area_changed",
                "visibility": "public",
                "details": {
                    "from": str(current_area or ""),
                    "to": str(area_id or ""),
                    "reason": reason,
                    "employee_id": actor_id,
                },
            }
        )

    if sub_area is not None:
        updates["sub_area"] = sub_area
        events.append(
          {
              "action": "sub_area_changed",
              "visibility": "internal",
              "details": {"from": claim.get("sub_area"), "to": sub_area},
          }
        )

    if not updates:
        return claim

    updated = update_claim(claim["id"], updates)

    for ev in events:
        log_claim_event(
            claim_id=claim["id"],
            actor_id=actor_id,
            actor_role=actor_role,
            action=ev["action"],
            visibility=ev["visibility"],
            details=ev["details"],
        )

    return updated


def add_claim_comment(*, claim_id: str, actor_id: str, actor_role: str, comment: str) -> Dict[str, Any]:
    claim = get_claim(claim_id)
    if not claim:
        raise ValueError("Reclamo no encontrado")
    log_claim_event(
        claim_id=claim_id,
        actor_id=actor_id,
        actor_role=actor_role,
        action="comment",
        visibility="internal",
        details={"comment": comment},
    )
    return claim


def add_claim_action(*, claim_id: str, actor_id: str, actor_role: str, action_description: str) -> Dict[str, Any]:
    """
    Registra una acción de trabajo realizada por un empleado sin cambiar el estado o área del reclamo.
    Ejemplos: 'Revisé los logs del sistema', 'Apliqué el parche de seguridad', etc.
    """
    claim = get_claim(claim_id)
    if not claim:
        raise ValueError("Reclamo no encontrado")
    if not action_description.strip():
        raise ValueError("La descripción de la acción es obligatoria")
    log_claim_event(
        claim_id=claim_id,
        actor_id=actor_id,
        actor_role=actor_role,
        action="action_logged",
        visibility="internal",
        details={"action_description": action_description.strip()},
    )
    return claim
