"""Configuración para tests de integración del backend"""
import pytest
from rest_framework.test import APIClient
from django.contrib.auth.hashers import make_password
from bson import ObjectId
from datetime import datetime

from claims.db import get_main_db
from claims.auth import generate_token


@pytest.fixture
def api_client():
    """Cliente API de Django REST Framework"""
    return APIClient()


@pytest.fixture
def clean_database():
    """Limpia las colecciones de MongoDB antes de cada test"""
    db = get_main_db()
    
    # Limpiar todas las colecciones
    db.users.delete_many({})
    db.areas.delete_many({})
    db.projects.delete_many({})
    db.claims.delete_many({})
    db.client_feedback.delete_many({})
    db.claim_events.delete_many({})
    
    yield db
    
    # Limpiar después del test
    db.users.delete_many({})
    db.areas.delete_many({})
    db.projects.delete_many({})
    db.claims.delete_many({})
    db.client_feedback.delete_many({})
    db.claim_events.delete_many({})


@pytest.fixture
def admin_user(clean_database):
    """Crea un usuario administrador de prueba"""
    admin_data = {
        "_id": ObjectId(),
        "email": "admin@test.com",
        "password": make_password("admin123"),
        "role": "admin",
        "full_name": "Admin Test",
        "is_active": True,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    clean_database.users.insert_one(admin_data)
    
    # Convertir _id a id para uso en tests
    admin_data["id"] = str(admin_data["_id"])
    return admin_data


@pytest.fixture
def employee_user(clean_database, test_area):
    """Crea un usuario empleado de prueba"""
    employee_data = {
        "_id": ObjectId(),
        "email": "employee@test.com",
        "password": make_password("employee123"),
        "role": "employee",
        "full_name": "Employee Test",
        "area_id": test_area["_id"],
        "is_active": True,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    clean_database.users.insert_one(employee_data)
    
    employee_data["id"] = str(employee_data["_id"])
    return employee_data


@pytest.fixture
def client_user(clean_database):
    """Crea un usuario cliente de prueba"""
    client_data = {
        "_id": ObjectId(),
        "email": "client@test.com",
        "password": make_password("client123"),
        "role": "client",
        "full_name": "Client Test",
        "company_name": "Test Corp",
        "is_active": True,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    clean_database.users.insert_one(client_data)
    
    client_data["id"] = str(client_data["_id"])
    return client_data


@pytest.fixture
def admin_token(admin_user):
    """Genera token JWT para usuario admin"""
    return generate_token(admin_user)


@pytest.fixture
def employee_token(employee_user):
    """Genera token JWT para usuario employee"""
    return generate_token(employee_user)


@pytest.fixture
def client_token(client_user):
    """Genera token JWT para usuario client"""
    return generate_token(client_user)


@pytest.fixture
def test_area(clean_database):
    """Crea un área de prueba"""
    area_data = {
        "_id": ObjectId(),
        "name": "Test Area",
        "description": "Area for testing",
        "sub_areas": [],
        "is_active": True,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    clean_database.areas.insert_one(area_data)
    
    area_data["id"] = str(area_data["_id"])
    return area_data


@pytest.fixture
def test_project(clean_database, client_user):
    """Crea un proyecto de prueba"""
    project_data = {
        "_id": ObjectId(),
        "name": "Test Project",
        "description": "Project for testing",
        "client_id": ObjectId(client_user["id"]),
        "is_active": True,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    clean_database.projects.insert_one(project_data)
    
    project_data["id"] = str(project_data["_id"])
    return project_data


@pytest.fixture
def test_claim(clean_database, test_project, test_area, client_user):
    """Crea un reclamo de prueba"""
    claim_data = {
        "_id": ObjectId(),
        "title": "Test Claim",
        "description": "Claim for testing",
        "project_id": ObjectId(test_project["id"]),
        "area_id": ObjectId(test_area["id"]),
        "client_id": ObjectId(client_user["id"]),
        "priority": "P2 - Media",
        "severity": "S2 - Moderado",
        "status": "Ingresado",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "actions": [],
        "comments": [],
    }
    clean_database.claims.insert_one(claim_data)
    
    claim_data["id"] = str(claim_data["_id"])
    return claim_data


def auth_headers(token):
    """Helper para generar headers de autenticación"""
    return {"HTTP_AUTHORIZATION": f"Bearer {token}"}
