"""Tests de integración para Statistics API"""
import pytest
from rest_framework import status


@pytest.mark.integration
class TestStatisticsIntegration:
    """Tests de integración para endpoints de estadísticas"""
    
    def test_get_statistics_as_admin(self, api_client, admin_token):
        """Admin debe poder ver estadísticas generales"""
        response = api_client.get(
            '/api/statistics/',
            HTTP_AUTHORIZATION=f'Bearer {admin_token}'
        )
        
        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.data, dict)
    
    def test_get_statistics_as_employee(self, api_client, employee_token):
        """Empleado debe poder ver estadísticas"""
        response = api_client.get(
            '/api/statistics/',
            HTTP_AUTHORIZATION=f'Bearer {employee_token}'
        )
        
        assert response.status_code == status.HTTP_200_OK
    
    def test_get_statistics_as_client_forbidden(self, api_client, client_token):
        """Cliente no debe poder ver estadísticas generales"""
        response = api_client.get(
            '/api/statistics/',
            HTTP_AUTHORIZATION=f'Bearer {client_token}'
        )
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_get_statistics_by_month(self, api_client, admin_token):
        """Debe obtener estadísticas por mes"""
        response = api_client.get(
            '/api/statistics/by-month/',
            HTTP_AUTHORIZATION=f'Bearer {admin_token}'
        )
        
        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.data, (dict, list))
    
    def test_get_statistics_by_status(self, api_client, admin_token):
        """Debe obtener estadísticas por estado"""
        response = api_client.get(
            '/api/statistics/by-status/',
            HTTP_AUTHORIZATION=f'Bearer {admin_token}'
        )
        
        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.data, (dict, list))
    
    def test_get_statistics_by_type(self, api_client, admin_token):
        """Debe obtener estadísticas por tipo"""
        response = api_client.get(
            '/api/statistics/by-type/',
            HTTP_AUTHORIZATION=f'Bearer {admin_token}'
        )
        
        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.data, (dict, list))
    
    def test_get_statistics_by_area(self, api_client, admin_token):
        """Debe obtener estadísticas por área"""
        response = api_client.get(
            '/api/statistics/by-area/',
            HTTP_AUTHORIZATION=f'Bearer {admin_token}'
        )
        
        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.data, (dict, list))
    
    def test_get_statistics_by_project(self, api_client, admin_token):
        """Debe obtener estadísticas por proyecto"""
        response = api_client.get(
            '/api/statistics/by-project/',
            HTTP_AUTHORIZATION=f'Bearer {admin_token}'
        )
        
        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.data, (dict, list))
    
    def test_get_average_resolution_time(self, api_client, admin_token):
        """Debe obtener tiempo promedio de resolución"""
        response = api_client.get(
            '/api/statistics/average-resolution-time/',
            HTTP_AUTHORIZATION=f'Bearer {admin_token}'
        )
        
        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.data, dict)
    
    def test_get_kpis(self, api_client, admin_token):
        """Debe obtener KPIs del sistema"""
        response = api_client.get(
            '/api/statistics/kpis/',
            HTTP_AUTHORIZATION=f'Bearer {admin_token}'
        )
        
        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.data, dict)
    
    def test_get_ratings_statistics(self, api_client, admin_token):
        """Debe obtener estadísticas de ratings"""
        response = api_client.get(
            '/api/statistics/ratings/',
            HTTP_AUTHORIZATION=f'Bearer {admin_token}'
        )
        
        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.data, dict)
    
    def test_get_statistics_by_employee(self, api_client, admin_token):
        """Debe obtener estadísticas por empleado"""
        response = api_client.get(
            '/api/statistics/by-employee/',
            HTTP_AUTHORIZATION=f'Bearer {admin_token}'
        )
        
        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.data, (dict, list))
    
    def test_statistics_with_date_filters(self, api_client, admin_token):
        """Debe permitir filtrar estadísticas por fecha"""
        response = api_client.get(
            '/api/statistics/?start_date=2024-01-01&end_date=2024-12-31',
            HTTP_AUTHORIZATION=f'Bearer {admin_token}'
        )
        
        assert response.status_code == status.HTTP_200_OK
    
    def test_statistics_without_auth(self, api_client):
        """Debe rechazar acceso sin autenticación"""
        response = api_client.get('/api/statistics/')
        
        assert response.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]
