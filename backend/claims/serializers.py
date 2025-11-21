from typing import Any

from rest_framework import serializers

from .repositories import ALLOWED_PRIORITIES, ALLOWED_STATUSES, get_area, get_project, get_user_by_id


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=6)


class AreaSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    name = serializers.CharField(max_length=120)
    description = serializers.CharField(max_length=500, allow_blank=True, required=False)
    is_active = serializers.BooleanField(read_only=True)


class EmployeeSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    full_name = serializers.CharField(max_length=200)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=6, required=False)
    area_id = serializers.CharField()
    is_active = serializers.BooleanField(read_only=True)

    def validate_area_id(self, value: Any):
        area = get_area(value)
        if not area or not area.get("is_active", True):
            raise serializers.ValidationError("Área no encontrada o inactiva")
        return str(area["id"])


class ClientSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    company_name = serializers.CharField(max_length=200)
    full_name = serializers.CharField(max_length=200, required=False, allow_blank=True)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=6, required=False)
    is_active = serializers.BooleanField(read_only=True)


class ProjectSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    name = serializers.CharField(max_length=200)
    project_type = serializers.CharField(max_length=100)
    client_id = serializers.CharField()
    is_active = serializers.BooleanField(read_only=True)

    def validate_client_id(self, value: Any):
        client = get_user_by_id(value)
        if not client or client.get("role") != "client" or not client.get("is_active", True):
            raise serializers.ValidationError("Cliente no encontrado o inactivo")
        return str(client["id"])


class ClaimSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    project_id = serializers.CharField()
    claim_type = serializers.CharField(max_length=120)
    urgency = serializers.CharField(max_length=20)
    severity = serializers.CharField(max_length=20, required=False, allow_null=True, allow_blank=True)
    description = serializers.CharField()
    status = serializers.CharField(read_only=True)
    priority = serializers.CharField(read_only=True)
    area_id = serializers.CharField(required=False, allow_null=True)
    sub_area = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    created_by = serializers.CharField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)

    def validate_project_id(self, value: Any):
        project = get_project(value)
        if not project or not project.get("is_active", True):
            raise serializers.ValidationError("Proyecto no encontrado o inactivo")
        return str(project["id"])

    def validate_urgency(self, value: str):
        allowed = ["Baja", "Media", "Alta"]
        if value not in allowed:
            raise serializers.ValidationError("Urgencia inválida")
        return value

    def validate_severity(self, value: str):
        if not value:  # Si está vacío o None, lo permitimos
            return value
        allowed = ["S1 - Crítico", "S2 - Alto", "S3 - Medio", "S4 - Bajo"]
        if value not in allowed:
            raise serializers.ValidationError("Nivel de criticidad inválido")
        return value


class ClaimUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=ALLOWED_STATUSES, required=False)
    priority = serializers.ChoiceField(choices=ALLOWED_PRIORITIES, required=False)
    area_id = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    sub_area = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    reason = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    description = serializers.CharField(required=False, allow_blank=True)

    def validate_area_id(self, value: Any):
        if not value:
            return None
        area = get_area(value)
        if not area or not area.get("is_active", True):
            raise serializers.ValidationError("Área no encontrada o inactiva")
        return str(area["id"])
