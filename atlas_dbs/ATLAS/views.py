from django.shortcuts import render, redirect,reverse
from django.http import HttpResponse,HttpResponseRedirect
from .models import ATLAS_rep,ATLAS_properties,ATLAS_paper,ATLAS_feedFile
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from django.views.generic import ListView, DetailView, CreateView, UpdateView
from .forms import QueryCoordForm, ATLASAuthorForm, ATLASRepForm, ATLASPropertiesForm,ATLASFileForm,RequestUserForm
from django.contrib import messages
from django.contrib.auth.mixins import LoginRequiredMixin
from extra_views import CreateWithInlinesView,InlineFormSetFactory

# Create your views here.


atlases = [
    {
        'author': 'author1',
        'short_name': 'short name 1',
        'full_name': 'full name 1',
        'date': 'October 27, 2018'
    },
    {
        'author': 'author2',
        'short_name': 'short name 2',
        'full_name': 'full name 2',
        'date': 'August 28, 2018'
    }
]
def home(request):
    return render(request,'ATLAS/home.html')

def rundemo(request):
    
    if request.method == 'POST':
        form = QueryCoordForm(request.POST)
        if form.is_valid():
            #form.save()
            x = form.cleaned_data['x']
            y = form.cleaned_data['y']
            z = form.cleaned_data['z']
            messages.success(request,f'Success!')
            return redirect('atlas-rundemo')
    else:
         form = QueryCoordForm()
    return render(request,'ATLAS/rundemo.html',{'form': form})
    #return render(request, 'ATLAS/rundemo.html')

@login_required
def new_atlas_superuser(request):
    if request.method == 'POST': 
       auth_form = ATLASAuthorForm(request.POST)
       at_form = ATLASRepForm(request.POST)
       atprop_form = ATLASPropertiesForm(request.POST)
       atfile_form = ATLASFileForm(request.POST, request.FILES)
       
       if auth_form.is_valid() and at_form.is_valid() and atprop_form.is_valid() and atfile_form.is_valid(): #save only if both are valid
           name_author = auth_form.save()
           atlas_rep = at_form.save(False)
           atlas_rep.author = name_author
           atlas_rep.save()
           file = atfile_form.save(False)
           file.feed = atlas_rep
           file.save()
           atlas_prop = atprop_form.save(False)
           atlas_prop.atlas = atlas_rep
           atlas_prop.author = name_author
           atlas_prop.save()
           messages.success(request,f'Your ATLAS has been added.')
           return redirect('atlas-home')

    else:
       auth_form = ATLASAuthorForm(instance = request.user)
       at_form = ATLASRepForm(instance = request.user.profile)
       atprop_form = ATLASPropertiesForm(instance = request.user.profile)
       atfile_form = ATLASFileForm(instance = request.user.profile)
    
    '''
    args = {}
    args.update(csrf(request))
    args['auth_form'] = auth_form
    args['at_form'] = at_form
    args['atprop_form'] = atprop_form
    args['atfile_form'] = atfile_form
    '''

    context = {
        'auth_form': auth_form,
        'at_form': at_form,
        'atprop_form': atprop_form,
        'atfile_form': atfile_form,       
    }
    return render(request,'ATLAS/new_atlas.html', context)

@login_required
def new_atlas_user(request):
    if request.method == 'POST': 
       req_form = RequestUserForm(request.POST, request.FILES)
       if req_form.is_valid():
           req_data = req_form.save(False)
           req_data.requester = request.user
           req_data.save()
           messages.success(request,f'Your ATLAS has been submitted to ATLAS Viewer Website.')
           return redirect('atlas-home')
    else:
        req_form = RequestUserForm(instance = request.user)
    context = {
        'req_form': req_form,     
    }
    return render(request,'ATLAS/new_request.html', context)



def list(request):
    context = {
        'ats': ATLAS_rep.objects.all() # try it with db
        # 'ats': atlases # try it without db
    }
    return render(request, 'ATLAS/list.html',context)


'''
@method_decorator(login_required, name='dispatch')

'''


'''
class ATLASFileFeed(InlineFormSetFactory):
    model = ATLAS_feedFile
    fields = ('file',)
    factory_kwargs = {'extra': 1, 'max_num': None,
                      'can_order': False, 'can_delete': False}    
class ATLASauthorFeed(InlineFormSetFactory):
    model = ATLAS_paper
    fields = ('name_author','surname_author','short_ref','date',)
    factory_kwargs = {'extra': 1, 'max_num': None,
                      'can_order': False, 'can_delete': False}

class AtlasPropertyFeed(InlineFormSetFactory):
    model = ATLAS_properties
    fields = ('coordinate','region','laterality','method','result','threshold','image')
    factory_kwargs = {'extra': 1, 'max_num': None,
                      'can_order': False, 'can_delete': False}

class ATLASCreateView(LoginRequiredMixin, CreateWithInlinesView):
    model = ATLAS_rep
    fields = ('name_atlas','description','url_download','version',)
    inlines = [ATLASauthorFeed,AtlasPropertyFeed,ATLASFileFeed]


    def get_success_url(self):
        return self.object.get_absolute_url()

    def forms_valid(self, form, inlines): #yes, f%%ng form(s)_valid, yeh...
        """
        If the form and formsets are valid, save the associated models.
        """
        self.object = form.save(commit=False)
        self.object.author = self.request.user
        form.save(commit=True)
        for formset in inlines:
            formset.save()
        return HttpResponseRedirect(self.get_success_url())


class ATLASListView(ListView): # this is to list the db stored atlases in atlas-resources web page
      model = ATLAS_rep
      template_name = 'ATLAS/resources.html' # check the name of the template
      context_object_name = 'ats' # it has to contain the key of the context dict
      ordering = ['-name'] # criterion to order stuff

class ATLASDetailView(DetailView): # this is to detail the description of each atlas
    model = ATLAS_rep

'''
