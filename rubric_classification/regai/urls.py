from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views.regai_views import AssignmentViewSet, SubmissionViewSet, RubricViewSet, GradeViewSet, \
    CritiqueViewSet

router = DefaultRouter()
router.register(r'rubrics', RubricViewSet)
router.register(r'grades', GradeViewSet)
router.register(r'critiques', CritiqueViewSet)
router.register(r'assignments', AssignmentViewSet)
router.register(r'submissions', SubmissionViewSet)

urlpatterns = [
    path('', include(router.urls)),
]