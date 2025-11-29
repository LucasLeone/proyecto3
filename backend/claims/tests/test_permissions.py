"""Tests para los permisos personalizados"""
import pytest
from unittest.mock import Mock

from claims.permissions import IsAuthenticated, IsAdmin, IsAdminOrEmployee


@pytest.mark.unit
class TestIsAuthenticated:
    """Tests para el permiso IsAuthenticated"""
    
    @pytest.fixture
    def permission(self):
        return IsAuthenticated()
    
    def test_user_authenticated(self, permission):
        """Debe permitir acceso a usuario autenticado"""
        request = Mock()
        request.user = Mock()
        request.user.is_authenticated = True
        
        assert permission.has_permission(request, None) is True
    
    def test_user_not_authenticated(self, permission):
        """Debe denegar acceso a usuario no autenticado"""
        request = Mock()
        request.user = Mock()
        request.user.is_authenticated = False
        
        assert permission.has_permission(request, None) is False
    
    def test_no_user(self, permission):
        """Debe denegar acceso si no hay usuario"""
        request = Mock()
        request.user = None
        
        assert permission.has_permission(request, None) is False


@pytest.mark.unit
class TestIsAdmin:
    """Tests para el permiso IsAdmin"""
    
    @pytest.fixture
    def permission(self):
        return IsAdmin()
    
    def test_admin_user(self, permission):
        """Debe permitir acceso a usuario administrador"""
        request = Mock()
        request.user = Mock()
        request.user.is_authenticated = True
        request.user.role = "admin"
        
        assert permission.has_permission(request, None) is True
    
    def test_non_admin_user(self, permission):
        """Debe denegar acceso a usuario no administrador"""
        request = Mock()
        request.user = Mock()
        request.user.is_authenticated = True
        request.user.role = "employee"
        
        assert permission.has_permission(request, None) is False
    
    def test_client_user(self, permission):
        """Debe denegar acceso a usuario cliente"""
        request = Mock()
        request.user = Mock()
        request.user.is_authenticated = True
        request.user.role = "client"
        
        assert permission.has_permission(request, None) is False
    
    def test_unauthenticated_user(self, permission):
        """Debe denegar acceso a usuario no autenticado"""
        request = Mock()
        request.user = Mock()
        request.user.is_authenticated = False
        request.user.role = "admin"
        
        assert permission.has_permission(request, None) is False
    
    def test_no_user(self, permission):
        """Debe denegar acceso si no hay usuario"""
        request = Mock()
        request.user = None
        
        assert permission.has_permission(request, None) is False


@pytest.mark.unit
class TestIsAdminOrEmployee:
    """Tests para el permiso IsAdminOrEmployee"""
    
    @pytest.fixture
    def permission(self):
        return IsAdminOrEmployee()
    
    def test_admin_user(self, permission):
        """Debe permitir acceso a usuario administrador"""
        request = Mock()
        request.user = Mock()
        request.user.is_authenticated = True
        request.user.role = "admin"
        
        assert permission.has_permission(request, None) is True
    
    def test_employee_user(self, permission):
        """Debe permitir acceso a usuario empleado"""
        request = Mock()
        request.user = Mock()
        request.user.is_authenticated = True
        request.user.role = "employee"
        
        assert permission.has_permission(request, None) is True
    
    def test_client_user(self, permission):
        """Debe denegar acceso a usuario cliente"""
        request = Mock()
        request.user = Mock()
        request.user.is_authenticated = True
        request.user.role = "client"
        
        assert permission.has_permission(request, None) is False
    
    def test_unauthenticated_user(self, permission):
        """Debe denegar acceso a usuario no autenticado"""
        request = Mock()
        request.user = Mock()
        request.user.is_authenticated = False
        request.user.role = "admin"
        
        assert permission.has_permission(request, None) is False
    
    def test_no_user(self, permission):
        """Debe denegar acceso si no hay usuario"""
        request = Mock()
        request.user = None
        
        assert permission.has_permission(request, None) is False
    
    def test_no_role_attribute(self, permission):
        """Debe denegar acceso si no hay atributo role"""
        request = Mock()
        request.user = Mock()
        request.user.is_authenticated = True
        delattr(request.user, 'role')
        
        assert permission.has_permission(request, None) is False
