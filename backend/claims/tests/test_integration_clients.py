"""Tests de integración para API de Clientes"""
import pytest
from rest_framework import status


pytestmark = pytest.mark.integration


class TestClientsListCreateIntegration:
    """Tests para listar y crear clientes"""
    
    def test_list_clients_as_admin(self, api_client, admin_token, client_user):
        """Admin puede listar clientes"""
        response = api_client.get(
            '/api/clients/',
            HTTP_AUTHORIZATION=f'Bearer {admin_token}'
        )
        
        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.data, list)
        assert len(response.data) >= 1
        assert any(client["email"] == "client@test.com" for client in response.data)
    
    def test_list_clients_as_employee_allowed(self, api_client, employee_token, client_user):
        """Employee puede listar clientes"""
        response = api_client.get(
            '/api/clients/',
            HTTP_AUTHORIZATION=f'Bearer {employee_token}'
        )
        
        assert response.status_code == status.HTTP_200_OK
    
    def test_list_clients_as_client_forbidden(self, api_client, client_token):
        """Client no puede listar clientes"""
        response = api_client.get(
            '/api/clients/',
            HTTP_AUTHORIZATION=f'Bearer {client_token}'
        )
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_create_client_as_admin(self, api_client, admin_token):
        """Admin puede crear cliente"""
        response = api_client.post(
            '/api/clients/',
            {
                "email": "newclient@test.com",
                "password": "password123",
                "full_name": "New Client",
                "company_name": "New Corp"
            },
            format='json',
            HTTP_AUTHORIZATION=f'Bearer {admin_token}'
        )
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["email"] == "newclient@test.com"
        assert response.data["company_name"] == "New Corp"
        assert "password" not in response.data
    
    def test_create_client_missing_password(self, api_client, admin_token):
        """Debe validar password requerido"""
        response = api_client.post(
            '/api/clients/',
            {
                "email": "test@test.com",
                "company_name": "Test"
            },
            format='json',
            HTTP_AUTHORIZATION=f'Bearer {admin_token}'
        )
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_create_client_duplicate_email(self, api_client, admin_token, client_user):
        """No debe permitir email duplicado"""
        response = api_client.post(
            '/api/clients/',
            {
                "email": "client@test.com",
                "password": "pass",
                "company_name": "Test"
            },
            format='json',
            HTTP_AUTHORIZATION=f'Bearer {admin_token}'
        )
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST


class TestClientDetailIntegration:
    """Tests para detalle, actualización y eliminación de clientes"""
    
    def test_get_client_as_admin(self, api_client, admin_token, client_user):
        """Admin puede ver detalle de cliente"""
        response = api_client.get(
            f'/api/clients/{client_user["id"]}/',
            HTTP_AUTHORIZATION=f'Bearer {admin_token}'
        )
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data["email"] == "client@test.com"
        assert "password" not in response.data
    
    def test_get_client_not_found(self, api_client, admin_token):
        """Debe retornar 404 para cliente inexistente"""
        from bson import ObjectId
        fake_id = str(ObjectId())
        
        response = api_client.get(
            f'/api/clients/{fake_id}/',
            HTTP_AUTHORIZATION=f'Bearer {admin_token}'
        )
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
    
    def test_update_client_as_admin(self, api_client, admin_token, client_user):
        """Admin puede actualizar cliente"""
        response = api_client.put(
            f'/api/clients/{client_user["id"]}/',
            {"company_name": "Updated Corp"},
            format='json',
            HTTP_AUTHORIZATION=f'Bearer {admin_token}'
        )
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data["company_name"] == "Updated Corp"
    
    def test_update_client_password(self, api_client, admin_token, client_user):
        """Admin puede cambiar contraseña de cliente"""
        response = api_client.put(
            f'/api/clients/{client_user["id"]}/',
            {"password": "newpassword123"},
            format='json',
            HTTP_AUTHORIZATION=f'Bearer {admin_token}'
        )
        
        assert response.status_code == status.HTTP_200_OK
        
        # Verificar que puede hacer login con nueva contraseña
        login_response = api_client.post('/api/login/', {
            "email": "client@test.com",
            "password": "newpassword123"
        }, format='json')
        
        assert login_response.status_code == status.HTTP_200_OK
    
    def test_delete_client_as_admin(self, api_client, admin_token, client_user):
        """Admin puede eliminar cliente (soft delete)"""
        response = api_client.delete(
            f'/api/clients/{client_user["id"]}/',
            HTTP_AUTHORIZATION=f'Bearer {admin_token}'
        )
        
        assert response.status_code == status.HTTP_204_NO_CONTENT
        
        # Verificar que no puede hacer login
        login_response = api_client.post('/api/login/', {
            "email": "client@test.com",
            "password": "client123"
        }, format='json')
        
        assert login_response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_delete_client_as_employee_forbidden(self, api_client, employee_token, client_user):
        """Employee no puede eliminar cliente"""
        response = api_client.delete(
            f'/api/clients/{client_user["id"]}/',
            HTTP_AUTHORIZATION=f'Bearer {employee_token}'
        )
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
