# -*- coding: utf-8 -*-
import pdfplumber
import json
import re
import sys
import unicodedata
import io

# Force UTF-8 for stdout
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def normalize_text(text):
    if not text:
        return ""
    text = unicodedata.normalize('NFKD', str(text)).encode('ascii', 'ignore').decode("utf-8")
    return text.upper().strip()

def clean_spacing(text):
    if not text:
        return ""
    return re.sub(r'\s+', ' ', str(text)).strip()

def extract_project_data(pdf_path):
    project_metadata = {
        "projectCode": "",
        "projectName": "",
        "executionTime": "",
        "regional": "",
        "center": "",
        "programCode": ""
    }

    phases_dict = {
        "ANALISIS": {
            "name": "ANALISIS",
            "activity": "",
            "activities": [],
            "rawText": "",
            "competencyCodes": set(),
            "resultCodes": set(),
            "items": []
        },
        "PLANEACION": {
            "name": "PLANEACION",
            "activity": "",
            "activities": [],
            "rawText": "",
            "competencyCodes": set(),
            "resultCodes": set(),
            "items": []
        },
        "EJECUCION": {
            "name": "EJECUCION",
            "activity": "",
            "activities": [],
            "rawText": "",
            "competencyCodes": set(),
            "resultCodes": set(),
            "items": []
        },
        "EVALUACION": {
            "name": "EVALUACION",
            "activity": "",
            "activities": [],
            "rawText": "",
            "competencyCodes": set(),
            "resultCodes": set(),
            "items": []
        }
    }

    current_phase_key = None
    current_activity = ""
    current_record = None

    with pdfplumber.open(pdf_path) as pdf:
        full_text = ""
        in_section_3 = False
        section_3_ended = False

        for page_idx, page in enumerate(pdf.pages):
            page_text = page.extract_text() or ""
            full_text += page_text + "\n"

            norm_page_text = normalize_text(page_text)
            if "3. PLANEACION DEL PROYECTO" in norm_page_text or "3.1. FASES DEL PROYECTO" in norm_page_text or "3.1 FASES DEL PROYECTO" in norm_page_text:
                in_section_3 = True

            tables = page.extract_tables()
            for t_idx, table in enumerate(tables):
                for r_idx, row in enumerate(table):
                    if not row or len(row) < 4:
                        continue

                    # On some pages, extra empty columns might appear (e.g. 6 cols on page 11)
                    if len(row) > 4:
                        # Extract non-empty or standard 4 columns
                        filtered = [c for c in row if c is not None and str(c).strip() != '']
                        if len(filtered) == 4:
                            row = filtered
                        elif len(row) == 6 and (row[0] or row[2]):
                            row = [row[0] or '', row[2] or '', row[3] or '', row[5] or '']
                        else:
                            row = row[:4]

                    col0 = str(row[0] or '').strip()
                    col1 = str(row[1] or '').strip()
                    col2 = str(row[2] or '').strip()
                    col3 = str(row[3] or '').strip()

                    row_combined = f"{col0} {col1} {col2} {col3}"
                    norm_row = normalize_text(row_combined)

                    # Detect start of Section 3
                    if "3.1" in norm_row and "FASES DEL PROYECTO" in norm_row:
                        in_section_3 = True
                        continue

                    # Detect end of Section 3
                    if in_section_3 and ("3.5" in norm_row or "ORGANIZACION DEL PROYECTO" in norm_row or "3.6" in norm_row or "3.7" in norm_row):
                        section_3_ended = True
                        break

                    if not in_section_3 or section_3_ended:
                        continue

                    # Skip header rows
                    if "FASES DEL PROYECTO" in norm_row or "ACTIVIDADES DEL PROYECTO" in norm_row or "RESULTADOS DE APRENDIZAJE" in norm_row:
                        continue

                    # Detect phase change
                    norm_c0 = normalize_text(col0)
                    if "ANALISIS" in norm_c0:
                        current_phase_key = "ANALISIS"
                    elif "PLANEACION" in norm_c0:
                        current_phase_key = "PLANEACION"
                    elif "EJECUCION" in norm_c0:
                        current_phase_key = "EJECUCION"
                    elif "EVALUACION" in norm_c0:
                        current_phase_key = "EVALUACION"

                    if col1:
                        act_cleaned = clean_spacing(col1)
                        if act_cleaned and (not current_activity or len(act_cleaned) > 5):
                            current_activity = act_cleaned

                    # Check if this row is a text continuation from previous row
                    has_res_code = bool(re.search(r'\b\d{6}\b', col2))
                    has_comp_code = bool(re.search(r'\b\d{6,9}\b', col3))

                    if (not has_res_code and not has_comp_code and current_record) or (not col0 and not col1 and not has_res_code and current_record):
                        # Merge text into previous record
                        if col2:
                            current_record['result_raw'] += " " + clean_spacing(col2)
                        if col3:
                            current_record['competency_raw'] += " " + clean_spacing(col3)
                        if col1 and not current_record['activity_raw']:
                            current_record['activity_raw'] = clean_spacing(col1)
                        continue

                    # Only process if we have a valid phase or have results/competencies
                    if not current_phase_key:
                        continue

                    rec = {
                        'phase_key': current_phase_key,
                        'activity_raw': clean_spacing(col1) or current_activity,
                        'result_raw': clean_spacing(col2),
                        'competency_raw': clean_spacing(col3)
                    }
                    
                    current_record = rec
                    if current_phase_key in phases_dict:
                        phases_dict[current_phase_key]['items'].append(rec)

                if section_3_ended:
                    break

        # Process extracted items for each phase
        final_phases = []
        for phase_name in ["ANALISIS", "PLANEACION", "EJECUCION", "EVALUACION"]:
            pdata = phases_dict[phase_name]
            act_set = set()
            raw_texts = []

            for item in pdata['items']:
                act = item['activity_raw']
                if act:
                    act_set.add(act)

                res_raw = item['result_raw']
                comp_raw = item['competency_raw']
                raw_texts.append(f"{act} {res_raw} {comp_raw}")

                # Extract 6-digit result codes
                res_matches = re.findall(r'\b(\d{6})\b', res_raw)
                for r_code in res_matches:
                    pdata['resultCodes'].add(r_code)

                # Extract competency codes
                comp_matches = re.findall(r'\b(\d{6,9})\b', comp_raw)
                for c_code in comp_matches:
                    pdata['competencyCodes'].add(c_code)

            # Build representative activity string
            activity_str = " / ".join(sorted(list(act_set))) if act_set else ""

            if pdata['resultCodes'] or pdata['competencyCodes']:
                final_phases.append({
                    "name": phase_name,
                    "activity": activity_str,
                    "rawText": clean_spacing(" ".join(raw_texts)),
                    "competencyCodes": sorted(list(pdata['competencyCodes'])),
                    "resultCodes": sorted(list(pdata['resultCodes']))
                })

        # Helper to extract metadata fields with multiple regex attempts
        def extract_value(patterns, text):
            for pattern in patterns:
                match = re.search(pattern, text, re.IGNORECASE | re.MULTILINE)
                if match:
                    val = match.group(1).strip()
                    val = re.sub(r'\s+', ' ', val)
                    if val:
                        return val
            return ""

        # Project Code
        project_metadata["projectCode"] = extract_value([
            r'(?:1\.\d+\s+)?C[oó]digo\s+Proyecto\s+SOFIA:\s*(\d+)',
            r'C[oó]digo\s+del\s+Proyecto:\s*(\d+)'
        ], full_text)

        # Program Code
        project_metadata["programCode"] = extract_value([
            r'(?:1\.\d+\s+)?C[oó]digo\s+del\s+Programa\s+SOFIA:\s*(\d+)',
            r'C[oó]digo\s+del\s+Programa:\s*(\d+)'
        ], full_text)

        # Project Name
        project_metadata["projectName"] = extract_value([
            r'1\.3\s+Nombre\s+del\s+proyecto:\s*([\s\S]+?)\s*(?:1\.4|Programa|$)',
            r'Nombre\s+del\s+proyecto:\s*([\s\S]+?)\s*(?:1\.4|Programa|$)'
        ], full_text)

        # Execution Time
        project_metadata["executionTime"] = extract_value([
            r'1\.5\s+Tiempo\s+estimado\s+de[\s\S]*?proyecto\s*\(meses\):\s*(\d+)',
            r'Tiempo\s+estimado\s+de[\s\S]*?proyecto\s*\(meses\):\s*(\d+)'
        ], full_text)

        # Regional
        project_metadata["regional"] = extract_value([
            r'1\.2\s+Regional:\s*([\s\S]+?)\s*(?:1\.3|Nombre|$)',
            r'Regional:\s*([\s\S]+?)\s*(?:1\.3|Nombre|$)'
        ], full_text)

        # Center
        project_metadata["center"] = extract_value([
            r'1\.1\s+Centro\s+de\s+Formaci[oó]n:\s*([\s\S]+?)\s*(?:1\.2|Regional|$)',
            r'Centro\s+de\s+Formaci[oó]n:\s*([\s\S]+?)\s*(?:1\.2|Regional|$)'
        ], full_text)

    return {**project_metadata, "phases": final_phases}

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No file provided"}))
        sys.exit(1)

    try:
        result = extract_project_data(sys.argv[1])
        print(json.dumps(result, indent=2, ensure_ascii=False))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)
