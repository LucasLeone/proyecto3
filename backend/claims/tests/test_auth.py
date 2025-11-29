"""Tests para el módulo de autenticación"""
import pytest
from datetime import datetime, timedelta, timezone
from unittest.mock import Mock, patch
import jwt
from django.conf import settings
from rest_framework.exceptions import AuthenticationFailed

from claims.auth import (
    generate_token,
    decode_token,
    JWTAuthentication,
    AuthenticatedUser,
    _now_utc
)


@pytest.mark.unit
class TestAuthenticatedUser:
    """Tests para la clase AuthenticatedUser"""
    
    def test_is_authenticated_property(self):
        """Debe retornar True para is_authenticated"""
        user = AuthenticatedUser(id="123", role="admin", email="test@test.com")
        assert user.is_authenticated is True
    
    def test_user_attributes(self):
        """Debe mantener los atributos del usuario"""
        user = AuthenticatedUser(
            id="123",
            role="admin",
            email="test@test.com",
            name="Test User"
        )
        assert user.id == "123"
        assert user.role == "admin"
        assert user.email == "test@test.com"
        assert user.name == "Test User"


@pytest.mark.unit
class TestGenerateToken:
    """Tests para la función generate_token"""
    
    def test_generate_token_structure(self):
        """Debe generar un token JWT válido con la estructura correcta"""
        user = {
            "id": "user123",
            "role": "admin",
            "email": "admin@test.com"
        }
        
        token = generate_token(user)
        
        assert isinstance(token, str)
        assert len(token) > 0
        
        # Decodificar para verificar estructura
        decoded = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=["HS256"])
        assert decoded["sub"] == "user123"
        assert decoded["role"] == "admin"
        assert decoded["email"] == "admin@test.com"
        assert "exp" in decoded
        assert "iat" in decoded
    
    def test_generate_token_expiration(self):
        """Debe incluir tiempo de expiración correcto"""
        user = {
            "id": "user123",
            "role": "client",
            "email": "client@test.com"
        }
        
        token = generate_token(user)
        decoded = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=["HS256"])
        
        exp_time = datetime.fromtimestamp(decoded["exp"], tz=timezone.utc)
        iat_time = datetime.fromtimestamp(decoded["iat"], tz=timezone.utc)
        
        diff = exp_time - iat_time
        expected_minutes = settings.JWT_ACCESS_TTL_MINUTES
        assert abs(diff.total_seconds() - (expected_minutes * 60)) < 5


@pytest.mark.unit
class TestDecodeToken:
    """Tests para la función decode_token"""
    
    def test_decode_valid_token(self):
        """Debe decodificar un token válido correctamente"""
        user = {
            "id": "user456",
            "role": "employee",
            "email": "employee@test.com"
        }
        
        token = generate_token(user)
        decoded = decode_token(token)
        
        assert decoded["sub"] == "user456"
        assert decoded["role"] == "employee"
        assert decoded["email"] == "employee@test.com"
    
    def test_decode_expired_token(self):
        """Debe lanzar excepción con token expirado"""
        payload = {
            "sub": "user789",
            "role": "admin",
            "email": "test@test.com",
            "exp": datetime.now(tz=timezone.utc) - timedelta(hours=1),
            "iat": datetime.now(tz=timezone.utc) - timedelta(hours=2),
        }
        token = jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm="HS256")
        
        with pytest.raises(jwt.ExpiredSignatureError):
            decode_token(token)
    
    def test_decode_invalid_token(self):
        """Debe lanzar excepción con token inválido"""
        with pytest.raises(jwt.InvalidTokenError):
            decode_token("invalid.token.here")


@pytest.mark.unit
class TestJWTAuthentication:
    """Tests para la clase JWTAuthentication"""
    
    @pytest.fixture
    def auth(self):
        return JWTAuthentication()
    
    @pytest.fixture
    def mock_request(self):
        return Mock()
    
    def test_no_authorization_header(self, auth, mock_request):
        """Debe retornar None si no hay header de autorización"""
        mock_request.headers.get.return_value = None
        
        result = auth.authenticate(mock_request)
        
        assert result is None
    
    def test_invalid_header_format(self, auth, mock_request):
        """Debe lanzar excepción con formato de header inválido"""
        mock_request.headers.get.return_value = "InvalidHeaderFormat"
        
        with pytest.raises(AuthenticationFailed) as exc_info:
            auth.authenticate(mock_request)
        
        assert "Authorization header is invalid" in str(exc_info.value)
    
    def test_wrong_scheme(self, auth, mock_request):
        """Debe retornar None si el esquema no es Bearer"""
        mock_request.headers.get.return_value = "Basic token123"
        
        result = auth.authenticate(mock_request)
        
        assert result is None
    
    @patch('claims.auth.get_user_by_id')
    def test_valid_authentication(self, mock_get_user, auth, mock_request):
        """Debe autenticar correctamente con token válido"""
        user_data = {
            "id": "user123",
            "role": "admin",
            "email": "admin@test.com",
            "full_name": "Admin User",
            "is_active": True
        }
        
        token = generate_token(user_data)
        mock_request.headers.get.return_value = f"Bearer {token}"
        mock_get_user.return_value = user_data
        
        auth_user, returned_token = auth.authenticate(mock_request)
        
        assert isinstance(auth_user, AuthenticatedUser)
        assert auth_user.id == user_data["id"]
        assert auth_user.role == user_data["role"]
        assert auth_user.email == user_data["email"]
        assert returned_token == token
    
    @patch('claims.auth.get_user_by_id')
    def test_expired_token(self, mock_get_user, auth, mock_request):
        """Debe lanzar excepción con token expirado"""
        payload = {
            "sub": "user123",
            "role": "admin",
            "email": "test@test.com",
            "exp": datetime.now(tz=timezone.utc) - timedelta(hours=1),
            "iat": datetime.now(tz=timezone.utc) - timedelta(hours=2),
        }
        token = jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm="HS256")
        mock_request.headers.get.return_value = f"Bearer {token}"
        
        with pytest.raises(AuthenticationFailed) as exc_info:
            auth.authenticate(mock_request)
        
        assert "Token expirado" in str(exc_info.value)
    
    @patch('claims.auth.get_user_by_id')
    def test_invalid_token(self, mock_get_user, auth, mock_request):
        """Debe lanzar excepción con token inválido"""
        mock_request.headers.get.return_value = "Bearer invalid.token.here"
        
        with pytest.raises(AuthenticationFailed) as exc_info:
            auth.authenticate(mock_request)
        
        assert "Token inválido" in str(exc_info.value)
    
    @patch('claims.auth.get_user_by_id')
    def test_user_not_found(self, mock_get_user, auth, mock_request):
        """Debe lanzar excepción si el usuario no existe"""
        user_data = {
            "id": "user123",
            "role": "admin",
            "email": "admin@test.com"
        }
        
        token = generate_token(user_data)
        mock_request.headers.get.return_value = f"Bearer {token}"
        mock_get_user.return_value = None
        
        with pytest.raises(AuthenticationFailed) as exc_info:
            auth.authenticate(mock_request)
        
        assert "Usuario no encontrado o inactivo" in str(exc_info.value)
    
    @patch('claims.auth.get_user_by_id')
    def test_inactive_user(self, mock_get_user, auth, mock_request):
        """Debe lanzar excepción si el usuario está inactivo"""
        user_data = {
            "id": "user123",
            "role": "admin",
            "email": "admin@test.com",
            "is_active": False
        }
        
        token = generate_token(user_data)
        mock_request.headers.get.return_value = f"Bearer {token}"
        mock_get_user.return_value = user_data
        
        with pytest.raises(AuthenticationFailed) as exc_info:
            auth.authenticate(mock_request)
        
        assert "Usuario no encontrado o inactivo" in str(exc_info.value)
