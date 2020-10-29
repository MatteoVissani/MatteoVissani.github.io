from django.db import models
from django.contrib.auth.models import User
from PIL import Image # Pillow library to manage images smoothly (maybe not the best but it works!)
# Create your models here.

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete = models.CASCADE) # one profile per user and delete profile if you delete user
    image = models.ImageField(default='default.jpg', upload_to='profile_pics') # insert an image field

    def __str__(self): # to print something meaningfull when you access to the instance
        return f'{self.user.username} Profile' 
    
    # method after something is saved
    def save(self,*args, **kwargs): # whenoverride default methods, always include *args, **kwargs
        super().save(*args, **kwargs)
        img = Image.open(self.image.path) # open image current istance
        if img.height > 300 or img.width > 300: # resize image for better visualization
           output_size = (300,300)
           img.thumbnail(output_size) # resize
           img.save(self.image.path) # save again

    
''' maybe later for subscribers
class Subscriber(models.Model):
    email = models.EmailField(unique=True)
    conf_num = models.CharField(max_length=15)
    confirmed = models.BooleanField(default=False)

    def __str__(self):
        return self.email + " (" + ("not " if not self.confirmed else "") + "confirmed)"
''' 
