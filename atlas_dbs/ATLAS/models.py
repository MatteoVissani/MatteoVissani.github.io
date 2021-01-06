from django.db import models
from datetime import datetime
from PIL import Image # Pillow library to manage images smoothly (maybe not the best but it works!)
from django.urls import reverse
from django.utils.translation import ugettext_lazy as _
from django.contrib.auth.models import User

# Create your models here.


'''
There is a big difference between the null and blank options.
The null option is strictly at the database level.
The blank option is used by the validation engine on the Django
admin site. This means that if you want to allow null values
to be stored in the database and accessed in your code, you will
 need to set both the null and blank options to True.
'''

def user_directory_path(instance, filename):
    # file will be uploaded to MEDIA_ROOT/atlas_<id>/<filename>
    return "atlases/%s/%s" %(instance.feed, filename)

def user_directory_path_req(instance, filename):
    # file will be uploaded to MEDIA_ROOT/atlas_<id>/<filename>
    return "requests/%s/%s" %(instance.name_atlas, filename)


class ATLAS_paper(models.Model):
    name_author = models.CharField(max_length=50, blank=False,
                            help_text='Name of the author', verbose_name = 'Name Author')
    surname_author = models.CharField(
        max_length=50, blank=False, help_text='Surname of the author', verbose_name = 'Surname Author')
    long_ref = models.TextField(
        max_length=250, blank=False, help_text='Full Reference', verbose_name = 'Long Reference')
    short_ref = models.CharField(
        max_length=100, blank=False, help_text='Short Reference: Surname et al', verbose_name = 'Short Reference')
    url_paper = models.URLField(
        max_length=500, null=True, help_text='URL paper', verbose_name = 'URL paper')
    date = models.DateField(blank=True, help_text='Date of creation: YYYY-MM-DD')

    class Meta:
        verbose_name = _('List of Author')
        verbose_name_plural = _('List of Authors')
    def __str__(self):
            return self.short_ref + ', ' + self.date.strftime('%Y')

class ATLAS_rep(models.Model):
    author = models.ForeignKey(ATLAS_paper, on_delete=models.CASCADE)
    name_atlas = models.CharField(max_length=40, blank=False,
                            default='atlas', help_text='Name of the ATLAS', verbose_name = 'Name ATLAS')
    description = models.TextField(
        max_length=500, blank=True, default='This is an atlas.', help_text='Write a brief description of the ATLAS')
    url_download = models.URLField(
        max_length=500, null=True, help_text='URL download')
    version = models.CharField(max_length=50, blank=False,
                            default='atlas', help_text='Version of the ATLAS: v. X.x', verbose_name = 'Version ATLAS')
    class Meta:
        verbose_name = _('List of ATLAS')
        verbose_name_plural = _('List of ATLASes')

    def __str__(self):
        return self.name_atlas + ' ' + self.version +' (' + self.author.short_ref + ')'
'''
    def get_absolute_url(self):
        return reverse('atlas-detail', kwargs={'pk': self.pk})
'''
class ATLAS_feedFile(models.Model):
    feed = models.ForeignKey(ATLAS_rep, on_delete=models.CASCADE, related_name='files')
    file = models.FileField(upload_to=user_directory_path, help_text = 'Load compressed .nii file (Lead-DBS format)')
    class Meta:
        verbose_name = _('List of File')
        verbose_name_plural = _('List of Files')    
    def __str__(self):
        return self.feed.name_atlas + '_file'
    

class ATLAS_properties(models.Model):

    COORDINATES = (

       ('b', 'MNI152 NLIN 2009b'),
       ('a', 'MNI152 NLIN 2009a'),
       ('l', 'MNI152 linear'),
       ('f', 'FSL space'),
       ('o','Other')
    )
    
    REGION = (
       ('c', 'Cortical'),
       ('s', 'Subcortical'),
       ('w', 'Whole Brain'),
       ('n', 'Single Nucleus'),
    )
        

    METHOD = (
       ('mri', 'x-MRI'),
       ('hst', 'Histological'),
       ('mix', 'Mixed'),
       ('oth', 'Other'),
    )

    RESULT = (
       ('b', 'Binary'),
       ('p', 'Probabilistic'),
       ('oth', 'Other'),
    )

    THRESHOLD = (
        ('ri', 'Relative Intensity'),
        ('n', None),
        ('riv', 'Relative Intensity Vector'),
        ('ai','Absolute Intensity'),
        ('aiv','Absolute Intensity Vector'),
        ('p', 'Percentage'),
        ('pv','Percentage Vector')
    )

    LATERALITY = (
       ('lh', 'LeftHemisphere'),
       ('rh', 'Right Hemisphere'),
       ('bh', 'Both Hemispheres'),
       ('mh', 'Mixed'),
       ('ml', 'Midline'),
    )    

    atlas = models.ForeignKey(ATLAS_rep, on_delete=models.CASCADE)
    author = models.ForeignKey(ATLAS_paper, on_delete=models.CASCADE)

    coordinate = models.CharField(
        max_length = 1,
        choices = COORDINATES,
        blank = True,
        default = 'b',
        help_text= 'Template Space',
    )
    region = models.CharField(
        max_length = 1,
        choices = REGION,
        blank = True,
        default = 'c',
        help_text = 'Which part of the brain?',
    )

    method = models.CharField(
        max_length = 3,
        choices = METHOD,
        blank = True,
        default = 'mri',
        help_text = 'Which methodology?',
    )

     
    result = models.CharField(
        max_length = 3,
        choices = RESULT,
        blank = True,
        default = 'b',
        help_text = 'Which output?',
    )

    threshold = models.CharField(
        max_length = 3,
        choices = THRESHOLD,
        blank = True,
        default = 'n',
        help_text = 'If probabilistic, Which threshold?',
    )    


    laterality = models.CharField(
        max_length = 2,
        choices = LATERALITY,
        blank = True,
        default = 'bh',
        help_text = 'Which side?',
       verbose_name = 'Side'    
    )


     # coordinate = models.CharField(max_length = 500, blank = False)


    image = models.ImageField(default='default.jpg', 
                              blank = True, help_text='Logo ATLAS',
                              upload_to='atlases/image') # insert an image field

    class Meta:
        verbose_name = _('List of ATLAS properties')
        verbose_name_plural = _('List of ATLAS properties')   
    
    # method after something is saved
    def save(self,*args, **kwargs): # whenoverride default methods, always include *args, **kwargs
        super().save(*args, **kwargs)
        img = Image.open(self.image.path) # open image current istance
        if img.height > 300 or img.width > 300: # resize image for better visualization
           output_size = (300,300)
           img.thumbnail(output_size) # resize
           img.save(self.image.path) # save again

    
    def __str__(self):
        """String for representing the Model object."""
        return f'({self.atlas.name_atlas} properties)'


class RequestATLAS_user(models.Model):
    requester = models.ForeignKey(User,null=True, max_length=50, on_delete = models.CASCADE)
    name_author = models.CharField(max_length=50, blank=False,
                            help_text='Name of the author', verbose_name = 'Name Author')
    surname_author = models.CharField(
        max_length=50, blank=False, help_text='Surname of the author', verbose_name = 'Surname Author')
    long_ref = models.TextField(
        max_length=250, blank=False, help_text='Full Reference', verbose_name = 'Long Reference')
    short_ref = models.CharField(
        max_length=100, blank=False, help_text='Short Reference: Surname et al', verbose_name = 'Short Reference')
    url_paper = models.URLField(
        max_length=500, null=True, help_text='URL paper', verbose_name = 'URL paper')
    date = models.DateField(blank=True, help_text='Date of creation: YYYY-MM-DD')    
    name_atlas = models.CharField(max_length=40, blank=False,
                            default='atlas', help_text='Name of the ATLAS', verbose_name = 'Name ATLAS')
    description = models.TextField(
        max_length=500, blank=True, default='This is an atlas.', help_text='Write a brief description of the ATLAS')
    url_download = models.URLField(
        max_length=500, null=True, help_text='URL download')
    version = models.CharField(max_length=50, blank=False,
                            default='v.1.0', help_text='Version: v. X.x', verbose_name = 'Version ATLAS')
    COORDINATES = (
       ('b', 'MNI152 NLIN 2009b'),
       ('a', 'MNI152 NLIN 2009a'),
       ('l', 'MNI152 linear'),
       ('f', 'FSL space'),
       ('o','Other')
    )
    
    REGION = (
       ('c', 'Cortical'),
       ('s', 'Subcortical'),
       ('w', 'Whole Brain'),
       ('n', 'Single Nucleus'),
    )
        

    METHOD = (
       ('mri', 'x-MRI'),
       ('hst', 'Histological'),
       ('mix', 'Mixed'),
       ('oth', 'Other'),
    )

    RESULT = (
       ('b', 'Binary'),
       ('p', 'Probabilistic'),
       ('oth', 'Other'),
    )

    THRESHOLD = (
        ('ri', 'Relative Intensity'),
        ('n', None),
        ('riv', 'Relative Intensity Vector'),
        ('ai','Absolute Intensity'),
        ('aiv','Absolute Intensity Vector'),
        ('p', 'Percentage'),
        ('pv','Percentage Vector')
    )

    LATERALITY = (
       ('lh', 'LeftHemisphere'),
       ('rh', 'Right Hemisphere'),
       ('bh', 'Both Hemispheres'),
       ('mh', 'Mixed'),
       ('ml', 'Midline'),
    )    


    coordinate = models.CharField(
        max_length = 1,
        choices = COORDINATES,
        blank = True,
        default = 'b',
        help_text= 'Template Space',
    )
    region = models.CharField(
        max_length = 1,
        choices = REGION,
        blank = True,
        default = 'c',
        help_text = 'Which part of the brain?',
    )

    method = models.CharField(
        max_length = 3,
        choices = METHOD,
        blank = True,
        default = 'mri',
        help_text = 'Which methodology?',
    )

     
    result = models.CharField(
        max_length = 3,
        choices = RESULT,
        blank = True,
        default = 'b',
        help_text = 'Which output?',
    )

    threshold = models.CharField(
        max_length = 3,
        choices = THRESHOLD,
        blank = True,
        default = 'n',
        help_text = 'If probabilistic, Which threshold?',
    )    


    laterality = models.CharField(
        max_length = 2,
        choices = LATERALITY,
        blank = True,
        default = 'bh',
        help_text = 'Which side?',
        verbose_name = 'Side'
    )

    image = models.ImageField(default='default.jpg', 
                              blank = True, help_text='Logo ATLAS',
                              upload_to='requests/image') # insert an image field
    
    file = models.FileField(upload_to=user_directory_path_req, help_text = 'Load compressed .nii file (Lead-DBS format)')

    class Meta:
        verbose_name = _('ATLAS Request')
        verbose_name_plural = _('ATLAS Requests')   


