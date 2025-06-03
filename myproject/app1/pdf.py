from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image as RLImage
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch
from PIL import Image as PILImage, ImageDraw, ImageFont
from io import BytesIO
import os
import datetime
import json

# Utility: convert bounding box list to dict
def convert_box_list_to_dict(box_list):
    print(box_list)
    if len(box_list) != 4:
        return None
    x_min, y_min, x_max, y_max = box_list
    return {
        "x": x_min,
        "y": y_min,
        "width": x_max - x_min,
        "height": y_max - y_min
    }

# Utility: draw bounding boxes + annotations
def draw_bounding_boxes_on_image(img_path, bounding_boxes, annotations):
    with PILImage.open(img_path) as img:
        draw = ImageDraw.Draw(img)
        box2 = convert_box_list_to_dict(bounding_boxes)

        x = float(box2.get('x', 0))
        y = float(box2.get('y', 0))
        width = float(box2.get('width', 0))
        height = float(box2.get('height', 0))
        # label = annotation.get('label', 'No Label')

        draw.rectangle([x, y, x + width, y + height], outline="red", width=3)
        point_x = x + width / 2
        point_y = y + height / 2
        radius = 5
        draw.ellipse([point_x - radius, point_y - radius, point_x + radius, point_y + radius], fill="blue", outline="blue")
        # draw.text((point_x + 5, point_y - 10), label, fill="blue", font=font)
        try:
            font = ImageFont.truetype("arial.ttf", 15)
        except IOError:
            font = ImageFont.load_default()
        print("process done 1")
        for box, annotation in zip(bounding_boxes, annotations):
             # convert if list format
            
            print("process done 2")
            


            # x = float(box.get('x', 0))
            # y = float(box.get('y', 0))
            # width = float(box.get('width', 0))
            # height = float(box.get('height', 0))
            points = [(float(p[0]), float(p[1])) for p in annotations]

            radius = 5  # radius for the point to draw
            for (x, y) in points:
                draw.ellipse([x - radius, y - radius, x + radius, y + radius], fill="blue", outline="blue")

            # draw.rectangle([x, y, x + width, y + height], outline="red", width=3)
            # point_x = x + width / 2
            # point_y = y + height / 2
            # radius = 5
            # draw.ellipse([point_x - radius, point_y - radius, point_x + radius, point_y + radius], fill="blue", outline="blue")
            
            print("process done 3")
        buffer = BytesIO()
        img.save(buffer, format="PNG")
        buffer.seek(0)
        return buffer

# Main function to generate PDF
def generate_pdf(imagedetails):
    title = "IISC-Annotation Report"
    image_name = imagedetails.annotation.image_name
    annotator_assigned = imagedetails.annotation.annotator.username
    image_boundingbox = imagedetails.annotation.image.bounding_box
    img_path = imagedetails.annotation.image.image.path
    verifier_annotations = imagedetails.annotations
    verifier_assigned = imagedetails.complete_verifier.user_verifier.username
    image_comments = imagedetails.comments
    image_status = "Verified" if imagedetails.status else "Rejected"
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # Convert JSON strings to Python data if needed
    if isinstance(image_boundingbox, str):
        image_boundingbox = json.loads(image_boundingbox)
    if isinstance(verifier_annotations, str):
        verifier_annotations = json.loads(verifier_annotations)

    # Convert list-style bounding boxes to dicts
    if isinstance(image_boundingbox, list) and image_boundingbox and isinstance(image_boundingbox[0], list):
        image_boundingbox = [convert_box_list_to_dict(b) for b in image_boundingbox]

    output_path = f"{image_name}_report.pdf"
    doc = SimpleDocTemplate(output_path, pagesize=A4)
    styles = getSampleStyleSheet()
    elements = []

    # Add Title & Metadata
    elements.append(Paragraph(title, styles['Title']))
    elements.append(Spacer(1, 12))
    elements += [
        Paragraph(f"<b>Image Name:</b> {image_name}", styles['Normal']),
        Paragraph(f"<b>Annotator:</b> {annotator_assigned}", styles['Normal']),
        Paragraph(f"<b>Verifier:</b> {verifier_assigned}", styles['Normal']),
        Paragraph(f"<b>Status:</b> {image_status}", styles['Normal']),
        Paragraph(f"<b>Timestamp:</b> {timestamp}", styles['Normal']),
        Spacer(1, 12)
    ]

    # Annotated Image
    if os.path.exists(img_path):
        processed_image = draw_bounding_boxes_on_image(img_path, image_boundingbox, verifier_annotations)
        elements.append(Paragraph("Annotated Image:", styles['Heading2']))
        elements.append(RLImage(processed_image, width=5 * inch, height=3 * inch))
        elements.append(Spacer(1, 24))
    else:
        elements.append(Paragraph(f"Image not found: {img_path}", styles['Normal']))
        elements.append(Spacer(1, 12))

    # Comments
    elements.append(Paragraph("Comments:", styles['Heading2']))
    elements.append(Paragraph(image_comments or "No comments available", styles['Normal']))
    elements.append(Spacer(1, 12))

    doc.build(elements)
    print(f"PDF generated at {output_path}")
    return output_path
