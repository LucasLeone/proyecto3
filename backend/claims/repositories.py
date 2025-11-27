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
        "sub_areas": [],  # Array de sub-áreas
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


def add_sub_area(area_id: str, sub_area_name: str) -> Dict[str, Any]:
    """Agregar una sub-área a un área"""
    db = get_main_db()
    area = get_area(area_id)
    if not area:
        raise ValueError("Área no encontrada")
    
    sub_area_name = sub_area_name.strip()
    if not sub_area_name:
        raise ValueError("El nombre de la sub-área no puede estar vacío")
    
    # Verificar que no exista ya una sub-área con ese nombre en esta área
    sub_areas = area.get("sub_areas", [])
    if any(sa["name"].lower() == sub_area_name.lower() for sa in sub_areas):
        raise ValueError("Ya existe una sub-área con ese nombre en esta área")
    
    new_sub_area = {
        "id": str(ObjectId()),
        "name": sub_area_name,
        "created_at": datetime.utcnow()
    }
    
    db.areas.update_one(
        {"_id": to_object_id(area_id)},
        {
            "$push": {"sub_areas": new_sub_area},
            "$set": {"updated_at": datetime.utcnow()}
        }
    )
    return get_area(area_id)


def update_sub_area(area_id: str, sub_area_id: str, new_name: str) -> Dict[str, Any]:
    """Actualizar el nombre de una sub-área"""
    db = get_main_db()
    area = get_area(area_id)
    if not area:
        raise ValueError("Área no encontrada")
    
    new_name = new_name.strip()
    if not new_name:
        raise ValueError("El nombre de la sub-área no puede estar vacío")
    
    # Verificar que la sub-área existe
    sub_areas = area.get("sub_areas", [])
    if not any(sa["id"] == sub_area_id for sa in sub_areas):
        raise ValueError("Sub-área no encontrada")
    
    # Verificar que el nuevo nombre no esté duplicado
    if any(sa["id"] != sub_area_id and sa["name"].lower() == new_name.lower() for sa in sub_areas):
        raise ValueError("Ya existe una sub-área con ese nombre en esta área")
    
    db.areas.update_one(
        {"_id": to_object_id(area_id), "sub_areas.id": sub_area_id},
        {
            "$set": {
                "sub_areas.$.name": new_name,
                "updated_at": datetime.utcnow()
            }
        }
    )
    return get_area(area_id)


def delete_sub_area(area_id: str, sub_area_id: str) -> Dict[str, Any]:
    """Eliminar una sub-área de un área"""
    db = get_main_db()
    area = get_area(area_id)
    if not area:
        raise ValueError("Área no encontrada")
    
    db.areas.update_one(
        {"_id": to_object_id(area_id)},
        {
            "$pull": {"sub_areas": {"id": sub_area_id}},
            "$set": {"updated_at": datetime.utcnow()}
        }
    )
    return get_area(area_id)


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
    priority: str,
    severity: str,
    description: str,
    created_by: str,
    sub_area: Optional[str] = None,
    attachment_path: Optional[str] = None,
    attachment_name: Optional[str] = None,
) -> Dict[str, Any]:
    now = datetime.utcnow()
    payload = {
        "project_id": to_object_id(project_id),
        "claim_type": claim_type.strip(),
        "priority": priority,
        "severity": severity,
        "description": description.strip(),
        "status": "Ingresado",
        "area_id": None,
        "sub_area": sub_area.strip() if sub_area else None,
        "attachment_path": attachment_path,
        "attachment_name": attachment_name,
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
    resolution_description: Optional[str] = None,
) -> Dict[str, Any]:
    if claim["status"] == "Resuelto":
        raise ValueError("El reclamo está resuelto y no admite cambios")

    updates: Dict[str, Any] = {}
    events: List[Dict[str, Any]] = []
    current_area = claim.get("area_id")
    current_area_str = str(current_area) if current_area else None

    if status:
        _validate_status_transition(claim["status"], status)
        
        # Validar que si cambia a Resuelto, debe tener descripción de resolución
        if status == "Resuelto":
            if not resolution_description or not resolution_description.strip():
                raise ValueError("Se requiere una descripción detallada de la resolución")
            updates["resolution_description"] = resolution_description.strip()
        
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


def _serialize_feedback_message(doc: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    data = serialize(doc)
    if not data:
        return None
    if doc and doc.get("claim_id"):
        data["claim_id"] = str(doc["claim_id"])
    if doc and doc.get("client_id"):
        data["client_id"] = str(doc["client_id"])
    data["type"] = doc.get("type", "progress")
    data["message"] = doc.get("message")
    data["rating"] = doc.get("rating")
    data["created_at"] = doc.get("created_at")
    return data


def list_client_feedback_messages(claim_id: str) -> List[Dict[str, Any]]:
    messages = (
        get_main_db()
        .client_feedback_messages
        .find({"claim_id": to_object_id(claim_id)})
        .sort("created_at", 1)
    )

    results: List[Dict[str, Any]] = []
    client_cache: Dict[str, Optional[Dict[str, Any]]] = {}

    for msg in messages:
        serialized = _serialize_feedback_message(msg)
        if not serialized:
            continue
        client_id = serialized.get("client_id")
        if client_id and client_id not in client_cache:
            client_cache[client_id] = get_user_by_id(client_id)
        client = client_cache.get(client_id)
        if client:
            full_name = client.get("full_name") or client.get("company_name") or client.get("email")
            serialized["client_name"] = full_name
        results.append(serialized)

    return results


def submit_client_feedback(
    *,
    claim_id: str,
    client_id: str,
    rating: Optional[int] = None,
    feedback: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Gestiona la retroalimentación del cliente según el estado del reclamo.
    - En "En Proceso" permite enviar múltiples mensajes.
    - En "Resuelto" solo permite un mensaje final con calificación.
    """
    claim = get_claim(claim_id)
    if not claim:
        raise ValueError("Reclamo no encontrado")

    if str(claim.get("created_by")) != str(client_id):
        raise ValueError("No tiene permisos para calificar este reclamo")

    status = claim.get("status")
    if status == "Ingresado":
        raise ValueError("No puede enviar retroalimentación mientras el reclamo está ingresado")

    feedback_text = feedback.strip() if isinstance(feedback, str) else None
    now = datetime.utcnow()

    db = get_main_db()

    if status == "En Proceso":
        if rating is not None:
            raise ValueError("La calificación solo puede enviarse cuando el reclamo está resuelto")
        if not feedback_text:
            raise ValueError("Debe escribir un comentario para enviar retroalimentación")

        payload = {
            "claim_id": to_object_id(claim_id),
            "client_id": to_object_id(client_id),
            "message": feedback_text,
            "rating": None,
            "type": "progress",
            "created_at": now,
        }
        inserted = db.client_feedback_messages.insert_one(payload)
        stored = db.client_feedback_messages.find_one({"_id": inserted.inserted_id})

        # No registrar en el timeline, solo en la colección de mensajes
        # log_claim_event(
        #     claim_id=claim_id,
        #     actor_id=client_id,
        #     actor_role="client",
        #     action="client_comment_added",
        #     visibility="internal",
        #     details={"comment": feedback_text},
        # )

        return {
            "claim": claim,
            "message": _serialize_feedback_message(stored),
        }

    if status == "Resuelto":
        existing_final = db.client_feedback_messages.find_one(
            {"claim_id": to_object_id(claim_id), "type": "final"}
        )
        if existing_final:
            raise ValueError("Ya enviaste la retroalimentación final de este reclamo")

        if rating is None:
            raise ValueError("Debe proporcionar una calificación para el reclamo resuelto")
        if rating < 1 or rating > 5:
            raise ValueError("La calificación debe estar entre 1 y 5")

        payload = {
            "claim_id": to_object_id(claim_id),
            "client_id": to_object_id(client_id),
            "message": feedback_text,
            "rating": rating,
            "type": "final",
            "created_at": now,
        }
        inserted = db.client_feedback_messages.insert_one(payload)
        stored = db.client_feedback_messages.find_one({"_id": inserted.inserted_id})

        updates: Dict[str, Any] = {
            "client_rating": rating,
            "client_feedback": feedback_text,
            "updated_at": now,
        }
        db.claims.update_one({"_id": to_object_id(claim_id)}, {"$set": updates})

        details: Dict[str, Any] = {"rating": rating}
        if feedback_text:
            details["feedback"] = feedback_text

        # No registrar en el timeline, solo en la colección de mensajes
        # log_claim_event(
        #     claim_id=claim_id,
        #     actor_id=client_id,
        #     actor_role="client",
        #     action="client_feedback_added",
        #     visibility="internal",
        #     details=details,
        # )

        return {
            "claim": get_claim(claim_id),
            "message": _serialize_feedback_message(stored),
        }

    raise ValueError("Estado del reclamo no admite retroalimentación")
