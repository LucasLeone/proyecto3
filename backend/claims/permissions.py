from rest_framework.permissions import BasePermission


class IsAuthenticated(BasePermission):
    def has_permission(self, request, view):
        return bool(getattr(request, "user", None)) and getattr(
            request.user, "is_authenticated", False
        )


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return (
            bool(getattr(request, "user", None))
            and getattr(request.user, "is_authenticated", False)
            and getattr(request.user, "role", None) == "admin"
        )


class IsAdminOrEmployee(BasePermission):
    def has_permission(self, request, view):
        return (
            bool(getattr(request, "user", None))
            and getattr(request.user, "is_authenticated", False)
            and getattr(request.user, "role", None) in {"admin", "employee"}
        )
