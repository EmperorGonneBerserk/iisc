from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import images, User, Annotator, Verifier,verifierdetails



class ImageSerializer(serializers.ModelSerializer):
    image_url=serializers.SerializerMethodField()
    class Meta:
        model = images
        fields = '__all__'

    def get_image_url(self,obj):
        request=self.context.get('request')
        if request and obj.image:
            return request.build_absolute_uri(obj.image.url)  
        return None  



class AnnotatorSerializer(serializers.ModelSerializer):
    image=ImageSerializer()
    class Meta:
        model = Annotator
        fields = ['id', 'image','count','image_name', 'annotations', 'bounding_box', 'submit']


class verifierdetailsserialiser(serializers.ModelSerializer):
    # user_verifier=
    class Meta:
        model=verifierdetails
        fields = ['id', 'user_verifier','count']

class VerifierSerializer(serializers.ModelSerializer):
    annotation=AnnotatorSerializer()
    complete_verifier=verifierdetailsserialiser()
    class Meta:
        model = Verifier  # Corrected model name
        fields = ['id', 'annotation','annotations','complete_verifier', 'comments', 'status']


# User Registration Serializer
class RegisterSerializer(serializers.ModelSerializer):
    password1 = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password1', 'password2']

    def validate(self, data):
        if data['password1'] != data['password2']:
            raise serializers.ValidationError({"password2": "Passwords do not match."})
        return data

    def create(self, validated_data):
        user = User(
            username=validated_data['username'],
            email=validated_data['email']
        )
        user.set_password(validated_data['password1'])  # Hash the password
        user.save()
        return user
    
 # or your custom model

# class UserSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = User
#         fields = ['id', 'name', 'email', 'role']  # Add more if needed

