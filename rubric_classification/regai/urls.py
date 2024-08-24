from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views.auth_views import RegistrationView, LoginView, CustomTokenRefreshView, LogoutView
from .views.regai_views import AssignmentViewSet, SubmissionViewSet, RubricViewSet, GradeViewSet, \
    CritiqueViewSet, CourseViewSet
from .views.scorm_views import SCORMAssignmentViewSet

router = DefaultRouter()
router.register(r'rubrics', RubricViewSet)
router.register(r'grades', GradeViewSet)
router.register(r'critiques', CritiqueViewSet)
router.register(r'assignments', AssignmentViewSet)
router.register(r'submissions', SubmissionViewSet)
router.register(r'courses', CourseViewSet, basename='courses')
router.register(r'scorm/assignments', SCORMAssignmentViewSet, basename='scorm-assignments')

urlpatterns = [
    path('', include(router.urls)),
    path('auth/register/', RegistrationView.as_view(), name='register'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/refresh/', CustomTokenRefreshView.as_view(), name='token_refresh'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
]