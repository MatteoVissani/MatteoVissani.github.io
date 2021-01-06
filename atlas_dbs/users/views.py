from django.shortcuts import render, redirect
from django.contrib.auth.forms import UserCreationForm
from django.contrib import messages
from .forms import UserRegisterForm, UserUpdateForm, ProfileUpdateForm
from django.contrib.auth.decorators import login_required

''' maybe later for subscribers

from django.http import HttpResponse
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from .models import Subscriber
from .forms import SubscriberForm
import random
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
'''
# Create your views here.
def register(request):
    if request.method == 'POST':
        form = UserRegisterForm(request.POST)
        if form.is_valid():
            form.save()
            #username = form.cleaned_data.get('username')
            messages.success(request,f'Your account has been created. You are now able to log in.')
            return redirect('login')
    else:
         form = UserRegisterForm()
    return render(request,'users/register.html',{'form': form})

# Populate fields with current values, check if it's a POST route and if it's VALID--> SAVE
@login_required
def profile(request):
    if request.method == 'POST': 
       u_form = UserUpdateForm(request.POST, instance = request.user)
       p_form = ProfileUpdateForm(request.POST, request.FILES, instance = request.user.profile)
       if u_form.is_valid() and p_form.is_valid(): #save only if both are valid
           u_form.save() 
           p_form.save()
           messages.success(request,f'Your account has been update successfully.')
           return redirect('profile')

    else:
       u_form = UserUpdateForm(instance = request.user)
       p_form = ProfileUpdateForm(instance = request.user.profile)
    
    context = {
        'u_form': u_form,
        'p_form': p_form
    }
    return render(request,'users/profile.html', context)


''' maybe later for subscribers

# Helper Functions
def random_digits():
    return "%0.12d" % random.randint(0, 999999999999)

@csrf_exempt
def new(request):
    if request.method == 'POST':
        sub = Subscriber(email=request.POST['email'], conf_num=random_digits())
        sub.save()
        message = Mail(
            from_email=settings.FROM_EMAIL,
            to_emails=sub.email,
            subject='Newsletter Confirmation',
            html_content='Thank you for signing up for my email newsletter! \
                Please complete the process by \
                <a href="{}/confirm/?email={}&conf_num={}"> clicking here to \
                confirm your registration</a>.'.format(request.build_absolute_uri('/confirm/'),
                                                    sub.email,
                                                    sub.conf_num))
        sg = SendGridAPIClient(settings.SENDGRID_API_KEY)
        response = sg.send(message)
        return render(request, 'index.html', {'email': sub.email, 'action': 'added', 'form': SubscriberForm()})
    else:
        return render(request, 'index.html', {'form': SubscriberForm()})
'''

