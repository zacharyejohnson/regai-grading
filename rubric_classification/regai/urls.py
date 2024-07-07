from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AssignmentViewSet, SubmissionViewSet, KnowledgeBaseViewSet

router = DefaultRouter()
router.register(r'assignments', AssignmentViewSet)
router.register(r'submissions', SubmissionViewSet)
router.register(r'knowledge-base', KnowledgeBaseViewSet)

urlpatterns = [
    path('', include(router.urls)),
]