# Generated by Django 3.1.2 on 2020-10-25 19:58

import ATLAS.models
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('ATLAS', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='RequestATLAS_user',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name_author', models.CharField(help_text='Name of the author', max_length=50, verbose_name='Name Author')),
                ('surname_author', models.CharField(help_text='Surname of the author', max_length=50, verbose_name='Surname Author')),
                ('long_ref', models.TextField(help_text='Full Reference', max_length=250, verbose_name='Long Reference')),
                ('short_ref', models.CharField(help_text='Short Reference: Surname et al', max_length=100, verbose_name='Short Reference')),
                ('url_paper', models.URLField(help_text='URL paper', max_length=500, null=True, verbose_name='URL paper')),
                ('date', models.DateField(blank=True, help_text='Date of creation: YYYY-MM-DD')),
                ('name_atlas', models.CharField(default='atlas', help_text='Name of the ATLAS', max_length=40, verbose_name='Name ATLAS')),
                ('description', models.TextField(blank=True, default='This is an atlas.', help_text='Write a brief description of the ATLAS', max_length=500)),
                ('url_download', models.URLField(help_text='URL download', max_length=500, null=True)),
                ('version', models.CharField(default='atlas', help_text='Version of the ATLAS: v. X.x', max_length=50, verbose_name='Version ATLAS')),
                ('coordinate', models.CharField(blank=True, choices=[('b', 'MNI152 NLIN 2009b'), ('a', 'MNI152 NLIN 2009a'), ('l', 'MNI152 linear'), ('f', 'FSL space'), ('o', 'Other')], default='b', help_text='Template Space', max_length=1)),
                ('region', models.CharField(blank=True, choices=[('c', 'Cortical'), ('s', 'Subcortical'), ('w', 'Whole Brain'), ('n', 'Single Nucleus')], default='c', help_text='Which part of the brain?', max_length=1)),
                ('method', models.CharField(blank=True, choices=[('mri', 'x-MRI'), ('hst', 'Histological'), ('mix', 'Mixed'), ('oth', 'Other')], default='mri', help_text='Which methodology?', max_length=3)),
                ('result', models.CharField(blank=True, choices=[('b', 'Binary'), ('p', 'Probabilistic'), ('oth', 'Other')], default='b', help_text='Which output?', max_length=3)),
                ('threshold', models.CharField(blank=True, choices=[('ri', 'Relative Intensity'), ('n', None), ('riv', 'Relative Intensity Vector'), ('ai', 'Absolute Intensity'), ('aiv', 'Absolute Intensity Vector'), ('p', 'Percentage'), ('pv', 'Percentage Vector')], default='n', help_text='If probabilistic, Which threshold?', max_length=3)),
                ('laterality', models.CharField(blank=True, choices=[('lh', 'LeftHemisphere'), ('rh', 'Right Hemisphere'), ('bh', 'Both Hemispheres'), ('mh', 'Mixed'), ('ml', 'Midline')], default='bh', help_text='Which side?', max_length=2)),
                ('image', models.ImageField(blank=True, default='default.jpg', help_text='Logo ATLAS', upload_to='atlases/image')),
                ('file', models.FileField(help_text='Load compressed .nii file (Lead-DBS format)', upload_to=ATLAS.models.user_directory_path)),
            ],
            options={
                'verbose_name': 'ATLAS Request',
                'verbose_name_plural': 'ATLAS Requests',
            },
        ),
        migrations.AlterModelOptions(
            name='atlas_properties',
            options={'verbose_name': 'List of ATLAS properties', 'verbose_name_plural': 'List of ATLAS properties'},
        ),
    ]