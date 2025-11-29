"""Tests para views - básicos para alcanzar cobertura"""
import pytest
from unittest.mock import Mock, patch
from rest_framework.test import APIRequestFactory, force_authenticate
from rest_framework import status
from django.contrib.auth import get_user_model

from claims.views import LoginView, AreaListCreateView, _present_user, _present_project
from bson import ObjectId


@pytest.mark.unit
class TestHelperFunctions:
    """Tests para funciones auxiliares"""
    
    def test_present_user_with_password(self):
        """Debe eliminar el password del usuario"""
        user = {
            "id": "123",
            "email": "test@test.com",
            "password": "hashed_password",
            "role": "client"
        }
        
        result = _present_user(user)
        
        assert "password" not in result
        assert result["email"] == "test@test.com"
    
    def test_present_user_with_area_id(self):
        """Debe convertir area_id a string"""
        oid = ObjectId()
        user = {
            "id": "123",
            "email": "test@test.com",
            "area_id": oid
        }
        
        result = _present_user(user)
        
        assert isinstance(result["area_id"], str)
        assert result["area_id"] == str(oid)
    
    def test_present_project_with_client_id(self):
        """Debe convertir client_id a string"""
        oid = ObjectId()
        project = {
            "id": "456",
            "name": "Test Project",
            "client_id": oid
        }
        
        result = _present_project(project)
        
        assert isinstance(result["client_id"], str)
        assert result["client_id"] == str(oid)


@pytest.mark.unit
class TestLoginView:
    """Tests para LoginView"""
    
    @pytest.fixture
    def factory(self):
        return APIRequestFactory()
    
    @pytest.fixture
    def view(self):
        return LoginView.as_view()
    
    @patch('claims.views.get_user_by_email')
    @patch('claims.views.verify_password')
    @patch('claims.views.generate_token')
    def test_login_success(self, mock_token, mock_verify, mock_get_user, factory, view):
        """Debe autenticar usuario correctamente"""
        mock_user = {
            "id": "123",
            "email": "test@test.com",
            "password": "hashed",
            "role": "client",
            "is_active": True
        }
        mock_get_user.return_value = mock_user
        mock_verify.return_value = True
        mock_token.return_value = "test-token"
        
        request = factory.post('/api/login/', {
            "email": "test@test.com",
            "password": "password123"
        }, format='json')
        
        response = view(request)
        
        assert response.status_code == status.HTTP_200_OK
        assert "token" in response.data
        assert response.data["role"] == "client"
    
    @patch('claims.views.get_user_by_email')
    def test_login_user_not_found(self, mock_get_user, factory, view):
        """Debe fallar con usuario no encontrado"""
        mock_get_user.return_value = None
        
        request = factory.post('/api/login/', {
            "email": "nonexistent@test.com",
            "password": "password123"
        }, format='json')
        
        response = view(request)
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    @patch('claims.views.get_user_by_email')
    @patch('claims.views.verify_password')
    def test_login_wrong_password(self, mock_verify, mock_get_user, factory, view):
        """Debe fallar con contraseña incorrecta"""
        mock_user = {
            "id": "123",
            "email": "test@test.com",
            "password": "hashed",
            "role": "client",
            "is_active": True
        }
        mock_get_user.return_value = mock_user
        mock_verify.return_value = False
        
        request = factory.post('/api/login/', {
            "email": "test@test.com",
            "password": "wrongpassword"
        }, format='json')
        
        response = view(request)
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    @patch('claims.views.get_user_by_email')
    def test_login_inactive_user(self, mock_get_user, factory, view):
        """Debe fallar con usuario inactivo"""
        mock_user = {
            "id": "123",
            "email": "test@test.com",
            "password": "hashed",
            "role": "client",
            "is_active": False
        }
        mock_get_user.return_value = mock_user
        
        request = factory.post('/api/login/', {
            "email": "test@test.com",
            "password": "password123"
        }, format='json')
        
        response = view(request)
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_login_invalid_data(self, factory, view):
        """Debe fallar con datos inválidos"""
        request = factory.post('/api/login/', {
            "email": "invalid-email",
            "password": "123"  # Too short
        }, format='json')
        
        response = view(request)
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.unit
class TestViewsWithMockData:
    """Tests adicionales para aumentar cobertura de views"""
    
    @pytest.fixture
    def factory(self):
        return APIRequestFactory()
    
    def test_present_user_with_complex_data(self):
        """Debe manejar usuario con datos complejos"""
        user = {
            "id": "123",
            "email": "test@test.com",
            "password": "hashed_password",
            "role": "employee",
            "area_id": ObjectId(),
            "full_name": "Test User"
        }
        
        result = _present_user(user)
        
        assert "password" not in result
        assert isinstance(result["area_id"], str)
        assert result["full_name"] == "Test User"
    
    def test_present_project_without_client_id(self):
        """Debe manejar proyecto sin client_id"""
        project = {
            "id": "456",
            "name": "Test Project",
            "project_type": "web"
        }
        
        result = _present_project(project)
        
        assert result["name"] == "Test Project"
        assert "client_id" not in result or result.get("client_id") is None


# Tests de views con autenticación requieren configuración más compleja
# Por ahora solo testeamos funciones auxiliares y LoginView
