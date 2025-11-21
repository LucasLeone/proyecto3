from django.urls import path

from .views import (
    AreaDetailView,
    AreaListCreateView,
    ClientDetailView,
    ClientListCreateView,
    ClaimDetailView,
    ClaimListCreateView,
    ClaimActionView,
    ClaimCommentView,
    ClaimTimelineView,
    EmployeeDetailView,
    EmployeeListCreateView,
    LoginView,
    ProjectDetailView,
    ProjectListCreateView,
)

urlpatterns = [
    path("auth/login/", LoginView.as_view(), name="login"),
    path("areas/", AreaListCreateView.as_view(), name="area-list"),
    path("areas/<str:area_id>/", AreaDetailView.as_view(), name="area-detail"),
    path("employees/", EmployeeListCreateView.as_view(), name="employee-list"),
    path("employees/<str:user_id>/", EmployeeDetailView.as_view(), name="employee-detail"),
    path("clients/", ClientListCreateView.as_view(), name="client-list"),
    path("clients/<str:user_id>/", ClientDetailView.as_view(), name="client-detail"),
    path("projects/", ProjectListCreateView.as_view(), name="project-list"),
    path("projects/<str:project_id>/", ProjectDetailView.as_view(), name="project-detail"),
    path("claims/", ClaimListCreateView.as_view(), name="claim-list"),
    path("claims/<str:claim_id>/", ClaimDetailView.as_view(), name="claim-detail"),
    path("claims/<str:claim_id>/actions/", ClaimActionView.as_view(), name="claim-action"),
    path("claims/<str:claim_id>/comments/", ClaimCommentView.as_view(), name="claim-comment"),
    path("claims/<str:claim_id>/timeline/", ClaimTimelineView.as_view(), name="claim-timeline"),
]
