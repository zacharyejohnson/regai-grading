from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AssignmentViewSet, regai_interface, assignment_view

router = DefaultRouter()
router.register(r'assignments', AssignmentViewSet, basename='assignment')

urlpatterns = [
    path('home/', regai_interface, name='regai_interface'),
    path('api/', include(router.urls)),
    path('assignment/<int:assignment_id>/', assignment_view, name='assignment_view'),
]