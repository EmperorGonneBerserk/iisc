from django.contrib import admin
from .models import User,images,Annotator,Verifier,verifierdetails
from django.contrib.auth.admin import UserAdmin



class CustomUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        (None, {'fields': ('role',)}),
    )


admin.site.register(User,CustomUserAdmin)
admin.site.register(images)
admin.site.register(verifierdetails)
admin.site.register(Annotator)

admin.site.register(Verifier)
# Register your models here.
