"""Tests de integración para autenticación y login"""
import pytest
from rest_framework import status


pytestmark = pytest.mark.integration


class TestLoginIntegration:
    """Tests de integración para el endpoint de login"""
    
    def test_login_success_admin(self, api_client, admin_user):
        """Debe autenticar correctamente un admin"""
        response = api_client.post('/api/auth/login/', {
            "email": "admin@test.com",
            "password": "admin123"
        }, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        assert "token" in response.data
        assert response.data["role"] == "admin"
        assert "user" in response.data
        assert response.data["user"]["email"] == "admin@test.com"
        assert "password" not in response.data["user"]
    
    def test_login_success_employee(self, api_client, employee_user):
        """Debe autenticar correctamente un empleado"""
        response = api_client.post('/api/auth/login/', {
            "email": "employee@test.com",
            "password": "employee123"
        }, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data["role"] == "employee"
    
    def test_login_success_client(self, api_client, client_user):
        """Debe autenticar correctamente un cliente"""
        response = api_client.post('/api/auth/login/', {
            "email": "client@test.com",
            "password": "client123"
        }, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data["role"] == "client"
    
    def test_login_wrong_password(self, api_client, admin_user):
        """Debe rechazar contraseña incorrecta"""
        response = api_client.post('/api/auth/login/', {
            "email": "admin@test.com",
            "password": "wrongpassword"
        }, format='json')
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert "Credenciales inválidas" in str(response.data)
    
    def test_login_user_not_found(self, api_client, clean_database):
        """Debe rechazar usuario inexistente"""
        response = api_client.post('/api/auth/login/', {
            "email": "notfound@test.com",
            "password": "password"
        }, format='json')
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_login_inactive_user(self, api_client, clean_database, admin_user):
        """Debe rechazar usuario inactivo"""
        # Desactivar usuario
        from claims.db import get_main_db
        from bson import ObjectId
        get_main_db().users.update_one(
            {"_id": ObjectId(admin_user["id"])},
            {"$set": {"is_active": False}}
        )
        
        response = api_client.post('/api/auth/login/', {
            "email": "admin@test.com",
            "password": "admin123"
        }, format='json')
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_login_missing_email(self, api_client):
        """Debe validar email requerido"""
        response = api_client.post('/api/auth/login/', {
            "password": "password"
        }, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_login_missing_password(self, api_client):
        """Debe validar password requerido"""
        response = api_client.post('/api/auth/login/', {
            "email": "test@test.com"
        }, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_login_invalid_email_format(self, api_client):
        """Debe validar formato de email"""
        response = api_client.post('/api/auth/login/', {
            "email": "invalid-email",
            "password": "password"
        }, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_token_can_be_used_for_authentication(self, api_client, admin_user, admin_token):
        """El token generado debe funcionar para autenticación"""
        # Intentar acceder a un endpoint protegido con el token
        response = api_client.get(
            '/api/areas/',
            HTTP_AUTHORIZATION=f'Bearer {admin_token}'
        )
        
        # Debe permitir acceso (200 o similar, no 401/403 por autenticación)
        assert response.status_code != status.HTTP_401_UNAUTHORIZED
