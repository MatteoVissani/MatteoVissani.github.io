from django.contrib import admin
from .models import Profile
''' maybe later for subscribers
from .models import Subscriber
'''
# Register your models here.

# Remember to register here admin to profile
admin.site.register(Profile)

''' maybe later for subscribers
admin.site.register(Subscriber)
'''


  