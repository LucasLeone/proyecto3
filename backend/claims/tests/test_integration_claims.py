"""Tests de integración para Claims API"""
import pytest
from rest_framework import status
from bson import ObjectId
from claims.db import get_main_db


@pytest.mark.integration
class TestClaimsListCreateIntegration:
    """Tests de integración para listar y crear reclamos"""
    
    def test_list_claims_as_admin(self, api_client, admin_token, test_claim):
        """Admin debe poder listar todos los reclamos"""
        response = api_client.get(
            '/api/claims/',
            HTTP_AUTHORIZATION=f'Bearer {admin_token}'
        )
        
        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.data, list)
        assert len(response.data) >= 1
    
    def test_list_claims_as_employee(self, api_client, employee_token, test_claim):
        """Empleado debe poder listar todos los reclamos"""
        response = api_client.get(
            '/api/claims/',
            HTTP_AUTHORIZATION=f'Bearer {employee_token}'
        )
        
        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.data, list)
    
    def test_list_claims_as_client(self, api_client, client_token, test_claim, client_user):
        """Cliente solo debe ver sus propios reclamos"""
        response = api_client.get(
            '/api/claims/',
            HTTP_AUTHORIZATION=f'Bearer {client_token}'
        )
        
        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.data, list)
        # Cliente solo ve sus reclamos
        for claim in response.data:
            assert claim['client_id'] == str(client_user['_id'])
    
    def test_list_claims_filter_by_status(self, api_client, admin_token, test_claim):
        """Debe poder filtrar reclamos por estado"""
        response = api_client.get(
            '/api/claims/?status=open',
            HTTP_AUTHORIZATION=f'Bearer {admin_token}'
        )
        
        assert response.status_code == status.HTTP_200_OK
        for claim in response.data:
            assert claim['status'] == 'open'
    
    def test_create_claim_as_client(self, api_client, client_token, test_area, test_project, client_user):
        """Cliente debe poder crear un reclamo"""
        claim_data = {
            "title": "Test claim",
            "description": "Test description",
            "priority": "high",
            "severity": "critical",
            "type": "bug",
            "area_id": str(test_area['_id']),
            "project_id": str(test_project['_id']),
            "client_id": str(client_user['_id'])
        }
        
        response = api_client.post(
            '/api/claims/',
            claim_data,
            format='json',
            HTTP_AUTHORIZATION=f'Bearer {client_token}'
        )
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['title'] == "Test claim"
        assert response.data['status'] == 'open'
        assert 'claim_id' in response.data or '_id' in response.data
    
    def test_create_claim_as_employee(self, api_client, employee_token, test_area, test_project, client_user):
        """Empleado debe poder crear reclamos para clientes"""
        claim_data = {
            "title": "Employee created claim",
            "description": "Created by employee",
            "priority": "medium",
            "severity": "minor",
            "type": "feature_request",
            "area_id": str(test_area['_id']),
            "project_id": str(test_project['_id']),
            "client_id": str(client_user['_id'])
        }
        
        response = api_client.post(
            '/api/claims/',
            claim_data,
            format='json',
            HTTP_AUTHORIZATION=f'Bearer {employee_token}'
        )
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['title'] == "Employee created claim"
    
    def test_create_claim_missing_required_fields(self, api_client, client_token):
        """Debe fallar al crear reclamo sin campos requeridos"""
        response = api_client.post(
            '/api/claims/',
            {"title": "Incomplete claim"},
            format='json',
            HTTP_AUTHORIZATION=f'Bearer {client_token}'
        )
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_create_claim_invalid_priority(self, api_client, client_token, test_area, test_project, client_user):
        """Debe validar valores de prioridad"""
        claim_data = {
            "title": "Invalid priority",
            "description": "Test",
            "priority": "invalid_priority",
            "severity": "minor",
            "type": "bug",
            "area_id": str(test_area['_id']),
            "project_id": str(test_project['_id']),
            "client_id": str(client_user['_id'])
        }
        
        response = api_client.post(
            '/api/claims/',
            claim_data,
            format='json',
            HTTP_AUTHORIZATION=f'Bearer {client_token}'
        )
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_create_claim_invalid_area(self, api_client, client_token, test_project, client_user):
        """Debe validar que el área exista"""
        claim_data = {
            "title": "Invalid area",
            "description": "Test",
            "priority": "low",
            "severity": "minor",
            "type": "bug",
            "area_id": str(ObjectId()),  # ObjectId que no existe
            "project_id": str(test_project['_id']),
            "client_id": str(client_user['_id'])
        }
        
        response = api_client.post(
            '/api/claims/',
            claim_data,
            format='json',
            HTTP_AUTHORIZATION=f'Bearer {client_token}'
        )
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.integration
class TestClaimDetailIntegration:
    """Tests de integración para operaciones sobre un reclamo específico"""
    
    def test_get_claim_as_admin(self, api_client, admin_token, test_claim):
        """Admin debe poder ver cualquier reclamo"""
        response = api_client.get(
            f'/api/claims/{test_claim["_id"]}/',
            HTTP_AUTHORIZATION=f'Bearer {admin_token}'
        )
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['title'] == test_claim['title']
    
    def test_get_claim_as_owner_client(self, api_client, client_token, test_claim):
        """Cliente debe poder ver sus propios reclamos"""
        response = api_client.get(
            f'/api/claims/{test_claim["_id"]}/',
            HTTP_AUTHORIZATION=f'Bearer {client_token}'
        )
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['title'] == test_claim['title']
    
    def test_get_claim_as_other_client_forbidden(self, api_client, test_claim, clean_database):
        """Cliente no debe ver reclamos de otros"""
        from django.contrib.auth.hashers import make_password
        
        # Crear otro cliente
        db = get_main_db()
        other_client = db.users.insert_one({
            "email": "other@client.com",
            "password": make_password("pass123"),
            "role": "client",
            "name": "Other Client",
            "is_active": True
        })
        
        from claims.auth import generate_token
        other_token = generate_token(str(other_client.inserted_id), "client")
        
        response = api_client.get(
            f'/api/claims/{test_claim["_id"]}/',
            HTTP_AUTHORIZATION=f'Bearer {other_token}'
        )
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_get_claim_not_found(self, api_client, admin_token):
        """Debe retornar 404 para reclamo inexistente"""
        fake_id = str(ObjectId())
        response = api_client.get(
            f'/api/claims/{fake_id}/',
            HTTP_AUTHORIZATION=f'Bearer {admin_token}'
        )
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
    
    def test_update_claim_as_admin(self, api_client, admin_token, test_claim):
        """Admin debe poder actualizar reclamos"""
        update_data = {
            "title": "Updated title",
            "description": "Updated description"
        }
        
        response = api_client.put(
            f'/api/claims/{test_claim["_id"]}/',
            update_data,
            format='json',
            HTTP_AUTHORIZATION=f'Bearer {admin_token}'
        )
        
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_204_NO_CONTENT]
    
    def test_update_claim_as_client_forbidden(self, api_client, client_token, test_claim):
        """Cliente no debe poder actualizar reclamos"""
        update_data = {
            "title": "Client update attempt"
        }
        
        response = api_client.put(
            f'/api/claims/{test_claim["_id"]}/',
            update_data,
            format='json',
            HTTP_AUTHORIZATION=f'Bearer {client_token}'
        )
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_update_claim_status_transition(self, api_client, admin_token, test_claim):
        """Debe permitir transiciones de estado válidas"""
        update_data = {
            "status": "in_progress"
        }
        
        response = api_client.patch(
            f'/api/claims/{test_claim["_id"]}/',
            update_data,
            format='json',
            HTTP_AUTHORIZATION=f'Bearer {admin_token}'
        )
        
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_204_NO_CONTENT]
    
    def test_delete_claim_as_admin(self, api_client, admin_token, test_claim):
        """Admin debe poder eliminar reclamos"""
        response = api_client.delete(
            f'/api/claims/{test_claim["_id"]}/',
            HTTP_AUTHORIZATION=f'Bearer {admin_token}'
        )
        
        assert response.status_code == status.HTTP_204_NO_CONTENT
    
    def test_delete_claim_as_employee_forbidden(self, api_client, employee_token, test_claim):
        """Empleado no debe poder eliminar reclamos"""
        response = api_client.delete(
            f'/api/claims/{test_claim["_id"]}/',
            HTTP_AUTHORIZATION=f'Bearer {employee_token}'
        )
        
        assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.integration
class TestClaimActionsAndCommentsIntegration:
    """Tests de integración para acciones y comentarios en reclamos"""
    
    def test_add_action_to_claim(self, api_client, employee_token, test_claim, employee_user):
        """Empleado debe poder agregar acciones a reclamos"""
        action_data = {
            "action_type": "status_change",
            "description": "Changed status to in_progress",
            "user_id": str(employee_user['_id'])
        }
        
        response = api_client.post(
            f'/api/claims/{test_claim["_id"]}/actions/',
            action_data,
            format='json',
            HTTP_AUTHORIZATION=f'Bearer {employee_token}'
        )
        
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_201_CREATED]
    
    def test_add_comment_to_claim(self, api_client, employee_token, test_claim, employee_user):
        """Debe poder agregar comentarios a reclamos"""
        comment_data = {
            "comment": "This is a test comment",
            "user_id": str(employee_user['_id'])
        }
        
        response = api_client.post(
            f'/api/claims/{test_claim["_id"]}/comments/',
            comment_data,
            format='json',
            HTTP_AUTHORIZATION=f'Bearer {employee_token}'
        )
        
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_201_CREATED]
    
    def test_add_comment_as_client(self, api_client, client_token, test_claim, client_user):
        """Cliente debe poder comentar en sus reclamos"""
        comment_data = {
            "comment": "Client comment",
            "user_id": str(client_user['_id'])
        }
        
        response = api_client.post(
            f'/api/claims/{test_claim["_id"]}/comments/',
            comment_data,
            format='json',
            HTTP_AUTHORIZATION=f'Bearer {client_token}'
        )
        
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_201_CREATED]
    
    def test_get_claim_timeline(self, api_client, admin_token, test_claim):
        """Debe poder obtener la línea de tiempo del reclamo"""
        response = api_client.get(
            f'/api/claims/{test_claim["_id"]}/timeline/',
            HTTP_AUTHORIZATION=f'Bearer {admin_token}'
        )
        
        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.data, (list, dict))


@pytest.mark.integration
class TestClientFeedbackIntegration:
    """Tests de integración para feedback de clientes"""
    
    def test_submit_client_feedback(self, api_client, client_token, test_claim):
        """Cliente debe poder enviar feedback"""
        feedback_data = {
            "rating": 5,
            "comment": "Great service!"
        }
        
        response = api_client.post(
            f'/api/claims/{test_claim["_id"]}/feedback/',
            feedback_data,
            format='json',
            HTTP_AUTHORIZATION=f'Bearer {client_token}'
        )
        
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_201_CREATED]
    
    def test_submit_feedback_invalid_rating(self, api_client, client_token, test_claim):
        """Debe validar el rating del feedback"""
        feedback_data = {
            "rating": 10,  # Rating inválido (debe ser 1-5)
            "comment": "Invalid rating"
        }
        
        response = api_client.post(
            f'/api/claims/{test_claim["_id"]}/feedback/',
            feedback_data,
            format='json',
            HTTP_AUTHORIZATION=f'Bearer {client_token}'
        )
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_get_feedback_messages(self, api_client, client_token, test_claim):
        """Debe poder obtener mensajes de feedback"""
        response = api_client.get(
            f'/api/claims/{test_claim["_id"]}/feedback/',
            HTTP_AUTHORIZATION=f'Bearer {client_token}'
        )
        
        assert response.status_code == status.HTTP_200_OK
