from django.shortcuts import render,HttpResponse,redirect,get_object_or_404
from .forms import registerform
from django.contrib.auth import authenticate,login,logout
from .models import images,User,Annotator,Verifier,verifierdetails
from django.contrib import messages
from .decorators import role_required
from django.contrib.auth.decorators import login_required
from .imagetoannotate import start
import json
from django.http import JsonResponse
from .serialisers import ImageSerializer,RegisterSerializer,AnnotatorSerializer,VerifierSerializer
from rest_framework.response import Response
from rest_framework.decorators import api_view,permission_classes
from rest_framework import status
from rest_framework.permissions import AllowAny,IsAuthenticated
import traceback
from .permissions import *
# from rest_framework_simplejwt.tokens import RefreshToken
import  os
import os
from django.conf import settings
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
import traceback
from .models import images
import json
from django.contrib.auth import authenticate, login, logout
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.views.decorators.csrf import csrf_exempt
import json
from datetime import datetime
import random
from .pdf import generate_pdf
from django.http import FileResponse
# from .pdf import generate_pdf

@login_required(login_url="login")
def home(request):
    photos=images.objects.all()


    return render(request,'home.html',{'photos':photos})

@api_view(['GET'])
def home2(request):
    photos=images.objects.all()
    imageserialiser=ImageSerializer(photos,many=True)

    return Response(imageserialiser.data)

def registerpage(request):
    if request.method =="POST":
        form=registerform(request.POST)

        if form.is_valid():
            form.save()
            return HttpResponse("Saved")

    
    else:
        form = registerform()

    return render(request,"register.html",{'form':form})       

@api_view(['POST'])
@permission_classes([AllowAny])
def registerpage2(request):
    serialiser=RegisterSerializer(data=request.data)

    if serialiser.is_valid(): 
        serialiser.save()
        return Response({"message":"User registered successfully"},status=status.HTTP_201_CREATED)
    return Response(serialiser.errors, status=status.HTTP_400_BAD_REQUEST)


def loginpage(request):
    # if request.user.is_authenticated:
    #     return redirect('home')
    
    if request.method=="POST":
        username=request.POST.get('username')
        password=request.POST.get('password')

        
        user=authenticate(request,username=username,password=password)

        if user is not None:
            login(request,user)
            return redirect('home')
        else:
            messages.error(request, "Invalid username oimageassignsuperr password.")
            return redirect('login')
        
       
    return render(request,'login.html')           


# from rest_framework.decorators import api_view, permission_classes
# from rest_framework.permissions import AllowAny
# from rest_framework.response import Response
# from rest_framework import status
# from django.contrib.auth import authenticate, login
# from rest_framework_simplejwt.tokens import RefreshToken
# from django.shortcuts import get_object_or_404
# from .models import User  # Import your User model

from django.contrib.auth import authenticate, login, logout
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
import json

@csrf_exempt
@api_view(["POST"])
def loginpage2(request):
    """Login user and start session authentication."""
    if request.method == "POST":
        username = request.data.get("username") 
        password = request.data.get("password")

        user = authenticate(request, username=username, password=password)
        if user:
            login(request, user)
            request.session["user_id"] = user.id  

            
            # Ensure session key is generated
            if not request.session.session_key:
                request.session.save()

            return Response({
                "username": user.username,
                "email": user.email,
                "role": getattr(user, "role", "User"),  
                "message": "User successfully logged in",
                "session_id": request.session.session_key  
            }, status=status.HTTP_200_OK)
        
        return Response({"error": "Invalid credentials"}, status=status.HTTP_400_BAD_REQUEST)

    return Response({"error": "Invalid request method"}, status=status.HTTP_405_METHOD_NOT_ALLOWED)


@api_view(["GET"])
def session_status(request):
    """Check if the user is authenticated."""
    if request.user.is_authenticated:
        return Response({"isAuthenticated": True, "user": request.user.username})
    return Response({"isAuthenticated": False})

@api_view(["GET"])
def get_csrf_token(request):
    """Get CSRF token for frontend."""
    return Response({"csrfToken": get_token(request)})

@api_view(["POST"])
def logout_view(request):
    """Logout user and destroy session."""
    logout(request)
    return Response({"message": "Logged out successfully"}, status=status.HTTP_200_OK)





@login_required(login_url='login')
@role_required("verifier","superuser")
def verifier(request):
    return render (request,"verifier.html")


@login_required(login_url='login')
@role_required("annotator","verifier","superuser")
def annotator(request):
    return render (request,"annotator.html")



@login_required(login_url='login')
@role_required("superuser")
def superuser3(request):
    users=User.objects.all()
    if request.method=="POST":
        if "updateuser" in request.POST:
         user_id=request.POST.get('user_id')
         newrole=request.POST.get('role')

         try:

             user=User.objects.get(id=user_id)
             user.role=newrole
             user.save()
             if user.role=="verifier":
                 createverifierdetails(user)
                 

         except user.DoesNotExist:
             messages.add_message("userdoesnotexist")

        elif "deleteuser" in request.POST:
            user_id=request.POST.get('user_id')

            try:
             user=User.objects.get(id=user_id)
             user.delete()

            except user.DoesNotExist:
             messages.add_message("userdoesnotexist")
    
    return render(request,"superuser.html",{'users':users})



from django.views.decorators.http import require_http_methods

from app1.models import User  # Adjust if you're using a custom user model




@api_view(["GET", "POST"])
def superuser(request):
    if request.method == "GET":
        users = User.objects.all().values("id", "username", "email", "role")  # Customize fields as needed
        print (users)  # Customize fields
        return Response({"users": list(users)}, status=status.HTTP_200_OK)

    elif request.method == "POST":
        action = request.POST.get("action")
        user_id = request.POST.get("user_id")

        if not user_id:
            return JsonResponse({"error": "Missing user_id"}, status=400)

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return JsonResponse({"error": "User does not exist"}, status=404)

        if action == "update":
            new_role = request.POST.get("role")
            if not new_role:
                return JsonResponse({"error": "Missing role"}, status=400)
            user.role = new_role
            user.save()

            # Optional: call extra logic if needed
            if user.role == "verifier":
                createverifierdetails(user)

            return JsonResponse({"message": "User role updated", "user": {
                "id": user.id,
                "username": user.username,
                "role": user.role
            }}, status=200)

        elif action == "delete":
            user.delete()
            return JsonResponse({"message": "User deleted successfully"}, status=200)

        else:
            return JsonResponse({"error": "Invalid action"}, status=400)



@api_view(['POST'])
@permission_classes([IsAuthenticated])
def superuser_roles_assign(request):
    if not request.user.is_superuser:
        return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)

    user_id = request.data.get("user_id")
    action = request.data.get("action")  # "update" or "delete"
    new_role = request.data.get("role", None)

    try:
        user = User.objects.get(id=user_id)
        
        if action == "update" and new_role:
            user.role = new_role
            user.save()
            if user.role=="verifier":
                 createverifierdetails(user)
            return Response({"message": "User role updated successfully"})
        
        elif action == "delete":
            user.delete()
            return Response({"message": "User deleted successfully"})

        else:
            return Response({"error": "Invalid action"}, status=status.HTTP_400_BAD_REQUEST)

    except User.DoesNotExist:
        return Response({"error": "User does not exist"}, status=status.HTTP_404_NOT_FOUND)
    


def user_logout(request):
    logout(request)
    return redirect('login')

# @api_view(['POST'])
# @permission_classes([IsAuthenticated])
# def userlogout2(request):
#     try:
#         refreshtoken=request.data["refresh_token"]
#         # token=RefreshToken(refreshtoken)
#         token.blacklist()
#         return Response(status=status.HTTP_205_RESET_CONTENT)
#     except Exception as e:               
#         return Response(status=status.HTTP_400_BAD_REQUEST)

def annotaorimages(request):
    context=Annotator.objects.filter(user=request.user)

    return render(request,"imagesannotate.html",{"context":context})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def annotatorimages2(request):
    print("User:", request.user)  
    images = Annotator.objects.filter(annotator=request.user,image__imagestatus="pending")
    print(images)
  
    serializer = AnnotatorSerializer(images, many=True,context={'request':request})
    print(serializer.data)
    return Response(serializer.data)


@role_required("superuser")
def superuserimages(request):
    context = images.objects.filter(imagestatus="default")

    if request.method == "POST":
        photos = request.POST.getlist("selectimages")
        user_id = request.POST.get("user_id")
    try:
        user = User.objects.get(id=user_id)
        images_list = images.objects.filter(id__in=photos)
        images_list.update(imagestatus="pending")
        image=images.objects.filter(imagestatus="pending") 
        # Fetch all images at once

        if not images_list.exists():
            return Response({"error": "One or more images do not exist"}, status=status.HTTP_404_NOT_FOUND)
        
        count=Annotator.objects.filter(annotator=user).count()
        annotators = [
            Annotator(annotator=user, image=image,image_name=f"{user.username}_{count}.jpg",annotations=image.annotations,bounding_box=image.bounding_box ) for image in images_list
        ]

        Annotator.objects.bulk_create(annotators)  

        messages.success(request, "Images successfully assigned!")

    except User.DoesNotExist:
            messages.error(request, "User does not exist")
 
    except images.DoesNotExist:
            messages.error(request, "Image does not exist")

    except Exception as e:
            messages.error(request, f"Failed: {str(e)}")  

    context2 = Annotator.objects.all()
    context3 = User.objects.filter(role="annotator")

    allcontext = {
        "context": context,
        "context2": context2,
        "context3": context3
    }
    
    return render(request, "imageassignsuper.html", {"allcontext": allcontext})


from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

# or your custom User model
# from .serialisers import UserSerializer

# @api_view(['GET', 'POST', 'DELETE'])
# def users_info(request):
#     if request.method == 'GET':
#         users = User.objects.all()
#         serializer = UserSerializer(users, many=True)
#         return Response(serializer.data)

#     elif request.method == 'POST':
#         user_id = request.data.get('id')
#         user = User.objects.get(id=user_id)
#         serializer = UserSerializer(user, data=request.data, partial=True)
#         if serializer.is_valid():
#             serializer.save()
#             return Response({'message': 'User updated successfully'}, status=status.HTTP_200_OK)
#         return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

#     elif request.method == 'DELETE':
#         user_id = request.data.get('id')
#         try:
#             user = User.objects.get(id=user_id)
#             user.delete()
#             return Response({'message': 'User deleted successfully'}, status=status.HTTP_200_OK)
#         except User.DoesNotExist:
#             return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
# @permission_classes([IsAuthenticated])
def annotator_images_assignement(request): #for annotator imsge assignment
    users = User.objects.filter(role="annotator")
    
    # You cannot directly return Django model instances.
    # You need to serialize them first or return specific fields.
    user_data = [{"id": user.id, "username": user.username} for user in users]

    return Response({"users": user_data})

@api_view(['GET'])
# @permission_classes([IsAuthenticated])
def annotator_images(request): #for annotator imsge assignment
    image=images.objects.filter(imagestatus="default")
    serialised_data = ImageSerializer(image, many=True,context={'request':request})
    # You cannot directly return Django model instances.
  

    return Response({"images_data": serialised_data.data})


@api_view(['POST'])
# @permission_classes([IsAuthenticated])
def superuserimages2(request): #for annotator imsge assignment
    if not request.user.is_superuser:
        return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)

    image_ids = request.data.get("image_ids")  # Frontend name
    user_id = request.data.get("user_id")  # Frontend name

    try:
        user = User.objects.get(id=user_id)
        imagess= images.objects.filter(id__in=image_ids)

        Annotatorset=[
            Annotator(
                annotator=user,
                image=image,
                annotations=[],  # Default empty list
               bounding_box=[],  # Default empty list
               submit=False
            )
            for image in imagess
        ]
        Annotator.objects.bulk_create(Annotatorset)

        return Response({"message": "Images successfully assigned!"}, status=status.HTTP_201_CREATED)

    except User.DoesNotExist:
        return Response({"error": "User does not exist"}, status=status.HTTP_404_NOT_FOUND)
    except images.DoesNotExist:
        return Response({"error": "Image does not exist"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        messages.add_message(request, messages.ERROR, "Failed")  # Corrected usage
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)




@api_view(['GET'])
@permission_classes([IsAuthenticated])
def annotateimage2(request, pk):
    annotate_image = get_object_or_404(Annotator, id=pk)

    # Ensure the related image exists
    image_instance = annotate_image.image
    image_url = image_instance.image.url if image_instance and image_instance.image else None

    return Response({
        "id": annotate_image.id,
        "image": request.build_absolute_uri(image_url) if image_url else None,  # Convert to full URL
        "annotations": annotate_image.annotations or [],
        "bounding_box": annotate_image.bounding_box or [],
        "original_height": float(image_instance.originalheight) if image_instance and image_instance.originalheight else None,
        "original_width": float(image_instance.originalwidth) if image_instance and image_instance.originalwidth else None,
    })

def annotateimage(request, pk):
    Annotateimage = get_object_or_404(Annotator, id=pk)

 
    if  Annotateimage.annotations is None:
      keypoints, bbox, imageheight, imagewidth = start(Annotateimage.imagestobeannotated)

      if keypoints and bbox:
        
        keypoints_serializable = [[float(x), float(y)] for x, y in keypoints]
        bbox_serializable = [float(x) for x in bbox]

        
        Annotateimage.annotations = keypoints_serializable
        Annotateimage.bounding_box = bbox_serializable
        Annotateimage.originalheight = imageheight
        Annotateimage.originalwidth = imagewidth
        Annotateimage.save()

    return render(request, "annotateimage.html", {"Annotate": Annotateimage})


from django.views.decorators.csrf import csrf_exempt


@csrf_exempt  # Optional if you are using csrf_token in JS; 
def savekeypoints(request, pk):
    if request.method == 'POST':
        try:
            data = json.loads(request.body) 
            keypoints = data.get('keypoints')

            if keypoints is None:
                return JsonResponse({'error': 'Keypoints not provided'}, status=400)

            annotator = get_object_or_404(Annotator, pk=pk)

            annotator.annotations = keypoints
            annotator.save()

            return JsonResponse({'message': 'Keypoints updated successfully'})
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

    return JsonResponse({'error': 'Invalid request method'}, status=405)
 

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def savekeypoints2(request, pk):
    try:
        data = request.data
        keypoints = data.get('keypoints')

        if keypoints is None:
            return Response({'error': 'Keypoints not provided'}, status=status.HTTP_400_BAD_REQUEST)

        annotator = get_object_or_404(Annotator, pk=pk)
        annotator.annotations = keypoints
        annotator.save()

        return Response({'message': 'Keypoints updated successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verifier2(request, pk):
    try:
        data = request.data
        annotatorverifier = get_object_or_404(Annotator, pk=pk)
        verifiersdetails=verifierdetails.objects.all()

        print(annotatorverifier)
        annotatorverifier.image.imagestatus ="annotated"
        annotatorverifier.image.save()
        print(annotatorverifier.image.imagestatus)

        print(f"Updated image status: {annotatorverifier.image.imagestatus}")
        print("helloo")

        keypoints = data.get('keypoints')
        if keypoints is None:
            return Response({'error': 'Keypoints data is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        if verifiersdetails is None:
            return Response ({'message':'Verifiers are not present'},status=status.HTTP_404_NOT_FOUND)

        verifier = Verifier.objects.create(
            annotation=annotatorverifier,
            annotations=annotatorverifier.annotations,
            complete_verifier=verifierdetail(verifiersdetails),
            comments=data.get('comments', ''), 
             
        )

        return Response({'message': 'Verifier model updated successfully'}, status=status.HTTP_201_CREATED)

    except Exception as e:
        print("Error occurred:", traceback.format_exc()) 
        return Response({'error': sVeriftr(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def createverifierdetails(user):
    verifierdetails.objects.create(user_verifier=user)


def verifierdetail(verifiers):
    while True:
        verifierr=random.choice(verifiers)

        if verifierr.count<5:
            verifierr.count=+1
            verifierr.save()
            return verifierr



@api_view(['GET'])
@permission_classes([IsAuthenticated])
def verifierimages2(request):
    print("User:", request.user)  
    images = Verifier.objects.filter(complete_verifier__user_verifier=request.user,annotation__image__imagestatus="annotated")

    print(images)
    serializer = VerifierSerializer(images, many=True,context={"request":request})
    print(serializer.data)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def verifiedimages(request,pk):
    print("User:", request.user)  
    
    images = Verifier.objects.filter(pk=pk)


    print(images)
    serializer = VerifierSerializer(images, many=True,context={"request":request})
    print(serializer.data)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def finalimagedetails2(request, pk):
    try:
    
        data = request.data
        image = get_object_or_404(Verifier, pk=pk)
        
        print("Original status2:", image.status2)
        print("Type of status2:", type(image.status2))
  
        if image.status2 is None or not isinstance(image.status2, dict):
            image.status2 = {"tasks": []}
        

        if "tasks" not in image.status2 or not isinstance(image.status2["tasks"], list):
            image.status2["tasks"] = []
        
        print("After initialization status2:", image.status2)
        

        if data.get("flagged") == False:
            new_task = {request.user.username: "Rejected"}
            action = "rejected"
        else:
            new_task = {request.user.username: "Verified"}
            action = "verified"
        
        print("New task to add:", new_task)
        

        user_exists = False

        for task in image.status2["tasks"]:
            print("Checking task:", task, "type:", type(task))
            if isinstance(task, dict) and request.user.username in task:
                user_exists = True
                print("User found in tasks")
                break
    
        if not user_exists:
            image.status2["tasks"].append(new_task)
            update_msg = "Added new verification status"
            print("Added new task")
        else:
            update_msg = "User already has verification status"
            print("User already exists, not adding")
        
        print("Final status2:", image.status2)
        
        new_comment = data.get("comments", "")
        if new_comment:
            if image.comments:
               
                timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                image.comments += f"\n\n--- {request.user.username} ({timestamp}) ---\n{new_comment}"
            else:
                
                timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                image.comments = f"--- {request.user.username} ({timestamp}) ---\n{new_comment}"

        if(verifiedimagestatus(image)):
            image.annotation.image.imagestatus="flagged"
        else:
            image.annotation.image.imagestatus="verified"
        image.annotation.image.save()
        image.save()
        print("Model saved successfully")
        
        return Response({
            "status": "success",
            "message": f"Successfully {action} the image",
            "details": {
                "image_id": pk,
                "verified_by": request.user.username,
                "verification_status": action,
                "tasks_updated": not user_exists,
                "update_message": update_msg,
                "current_tasks": image.status2["tasks"],
                "comments": image.comments
            }
        }, status=status.HTTP_200_OK)
    except Exception as e:
        import traceback
        print("Exception occurred:", str(e))
        print(traceback.format_exc())
        return Response({
            'status': 'error',
            'message': str(e),   # status=HStoreField()
    # status3=HStoreField(null=True,blank=True,default=dict)
            'details': {
                'image_id': pk if 'pk' in locals() else None,
                'error_type': type(e).__name__,
                'trace': traceback.format_exc() if settings.DEBUG else None
            }
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def verifiedimagestatus(image):
    for task in image.status2["tasks"]:
        print("Checking task:", task, "type:", type(task))
        if isinstance(task, dict):
            for _, value in task.items():
                if value == "rejected":
                    return True
    return False

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def finalimagedetails(request, pk):

    try:
    
        data = request.data
        image = get_object_or_404(Verifier, pk=pk)
        
        print("Original status2:", image.status)
        print("Type of status2:", type(image.status))
  
    
        

        
        print("After initialization status2:", image.status)
        

        if data.get("flagged") == True:
            image.status=False
            image.save()

        
        new_comment = data.get("comments", "")
        if new_comment:
            if image.comments:
               
                timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                image.comments += f"\n\n--- {request.user.username} ({timestamp}) ---\n{new_comment}"
            else:
                
                timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                image.comments = f"--- {request.user.username} ({timestamp}) ---\n{new_comment}"


        if(image.status==False):
            image.annotation.image.imagestatus="flagged"
        else:
            image.annotation.image.imagestatus="verified"
        image.annotation.image.save()        
                
        image.save()
        print("Model saved successfully")
        
        return Response({
            "status": "success",
            "message": f"Successfully {image.status} the image",
            "details": {
                "image_id": pk,
                "verified_by": request.user.username,
                "verification_status": image.status,
                "comments": image.comments
            }
        }, status=status.HTTP_200_OK)
    except Exception as e:
        import traceback
        print("Exception occurred:", str(e))
        print(traceback.format_exc())
        return Response({
            'status': 'error',
            'message': str(e),   # status=HStoreField()
    # status3=HStoreField(null=True,blank=True,default=dict)
            'details': {
                'image_id': pk if 'pk' in locals() else None,
                'error_type': type(e).__name__,
                'trace': traceback.format_exc() if settings.DEBUG else None
            }
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        

                     




@api_view(['GET'])
@permission_classes([IsAuthenticated])
def verifyimage2(request, pk):
    
        verifyimage = get_object_or_404(Verifier, id=pk,annotation__image__imagestatus="Annotated")



        return Response({
            "id": verifyimage.id,
            "image": verifyimage.imagestobeannotated.url if verifyimage.imagestobeannotated else None,
            "annotations": verifyimage.annotations,
            "bounding_box": verifyimage.bounding_box,
            "original_height": verifyimage.originalheight,
            "original_width": verifyimage.originalwidth,
        })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def annotatedimages2(request):
    print("User:", request.user)  
    images = Annotator.objects.filter(annotator=request.user)
  
    serializer = AnnotatorSerializer(images, many=True)
    return Response(serializer.data)


@login_required
def super2(request):
    return render(request,'super.html')

@csrf_exempt
@api_view(['POST'])
def superuser_images_loading_fromlocal(request):
    try:
        uploaded_images = request.FILES.getlist('images')  
        image_data_list = []
        print(uploaded_images)

        for img in uploaded_images:
        
            file_path = os.path.join(settings.MEDIA_ROOT, img.name)
            print("done1")

            
            os.makedirs(os.path.dirname(file_path), exist_ok=True)

            with open(file_path, 'wb+') as destination:
                for chunk in img.chunks():
                    destination.write(chunk)

            keypoints, bbox, image_height, image_width = start(file_path) 
            print(keypoints)

            keypoints_serializable = [[float(x), float(y)] for x, y in keypoints]
            bbox_serializable = [float(x) for x in bbox]
            keypoints_serializable2 = [point + [1] for point in keypoints_serializable]

            image_instance = images.objects.create(
                image=img,  
                annotations=keypoints_serializable2,
                bounding_box=bbox_serializable,
                originalheight=image_height,
                originalwidth=image_width,

            )
            print("done1")
            # image_data_list.append({
            #     "id": image_instance.id,
            #     "image_url": image_instance.imagestobeannotated.url,
            #     "annotations": keypoints_serializable,
            #     "bounding_box": bbox_serializable,
            #     "originalheight": image_height,
            #     "originalwidth": image_width
            # })

            print("uploaded suceesfully")

        return Response({"success": True, "uploaded_images": image_data_list}, status=status.HTTP_201_CREATED)
    
    except Exception as e:
        print("Error occurred:", traceback.format_exc()) 
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def generate_pdf_view(request,pk):
    try:
        imagedetails = get_object_or_404(Verifier, pk=pk)
        print("image deatisl",imagedetails)
        pdf_path = generate_pdf(imagedetails)

        return FileResponse(open(pdf_path, 'rb'), content_type='application/pdf')
    except Exception as e:
        print(str(e))
        return Response({"message": "Could not generate the requested file"}, status=status.HTTP_404_NOT_FOUND)

