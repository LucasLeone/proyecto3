"""Configuración de pytest y fixtures compartidos"""
import os
import django
from django.conf import settings

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

if not settings.configured:
    django.setup()


def pytest_configure(config):
    """Configuración de pytest"""
    settings.DEBUG = False
    settings.TESTING = True
    
    # Configurar bases de datos de prueba
    settings.MONGODB_MAIN_URI = os.getenv('MONGODB_MAIN_URI', 'mongodb://localhost:27017/')
    settings.MONGODB_AUDIT_URI = os.getenv('MONGODB_AUDIT_URI', 'mongodb://localhost:27017/')
    settings.MONGODB_MAIN_DB = os.getenv('MONGODB_MAIN_DB_TEST', 'claims_test_db')
    settings.MONGODB_AUDIT_DB = os.getenv('MONGODB_AUDIT_DB_TEST', 'claims_audit_test_db')
    
    # Configurar JWT
    settings.JWT_SECRET_KEY = 'test-secret-key-for-testing'
    settings.JWT_ACCESS_TTL_MINUTES = 30


# Importar fixtures de integración
pytest_plugins = ['claims.tests.integration_conftest']
