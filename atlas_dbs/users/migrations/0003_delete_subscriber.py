# Generated by Django 3.1.2 on 2020-10-16 09:37

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0002_subscriber'),
    ]

    operations = [
        migrations.DeleteModel(
            name='Subscriber',
        ),
    ]