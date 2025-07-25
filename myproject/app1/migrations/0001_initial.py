# Generated by Django 5.2.1 on 2025-05-22 10:17

import django.contrib.auth.models
import django.contrib.auth.validators
import django.db.models.deletion
import django.utils.timezone
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('auth', '0012_alter_user_first_name_max_length'),
    ]

    operations = [
        migrations.CreateModel(
            name='images',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('image', models.FileField(default=None, null=True, upload_to='')),
                ('annotations', models.JSONField(blank=True, default=list)),
                ('bounding_box', models.JSONField(blank=True, default=list)),
                ('originalheight', models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True)),
                ('originalwidth', models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True)),
                ('imagestatus', models.CharField(choices=[('default', 'Default'), ('pending', 'Pending'), ('save', 'Save'), ('annotated', 'Annotated'), ('flagged', 'Flagged'), ('verified', 'Verified')], default='default', max_length=25)),
            ],
        ),
        migrations.CreateModel(
            name='User',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('password', models.CharField(max_length=128, verbose_name='password')),
                ('last_login', models.DateTimeField(blank=True, null=True, verbose_name='last login')),
                ('is_superuser', models.BooleanField(default=False, help_text='Designates that this user has all permissions without explicitly assigning them.', verbose_name='superuser status')),
                ('username', models.CharField(error_messages={'unique': 'A user with that username already exists.'}, help_text='Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only.', max_length=150, unique=True, validators=[django.contrib.auth.validators.UnicodeUsernameValidator()], verbose_name='username')),
                ('first_name', models.CharField(blank=True, max_length=150, verbose_name='first name')),
                ('last_name', models.CharField(blank=True, max_length=150, verbose_name='last name')),
                ('is_staff', models.BooleanField(default=False, help_text='Designates whether the user can log into this admin site.', verbose_name='staff status')),
                ('is_active', models.BooleanField(default=True, help_text='Designates whether this user should be treated as active. Unselect this instead of deleting accounts.', verbose_name='active')),
                ('date_joined', models.DateTimeField(default=django.utils.timezone.now, verbose_name='date joined')),
                ('name', models.CharField(max_length=255)),
                ('email', models.EmailField(max_length=254, unique=True)),
                ('phno', models.IntegerField(null=True)),
                ('photo', models.FileField(default=None, null=True, upload_to='')),
                ('role', models.CharField(choices=[('normal', 'Normal'), ('annotator', 'Annotator'), ('verifier', 'Verifier'), ('superuser', 'Superuser')], default='normal', max_length=25)),
                ('groups', models.ManyToManyField(blank=True, help_text='The groups this user belongs to. A user will get all permissions granted to each of their groups.', related_name='user_set', related_query_name='user', to='auth.group', verbose_name='groups')),
                ('user_permissions', models.ManyToManyField(blank=True, help_text='Specific permissions for this user.', related_name='user_set', related_query_name='user', to='auth.permission', verbose_name='user permissions')),
            ],
            options={
                'verbose_name': 'user',
                'verbose_name_plural': 'users',
                'abstract': False,
            },
            managers=[
                ('objects', django.contrib.auth.models.UserManager()),
            ],
        ),
        migrations.CreateModel(
            name='Annotator',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('count', models.IntegerField(default=0)),
                ('image_name', models.CharField(blank=True, max_length=225)),
                ('annotations', models.JSONField(blank=True, default=list)),
                ('bounding_box', models.JSONField(blank=True, default=list)),
                ('submit', models.BooleanField(default=False)),
                ('annotator', models.ForeignKey(blank=True, default=1, limit_choices_to={'role': 'annotator'}, on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
                ('image', models.ForeignKey(blank=True, default=None, on_delete=django.db.models.deletion.CASCADE, related_name='annotatorimage', to='app1.images')),
            ],
        ),
        migrations.CreateModel(
            name='verifierdetails',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('count', models.IntegerField(default=0)),
                ('user_verifier', models.OneToOneField(limit_choices_to={'role': 'verifier'}, on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='Verifier',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('annotations', models.JSONField(blank=True, default=list)),
                ('comments', models.TextField(blank=True)),
                ('status', models.BooleanField(default=True)),
                ('annotation', models.ForeignKey(default=None, on_delete=django.db.models.deletion.CASCADE, related_name='verifications', to='app1.annotator')),
                ('complete_verifier', models.ForeignKey(blank=True, default=1, on_delete=django.db.models.deletion.CASCADE, to='app1.verifierdetails')),
            ],
        ),
    ]
