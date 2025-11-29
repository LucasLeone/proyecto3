"""Tests para los serializers"""
import pytest
from unittest.mock import patch
from rest_framework.exceptions import ValidationError

from claims.serializers import (
    LoginSerializer,
    AreaSerializer,
    EmployeeSerializer,
    ClientSerializer,
    ProjectSerializer,
    ClaimSerializer,
    ClaimUpdateSerializer,
    ClientFeedbackSerializer,
)


@pytest.mark.unit
class TestLoginSerializer:
    """Tests para LoginSerializer"""
    
    def test_valid_data(self):
        """Debe validar datos correctos"""
        data = {
            "email": "test@example.com",
            "password": "password123"
        }
        serializer = LoginSerializer(data=data)
        assert serializer.is_valid()
    
    def test_invalid_email(self):
        """Debe fallar con email inválido"""
        data = {
            "email": "invalid-email",
            "password": "password123"
        }
        serializer = LoginSerializer(data=data)
        assert not serializer.is_valid()
        assert "email" in serializer.errors
    
    def test_short_password(self):
        """Debe fallar con contraseña corta"""
        data = {
            "email": "test@example.com",
            "password": "123"
        }
        serializer = LoginSerializer(data=data)
        assert not serializer.is_valid()
        assert "password" in serializer.errors
    
    def test_missing_fields(self):
        """Debe fallar con campos faltantes"""
        serializer = LoginSerializer(data={})
        assert not serializer.is_valid()
        assert "email" in serializer.errors
        assert "password" in serializer.errors


@pytest.mark.unit
class TestAreaSerializer:
    """Tests para AreaSerializer"""
    
    def test_valid_data(self):
        """Debe validar datos correctos"""
        data = {
            "name": "Soporte Técnico",
            "description": "Área de soporte"
        }
        serializer = AreaSerializer(data=data)
        assert serializer.is_valid()
    
    def test_without_description(self):
        """Debe validar sin descripción (opcional)"""
        data = {"name": "IT"}
        serializer = AreaSerializer(data=data)
        assert serializer.is_valid()
    
    def test_blank_description(self):
        """Debe permitir descripción en blanco"""
        data = {
            "name": "IT",
            "description": ""
        }
        serializer = AreaSerializer(data=data)
        assert serializer.is_valid()
    
    def test_missing_name(self):
        """Debe fallar sin nombre"""
        data = {"description": "Test"}
        serializer = AreaSerializer(data=data)
        assert not serializer.is_valid()
        assert "name" in serializer.errors


@pytest.mark.unit
class TestEmployeeSerializer:
    """Tests para EmployeeSerializer"""
    
    @patch('claims.serializers.get_area')
    def test_valid_data(self, mock_get_area):
        """Debe validar datos correctos"""
        mock_get_area.return_value = {
            "id": "area123",
            "name": "IT",
            "is_active": True
        }
        
        data = {
            "full_name": "John Doe",
            "email": "john@example.com",
            "password": "password123",
            "area_id": "area123"
        }
        serializer = EmployeeSerializer(data=data)
        assert serializer.is_valid()
    
    @patch('claims.serializers.get_area')
    def test_inactive_area(self, mock_get_area):
        """Debe fallar con área inactiva"""
        mock_get_area.return_value = {
            "id": "area123",
            "name": "IT",
            "is_active": False
        }
        
        data = {
            "full_name": "John Doe",
            "email": "john@example.com",
            "password": "password123",
            "area_id": "area123"
        }
        serializer = EmployeeSerializer(data=data)
        assert not serializer.is_valid()
        assert "area_id" in serializer.errors
    
    @patch('claims.serializers.get_area')
    def test_nonexistent_area(self, mock_get_area):
        """Debe fallar con área inexistente"""
        mock_get_area.return_value = None
        
        data = {
            "full_name": "John Doe",
            "email": "john@example.com",
            "password": "password123",
            "area_id": "invalid"
        }
        serializer = EmployeeSerializer(data=data)
        assert not serializer.is_valid()
        assert "area_id" in serializer.errors
    
    @patch('claims.serializers.get_area')
    def test_without_password(self, mock_get_area):
        """Debe validar sin contraseña (opcional para updates)"""
        mock_get_area.return_value = {
            "id": "area123",
            "name": "IT",
            "is_active": True
        }
        
        data = {
            "full_name": "John Doe",
            "email": "john@example.com",
            "area_id": "area123"
        }
        serializer = EmployeeSerializer(data=data)
        assert serializer.is_valid()


@pytest.mark.unit
class TestClientSerializer:
    """Tests para ClientSerializer"""
    
    def test_valid_data(self):
        """Debe validar datos correctos"""
        data = {
            "company_name": "ACME Corp",
            "full_name": "Jane Doe",
            "email": "jane@acme.com",
            "password": "password123"
        }
        serializer = ClientSerializer(data=data)
        assert serializer.is_valid()
    
    def test_without_full_name(self):
        """Debe validar sin nombre completo (opcional)"""
        data = {
            "company_name": "ACME Corp",
            "email": "jane@acme.com",
            "password": "password123"
        }
        serializer = ClientSerializer(data=data)
        assert serializer.is_valid()
    
    def test_missing_company_name(self):
        """Debe fallar sin nombre de empresa"""
        data = {
            "email": "jane@acme.com",
            "password": "password123"
        }
        serializer = ClientSerializer(data=data)
        assert not serializer.is_valid()
        assert "company_name" in serializer.errors


@pytest.mark.unit
class TestProjectSerializer:
    """Tests para ProjectSerializer"""
    
    @patch('claims.serializers.get_user_by_id')
    def test_valid_data(self, mock_get_user):
        """Debe validar datos correctos"""
        mock_get_user.return_value = {
            "id": "client123",
            "role": "client",
            "is_active": True
        }
        
        data = {
            "name": "Website Redesign",
            "project_type": "web",
            "client_id": "client123"
        }
        serializer = ProjectSerializer(data=data)
        assert serializer.is_valid()
    
    @patch('claims.serializers.get_user_by_id')
    def test_invalid_client(self, mock_get_user):
        """Debe fallar con cliente inválido"""
        mock_get_user.return_value = {
            "id": "user123",
            "role": "employee",  # No es cliente
            "is_active": True
        }
        
        data = {
            "name": "Website Redesign",
            "project_type": "web",
            "client_id": "user123"
        }
        serializer = ProjectSerializer(data=data)
        assert not serializer.is_valid()
        assert "client_id" in serializer.errors
    
    @patch('claims.serializers.get_user_by_id')
    def test_inactive_client(self, mock_get_user):
        """Debe fallar con cliente inactivo"""
        mock_get_user.return_value = {
            "id": "client123",
            "role": "client",
            "is_active": False
        }
        
        data = {
            "name": "Website Redesign",
            "project_type": "web",
            "client_id": "client123"
        }
        serializer = ProjectSerializer(data=data)
        assert not serializer.is_valid()
        assert "client_id" in serializer.errors


@pytest.mark.unit
class TestClaimSerializer:
    """Tests para ClaimSerializer"""
    
    @patch('claims.serializers.get_project')
    def test_valid_data(self, mock_get_project):
        """Debe validar datos correctos"""
        mock_get_project.return_value = {
            "id": "project123",
            "name": "Test Project",
            "is_active": True
        }
        
        data = {
            "project_id": "project123",
            "claim_type": "bug",
            "priority": "Alta",
            "severity": "S1 - Crítico",
            "description": "Sistema caído"
        }
        serializer = ClaimSerializer(data=data)
        assert serializer.is_valid()
    
    @patch('claims.serializers.get_project')
    def test_invalid_priority(self, mock_get_project):
        """Debe fallar con prioridad inválida"""
        mock_get_project.return_value = {
            "id": "project123",
            "name": "Test Project",
            "is_active": True
        }
        
        data = {
            "project_id": "project123",
            "claim_type": "bug",
            "priority": "Urgente",  # No válida
            "description": "Test"
        }
        serializer = ClaimSerializer(data=data)
        assert not serializer.is_valid()
        assert "priority" in serializer.errors
    
    @patch('claims.serializers.get_project')
    def test_invalid_severity(self, mock_get_project):
        """Debe fallar con severidad inválida"""
        mock_get_project.return_value = {
            "id": "project123",
            "name": "Test Project",
            "is_active": True
        }
        
        data = {
            "project_id": "project123",
            "claim_type": "bug",
            "priority": "Alta",
            "severity": "Critical",  # No válida
            "description": "Test"
        }
        serializer = ClaimSerializer(data=data)
        assert not serializer.is_valid()
        assert "severity" in serializer.errors
    
    @patch('claims.serializers.get_project')
    def test_empty_severity(self, mock_get_project):
        """Debe permitir severidad vacía"""
        mock_get_project.return_value = {
            "id": "project123",
            "name": "Test Project",
            "is_active": True
        }
        
        data = {
            "project_id": "project123",
            "claim_type": "bug",
            "priority": "Media",
            "severity": "",
            "description": "Test"
        }
        serializer = ClaimSerializer(data=data)
        assert serializer.is_valid()
    
    @patch('claims.serializers.get_project')
    def test_inactive_project(self, mock_get_project):
        """Debe fallar con proyecto inactivo"""
        mock_get_project.return_value = {
            "id": "project123",
            "name": "Test Project",
            "is_active": False
        }
        
        data = {
            "project_id": "project123",
            "claim_type": "bug",
            "priority": "Alta",
            "description": "Test"
        }
        serializer = ClaimSerializer(data=data)
        assert not serializer.is_valid()
        assert "project_id" in serializer.errors


@pytest.mark.unit
class TestClaimUpdateSerializer:
    """Tests para ClaimUpdateSerializer"""
    
    @patch('claims.serializers.get_area')
    def test_valid_data(self, mock_get_area):
        """Debe validar datos correctos"""
        mock_get_area.return_value = {
            "id": "area123",
            "name": "IT",
            "is_active": True
        }
        
        data = {
            "status": "En Proceso",
            "priority": "Alta",
            "area_id": "area123",
            "reason": "Escalado a IT"
        }
        serializer = ClaimUpdateSerializer(data=data)
        assert serializer.is_valid()
    
    @patch('claims.serializers.get_area')
    def test_empty_area_id(self, mock_get_area):
        """Debe permitir area_id vacío"""
        data = {
            "status": "Ingresado",
            "area_id": ""
        }
        serializer = ClaimUpdateSerializer(data=data)
        assert serializer.is_valid()
        assert serializer.validated_data.get("area_id") is None
    
    @patch('claims.serializers.get_area')
    def test_null_area_id(self, mock_get_area):
        """Debe permitir area_id null"""
        data = {
            "status": "Ingresado",
            "area_id": None
        }
        serializer = ClaimUpdateSerializer(data=data)
        assert serializer.is_valid()
        assert serializer.validated_data.get("area_id") is None


@pytest.mark.unit
class TestClientFeedbackSerializer:
    """Tests para ClientFeedbackSerializer"""
    
    def test_valid_with_rating_and_feedback(self):
        """Debe validar con rating y feedback"""
        data = {
            "rating": 5,
            "feedback": "Excelente servicio"
        }
        serializer = ClientFeedbackSerializer(data=data)
        assert serializer.is_valid()
    
    def test_valid_with_only_rating(self):
        """Debe validar solo con rating"""
        data = {"rating": 4}
        serializer = ClientFeedbackSerializer(data=data)
        assert serializer.is_valid()
    
    def test_valid_with_only_feedback(self):
        """Debe validar solo con feedback"""
        data = {"feedback": "Buen trabajo"}
        serializer = ClientFeedbackSerializer(data=data)
        assert serializer.is_valid()
    
    def test_invalid_rating_too_high(self):
        """Debe fallar con rating mayor a 5"""
        data = {"rating": 6}
        serializer = ClientFeedbackSerializer(data=data)
        assert not serializer.is_valid()
        assert "rating" in serializer.errors
    
    def test_invalid_rating_too_low(self):
        """Debe fallar con rating menor a 1"""
        data = {"rating": 0}
        serializer = ClientFeedbackSerializer(data=data)
        assert not serializer.is_valid()
        assert "rating" in serializer.errors
    
    def test_invalid_empty_data(self):
        """Debe fallar con datos vacíos"""
        data = {}
        serializer = ClientFeedbackSerializer(data=data)
        assert not serializer.is_valid()
        assert "non_field_errors" in serializer.errors
