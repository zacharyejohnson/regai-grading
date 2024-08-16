from django.urls import path, include
from rest_framework.routers import DefaultRouter
<<<<<<< HEAD
from .views.regai_views import AssignmentViewSet, SubmissionViewSet, RubricViewSet, GradeViewSet, \
    CritiqueViewSet

router = DefaultRouter()
router.register(r'rubrics', RubricViewSet)
router.register(r'grades', GradeViewSet)
router.register(r'critiques', CritiqueViewSet)
router.register(r'assignments', AssignmentViewSet)
router.register(r'submissions', SubmissionViewSet)
=======
from .views import AssignmentViewSet, regai_interface, assignment_view

router = DefaultRouter()
router.register(r'assignments', AssignmentViewSet, basename='assignment')
>>>>>>> parent of fc22ff7 (for marsh)

urlpatterns = [
    path('home/', regai_interface, name='regai_interface'),
    path('api/', include(router.urls)),
    path('assignment/<int:assignment_id>/', assignment_view, name='assignment_view'),
]