from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from django.conf import settings
import os
from uuid import uuid4

from .auth import generate_token
from .permissions import IsAdmin, IsAdminOrEmployee, IsAuthenticated
from .repositories import (
    ALLOWED_PRIORITIES,
    ALLOWED_STATUSES,
    add_claim_action,
    add_claim_comment,
    add_sub_area,
    create_claim,
    create_area,
    create_project,
    create_user,
    delete_area,
    delete_project,
    delete_sub_area,
    get_area,
    get_claim,
    get_project,
    get_user_by_email,
    get_user_by_id,
    list_claim_events,
    list_client_feedback_messages,
    list_claims,
    list_areas,
    list_projects,
    submit_client_feedback,
    list_users,
    soft_delete_user,
    update_area,
    update_claim_with_rules,
    update_project,
    update_sub_area,
    update_user,
    verify_password,
)
from .db import to_object_id
from .serializers import (
    AreaSerializer,
    ClaimSerializer,
    ClaimUpdateSerializer,
    ClientFeedbackMessageSerializer,
    ClientFeedbackSerializer,
    ClientSerializer,
    EmployeeSerializer,
    LoginSerializer,
    ProjectSerializer,
)


def _present_user(user: dict) -> dict:
    data = user.copy()
    data.pop("password", None)
    if data.get("area_id"):
        data["area_id"] = str(data["area_id"])
    return data


def _present_project(proj: dict) -> dict:
    data = proj.copy()
    if data.get("client_id"):
        data["client_id"] = str(data["client_id"])
    return data


class LoginView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = get_user_by_email(serializer.validated_data["email"].lower().strip())
        if not user or not user.get("is_active", True):
            return Response({"detail": "Credenciales inválidas"}, status=status.HTTP_401_UNAUTHORIZED)

        if not verify_password(serializer.validated_data["password"], user["password"]):
            return Response({"detail": "Credenciales inválidas"}, status=status.HTTP_401_UNAUTHORIZED)

        token = generate_token(user)
        return Response(
            {
                "token": token,
                "role": user["role"],
                "user": _present_user(user),
            }
        )


class AreaListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if getattr(request.user, "role", None) not in ("admin", "employee"):
            return Response(status=status.HTTP_403_FORBIDDEN)
        areas = list_areas()
        return Response([AreaSerializer(area).data for area in areas])

    def post(self, request):
        if getattr(request.user, "role", None) != "admin":
            return Response(status=status.HTTP_403_FORBIDDEN)
        serializer = AreaSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            area = create_area(
                name=serializer.validated_data["name"],
                description=serializer.validated_data.get("description", ""),
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(AreaSerializer(area).data, status=status.HTTP_201_CREATED)


class AreaDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, area_id: str):
        if getattr(request.user, "role", None) not in ("admin", "employee"):
            return Response(status=status.HTTP_403_FORBIDDEN)
        area = get_area(area_id)
        if not area or not area.get("is_active", True):
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(AreaSerializer(area).data)

    def put(self, request, area_id: str):
        if getattr(request.user, "role", None) != "admin":
            return Response(status=status.HTTP_403_FORBIDDEN)
        serializer = AreaSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        if not get_area(area_id):
            return Response(status=status.HTTP_404_NOT_FOUND)
        try:
            updated = update_area(area_id, serializer.validated_data)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(AreaSerializer(updated).data)

    def delete(self, request, area_id: str):
        if getattr(request.user, "role", None) != "admin":
            return Response(status=status.HTTP_403_FORBIDDEN)
        if not get_area(area_id):
            return Response(status=status.HTTP_404_NOT_FOUND)
        try:
            delete_area(area_id)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(status=status.HTTP_204_NO_CONTENT)


class SubAreaView(APIView):
    """Gestión de sub-áreas dentro de un área"""
    permission_classes = [IsAdmin]

    def post(self, request, area_id: str):
        """Agregar una sub-área a un área"""
        sub_area_name = request.data.get("name", "").strip()
        if not sub_area_name:
            return Response({"detail": "El nombre de la sub-área es requerido"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            area = add_sub_area(area_id, sub_area_name)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        
        return Response(AreaSerializer(area).data, status=status.HTTP_201_CREATED)

    def put(self, request, area_id: str, sub_area_id: str):
        """Actualizar una sub-área"""
        new_name = request.data.get("name", "").strip()
        if not new_name:
            return Response({"detail": "El nombre de la sub-área es requerido"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            area = update_sub_area(area_id, sub_area_id, new_name)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        
        return Response(AreaSerializer(area).data)

    def delete(self, request, area_id: str, sub_area_id: str):
        """Eliminar una sub-área"""
        try:
            area = delete_sub_area(area_id, sub_area_id)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        
        return Response(AreaSerializer(area).data)


class EmployeeListCreateView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        employees = list_users(role="employee")
        return Response([_present_user(emp) for emp in employees])

    def post(self, request):
        serializer = EmployeeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        if "password" not in serializer.validated_data:
            return Response({"detail": "La contraseña es obligatoria"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            created = create_user(
                role="employee",
                email=serializer.validated_data["email"],
                password=serializer.validated_data["password"],
                full_name=serializer.validated_data.get("full_name", ""),
                area_id=serializer.validated_data["area_id"],
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(_present_user(created), status=status.HTTP_201_CREATED)


class EmployeeDetailView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request, user_id: str):
        user = get_user_by_id(user_id)
        if not user or user.get("role") != "employee":
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(_present_user(user))

    def put(self, request, user_id: str):
        user = get_user_by_id(user_id)
        if not user or user.get("role") != "employee":
            return Response(status=status.HTTP_404_NOT_FOUND)
        serializer = EmployeeSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        updates = serializer.validated_data
        try:
            updated = update_user(user_id, updates)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(_present_user(updated))

    def delete(self, request, user_id: str):
        user = get_user_by_id(user_id)
        if not user or user.get("role") != "employee":
            return Response(status=status.HTTP_404_NOT_FOUND)
        soft_delete_user(user_id)
        return Response(status=status.HTTP_204_NO_CONTENT)


class ClientListCreateView(APIView):
    permission_classes = [IsAdminOrEmployee]

    def get(self, request):
        clients = list_users(role="client")
        return Response([_present_user(client) for client in clients])

    def post(self, request):
        serializer = ClientSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        if "password" not in serializer.validated_data:
            return Response({"detail": "La contraseña es obligatoria"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            created = create_user(
                role="client",
                email=serializer.validated_data["email"],
                password=serializer.validated_data["password"],
                full_name=serializer.validated_data.get("full_name", ""),
                company_name=serializer.validated_data.get("company_name"),
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(_present_user(created), status=status.HTTP_201_CREATED)


class ClientDetailView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request, user_id: str):
        user = get_user_by_id(user_id)
        if not user or user.get("role") != "client":
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(_present_user(user))

    def put(self, request, user_id: str):
        user = get_user_by_id(user_id)
        if not user or user.get("role") != "client":
            return Response(status=status.HTTP_404_NOT_FOUND)
        serializer = ClientSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        try:
            updated = update_user(user_id, serializer.validated_data)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(_present_user(updated))

    def delete(self, request, user_id: str):
        user = get_user_by_id(user_id)
        if not user or user.get("role") != "client":
            return Response(status=status.HTTP_404_NOT_FOUND)
        soft_delete_user(user_id)
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProjectListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        client_filter = None
        if getattr(request.user, "role", None) == "client":
            client_filter = request.user.id
        else:
            client_filter = request.query_params.get("client_id") or None
        projects = list_projects(client_id=client_filter)
        return Response([_present_project(p) for p in projects])

    def post(self, request):
        if getattr(request.user, "role", None) != "admin":
            return Response({"detail": "Solo un admin puede crear proyectos"}, status=status.HTTP_403_FORBIDDEN)
        serializer = ProjectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            project = create_project(
                name=serializer.validated_data["name"],
                project_type=serializer.validated_data["project_type"],
                client_id=serializer.validated_data["client_id"],
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(_present_project(project), status=status.HTTP_201_CREATED)


class ProjectDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, project_id: str):
        proj = get_project(project_id)
        if not proj or not proj.get("is_active", True):
            return Response(status=status.HTTP_404_NOT_FOUND)
        if getattr(request.user, "role", None) == "client" and str(proj.get("client_id")) != request.user.id:
            return Response(status=status.HTTP_403_FORBIDDEN)
        return Response(_present_project(proj))

    def put(self, request, project_id: str):
        proj = get_project(project_id)
        if not proj or not proj.get("is_active", True):
            return Response(status=status.HTTP_404_NOT_FOUND)
        if getattr(request.user, "role", None) != "admin":
            return Response(status=status.HTTP_403_FORBIDDEN)
        serializer = ProjectSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        updated = update_project(project_id, serializer.validated_data)
        return Response(_present_project(updated))

    def delete(self, request, project_id: str):
        proj = get_project(project_id)
        if not proj or not proj.get("is_active", True):
            return Response(status=status.HTTP_404_NOT_FOUND)
        if getattr(request.user, "role", None) != "admin":
            return Response(status=status.HTTP_403_FORBIDDEN)
        delete_project(project_id)
        return Response(status=status.HTTP_204_NO_CONTENT)


class ClaimListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        status_filter = request.query_params.get("status") or None
        client_filter = request.query_params.get("client_id") or None
        claims = list_claims(
            role=getattr(request.user, "role", ""),
            user_id=getattr(request.user, "id", ""),
            client_id=client_filter,
            status=status_filter,
        )
        def present(claim):
            data = ClaimSerializer(claim).data
            data["project_id"] = str(claim["project_id"])
            data["area_id"] = str(claim["area_id"]) if claim.get("area_id") else None
            data["created_by"] = str(claim["created_by"])
            # Obtener el client_id del proyecto asociado
            project = get_project(claim["project_id"])
            data["client_id"] = str(project["client_id"]) if project and project.get("client_id") else str(claim["created_by"])
            # Agregar URL del archivo adjunto si existe
            if claim.get("attachment_path"):
                data["attachment_url"] = request.build_absolute_uri(settings.MEDIA_URL + claim["attachment_path"])
                data["attachment_name"] = claim.get("attachment_name", "archivo")
            if getattr(request.user, "role", None) == "client":
                data.pop("sub_area", None)
            return data

        return Response([present(c) for c in claims])

    def post(self, request):
        role = getattr(request.user, "role", None)
        if role != "client":
            return Response({"detail": "Solo clientes pueden crear reclamos"}, status=status.HTTP_403_FORBIDDEN)

        serializer = ClaimSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Manejar archivo adjunto si existe
        attachment_path = None
        attachment_name = None
        attachment_file = request.FILES.get('attachment')
        
        if attachment_file:
            # Validar tipo de archivo
            allowed_extensions = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.gif', '.txt']
            file_ext = os.path.splitext(attachment_file.name)[1].lower()
            if file_ext not in allowed_extensions:
                return Response(
                    {"detail": f"Tipo de archivo no permitido. Permitidos: {', '.join(allowed_extensions)}"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Validar tamaño (máximo 10MB)
            if attachment_file.size > 10 * 1024 * 1024:
                return Response(
                    {"detail": "El archivo es demasiado grande. Máximo 10MB"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Generar nombre único y guardar
            unique_filename = f"{uuid4()}{file_ext}"
            attachment_path = os.path.join('claim_attachments', unique_filename)
            full_path = os.path.join(settings.MEDIA_ROOT, attachment_path)
            
            # Crear directorio si no existe
            os.makedirs(os.path.dirname(full_path), exist_ok=True)
            
            # Guardar archivo
            with open(full_path, 'wb+') as destination:
                for chunk in attachment_file.chunks():
                    destination.write(chunk)
            
            attachment_name = attachment_file.name
        
        try:
            created = create_claim(
                project_id=serializer.validated_data["project_id"],
                claim_type=serializer.validated_data["claim_type"],
                priority=serializer.validated_data["priority"],
                severity=serializer.validated_data.get("severity", "S3 - Medio"),
                description=serializer.validated_data["description"],
                created_by=request.user.id,
                attachment_path=attachment_path,
                attachment_name=attachment_name,
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        data = ClaimSerializer(created).data
        data["project_id"] = str(created["project_id"])
        data["area_id"] = str(created["area_id"]) if created.get("area_id") else None
        data["created_by"] = str(created["created_by"])
        # Obtener el client_id del proyecto asociado
        project = get_project(created["project_id"])
        data["client_id"] = str(project["client_id"]) if project and project.get("client_id") else str(created["created_by"])
        # Agregar URL del archivo adjunto si existe
        if created.get("attachment_path"):
            data["attachment_url"] = request.build_absolute_uri(settings.MEDIA_URL + created["attachment_path"])
            data["attachment_name"] = created.get("attachment_name", "archivo")
        return Response(data, status=status.HTTP_201_CREATED)


class ClaimDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, claim_id: str):
        claim = get_claim(claim_id)
        if not claim:
            return Response(status=status.HTTP_404_NOT_FOUND)

        role = getattr(request.user, "role", None)
        if role == "client" and str(claim.get("created_by")) != request.user.id:
            return Response(status=status.HTTP_403_FORBIDDEN)

        data = ClaimSerializer(claim).data
        data["project_id"] = str(claim["project_id"])
        data["area_id"] = str(claim["area_id"]) if claim.get("area_id") else None
        data["created_by"] = str(claim["created_by"])
        # Obtener el client_id del proyecto asociado
        project = get_project(claim["project_id"])
        data["client_id"] = str(project["client_id"]) if project and project.get("client_id") else str(claim["created_by"])
        # Agregar URL del archivo adjunto si existe
        if claim.get("attachment_path"):
            data["attachment_url"] = request.build_absolute_uri(settings.MEDIA_URL + claim["attachment_path"])
            data["attachment_name"] = claim.get("attachment_name", "archivo")
        if role == "client":
            data.pop("sub_area", None)
        return Response(data)

    def put(self, request, claim_id: str):
        claim = get_claim(claim_id)
        if not claim:
            return Response(status=status.HTTP_404_NOT_FOUND)

        role = getattr(request.user, "role", None)
        if role not in ("admin", "employee"):
            return Response({"detail": "Solo admin o empleado pueden actualizar reclamos"}, status=status.HTTP_403_FORBIDDEN)

        serializer = ClaimUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        try:
            updated = update_claim_with_rules(
                claim=claim,
                actor_id=request.user.id,
                actor_role=role,
                status=serializer.validated_data.get("status"),
                priority=serializer.validated_data.get("priority"),
                area_id=serializer.validated_data.get("area_id") if "area_id" in serializer.validated_data else None,
                sub_area=serializer.validated_data.get("sub_area") if "sub_area" in serializer.validated_data else None,
                reason=serializer.validated_data.get("reason"),
                resolution_description=serializer.validated_data.get("resolution_description"),
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        data = ClaimSerializer(updated).data
        data["project_id"] = str(updated["project_id"])
        data["area_id"] = str(updated["area_id"]) if updated.get("area_id") else None
        data["created_by"] = str(updated["created_by"])
        # Obtener el client_id del proyecto asociado
        project = get_project(updated["project_id"])
        data["client_id"] = str(project["client_id"]) if project and project.get("client_id") else str(updated["created_by"])
        return Response(data)


class ClaimCommentView(APIView):
    permission_classes = [IsAdminOrEmployee]

    def post(self, request, claim_id: str):
        comment = request.data.get("comment", "").strip()
        if not comment:
            return Response({"detail": "El comentario es obligatorio"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            add_claim_comment(
                claim_id=claim_id,
                actor_id=request.user.id,
                actor_role=getattr(request.user, "role", None),
                comment=comment,
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_201_CREATED)


class ClaimActionView(APIView):
    permission_classes = [IsAdminOrEmployee]

    def post(self, request, claim_id: str):
        action_description = request.data.get("action_description", "").strip()
        if not action_description:
            return Response({"detail": "La descripción de la acción es obligatoria"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            add_claim_action(
                claim_id=claim_id,
                actor_id=request.user.id,
                actor_role=getattr(request.user, "role", None),
                action_description=action_description,
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_201_CREATED)


class ClientFeedbackView(APIView):
    """
    Permite al cliente enviar feedback (comentario y/o calificación) sobre el reclamo.
    Solo disponible cuando el reclamo está en 'En Proceso' o 'Resuelto'.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, claim_id: str):
        claim = get_claim(claim_id)
        if not claim:
            return Response(status=status.HTTP_404_NOT_FOUND)

        role = getattr(request.user, "role", None)
        if role == "client" and str(claim.get("created_by")) != request.user.id:
            return Response(status=status.HTTP_403_FORBIDDEN)
        if role not in ("client", "admin", "employee"):
            return Response(status=status.HTTP_403_FORBIDDEN)

        messages = list_client_feedback_messages(claim_id)
        serializer = ClientFeedbackMessageSerializer(messages, many=True)
        return Response(serializer.data)

    def post(self, request, claim_id: str):
        # Verificar que el usuario es un cliente
        if getattr(request.user, "role", None) != "client":
            return Response(
                {"detail": "Solo los clientes pueden enviar feedback"},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = ClientFeedbackSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            result = submit_client_feedback(
                claim_id=claim_id,
                client_id=request.user.id,
                rating=serializer.validated_data.get("rating"),
                feedback=serializer.validated_data.get("feedback"),
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        claim = result.get("claim")
        message = result.get("message")

        claim_data = ClaimSerializer(claim).data if claim else {}
        if claim:
            claim_data["project_id"] = str(claim["project_id"])
            claim_data["area_id"] = str(claim["area_id"]) if claim.get("area_id") else None
            claim_data["created_by"] = str(claim["created_by"])

        message_data = (
            ClientFeedbackMessageSerializer(message).data
            if message
            else None
        )

        return Response(
            {
                "claim": claim_data,
                "message": message_data,
            }
        )


class ClaimTimelineView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, claim_id: str):
        claim = get_claim(claim_id)
        if not claim:
            return Response(status=status.HTTP_404_NOT_FOUND)
        role = getattr(request.user, "role", None)
        if role == "client" and str(claim.get("created_by")) != request.user.id:
            return Response(status=status.HTTP_403_FORBIDDEN)
        public_only = role == "client"
        events = list_claim_events(claim_id, public_only=public_only)
        return Response(events)


class StatisticsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from .db import get_main_db
        from datetime import datetime
        
        db = get_main_db()
        role = getattr(request.user, "role", None)
        
        query = {}
        if role == "client":
            query["created_by"] = to_object_id(request.user.id)
        elif role == "employee":
            query["area_id"] = request.user.area_id
        
        client_id = request.GET.get("client_id")
        employee_id = request.GET.get("employee_id")
        project_id = request.GET.get("project_type")
        area_id = request.GET.get("area_id")
        claim_status = request.GET.get("status")
        start_date = request.GET.get("start_date")
        end_date = request.GET.get("end_date")
        
        if client_id and role == "admin":
            query["created_by"] = to_object_id(client_id)
        if employee_id and role == "admin":
            employee = get_user_by_id(employee_id)
            if employee and employee.get("area_id"):
                query["area_id"] = employee["area_id"]
        if project_id:
            query["project_id"] = to_object_id(project_id)
        if area_id:
            query["area_id"] = to_object_id(area_id)
        if claim_status:
            query["status"] = claim_status
        if start_date:
            query.setdefault("created_at", {})["$gte"] = datetime.fromisoformat(start_date)
        if end_date:
            query.setdefault("created_at", {})["$lte"] = datetime.fromisoformat(end_date)
        
        pipeline = [
            {"$match": query},
            {"$group": {
                "_id": "$status",
                "count": {"$sum": 1}
            }}
        ]
        
        results = list(db.claims.aggregate(pipeline))
        by_status = {item["_id"]: item["count"] for item in results}
        
        return Response({
            "by_status": by_status,
            "total": sum(by_status.values())
        })


class StatisticsByMonthView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from .db import get_main_db
        from datetime import datetime
        
        db = get_main_db()
        role = getattr(request.user, "role", None)
        year = int(request.GET.get("year", datetime.now().year))
        
        query = {
            "created_at": {
                "$gte": datetime(year, 1, 1),
                "$lt": datetime(year + 1, 1, 1)
            }
        }
        
        if role == "client":
            query["created_by"] = to_object_id(request.user.id)
        elif role == "employee":
            query["area_id"] = request.user.area_id
        
        client_id = request.GET.get("client_id")
        employee_id = request.GET.get("employee_id")
        
        if client_id and role == "admin":
            query["created_by"] = to_object_id(client_id)
        if employee_id and role == "admin":
            employee = get_user_by_id(employee_id)
            if employee and employee.get("area_id"):
                query["area_id"] = employee["area_id"]
        
        pipeline = [
            {"$match": query},
            {"$group": {
                "_id": {"$month": "$created_at"},
                "count": {"$sum": 1},
                "resolved": {
                    "$sum": {"$cond": [{"$eq": ["$status", "resolved"]}, 1, 0]}
                }
            }},
            {"$sort": {"_id": 1}}
        ]
        
        results = list(db.claims.aggregate(pipeline))
        months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
                  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]
        
        data = []
        for item in results:
            month_index = item["_id"] - 1
            data.append({
                "month": months[month_index] if month_index < len(months) else str(item["_id"]),
                "count": item["count"],
                "resolved": item["resolved"]
            })
        
        return Response(data)


class StatisticsByStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from .db import get_main_db
        from datetime import datetime
        
        db = get_main_db()
        role = getattr(request.user, "role", None)
        
        query = {}
        if role == "client":
            query["created_by"] = to_object_id(request.user.id)
        
        client_id = request.GET.get("client_id")
        employee_id = request.GET.get("employee_id")
        project_id = request.GET.get("project_id")
        
        if client_id and role in ["admin", "employee"]:
            query["created_by"] = to_object_id(client_id)
        if employee_id and role == "admin":
            employee = get_user_by_id(employee_id)
            if employee and employee.get("area_id"):
                query["area_id"] = employee["area_id"]
        if project_id:
            query["project_id"] = to_object_id(project_id)
        
        pipeline = [
            {"$match": query},
            {"$group": {
                "_id": "$status",
                "count": {"$sum": 1}
            }}
        ]
        
        results = list(db.claims.aggregate(pipeline))
        status_translations = {
            "pending": "Pendiente",
            "in_progress": "En Progreso",
            "resolved": "Resuelto",
            "cancelled": "Cancelado"
        }
        
        data = []
        for item in results:
            data.append({
                "status": status_translations.get(item["_id"], item["_id"]),
                "count": item["count"]
            })
        
        return Response(data)


class StatisticsByTypeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from .db import get_main_db
        from datetime import datetime
        
        db = get_main_db()
        role = getattr(request.user, "role", None)
        
        query = {}
        if role == "client":
            query["created_by"] = to_object_id(request.user.id)
        
        client_id = request.GET.get("client_id")
        employee_id = request.GET.get("employee_id")
        area_id = request.GET.get("area_id")
        start_date = request.GET.get("start_date")
        end_date = request.GET.get("end_date")
        
        if client_id and role in ["admin", "employee"]:
            query["created_by"] = to_object_id(client_id)
        if employee_id and role in ["admin", "employee"]:
            employee = get_user_by_id(employee_id)
            if employee and employee.get("area_id"):
                query["area_id"] = employee["area_id"]
        if area_id:
            query["area_id"] = to_object_id(area_id)
        if start_date:
            query.setdefault("created_at", {})["$gte"] = datetime.fromisoformat(start_date)
        if end_date:
            query.setdefault("created_at", {})["$lte"] = datetime.fromisoformat(end_date)
        
        pipeline = [
            {"$match": query},
            {"$group": {
                "_id": "$claim_type",
                "count": {"$sum": 1}
            }},
            {"$sort": {"count": -1}},
            {"$limit": 10}
        ]
        
        results = list(db.claims.aggregate(pipeline))
        data = []
        for item in results:
            data.append({
                "type": item["_id"],
                "count": item["count"]
            })
        
        return Response(data)


class StatisticsByAreaView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from .db import get_main_db
        from datetime import datetime
        
        db = get_main_db()
        
        query = {}
        start_date = request.GET.get("start_date")
        end_date = request.GET.get("end_date")
        
        if start_date:
            query.setdefault("created_at", {})["$gte"] = datetime.fromisoformat(start_date)
        if end_date:
            query.setdefault("created_at", {})["$lte"] = datetime.fromisoformat(end_date)
        
        pipeline = [
            {"$match": query},
            {"$group": {
                "_id": "$area_id",
                "count": {"$sum": 1}
            }},
            {"$sort": {"count": -1}}
        ]
        
        results = list(db.claims.aggregate(pipeline))
        data = []
        for item in results:
            if item["_id"]:
                area = get_area(item["_id"])
                area_name = area["name"] if area else "Sin área"
            else:
                area_name = "Sin área"
            
            data.append({
                "area": area_name,
                "count": item["count"]
            })
        
        return Response(data)


class StatisticsByProjectView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from .db import get_main_db
        from datetime import datetime
        
        db = get_main_db()
        role = getattr(request.user, "role", None)
        
        query = {}
        if role == "client":
            query["created_by"] = to_object_id(request.user.id)
        
        client_id = request.GET.get("client_id")
        year = request.GET.get("year")
        month = request.GET.get("month")
        start_date = request.GET.get("start_date")
        end_date = request.GET.get("end_date")
        
        if client_id and role == "admin":
            query["created_by"] = to_object_id(client_id)
        
        # Filtros por año y mes
        if year:
            year_int = int(year)
            if month:
                month_int = int(month)
                # Específico mes y año
                query.setdefault("created_at", {})["$gte"] = datetime(year_int, month_int, 1)
                if month_int == 12:
                    query["created_at"]["$lt"] = datetime(year_int + 1, 1, 1)
                else:
                    query["created_at"]["$lt"] = datetime(year_int, month_int + 1, 1)
            else:
                # Solo año
                query.setdefault("created_at", {})["$gte"] = datetime(year_int, 1, 1)
                query["created_at"]["$lt"] = datetime(year_int + 1, 1, 1)
        # Filtros alternativos por rango de fechas
        elif start_date:
            query.setdefault("created_at", {})["$gte"] = datetime.fromisoformat(start_date)
        if end_date:
            query.setdefault("created_at", {})["$lte"] = datetime.fromisoformat(end_date)
        
        pipeline = [
            {"$match": query},
            {"$group": {
                "_id": "$project_id",
                "count": {"$sum": 1}
            }},
            {"$sort": {"count": -1}},
            {"$limit": 10}
        ]
        
        results = list(db.claims.aggregate(pipeline))
        data = []
        for item in results:
            if item["_id"]:
                project = get_project(item["_id"])
                project_name = project["name"] if project else "Sin proyecto"
            else:
                project_name = "Sin proyecto"
            
            data.append({
                "project": project_name,
                "count": item["count"]
            })
        
        return Response(data)


class StatisticsAverageResolutionTimeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from .db import get_main_db
        
        db = get_main_db()
        role = getattr(request.user, "role", None)
        
        query = {"status": "resolved", "resolved_at": {"$exists": True}}
        if role == "client":
            query["created_by"] = to_object_id(request.user.id)
        elif role == "employee":
            query["area_id"] = request.user.area_id
        
        employee_id = request.GET.get("employee_id")
        area_id = request.GET.get("area_id")
        claim_type = request.GET.get("claim_type")
        
        if employee_id and role == "admin":
            employee = get_user_by_id(employee_id)
            if employee and employee.get("area_id"):
                query["area_id"] = employee["area_id"]
        if area_id:
            query["area_id"] = to_object_id(area_id)
        if claim_type:
            query["claim_type"] = claim_type
        
        claims = list(db.claims.find(query))
        
        if not claims:
            return Response({
                "average": "0h",
                "average_hours": 0,
                "trend": "neutral",
                "trendValue": "0%"
            })
        
        total_hours = 0
        for claim in claims:
            if claim.get("resolved_at") and claim.get("created_at"):
                diff = claim["resolved_at"] - claim["created_at"]
                total_hours += diff.total_seconds() / 3600
        
        avg_hours = total_hours / len(claims) if claims else 0
        
        return Response({
            "average": f"{int(avg_hours)}h",
            "average_hours": round(avg_hours, 2),
            "trend": "neutral",
            "trendValue": "0%"
        })


class StatisticsKPIsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from .db import get_main_db
        from datetime import datetime
        
        db = get_main_db()
        role = getattr(request.user, "role", None)
        
        query = {}
        if role == "client":
            query["created_by"] = to_object_id(request.user.id)
        elif role == "employee":
            query["area_id"] = request.user.area_id
        
        client_id = request.GET.get("client_id")
        employee_id = request.GET.get("employee_id")
        start_date = request.GET.get("start_date")
        end_date = request.GET.get("end_date")
        
        if client_id and role == "admin":
            query["created_by"] = to_object_id(client_id)
        if employee_id and role == "admin":
            employee = get_user_by_id(employee_id)
            if employee and employee.get("area_id"):
                query["area_id"] = employee["area_id"]
        if start_date:
            query.setdefault("created_at", {})["$gte"] = datetime.fromisoformat(start_date)
        if end_date:
            query.setdefault("created_at", {})["$lte"] = datetime.fromisoformat(end_date)
        
        total_claims = db.claims.count_documents(query)
        
        pending_query = query.copy()
        pending_query["status"] = "pending"
        pending_claims = db.claims.count_documents(pending_query)
        
        resolved_query = query.copy()
        resolved_query["status"] = "resolved"
        resolved_claims = db.claims.count_documents(resolved_query)
        
        data = {
            "totalClaims": total_claims,
            "totalTrend": "neutral",
            "totalTrendValue": "0%",
            "pendingClaims": pending_claims,
            "pendingTrend": "neutral",
            "pendingTrendValue": "0%",
            "resolvedClaims": resolved_claims,
            "resolvedTrend": "neutral",
            "resolvedTrendValue": "0%",
        }
        
        if role == "employee":
            assigned_query = query.copy()
            assigned_to_me = db.claims.count_documents(assigned_query)
            
            resolved_by_me_query = assigned_query.copy()
            resolved_by_me_query["status"] = "resolved"
            resolved_by_me = db.claims.count_documents(resolved_by_me_query)
            
            data["assignedToMe"] = assigned_to_me
            data["resolvedByMe"] = resolved_by_me
            data["avgTimeMe"] = "0h"
        
        return Response(data)


class StatisticsRatingsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from .db import get_main_db
        from datetime import datetime
        
        db = get_main_db()
        role = getattr(request.user, "role", None)
        
        query = {"type": "final", "rating": {"$exists": True, "$ne": None}}
        
        client_id = request.GET.get("client_id")
        year = request.GET.get("year")
        month = request.GET.get("month")
        start_date = request.GET.get("start_date")
        end_date = request.GET.get("end_date")
        
        # Filtrar por cliente específico si se proporciona
        if client_id:
            query["client_id"] = to_object_id(client_id)
        else:
            # Si NO se seleccionó un cliente, filtrar por rol
            if role == "client":
                query["client_id"] = to_object_id(request.user.id)
            # Para admin y employee sin cliente seleccionado, mostrar todos (no agregar filtro adicional)
        
        # Filtros por año y mes
        if year:
            year_int = int(year)
            if month:
                month_int = int(month)
                # Específico mes y año
                query.setdefault("created_at", {})["$gte"] = datetime(year_int, month_int, 1)
                if month_int == 12:
                    query["created_at"]["$lt"] = datetime(year_int + 1, 1, 1)
                else:
                    query["created_at"]["$lt"] = datetime(year_int, month_int + 1, 1)
            else:
                # Solo año
                query.setdefault("created_at", {})["$gte"] = datetime(year_int, 1, 1)
                query["created_at"]["$lt"] = datetime(year_int + 1, 1, 1)
        # Filtros alternativos por rango de fechas
        elif start_date:
            query.setdefault("created_at", {})["$gte"] = datetime.fromisoformat(start_date)
        if end_date:
            query.setdefault("created_at", {})["$lte"] = datetime.fromisoformat(end_date)
        
        pipeline = [
            {"$match": query},
            {"$group": {
                "_id": "$rating",
                "count": {"$sum": 1}
            }},
            {"$sort": {"_id": 1}}
        ]
        
        result = list(db.client_feedback_messages.aggregate(pipeline))
        
        # Asegurar que siempre haya 5 valores (1-5 estrellas)
        ratings_dict = {i: 0 for i in range(1, 6)}
        for item in result:
            if item["_id"] and 1 <= item["_id"] <= 5:
                ratings_dict[item["_id"]] = item["count"]
        
        data = [
            {"rating": rating, "count": count}
            for rating, count in ratings_dict.items()
        ]
        
        return Response(data)


class StatisticsByEmployeeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from .db import get_main_db
        from datetime import datetime
        
        db = get_main_db()
        role = getattr(request.user, "role", None)
        
        query = {}
        area_id = request.GET.get("area_id")
        start_date = request.GET.get("start_date")
        end_date = request.GET.get("end_date")
        
        if area_id:
            query["area_id"] = to_object_id(area_id)
        
        if start_date:
            query.setdefault("created_at", {})["$gte"] = datetime.fromisoformat(start_date)
        if end_date:
            query.setdefault("created_at", {})["$lte"] = datetime.fromisoformat(end_date)
        
        # Obtener todos los empleados
        employees = list(db.users.find({"role": "employee", "is_active": {"$ne": False}}))
        
        data = []
        for employee in employees:
            employee_query = query.copy()
            employee_query["area_id"] = employee.get("area_id")
            
            if not employee_query.get("area_id"):
                continue
            
            # Contar reclamos del área del empleado
            total = db.claims.count_documents(employee_query)
            
            # Contar reclamos resueltos
            resolved_query = employee_query.copy()
            resolved_query["status"] = "Resuelto"
            resolved = db.claims.count_documents(resolved_query)
            
            # Obtener nombre del área
            area = db.areas.find_one({"_id": employee_query["area_id"]})
            area_name = area["name"] if area else "Sin área"
            
            data.append({
                "employee": employee.get("full_name") or employee.get("email"),
                "area": area_name,
                "total": total,
                "resolved": resolved
            })
        
        # Ordenar por total de reclamos descendente
        data.sort(key=lambda x: x["total"], reverse=True)
        
        return Response(data)

