from django.urls import path
from .views import *
from . import views
from django.conf import settings
from django.conf.urls.static import static
from django.contrib.staticfiles.urls import staticfiles_urlpatterns
# from rest_framework_simplejwt import views as jwt_views


from django.urls import path
# from rest_framework_simplejwt.views import (
#     TokenObtainPairView,
#     TokenRefreshView,
# )


urlpatterns=[
    # path("api/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),  # Login
    # path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),  # Refresh token
    path("",views.home,name="home"),
    path("register/",views.registerpage,name="register"),
    path("login/",views.loginpage,name="login"),
    path("verifier/",views.verifier,name="verifier"),
    path("superuser/",views.superuser,name="superuser"),
    path("annotation/",views.annotaorimages,name="annotation"),
    
    path("annotation/<str:pk>/",views.annotateimage,name="annotateimage"),
    path("annotator/",views.annotator,name="annotator"),
    path('logout/', views.user_logout, name='logout'),
    path('save_keypoints/<int:pk>/', views.savekeypoints, name='savekeypoints'),
    path('superuserimages/',views.superuserimages,name="superuserimages"),
    path('super2/',views.super2,name="super2"),




    path("api/session/", session_status, name="session_status"),
    path("api/csrf/", get_csrf_token, name="csrf_token"),
    # path("api/allusers/",users_info, name="users_info"),

    # path("api/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),  # Login
    # path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"), 
    # path('api/token/',jwt_views.TokenObtainPairView.as_view(), name ='token_obtain_pair'),
    # path('api/token/refresh/',jwt_views.TokenRefreshView.as_view(), name ='token_refresh'),
    # path('api/logout', userlogout2, name='logout2'),
#    path("api/protected-route/", ProtectedView.as_view(), name="protected-route"),

    path("api/",home2,name="home2"),
    path("api/register",registerpage2,name="register2"),
    path("api/login",loginpage2,name="login2"),
    path("api/superuser/",superuser_roles_assign,name="superuser2"),
    path("api/superuserrr2/",superuser,name="annotator2"),
    path("api/annotation/",annotatorimages2,name="annotateimage2"),
    path("api/annotated/",annotatedimages2,name="annotated"),
    path("api/verifier/",verifierimages2,name="verifier2"),
    path("api/annotation/<str:pk>/",annotateimage2,name="annotateimage2"),
    path("api/super/",superuser_images_loading_fromlocal,name="superimagesloading"),
    path("api/verifier2/<str:pk>/",verifier2,name="verifier"),
    path("api/verify/<str:pk>/",verifyimage2,name="verify"),
    path("api/verifiedimage/<str:pk>/",verifiedimages,name="verified"),
    path("api/finalimage/<str:pk>/",finalimagedetails,name="finalimage"),
    path("api/annotators/",annotator_images_assignement,name="annotator_image"),
    path("api/imagesforannotator/",annotator_images,name="image"),
    # path("api/annotation/<str:pk>/",annotatorimages2,name="annotateimage2"),
    path('api/savekeypoints/<int:pk>/', savekeypoints2, name='savekeypoints2'),
    path('api/superuserimages/',superuserimages2,name="superuserimages2"),
    path('api/generate_pdf/<int:pk>/', generate_pdf_view, name='generate_pdf_view'),

    
]


MEDIA_URL = '/media/'
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL,document_root=settings.MEDIA_ROOT)

    urlpatterns +=staticfiles_urlpatterns()


