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
    text = unicodedata.normalize('NFD', text).encode('ascii', 'ignore').decode("utf-8")
    return text.upper().strip()

def extract_project_data(pdf_path):
    phase_map = {}
    project_metadata = {
        "projectCode": "",
        "projectName": "",
        "executionTime": "",
        "regional": "",
        "center": "",
        "programCode": ""
    }
    
    with pdfplumber.open(pdf_path) as pdf:
        full_text = ""
        for page in pdf.pages:
            # Extract text for metadata
            page_text = page.extract_text() or ""
            full_text += page_text + "\n"
            
            # Extract tables for phases
            tables = page.extract_tables()
            for table in tables:
                for row in table:
                    if len(row) >= 4:
                        phase_col = row[0]
                        activity_col = row[1]
                        result_col = row[2]
                        competency_col = row[3]
                        
                        if not phase_col or not activity_col:
                            continue
                            
                        norm_phase = normalize_text(phase_col)
                        phase_name = None
                        if 'ANALISIS' in norm_phase: phase_name = 'ANALISIS'
                        elif 'PLANEACION' in norm_phase: phase_name = 'PLANEACION'
                        elif 'EJECUCION' in norm_phase: phase_name = 'EJECUCION'
                        elif 'EVALUACION' in norm_phase: phase_name = 'EVALUACION'
                        
                        if not phase_name:
                            continue
                            
                        activity = activity_col.replace('\n', ' ').strip()
                        activity = re.sub(r'\s+', ' ', activity)
                        
                        result_codes = re.findall(r'\b\d{6}\b', str(result_col))
                        competency_codes = re.findall(r'\b\d{6,9}\b', str(competency_col))
                            
                        if phase_name not in phase_map:
                            phase_map[phase_name] = {
                                "name": phase_name,
                                "activity": activity,
                                "rawText": "",
                                "competencyCodes": set(),
                                "resultCodes": set()
                            }
                            
                        if len(activity) > len(phase_map[phase_name]["activity"]):
                            phase_map[phase_name]["activity"] = activity
                            
                        for code in result_codes:
                            phase_map[phase_name]["resultCodes"].add(code)
                                
                        for code in competency_codes:
                            phase_map[phase_name]["competencyCodes"].add(code)

        # Extract metadata from full text
        def extract_value(pattern, text):
            match = re.search(pattern, text, re.IGNORECASE | re.MULTILINE)
            if match:
                val = match.group(1).strip()
                # Normalize internal whitespace (convert newlines/tabs to single spaces)
                return re.sub(r'\s+', ' ', val)
            return ""

        # Project Code
        project_metadata["projectCode"] = extract_value(r'(?:1\.\d+\s+)?Cdigo\s+Proyecto\s+SOFIA:\s*(\d+)', full_text)
        if not project_metadata["projectCode"]:
             project_metadata["projectCode"] = extract_value(r'(?:1\.\d+\s+)?Código\s+Proyecto\s+SOFIA:\s*(\d+)', full_text)
             
        # Program Code
        project_metadata["programCode"] = extract_value(r'(?:1\.\d+\s+)?Cdigo\s+del\s+Programa\s+SOFIA:\s*(\d+)', full_text)
        if not project_metadata["programCode"]:
            project_metadata["programCode"] = extract_value(r'(?:1\.\d+\s+)?Código\s+del\s+Programa\s+SOFIA:\s*(\d+)', full_text)

        # Project Name
        project_metadata["projectName"] = extract_value(r'1\.3\s+Nombre\s+del\s+proyecto:\s*([\s\S]+?)\s*(?:1\.4|Programa|$)', full_text)
        if not project_metadata["projectName"]:
            project_metadata["projectName"] = extract_value(r'Nombre\s+del\s+proyecto:\s*([\s\S]+?)\s*(?:1\.4|Programa|$)', full_text)

        # Execution Time
        project_metadata["executionTime"] = extract_value(r'1\.5\s+Tiempo\s+estimado\s+de[\s\S]*?proyecto\s*\(meses\):\s*(\d+)', full_text)
        if not project_metadata["executionTime"]:
            project_metadata["executionTime"] = extract_value(r'Tiempo\s+estimado\s+de[\s\S]*?proyecto\s*\(meses\):\s*(\d+)', full_text)

        # Regional
        project_metadata["regional"] = extract_value(r'1\.2\s+Regional:\s*([\s\S]+?)\s*(?:1\.3|Nombre|$)', full_text)
        if not project_metadata["regional"]:
            project_metadata["regional"] = extract_value(r'Regional:\s*([\s\S]+?)\s*(?:1\.3|Nombre|$)', full_text)

        # Center
        project_metadata["center"] = extract_value(r'1\.1\s+Centro\s+de\s+Formacin:\s*([\s\S]+?)\s*(?:1\.2|Regional|$)', full_text)
        if not project_metadata["center"]:
             project_metadata["center"] = extract_value(r'1\.1\s+Centro\s+de\s+Formación:\s*([\s\S]+?)\s*(?:1\.2|Regional|$)', full_text)
        if not project_metadata["center"]:
             project_metadata["center"] = extract_value(r'Centro\s+de\s+Formación:\s*([\s\S]+?)\s*(?:1\.2|Regional|$)', full_text)

    # Convert sets to lists
    final_phases = []
    for p in phase_map.values():
        p["competencyCodes"] = sorted(list(p["competencyCodes"]))
        p["resultCodes"] = sorted(list(p["resultCodes"]))
        final_phases.append(p)
        
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
