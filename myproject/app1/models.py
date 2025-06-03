from django.db import models
from django.contrib.auth.models import AbstractUser
from django.contrib.postgres.fields import HStoreField

class User(AbstractUser):
    name=models.CharField(max_length=255,null=False)
    email=models.EmailField(unique=True,null=False)
    phno=models.IntegerField(null=True)
    photo=models.FileField(null=True,default=None)
    role_choices=[
        ('normal','Normal'),
        ('annotator','Annotator'),
        ('verifier','Verifier'),
        ('superuser','Superuser'),

    ]
    role=models.CharField(max_length=25,choices=role_choices,default='normal')

    def __str__(self):
        return f"{self.username} "

   

class images(models.Model):
    image = models.FileField(null=True, default=None)
    annotations = models.JSONField(default=list, blank=True)
    bounding_box = models.JSONField(default=list, blank=True)
    originalheight = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    originalwidth = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    imagestatus=[
        ('default','Default'),
        ('pending','Pending'),
        ('save','Save'),
        ('annotated','Annotated'),
        ('flagged','Flagged'),
        ('verified','Verified'),
        


    ]
    imagestatus=models.CharField(max_length=25,choices=imagestatus,default='default')


    def __str__(self):
        return f"Image {self.id}"




class Annotator(models.Model):
    annotator = models.ForeignKey(User, on_delete=models.CASCADE, limit_choices_to={'role': 'annotator'},default=1,blank=True)
    image = models.ForeignKey(images, on_delete=models.CASCADE, related_name="annotatorimage",blank=True,default=None)
    count=models.IntegerField(default=0)
    image_name=models.CharField(max_length=225,blank=True )
    annotations = models.JSONField(default=list, blank=True)
    bounding_box = models.JSONField(default=list, blank=True)
    submit = models.BooleanField(default=False)

    def __str__(self):
        return f"Annotation {self.id} by {self.annotator.username}"



class verifierdetails(models.Model):
    user_verifier=models.OneToOneField(User,on_delete=models.CASCADE,limit_choices_to={'role': 'verifier'})
    count=models.IntegerField(default=0)


class Verifier(models.Model):

    annotation = models.ForeignKey(Annotator, on_delete=models.CASCADE, related_name="verifications",default=None)
    annotations = models.JSONField(default=list, blank=True)
    complete_verifier = models.ForeignKey(verifierdetails, on_delete=models.CASCADE,default=1,blank=True)
    comments = models.TextField(blank=True)
    # status=HStoreField()
    # status3=HStoreField(null=True,blank=True,default=dict)
    status=models.BooleanField(default=True)
   



# Create your models here.

# Image Model (Centralized)


# Annotator Model
# class Annotation(models.Model):
#     annotator = models.ForeignKey(User, on_delete=models.CASCADE, limit_choices_to={'role': 'annotator'})
#     image = models.ForeignKey(Image, on_delete=models.CASCADE, related_name="annotations")
#     annotations = models.JSONField(default=list, blank=True)
#     bounding_box = models.JSONField(default=list, blank=True)
#     submit = models.BooleanField(default=False)

#     def __str__(self):
#         return f"Annotation {self.id} by {self.annotator.username}"

# Verifier Model
# class Verification(models.Model):
#     verifier = models.ForeignKey(User, on_delete=models.CASCADE, limit_choices_to={'role': 'verifier'})
#     annotation = models.ForeignKey(Annotation, on_delete=models.CASCADE, related_name="verifications")
#     status = models.CharField(max_length=10, choices=[('approved', 'Approved'), ('rejected', 'Rejected')], default='approved')
#     comments = models.TextField(blank=True)

#     def __str__(self):
#         return f"Verification {self.id} - {self.status} by {self.verifier.username}"
 