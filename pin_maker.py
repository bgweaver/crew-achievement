from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.pdfgen import canvas
from reportlab.lib.units import inch
import json
import os

# Load the JSON
with open("./data/plaintext-pins.json") as f:
    data = json.load(f)

# Try to map known color names to actual RGB colors
color_map = {
    "red": colors.red,
    "blue": colors.blue,
    "green": colors.green,
    "yellow": colors.yellow,
    "orange": colors.orange,
    "purple": colors.purple,
    "pink": colors.pink,
    "black": colors.black,
    "gray": colors.gray,
    "teal": colors.teal,
}

# Setup canvas
os.makedirs("./data", exist_ok=True)
c = canvas.Canvas("./data/student_login_cards.pdf", pagesize=letter)
width, height = letter

# Card layout
card_width = 3.5 * inch
card_height = 2 * inch
margin_x = 0.5 * inch
margin_y = 0.5 * inch
cards_per_row = 2
cards_per_col = 5
card_count = 0

x_offset = margin_x
y_offset = height - margin_y - card_height

for username, pin in data.items():
    # Extract color from username
    color_prefix = username.split("-")[0].lower()
    color = color_map.get(color_prefix, colors.lightgrey)

    # Draw card background/outline
    c.setStrokeColor(colors.black)
    c.rect(x_offset, y_offset, card_width, card_height, fill=0)

    # Draw color stripe
    c.setFillColor(color)
    c.rect(x_offset, y_offset + card_height - 0.3 * inch, card_width, 0.3 * inch, fill=1)

    # Draw username
    c.setFillColor(colors.black)
    c.setFont("Helvetica-Bold", 14)
    c.drawString(x_offset + 0.2 * inch, y_offset + card_height - 0.5 * inch, f"Username: {username}")

    # Draw PIN
    c.setFont("Helvetica", 18)
    c.drawString(x_offset + 0.2 * inch, y_offset + card_height / 2 - 0.3 * inch, f"PIN: {pin}")

    # Move to next card position
    card_count += 1
    if card_count % cards_per_row == 0:
        x_offset = margin_x
        y_offset -= card_height + 0.2 * inch
        if card_count % (cards_per_row * cards_per_col) == 0:
            c.showPage()
            x_offset = margin_x
            y_offset = height - margin_y - card_height
    else:
        x_offset += card_width + 0.5 * inch

# Save the PDF
c.save()
print("✅ Cards saved as 'student_login_cards.pdf'")
