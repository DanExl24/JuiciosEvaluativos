import pdfplumber
import json

tables = []

with pdfplumber.open("guides/1.Proyecto Formativo ADSO - 2480542.pdf") as pdf:
    for i, page in enumerate(pdf.pages):
        # We look for tables
        page_tables = page.extract_tables()
        if page_tables:
            for table in page_tables:
                tables.append({
                    "page": i + 1,
                    "table": table
                })

with open("pdf-tables.json", "w", encoding="utf-8") as f:
    json.dump(tables, f, indent=2, ensure_ascii=False)
print(f"Extracted {len(tables)} tables")
