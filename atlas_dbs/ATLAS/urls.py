from django.urls import path
from . import views
from .views import new_atlas_superuser, new_atlas_user # use it when you want to use database

urlpatterns = [
    path('', views.home, name='atlas-home'),
    path('rundemo/', views.rundemo, name='atlas-rundemo'),
    #path('resources/atlas/new/',ATLASCreateView.as_view(),name = 'atlas-create'),
    path('list/', views.list, name='atlas-list'), # use it when you want to avoid database
    #path('resources/', ATLASListView.as_view(), name='atlas-list'), # use it when you want to use database
    #path('resources/atlas/<int:pk>/', ATLASDetailView.as_view(), name='atlas-detail'),
    path('newatlas/superuser',views.new_atlas_superuser, name ='atlas-submit-superuser'),
    path('newatlas/user',views.new_atlas_user, name ='atlas-submit-user'),

]

# <app>/<model>_<viewtype>.html 
# ATLAS/Model_Viewtype.html

# ATLAS/ATLAS_list_list.html
