from django import forms
from crispy_forms.helper import FormHelper
from crispy_forms.layout import Submit
from django.core.exceptions import ValidationError
from .models import ATLAS_paper,ATLAS_rep,ATLAS_properties,ATLAS_feedFile, RequestATLAS_user


class QueryCoordForm(forms.Form):
    x = forms.DecimalField(
        required=True, min_value=-500, max_value=500, max_digits=4,
        widget=forms.TextInput(attrs={'style':'max-width: 8em'})
        )
    y = forms.DecimalField(
        required=True, min_value=-500, max_value=500, max_digits=4,
        widget=forms.TextInput(attrs={'style':'max-width: 8em'})
        )
    z = forms.DecimalField(
        required=True, min_value=-500, max_value=500, max_digits=4,
        widget=forms.TextInput(attrs={'style':'max-width: 8em'})
        )
    
    # widgets are really useful to modify attributes in form without using css


class ATLASAuthorForm(forms.ModelForm): 
    class Meta:
        model = ATLAS_paper
        fields = ('name_author','surname_author','short_ref','long_ref','date','url_paper')

class ATLASRepForm(forms.ModelForm): 
    class Meta:
        model = ATLAS_rep
        fields =('name_atlas','description','url_download','version',)

class ATLASPropertiesForm(forms.ModelForm): 
    class Meta:
        model = ATLAS_properties
        fields = ('coordinate','region','laterality','method','result','threshold','image')

class ATLASFileForm(forms.ModelForm): 
    class Meta:
        model = ATLAS_feedFile
        fields = ('file',)


class RequestUserForm(forms.ModelForm):
    class Meta:
        model = RequestATLAS_user
        exclude = ('requester',)

'''
    def __init__(self,*args, **kwargs):
        super(UserRegisterForm,self).__init__(*args, **kwargs)
 
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


    def __init__(self, *args, **kwargs):
        super(QueryForm, self).__init__(*args, **kwargs)
        self.helper = FormHelper()
        self.helper.form_group_wrapper_class = 'row'
        self.helper.label_class = 'offset-md-1 col-md-1'
        self.helper.field_class = 'col-md-16'
'''
'''
class AtlasForm(forms.ModelForm):
    class Meta:
        model = Atlas_rep
        fields = ['name',]   

class AuthorForm(forms.ModelForm):
    class Meta:
        model = author_atlas
        fields = ['name',]     

class AtlasPropertyForm(forms.ModelForm):
    class Meta:
        model = Properties_atlas
        fields = ['coordinate',]              
'''
