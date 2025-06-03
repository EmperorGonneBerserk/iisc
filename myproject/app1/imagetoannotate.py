import os
import cv2
from ultralytics import YOLO

def start(image):
    model = YOLO("C:/Users/91776/Downloads/IISC/Annotations-main/weights/best26.pt")
    keypoints, bbox, imageheight, imagewidth = load_image(image, model)
    return keypoints, bbox, imageheight, imagewidth

def load_image(imagetoannotate, model):
    image_path = imagetoannotate
    image = cv2.imread(image_path)
    if image is None:
        raise ValueError(f"Image at {image_path} could not be loaded")

    imageheight, imagewidth, _ = image.shape
    image_resized = cv2.resize(image, (256, 256), interpolation=cv2.INTER_AREA)

    results = model(image_resized)
    result = results[0]

    if result.keypoints is None:
        raise ValueError("No keypoints detected")

    keypoints = result.keypoints.xy[0].tolist()
    bbox = result.boxes.xyxy[0].tolist()

    keypoints = scale_keypoints(keypoints, image_resized, image)
    bbox = scale_bbox(bbox, image_resized, image)

    return keypoints, bbox, imageheight, imagewidth

def scale_keypoints(keypoints, resized_image, original_image):
    height_ratio = original_image.shape[0] / resized_image.shape[0]
    width_ratio = original_image.shape[1] / resized_image.shape[1]

    scaled_keypoints = [[x * width_ratio, y * height_ratio] for x, y in keypoints]
    return scaled_keypoints

def scale_bbox(bbox, resized_image, original_image):
    height_ratio = original_image.shape[0] / resized_image.shape[0]
    width_ratio = original_image.shape[1] / resized_image.shape[1]

    scaled_bbox = [
        bbox[0] * width_ratio, bbox[1] * height_ratio,
        bbox[2] * width_ratio, bbox[3] * height_ratio
    ]
    return scaled_bbox
