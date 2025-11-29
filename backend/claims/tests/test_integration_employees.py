"""Tests de integración para API de Empleados"""
import pytest
from rest_framework import status


pytestmark = pytest.mark.integration


class TestEmployeesListCreateIntegration:
    """Tests para listar y crear empleados"""
    
    def test_list_employees_as_admin(self, api_client, admin_token, employee_user):
        """Admin puede listar empleados"""
        response = api_client.get(
            '/api/employees/',
            HTTP_AUTHORIZATION=f'Bearer {admin_token}'
        )
        
        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.data, list)
        assert len(response.data) >= 1
        assert any(emp["email"] == "employee@test.com" for emp in response.data)
    
    def test_list_employees_as_employee_forbidden(self, api_client, employee_token):
        """Employee no puede listar empleados"""
        response = api_client.get(
            '/api/employees/',
            HTTP_AUTHORIZATION=f'Bearer {employee_token}'
        )
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_create_employee_as_admin(self, api_client, admin_token, test_area):
        """Admin puede crear empleado"""
        response = api_client.post(
            '/api/employees/',
            {
                "email": "newemployee@test.com",
                "password": "password123",
                "full_name": "New Employee",
                "area_id": test_area["id"]
            },
            format='json',
            HTTP_AUTHORIZATION=f'Bearer {admin_token}'
        )
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["email"] == "newemployee@test.com"
        assert "password" not in response.data
    
    def test_create_employee_missing_password(self, api_client, admin_token, test_area):
        """Debe validar password requerido"""
        response = api_client.post(
            '/api/employees/',
            {
                "email": "test@test.com",
                "area_id": test_area["id"]
            },
            format='json',
            HTTP_AUTHORIZATION=f'Bearer {admin_token}'
        )
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_create_employee_duplicate_email(self, api_client, admin_token, employee_user, test_area):
        """No debe permitir email duplicado"""
        response = api_client.post(
            '/api/employees/',
            {
                "email": "employee@test.com",
                "password": "pass",
                "area_id": test_area["id"]
            },
            format='json',
            HTTP_AUTHORIZATION=f'Bearer {admin_token}'
        )
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST


class TestEmployeeDetailIntegration:
    """Tests para detalle, actualización y eliminación de empleados"""
    
    def test_get_employee_as_admin(self, api_client, admin_token, employee_user):
        """Admin puede ver detalle de empleado"""
        response = api_client.get(
            f'/api/employees/{employee_user["id"]}/',
            HTTP_AUTHORIZATION=f'Bearer {admin_token}'
        )
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data["email"] == "employee@test.com"
        assert "password" not in response.data
    
    def test_get_employee_not_found(self, api_client, admin_token):
        """Debe retornar 404 para empleado inexistente"""
        from bson import ObjectId
        fake_id = str(ObjectId())
        
        response = api_client.get(
            f'/api/employees/{fake_id}/',
            HTTP_AUTHORIZATION=f'Bearer {admin_token}'
        )
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
    
    def test_update_employee_as_admin(self, api_client, admin_token, employee_user):
        """Admin puede actualizar empleado"""
        response = api_client.put(
            f'/api/employees/{employee_user["id"]}/',
            {"full_name": "Updated Employee Name"},
            format='json',
            HTTP_AUTHORIZATION=f'Bearer {admin_token}'
        )
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data["full_name"] == "Updated Employee Name"
    
    def test_update_employee_password(self, api_client, admin_token, employee_user):
        """Admin puede cambiar contraseña de empleado"""
        response = api_client.put(
            f'/api/employees/{employee_user["id"]}/',
            {"password": "newpassword123"},
            format='json',
            HTTP_AUTHORIZATION=f'Bearer {admin_token}'
        )
        
        assert response.status_code == status.HTTP_200_OK
        
        # Verificar que puede hacer login con nueva contraseña
        login_response = api_client.post('/api/login/', {
            "email": "employee@test.com",
            "password": "newpassword123"
        }, format='json')
        
        assert login_response.status_code == status.HTTP_200_OK
    
    def test_delete_employee_as_admin(self, api_client, admin_token, employee_user):
        """Admin puede eliminar empleado (soft delete)"""
        response = api_client.delete(
            f'/api/employees/{employee_user["id"]}/',
            HTTP_AUTHORIZATION=f'Bearer {admin_token}'
        )
        
        assert response.status_code == status.HTTP_204_NO_CONTENT
        
        # Verificar que no puede hacer login
        login_response = api_client.post('/api/login/', {
            "email": "employee@test.com",
            "password": "employee123"
        }, format='json')
        
        assert login_response.status_code == status.HTTP_401_UNAUTHORIZED
