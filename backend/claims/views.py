from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .auth import generate_token
from .permissions import IsAdmin, IsAdminOrEmployee, IsAuthenticated
from .repositories import (
    ALLOWED_PRIORITIES,
    ALLOWED_STATUSES,
    add_claim_comment,
    create_claim,
    create_area,
    create_project,
    create_user,
    delete_area,
    delete_project,
    get_area,
    get_claim,
    get_project,
    get_user_by_email,
    get_user_by_id,
    list_claim_events,
    list_claims,
    list_areas,
    list_projects,
    list_users,
    soft_delete_user,
    update_area,
    update_claim_with_rules,
    update_project,
    update_user,
    verify_password,
)
from .serializers import (
    AreaSerializer,
    ClaimSerializer,
    ClaimUpdateSerializer,
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
    permission_classes = [IsAdmin]

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
                status=serializer.validated_data["status"],
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
            data["client_id"] = str(claim["created_by"])
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
        try:
            created = create_claim(
                project_id=serializer.validated_data["project_id"],
                claim_type=serializer.validated_data["claim_type"],
                urgency=serializer.validated_data["urgency"],
                description=serializer.validated_data["description"],
                created_by=request.user.id,
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        data = ClaimSerializer(created).data
        data["project_id"] = str(created["project_id"])
        data["area_id"] = str(created["area_id"]) if created.get("area_id") else None
        data["created_by"] = str(created["created_by"])
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
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        data = ClaimSerializer(updated).data
        data["project_id"] = str(updated["project_id"])
        data["area_id"] = str(updated["area_id"]) if updated.get("area_id") else None
        data["created_by"] = str(updated["created_by"])
        data["client_id"] = str(updated["created_by"])
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
