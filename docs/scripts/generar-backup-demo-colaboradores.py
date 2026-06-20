#!/usr/bin/env python3
"""
Regenera docs/backup-demo-ieca.json a partir del Excel de colaboradores IECA 2024.
Regla: cada persona aparece en un solo ministerio (primera fila del Excel gana).
"""
from __future__ import annotations

import json
import re
import unicodedata
from collections import OrderedDict
from datetime import datetime, timezone
from pathlib import Path

from openpyxl import load_workbook

ROOT = Path(__file__).resolve().parents[2]
EXCEL = Path(r"c:\Users\ena\Downloads\COLABORADORES DE CADA MINISTERIO 2024.xlsx")
BACKUP_IN = ROOT / "docs" / "backup-demo-ieca.json"
BACKUP_OUT = ROOT / "docs" / "backup-demo-ieca.json"

# Filas con LIDER/COLIDER sin nombre de ministerio → ministerio inferido del bloque
LIDER_ROW_MINISTRY: dict[int, str] = {
    54: "CONSOLIDACION",
    76: "CABALLEROS",
    89: "E.S.F.C.",
    94: "GUARDIANIA",
    95: "JOVENES",
    100: "MISIONES",
    109: "ORACION MARTES",
    127: "PASITOS A CRISTO",
    133: "PASITOS A CRISTO",
    146: "PGH",
    162: "PGH",
    184: "E.S.F.C.",
    193: "UJIERES",
}

DISPLAY: dict[str, str] = {
    "ADOLESCENTES": "Adolescentes",
    "ALABANZA": "Alabanza",
    "CABALLEROS": "Caballeros",
    "CADETES": "Cadetes",
    "CONSEJERA": "Consejería",
    "CONSEJERO": "Consejería",
    "CONSOLIDACION": "Consolidación",
    "CONTABILIDAD": "Contabilidad",
    "DAMAS": "Damas",
    "DANZA": "Danza",
    "DISCIPULADO": "Discipulado",
    "E.S.F.C.": "E.S.F.C.",
    "ESFC": "E.S.F.C.",
    "GUARDIANIA": "Guardianía",
    "JOVENES": "Jóvenes",
    "MISIONES": "Misiones",
    "ORACION JUEVES": "Oración Jueves",
    "ORACION MARTES": "Oración Martes",
    "PAREJAS": "Parejas",
    "PASITOS A CRISTO": "Pasitos a Cristo",
    "PASTORAL": "Pastoral",
    "PGH": "PGH",
    "UJIERES": "Ujieres",
    "GENERAL": "General",
}

OLD_MINISTRY_TO_KEY: dict[str, str] = {
    "Alabanza y Adoración": "ALABANZA",
    "Intercesión": "ORACION JUEVES",
    "Misiones": "MISIONES",
    "Ujeres": "UJIERES",
    "Evangelismo": "PASTORAL",
    "Medios y Comunicación": "ALABANZA",
    "Matrimonios": "PAREJAS",
    "Damas": "DAMAS",
}

# Personal institucional IECA (no son colaboradores de ministerio)
STAFF_ADMINS = [
    {
        "id": 1,
        "usuario": "milena.mariscal",
        "nombre": "Milena Mariscal Ponce",
        "email": "milena.mariscal@ieca.demo",
    },
    {
        "id": 3,
        "usuario": "orbe.jimenez",
        "nombre": "Orbe Jimenez",
        "email": "orbe.jimenez@ieca.demo",
    },
]
STAFF_CONTABLE = {
    "id": 2,
    "usuario": "diznarda.quezada",
    "nombre": "Diznarda Quezada",
    "email": "diznarda.quezada@ieca.demo",
}
STAFF_COLABORADOR_EXCLUDE_KEYS = {"ORBE|JIMENEZ", "DIZNARDA|QUEZADA"}
STAFF_NAME_REPLACEMENTS = {
    "Administrador IECA": "Milena Mariscal Ponce",
    "María Contable": "Diznarda Quezada",
}
STAFF_ID_BY_NAME = {
    "Milena Mariscal Ponce": 1,
    "Diznarda Quezada": 2,
    "Orbe Jimenez": 3,
}


def build_staff_usuarios() -> list[dict]:
    out: list[dict] = []
    for admin in STAFF_ADMINS:
        out.append(
            {
                **admin,
                "rol": "Administrador",
                "estado": "Activo",
                "password": "123456",
            }
        )
    out.append(
        {
            **STAFF_CONTABLE,
            "rol": "Contable",
            "estado": "Activo",
            "password": "123456",
        }
    )
    return sorted(out, key=lambda u: u["id"])


def apply_staff_names(items: list[dict]) -> None:
    name_fields = (
        "registradoPor",
        "auditCreadoPorNombre",
        "aprobadoPor",
        "rechazadoPor",
    )
    for item in items:
        for field in name_fields:
            val = item.get(field)
            if isinstance(val, str) and val in STAFF_NAME_REPLACEMENTS:
                item[field] = STAFF_NAME_REPLACEMENTS[val]
        rp = item.get("registradoPor")
        if isinstance(rp, str) and rp in STAFF_ID_BY_NAME:
            item["usuarioId"] = STAFF_ID_BY_NAME[rp]
            if item.get("auditCreadoPorId") and str(item.get("usuarioId")) != str(
                item.get("auditCreadoPorId")
            ):
                pass
            audit_id = item.get("auditCreadoPorId")
            if audit_id is not None and str(audit_id) not in ("1", "2", "3"):
                item["auditCreadoPorId"] = str(STAFF_ID_BY_NAME.get(rp, item["usuarioId"]))


def strip_accents(text: str) -> str:
    n = unicodedata.normalize("NFD", text)
    return "".join(c for c in n if unicodedata.category(c) != "Mn")


def norm_ministry(raw) -> str:
    if raw is None:
        return ""
    s = strip_accents(str(raw).strip().upper())
    s = re.sub(r"\s+", " ", s)
    s = re.sub(r"^LIDER\s+", "", s)
    s = re.sub(r"^COLIDER\s+", "", s)
    if s == "ESFC":
        return "E.S.F.C."
    if s == "CONSEJERO":
        return "CONSEJERA"
    return s.strip()


def person_key(nombre: str, apellido: str) -> str:
    return norm_ministry(nombre) + "|" + norm_ministry(apellido)


def slug(text: str) -> str:
    s = strip_accents(str(text).lower().strip())
    s = re.sub(r"[^a-z0-9]+", ".", s).strip(".")
    return s or "x"


def title_name(nombre: str, apellido: str) -> str:
    def t(part: str) -> str:
        return " ".join(w.capitalize() for w in part.split())

    return f"{t(nombre.strip())} {t(apellido.strip())}".strip()


def parse_excel(path: Path) -> tuple[list[dict], list[dict], list[tuple]]:
    wb = load_workbook(path, data_only=True)
    ws = wb.active
    people: OrderedDict[str, dict] = OrderedDict()
    skipped_dupes: list[tuple] = []

    for r in range(6, ws.max_row + 1):
        nombre = ws.cell(r, 3).value
        apellido = ws.cell(r, 4).value
        minist = ws.cell(r, 5).value
        otros = ws.cell(r, 6).value
        if not nombre or not apellido:
            continue

        m = norm_ministry(minist)
        if not m or m in ("LIDER", "COLIDER"):
            m = LIDER_ROW_MINISTRY.get(r, "")
        if not m:
            continue

        pk = person_key(str(nombre), str(apellido))
        if pk in people:
            skipped_dupes.append((pk, people[pk]["ministerio_key"], m, r))
            continue

        people[pk] = {
            "nombre": str(nombre).strip(),
            "apellido": str(apellido).strip(),
            "ministerio_key": m,
            "otros": str(otros).strip() if otros else None,
            "row": r,
        }

    ministry_keys = sorted({p["ministerio_key"] for p in people.values()})
    if "GENERAL" not in ministry_keys:
        ministry_keys.append("GENERAL")

    ministerios = []
    key_to_id: dict[str, int] = {}
    now = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    for i, key in enumerate(ministry_keys, start=1):
        key_to_id[key] = i
        ministerios.append(
            {
                "id": i,
                "nombre": DISPLAY.get(key, key.title()),
                "estado": "Activo",
                "fecha": now,
            }
        )

    used_logins: set[str] = {u["usuario"] for u in build_staff_usuarios()}
    used_emails: set[str] = {u["email"] for u in build_staff_usuarios()}
    usuarios = build_staff_usuarios()

    uid = 4
    name_to_uid: dict[str, int] = {}
    ministry_first_user: dict[int, int] = {}

    for pk, p in people.items():
        if pk in STAFF_COLABORADOR_EXCLUDE_KEYS:
            continue
        mkey = p["ministerio_key"]
        mid = key_to_id[mkey]
        base = f"{slug(p['nombre'])}.{slug(p['apellido'].split()[0])}"
        login = base
        n = 2
        while login in used_logins:
            login = f"{base}.{n}"
            n += 1
        used_logins.add(login)

        email = f"{login}@ieca.demo"
        while email in used_emails:
            email = f"{login}.{n}@ieca.demo"
            n += 1
        used_emails.add(email)

        full = title_name(p["nombre"], p["apellido"])
        name_to_uid[norm_ministry(full.replace(" ", "|"))] = uid
        name_to_uid[pk] = uid
        if mid not in ministry_first_user:
            ministry_first_user[mid] = uid

        usuarios.append(
            {
                "id": uid,
                "usuario": login,
                "nombre": full,
                "email": email,
                "rol": "Colaborador",
                "estado": "Activo",
                "ministerioId": mid,
                "password": "123456",
            }
        )
        uid += 1

    return ministerios, usuarios, skipped_dupes, key_to_id, ministry_first_user, name_to_uid


def remap_movements(
    old_backup: dict,
    key_to_id: dict[str, int],
    ministry_first_user: dict[int, int],
    usuarios: list[dict],
) -> tuple[list[dict], list[dict]]:
    andres_uid = None
    for u in usuarios:
        if u.get("rol") == "Colaborador" and "Andres" in u["nombre"] and "Quinde" in u["nombre"]:
            andres_uid = u["id"]
            break

    def remap_item(item: dict, *, is_ingreso: bool) -> dict:
        out = dict(item)
        old_name = item.get("ministerio") or ""
        mkey = OLD_MINISTRY_TO_KEY.get(old_name)
        if mkey and mkey in key_to_id:
            mid = key_to_id[mkey]
            out["ministerioId"] = mid
            out["ministerio"] = DISPLAY.get(mkey, mkey.title())

        old_uid = item.get("usuarioId")
        if old_uid in (1, 2):
            pass
        elif is_ingreso and item.get("id") == 13 and andres_uid:
            out["usuarioId"] = andres_uid
            out["registradoPor"] = next(u["nombre"] for u in usuarios if u["id"] == andres_uid)
            out["auditCreadoPorId"] = str(andres_uid)
            out["auditCreadoPorNombre"] = out["registradoPor"]
            out["monto"] = 182
            out["descripcion"] = "Ofrenda dominical — Adolescentes (talento Andrés Quinde)"
            mid = key_to_id.get("ADOLESCENTES")
            if mid:
                out["ministerioId"] = mid
                out["ministerio"] = DISPLAY["ADOLESCENTES"]
        else:
            target_mid = out.get("ministerioId")
            if target_mid and target_mid in ministry_first_user:
                new_uid = ministry_first_user[target_mid]
                out["usuarioId"] = new_uid
                collab = next(u for u in usuarios if u["id"] == new_uid)
                out["registradoPor"] = collab["nombre"]
                if out.get("auditCreadoPorId") and str(old_uid) not in ("1", "2"):
                    out["auditCreadoPorId"] = str(new_uid)
                    out["auditCreadoPorNombre"] = collab["nombre"]

        return out

    ingresos = [remap_item(i, is_ingreso=True) for i in old_backup.get("ingresos", [])]
    gastos = [remap_item(g, is_ingreso=False) for g in old_backup.get("gastos", [])]
    apply_staff_names(ingresos)
    apply_staff_names(gastos)
    return ingresos, gastos


def main() -> None:
    if not EXCEL.exists():
        raise SystemExit(f"No se encontró el Excel: {EXCEL}")

    old = json.loads(BACKUP_IN.read_text(encoding="utf-8-sig"))
    ministerios, usuarios, dupes, key_to_id, ministry_first_user, _name_to_uid = parse_excel(EXCEL)
    ingresos, gastos = remap_movements(old, key_to_id, ministry_first_user, usuarios)

    out = {
        "fecha": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "version": old.get("version", "v1.0.0"),
        "ministerios": ministerios,
        "usuarios": usuarios,
        "ingresos": ingresos,
        "gastos": gastos,
        "notificaciones": old.get("notificaciones", []),
        "ultimoCierre": old.get("ultimoCierre"),
        "periodosCerrados": old.get("periodosCerrados", []),
    }

    BACKUP_OUT.write_text(json.dumps(out, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    colabs = [u for u in usuarios if u["rol"] == "Colaborador"]
    admins = [u for u in usuarios if u["rol"] == "Administrador"]
    print(f"Ministerios: {len(ministerios)}")
    print(f"Usuarios: {len(usuarios)} ({len(admins)} admins + 1 contable + {len(colabs)} colaboradores)")
    print("Staff:")
    for u in usuarios:
        if u["rol"] != "Colaborador":
            print(f"  [{u['rol']}] {u['usuario']} — {u['nombre']}")
    print(f"Duplicados omitidos (2.º ministerio descartado): {len(dupes)}")
    for d in dupes:
        print(f"  {d[0]}: conservado {d[1]}, omitido fila {d[3]} ({d[2]})")
    print(f"Escrito: {BACKUP_OUT}")


if __name__ == "__main__":
    main()
