"""Tests para módulo de base de datos"""
import pytest
from unittest.mock import Mock, patch, MagicMock
from bson import ObjectId

from claims.db import (
    to_object_id,
    serialize,
    get_main_client,
    get_audit_client,
    get_main_db,
    get_audit_db
)


@pytest.mark.unit
class TestToObjectId:
    """Tests para la función to_object_id"""
    
    def test_string_to_objectid(self):
        """Debe convertir string a ObjectId"""
        oid_str = "507f1f77bcf86cd799439011"
        result = to_object_id(oid_str)
        
        assert isinstance(result, ObjectId)
        assert str(result) == oid_str
    
    def test_objectid_to_objectid(self):
        """Debe retornar el mismo ObjectId si ya es ObjectId"""
        oid = ObjectId()
        result = to_object_id(oid)
        
        assert result is oid
        assert isinstance(result, ObjectId)
    
    def test_invalid_string(self):
        """Debe lanzar excepción con string inválido"""
        with pytest.raises(Exception):
            to_object_id("invalid-objectid")


@pytest.mark.unit
class TestSerialize:
    """Tests para la función serialize"""
    
    def test_serialize_document(self):
        """Debe serializar documento con _id a id"""
        oid = ObjectId()
        document = {
            "_id": oid,
            "name": "Test",
            "value": 123
        }
        
        result = serialize(document)
        
        assert result is not None
        assert "id" in result
        assert "_id" not in result
        assert result["id"] == str(oid)
        assert result["name"] == "Test"
        assert result["value"] == 123
    
    def test_serialize_none(self):
        """Debe retornar None si el documento es None"""
        result = serialize(None)
        assert result is None
    
    def test_serialize_empty_dict(self):
        """Debe retornar None si el documento está vacío (por el if not document)"""
        result = serialize({})
        assert result is None
    
    def test_serialize_without_id(self):
        """Debe serializar documento sin _id"""
        document = {
            "name": "Test",
            "value": 456
        }
        
        result = serialize(document)
        
        assert result is not None
        assert "id" not in result
        assert "_id" not in result
        assert result["name"] == "Test"
        assert result["value"] == 456
    
    def test_serialize_does_not_modify_original(self):
        """No debe modificar el documento original"""
        oid = ObjectId()
        document = {
            "_id": oid,
            "name": "Test"
        }
        
        result = serialize(document)
        
        assert "_id" in document
        assert document["_id"] == oid


@pytest.mark.unit
class TestDatabaseConnections:
    """Tests para las funciones de conexión a base de datos"""
    
    def test_get_main_client(self):
        """Debe retornar cliente de MongoDB principal"""
        result = get_main_client()
        
        assert result is not None
        assert hasattr(result, '__getitem__')  # Verifica que es un cliente MongoDB
    
    def test_get_audit_client(self):
        """Debe retornar cliente de MongoDB de auditoría"""
        result = get_audit_client()
        
        assert result is not None
        assert hasattr(result, '__getitem__')  # Verifica que es un cliente MongoDB
    
    @patch('claims.db.get_main_client')
    def test_get_main_db(self, mock_get_client):
        """Debe retornar la base de datos principal"""
        mock_client = MagicMock()
        mock_db = Mock()
        mock_client.__getitem__.return_value = mock_db
        mock_get_client.return_value = mock_client
        
        result = get_main_db()
        
        assert result == mock_db
    
    @patch('claims.db.get_audit_client')
    def test_get_audit_db(self, mock_get_client):
        """Debe retornar la base de datos de auditoría"""
        mock_client = MagicMock()
        mock_db = Mock()
        mock_client.__getitem__.return_value = mock_db
        mock_get_client.return_value = mock_client
        
        result = get_audit_db()
        
        assert result == mock_db
