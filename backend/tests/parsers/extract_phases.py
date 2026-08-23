import pdfplumber
import json

data = []

with pdfplumber.open("guides/1.Proyecto Formativo ADSO - 2480542.pdf") as pdf:
    for i, page in enumerate(pdf.pages):
        words = page.extract_words(keep_blank_chars=True)
        # only care about pages 3 and 4 where the data usually starts
        if i in [2, 3, 4, 5]:
            for w in words:
                data.append({
                    "text": w["text"],
                    "x0": w["x0"],
                    "top": w["top"],
                    "page": i + 1
                })

with open("pdf-words.json", "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
print("Done")
