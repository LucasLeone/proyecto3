"""Tests de integración para API de Áreas"""
import pytest
from rest_framework import status


pytestmark = pytest.mark.integration


class TestAreasListCreateIntegration:
    """Tests para listar y crear áreas"""
    
    def test_list_areas_as_admin(self, api_client, admin_token, test_area):
        """Admin puede listar áreas"""
        response = api_client.get(
            '/api/areas/',
            HTTP_AUTHORIZATION=f'Bearer {admin_token}'
        )
        
        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.data, list)
        assert len(response.data) >= 1
        assert any(area["name"] == "Test Area" for area in response.data)
    
    def test_list_areas_as_employee(self, api_client, employee_token, test_area):
        """Employee puede listar áreas"""
        response = api_client.get(
            '/api/areas/',
            HTTP_AUTHORIZATION=f'Bearer {employee_token}'
        )
        
        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.data, list)
    
    def test_list_areas_as_client_forbidden(self, api_client, client_token):
        """Client no puede listar áreas"""
        response = api_client.get(
            '/api/areas/',
            HTTP_AUTHORIZATION=f'Bearer {client_token}'
        )
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_list_areas_without_auth(self, api_client):
        """Sin autenticación debe fallar"""
        response = api_client.get('/api/areas/')
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_create_area_as_admin(self, api_client, admin_token):
        """Admin puede crear área"""
        response = api_client.post(
            '/api/areas/',
            {
                "name": "New Test Area",
                "description": "Created in test"
            },
            format='json',
            HTTP_AUTHORIZATION=f'Bearer {admin_token}'
        )
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["name"] == "New Test Area"
        assert "id" in response.data
    
    def test_create_area_as_employee_forbidden(self, api_client, employee_token):
        """Employee no puede crear área"""
        response = api_client.post(
            '/api/areas/',
            {"name": "New Area"},
            format='json',
            HTTP_AUTHORIZATION=f'Bearer {employee_token}'
        )
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_create_area_duplicate_name(self, api_client, admin_token, test_area):
        """No debe permitir nombres duplicados"""
        response = api_client.post(
            '/api/areas/',
            {"name": "Test Area"},
            format='json',
            HTTP_AUTHORIZATION=f'Bearer {admin_token}'
        )
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_create_area_missing_name(self, api_client, admin_token):
        """Debe validar nombre requerido"""
        response = api_client.post(
            '/api/areas/',
            {"description": "No name"},
            format='json',
            HTTP_AUTHORIZATION=f'Bearer {admin_token}'
        )
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST


class TestAreaDetailIntegration:
    """Tests para detalle, actualización y eliminación de áreas"""
    
    def test_get_area_as_admin(self, api_client, admin_token, test_area):
        """Admin puede ver detalle de área"""
        response = api_client.get(
            f'/api/areas/{test_area["id"]}/',
            HTTP_AUTHORIZATION=f'Bearer {admin_token}'
        )
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data["name"] == "Test Area"
    
    def test_get_area_not_found(self, api_client, admin_token):
        """Debe retornar 404 para área inexistente"""
        from bson import ObjectId
        fake_id = str(ObjectId())
        
        response = api_client.get(
            f'/api/areas/{fake_id}/',
            HTTP_AUTHORIZATION=f'Bearer {admin_token}'
        )
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
    
    def test_update_area_as_admin(self, api_client, admin_token, test_area):
        """Admin puede actualizar área"""
        response = api_client.put(
            f'/api/areas/{test_area["id"]}/',
            {"name": "Updated Area Name"},
            format='json',
            HTTP_AUTHORIZATION=f'Bearer {admin_token}'
        )
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data["name"] == "Updated Area Name"
    
    def test_update_area_as_employee_forbidden(self, api_client, employee_token, test_area):
        """Employee no puede actualizar área"""
        response = api_client.put(
            f'/api/areas/{test_area["id"]}/',
            {"name": "Updated"},
            format='json',
            HTTP_AUTHORIZATION=f'Bearer {employee_token}'
        )
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_delete_area_as_admin(self, api_client, admin_token, clean_database):
        """Admin puede eliminar área sin empleados"""
        from bson import ObjectId
        from datetime import datetime
        
        # Crear área sin empleados
        area_id = ObjectId()
        clean_database.areas.insert_one({
            "_id": area_id,
            "name": "Area to Delete",
            "description": "",
            "sub_areas": [],
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        })
        
        response = api_client.delete(
            f'/api/areas/{str(area_id)}/',
            HTTP_AUTHORIZATION=f'Bearer {admin_token}'
        )
        
        assert response.status_code == status.HTTP_204_NO_CONTENT
    
    def test_delete_area_with_employees_error(self, api_client, admin_token, test_area, employee_user):
        """No debe poder eliminar área con empleados activos"""
        response = api_client.delete(
            f'/api/areas/{test_area["id"]}/',
            HTTP_AUTHORIZATION=f'Bearer {admin_token}'
        )
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "empleados activos" in str(response.data).lower()


class TestSubAreasIntegration:
    """Tests para sub-áreas"""
    
    def test_add_sub_area(self, api_client, admin_token, test_area):
        """Admin puede agregar sub-área"""
        response = api_client.post(
            f'/api/areas/{test_area["id"]}/sub-areas/',
            {"name": "New Sub Area"},
            format='json',
            HTTP_AUTHORIZATION=f'Bearer {admin_token}'
        )
        
        assert response.status_code == status.HTTP_201_CREATED
        assert any(sa["name"] == "New Sub Area" for sa in response.data["sub_areas"])
    
    def test_add_sub_area_empty_name(self, api_client, admin_token, test_area):
        """Debe validar nombre no vacío"""
        response = api_client.post(
            f'/api/areas/{test_area["id"]}/sub-areas/',
            {"name": ""},
            format='json',
            HTTP_AUTHORIZATION=f'Bearer {admin_token}'
        )
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_update_sub_area(self, api_client, admin_token, test_area, clean_database):
        """Admin puede actualizar sub-área"""
        from bson import ObjectId
        
        # Primero agregar una sub-área
        sub_area_id = str(ObjectId())
        clean_database.areas.update_one(
            {"_id": ObjectId(test_area["id"])},
            {"$push": {"sub_areas": {"id": sub_area_id, "name": "Original Name"}}}
        )
        
        response = api_client.put(
            f'/api/areas/{test_area["id"]}/sub-areas/{sub_area_id}/',
            {"name": "Updated Sub Area"},
            format='json',
            HTTP_AUTHORIZATION=f'Bearer {admin_token}'
        )
        
        assert response.status_code == status.HTTP_200_OK
    
    def test_delete_sub_area(self, api_client, admin_token, test_area, clean_database):
        """Admin puede eliminar sub-área"""
        from bson import ObjectId
        
        # Agregar sub-área
        sub_area_id = str(ObjectId())
        clean_database.areas.update_one(
            {"_id": ObjectId(test_area["id"])},
            {"$push": {"sub_areas": {"id": sub_area_id, "name": "To Delete"}}}
        )
        
        response = api_client.delete(
            f'/api/areas/{test_area["id"]}/sub-areas/{sub_area_id}/',
            HTTP_AUTHORIZATION=f'Bearer {admin_token}'
        )
        
        assert response.status_code == status.HTTP_200_OK
