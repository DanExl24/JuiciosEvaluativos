# -*- coding: utf-8 -*-
import pdfplumber
import json
import re
import sys
import unicodedata
import io

def normalize_text(text):
    if not text:
        return ""
    text = unicodedata.normalize('NFKD', str(text)).encode('ascii', 'ignore').decode("utf-8")
    return text.upper().strip()

def clean_spacing(text):
    if not text:
        return ""
    return re.sub(r'\s+', ' ', str(text)).strip()

def extract_full_project_hierarchy(pdf_path):
    project_metadata = {
        "projectCode": "",
        "projectName": "",
        "executionTime": "",
        "regional": "",
        "center": "",
        "programCode": ""
    }

    extracted_records = []
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

                    if len(row) > 4:
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

                    if "3.1" in norm_row and "FASES DEL PROYECTO" in norm_row:
                        in_section_3 = True
                        continue

                    if in_section_3 and ("3.5" in norm_row or "ORGANIZACION DEL PROYECTO" in norm_row or "3.6" in norm_row or "3.7" in norm_row):
                        section_3_ended = True
                        break

                    if not in_section_3 or section_3_ended:
                        continue

                    if "FASES DEL PROYECTO" in norm_row or "ACTIVIDADES DEL PROYECTO" in norm_row or "RESULTADOS DE APRENDIZAJE" in norm_row:
                        continue

                    norm_c0 = normalize_text(col0)
                    if "ANALISIS" in norm_c0:
                        current_phase_key = "ANÁLISIS"
                    elif "PLANEACION" in norm_c0:
                        current_phase_key = "PLANEACIÓN"
                    elif "EJECUCION" in norm_c0:
                        current_phase_key = "EJECUCIÓN"
                    elif "EVALUACION" in norm_c0:
                        current_phase_key = "EVALUACIÓN"

                    if col1:
                        act_cleaned = clean_spacing(col1)
                        if act_cleaned and (not current_activity or len(act_cleaned) > 5):
                            current_activity = act_cleaned

                    has_res_code = bool(re.search(r'\b\d{6}\b', col2))
                    has_comp_code = bool(re.search(r'\b\d{6,9}\b', col3))

                    if (not has_res_code and not has_comp_code and current_record) or (not col0 and not col1 and not has_res_code and current_record):
                        if col2:
                            current_record['result_raw'] += " " + clean_spacing(col2)
                        if col3:
                            current_record['competency_raw'] += " " + clean_spacing(col3)
                        if col1 and not current_record['activity_raw']:
                            current_record['activity_raw'] = clean_spacing(col1)
                        continue

                    # Ignore rows with no phase or no content
                    if not current_phase_key or (not has_res_code and not has_comp_code and not col2 and not col3):
                        continue

                    rec = {
                        'page': page_idx + 1,
                        'phase': current_phase_key,
                        'activity_raw': clean_spacing(col1) or current_activity,
                        'result_raw': clean_spacing(col2),
                        'competency_raw': clean_spacing(col3)
                    }
                    
                    current_record = rec
                    extracted_records.append(rec)

                if section_3_ended:
                    break

        # Extract metadata
        def extract_value(patterns, text):
            for pattern in patterns:
                match = re.search(pattern, text, re.IGNORECASE | re.MULTILINE)
                if match:
                    val = match.group(1).strip()
                    val = re.sub(r'\s+', ' ', val)
                    if val:
                        return val
            return ""

        project_metadata["projectCode"] = extract_value([
            r'(?:1\.\d+\s+)?C[oó]digo\s+Proyecto\s+SOFIA:\s*(\d+)',
            r'C[oó]digo\s+del\s+Proyecto:\s*(\d+)'
        ], full_text)

        project_metadata["programCode"] = extract_value([
            r'(?:1\.\d+\s+)?C[oó]digo\s+del\s+Programa\s+SOFIA:\s*(\d+)',
            r'C[oó]digo\s+del\s+Programa:\s*(\d+)'
        ], full_text)

        project_metadata["projectName"] = extract_value([
            r'1\.3\s+Nombre\s+del\s+proyecto:\s*([\s\S]+?)\s*(?:1\.4|Programa|$)',
            r'Nombre\s+del\s+proyecto:\s*([\s\S]+?)\s*(?:1\.4|Programa|$)'
        ], full_text)

        project_metadata["executionTime"] = extract_value([
            r'1\.5\s+Tiempo\s+estimado\s+de[\s\S]*?proyecto\s*\(meses\):\s*(\d+)',
            r'Tiempo\s+estimado\s+de[\s\S]*?proyecto\s*\(meses\):\s*(\d+)'
        ], full_text)

        project_metadata["regional"] = extract_value([
            r'1\.2\s+Regional:\s*([\s\S]+?)\s*(?:1\.3|Nombre|$)',
            r'Regional:\s*([\s\S]+?)\s*(?:1\.3|Nombre|$)'
        ], full_text)

        project_metadata["center"] = extract_value([
            r'1\.1\s+Centro\s+de\s+Formaci[oó]n:\s*([\s\S]+?)\s*(?:1\.2|Regional|$)',
            r'Centro\s+de\s+Formaci[oó]n:\s*([\s\S]+?)\s*(?:1\.2|Regional|$)'
        ], full_text)

    # Activity deduplication and canonicalization helper per phase
    def get_canonical_activity_map(records_for_phase):
        all_acts = [r['activity_raw'] for r in records_for_phase if r['activity_raw']]
        
        def get_act_num(s):
            m = re.match(r'^(\d+)', clean_spacing(s))
            return int(m.group(1)) if m else None

        canonical_acts = []
        for act in sorted(all_acts, key=len, reverse=True):
            act_clean = clean_spacing(act)
            if not act_clean or len(act_clean) < 4:
                continue
            act_num = get_act_num(act_clean)
            
            # Check if this is a substring of an existing longer activity with the SAME activity number
            is_sub = False
            for longer in canonical_acts:
                longer_num = get_act_num(longer)
                if (act_num is None or act_num == longer_num) and act_clean in longer:
                    is_sub = True
                    break
            if not is_sub:
                canonical_acts.append(act_clean)

        act_map = {}
        for raw in all_acts:
            raw_clean = clean_spacing(raw)
            raw_num = get_act_num(raw_clean)
            matched = False
            for canon in canonical_acts:
                canon_num = get_act_num(canon)
                if (raw_num is None or raw_num == canon_num) and raw_clean in canon:
                    act_map[raw] = canon
                    matched = True
                    break
            if not matched:
                act_map[raw] = raw_clean
                
        return act_map

    # Process and build hierarchical structure: Phase -> Activity -> Competency -> Learning Outcome
    phase_order = ["ANÁLISIS", "PLANEACIÓN", "EJECUCIÓN", "EVALUACIÓN"]
    hierarchical_phases = []

    for phase_name in phase_order:
        phase_records = [
            r for r in extracted_records 
            if r['phase'] == phase_name and (r['result_raw'] or r['competency_raw'])
        ]
        if not phase_records:
            continue

        act_canon_map = get_canonical_activity_map(phase_records)

        activities_dict = {}
        for r in phase_records:
            canon_act = act_canon_map.get(r['activity_raw'], r['activity_raw'])
            if not canon_act:
                # If no activity string found, use fallback
                canon_act = f"Actividad de la Fase de {phase_name}"

            if canon_act not in activities_dict:
                num_m = re.match(r'^(\d+)', canon_act)
                act_num = int(num_m.group(1)) if num_m else None
                activities_dict[canon_act] = {
                    "actividad": canon_act,
                    "numero": act_num,
                    "competencias": {}
                }

            # Parse Competency
            comp_raw = r['competency_raw']
            comp_code = ""
            comp_name = comp_raw
            comp_m = re.search(r'(\d{6,9})\s*[-:]?\s*(.*)', comp_raw)
            if comp_m:
                comp_code = comp_m.group(1).strip()
                comp_name = comp_m.group(2).strip()

            # Parse Result
            res_raw = r['result_raw']
            res_code = ""
            res_desc = res_raw
            res_m = re.search(r'(\d{6})\s*[-:]?\s*(.*)', res_raw)
            if res_m:
                res_code = res_m.group(1).strip()
                res_desc = res_m.group(2).strip()

            # Skip if both code and desc are empty
            if not comp_code and not comp_name and not res_code and not res_desc:
                continue

            comp_key = (comp_code, comp_name)
            if comp_key not in activities_dict[canon_act]["competencias"]:
                activities_dict[canon_act]["competencias"][comp_key] = {
                    "codigo": comp_code,
                    "nombre": comp_name,
                    "resultados_aprendizaje": []
                }

            if res_code or res_desc:
                activities_dict[canon_act]["competencias"][comp_key]["resultados_aprendizaje"].append({
                    "codigo": res_code,
                    "descripcion": res_desc
                })

        formatted_activities = []
        for act_name, act_data in activities_dict.items():
            comps_list = []
            for (ccode, cname), cdata in act_data["competencias"].items():
                if not cdata["resultados_aprendizaje"] and not ccode and not cname:
                    continue
                comps_list.append({
                    "codigo": cdata["codigo"],
                    "nombre": cdata["nombre"],
                    "total_resultados": len(cdata["resultados_aprendizaje"]),
                    "resultados_aprendizaje": cdata["resultados_aprendizaje"]
                })

            if not comps_list:
                continue

            formatted_activities.append({
                "actividad": act_name,
                "numero": act_data["numero"],
                "total_competencias": len(comps_list),
                "competencias": comps_list
            })

        formatted_activities.sort(key=lambda a: a["numero"] if a["numero"] is not None else 999)

        total_phase_competencies = sum(a["total_competencias"] for a in formatted_activities)
        total_phase_results = sum(
            sum(c["total_resultados"] for c in a["competencias"]) for a in formatted_activities
        )

        hierarchical_phases.append({
            "fase": phase_name,
            "total_actividades": len(formatted_activities),
            "total_competencias": total_phase_competencies,
            "total_resultados_aprendizaje": total_phase_results,
            "actividades": formatted_activities
        })

    full_output = {
        "metadata_proyecto": project_metadata,
        "resumen_general": {
            "total_fases": len(hierarchical_phases),
            "total_actividades": sum(p["total_actividades"] for p in hierarchical_phases),
            "total_competencias_asignadas": sum(p["total_competencias"] for p in hierarchical_phases),
            "total_resultados_aprendizaje": sum(p["total_resultados_aprendizaje"] for p in hierarchical_phases)
        },
        "fases_proyecto": hierarchical_phases
    }

    return full_output

if __name__ == "__main__":
    pdf_path = r'guides/1.Proyecto Formativo ADSO - 2480542.pdf'
    output_json_path = r'proyecto_formativo_estructura.json'
    
    print(f"Extrayendo jerarquia completa desde {pdf_path}...")
    hierarchy = extract_full_project_hierarchy(pdf_path)
    
    with open(output_json_path, 'w', encoding='utf-8') as f:
        json.dump(hierarchy, f, indent=2, ensure_ascii=False)
        
    print(f"Archivo guardado exitosamente en: {output_json_path}")
