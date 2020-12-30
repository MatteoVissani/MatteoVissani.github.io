from django.db.models.signals import post_save # signal after an object is created
from django.contrib.auth.models import User
from django.dispatch import receiver # import receiver of signal
from .models import Profile

# We want an user profile created for each new user authomatically

@receiver(post_save, sender=User) # when an user is saved send this signsl and the receiver is the profile function
def create_profile(sender,instance,created, **kwargs):
    if created:
        Profile.objects.create(user = instance) # run it everytime an user is created


@receiver(post_save, sender=User) # when an user is saved send this signsl and the receiver is the profile function
def save_profile(sender,instance, **kwargs):
    instance.profile.save() #save it