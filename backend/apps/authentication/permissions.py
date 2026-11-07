from rest_framework import permissions

class IsAdminUserRole(permissions.BasePermission):
    """
    Allows access only to Admin users.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            (request.user.role == 'admin' or request.user.is_superuser)
        )


class IsFrontDeskOrAdmin(permissions.BasePermission):
    """
    Allows access to Front Desk Staff and Admin users.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role in ['admin', 'front_desk']
        )


class IsOperationsOrAdmin(permissions.BasePermission):
    """
    Allows access to Operations Staff, Front Desk Staff, and Admin.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role in ['admin', 'front_desk', 'operations']
        )
