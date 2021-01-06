from django import forms
from django.contrib.auth.models import User
from django.contrib.auth.forms import UserCreationForm
from .models import Profile

class UserRegisterForm(UserCreationForm): # create an user form from USerCreationForm
    email = forms.EmailField()
    class Meta:
        model = User
        fields = ['username','email','password1','password2']
    '''
    def __init__(self,*args, **kwargs):
        super(UserRegisterForm,self).__init__(*args, **kwargs)
    '''
# We want form and profile updated by user model
class UserUpdateForm(forms.ModelForm):
    email = forms.EmailField()

    class Meta:
        model = User
        fields = ['username','email']

class ProfileUpdateForm(forms.ModelForm):
    class Meta:
        model = Profile
        fields = ['image']

''' maybe later for subscribers
class SubscriberForm(forms.Form):
    email = forms.EmailField(label='Your email',
                             max_length=100,
                             widget=forms.EmailInput(attrs={'class': 'form-control'}))
'''
                