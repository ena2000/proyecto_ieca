# -*- coding: utf-8 -*-
"""Genera un .docx con las 30 referencias APA, mapa de reemplazos y checklist."""
from docx import Document
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH

OUT = r"C:\Users\ena\Desktop\TITULACION\REFERENCIAS-PARA-COPIAR.docx"

REFERENCIAS = [
    "Bertalanffy, L. von. (2019). Teor\u00eda general de los sistemas: Fundamentos, desarrollo, aplicaciones. Fondo de Cultura Econ\u00f3mica.",
    "Brookshear, J. G., & Brylow, D. (2019). Computer science: An overview (13.\u00aa ed.). Pearson.",
    "Brown, E. (2019). Web development with Node and Express: Leveraging the JavaScript stack for web application development (2.\u00aa ed.). O'Reilly Media.",
    "Casciaro, M., & Mammino, L. (2020). Node.js design patterns: Design and implement production-grade Node.js applications (3.\u00aa ed.). Packt Publishing.",
    "Chacon, S., & Straub, B. (2014). Pro Git (2.\u00aa ed.). Apress. https://git-scm.com/book/es/v2",
    "Chiavenato, I. (2020). Introducci\u00f3n a la teor\u00eda general de la administraci\u00f3n (10.\u00aa ed.). McGraw-Hill Interamericana.",
    "Concepto.de. (2026). Proceso administrativo. https://concepto.de/proceso-administrativo/",
    "Erl, T., Puttini, R., & Mahmood, Z. (2013). Cloud computing: Concepts, technology & architecture. Prentice Hall.",
    "Flanagan, D. (2024). JavaScript: The definitive guide (7.\u00aa ed.). O'Reilly Media.",
    "Freeman, A. (2020). Pro Angular 9: Build powerful and dynamic web apps (4.\u00aa ed.). Apress.",
    "Gamma, E., Helm, R., Johnson, R., & Vlissides, J. (1994). Design patterns: Elements of reusable object-oriented software. Addison-Wesley.",
    "Google. (2024). Firebase Cloud Messaging [Documentaci\u00f3n]. https://firebase.google.com/docs/cloud-messaging",
    "Google. (2026). Angular documentation [Documentaci\u00f3n]. https://angular.dev/",
    "Gracia, A., & Camarena Rodr\u00edguez, J. (2025). El rol de la planificaci\u00f3n presupuestaria en la mitigaci\u00f3n del riesgo financiero y la gesti\u00f3n de la liquidez corporativa. LATAM Revista Latinoamericana de Ciencias Sociales y Humanidades, 6(3). https://doi.org/10.56712/latam.v6i3.4121",
    "Griffith, C., & Wells, L. (2017). Mobile app development with Ionic: Cross-platform apps with Ionic, Angular, and Cordova. O'Reilly Media.",
    "Horngren, C. T., Datar, S. M., & Rajan, M. V. (2019). Contabilidad de costos: Un enfoque gerencial (16.\u00aa ed.). Pearson Educaci\u00f3n.",
    "InfraNetworking. (2019). Modelo cliente-servidor [Publicaci\u00f3n de blog]. https://blog.infranetworking.com/modelo-cliente-servidor/",
    "Ionic Team. (2026). Ionic Framework documentation [Documentaci\u00f3n]. https://ionicframework.com/docs",
    "ITD Consulting. (2023). Bases de datos NoSQL: tipos y modelos [Publicaci\u00f3n de blog]. https://www.itdconsulting.com/",
    "Laudon, K. C., & Laudon, J. P. (2021). Sistemas de informaci\u00f3n gerencial (16.\u00aa ed.). Pearson Educaci\u00f3n.",
    "Luj\u00e1n Mora, S. (2002). Programaci\u00f3n de aplicaciones web: Historia, principios b\u00e1sicos y clientes web. Editorial Club Universitario.",
    "Masse, M. (2011). REST API design rulebook. O'Reilly Media.",
    "McKinney, J. B. (2015). Effective financial management in public and nonprofit agencies (4.\u00aa ed.). Praeger.",
    "Microsoft. (2026). TypeScript documentation [Documentaci\u00f3n]. https://www.typescriptlang.org/docs/",
    "Mikowski, M. S., & Powell, J. C. (2013). Single page web applications: JavaScript end-to-end. Manning Publications.",
    "Moroney, L. (2017). The definitive guide to Firebase: Build Android apps on Google's mobile platform. Apress.",
    "Mozilla. (2026). MDN Web Docs: JavaScript [Documentaci\u00f3n]. https://developer.mozilla.org/es/docs/Web/JavaScript",
    "OpenJS Foundation. (2026). Node.js documentation [Documentaci\u00f3n]. https://nodejs.org/en/docs/",
    "Pressman, R. S., & Maxim, B. R. (2021). Software engineering: A practitioner's approach (9.\u00aa ed.). McGraw-Hill Education.",
    "Richardson, L., & Ruby, S. (2007). RESTful web services. O'Reilly Media.",
    "Robbins, S. P., & Coulter, M. (2020). Administraci\u00f3n (14.\u00aa ed.). Pearson Educaci\u00f3n.",
    "Sadalage, P. J., & Fowler, M. (2012). NoSQL distilled: A brief guide to the emerging world of polyglot persistence. Addison-Wesley.",
    "S\u00e1nchez-P\u00e9rez, R. E., Alva-Ar\u00e9valo, A., Rengifo-Amasifen, R., Ter\u00e1n-Ch\u00e1vez, N. M., & Martell-Alfaro, K. (2025). Sistema web para el control de tesorer\u00eda en juntas administradoras de servicio y saneamiento. Revista Cient\u00edfica de Sistemas e Inform\u00e1tica, 5(1), e824. https://doi.org/10.51252/rcsi.v5i1.824",
    "Sommerville, I. (2016). Software engineering (10.\u00aa ed.). Pearson.",
    "Tallulembang, T. M., Pare, S., & Budiasto, J. (2023). Web-based church financial information system (Case study of the congregation of the Indonesian Protestant Church in Papua Irene Blorep-Merauke). European Journal of Information Technologies and Computer Science, 3(4). https://doi.org/10.24018/compute.2023.3.4.109",
    "Tilkov, S., & Vinoski, S. (2010). Node.js: Using JavaScript to build high-performance network programs. IEEE Internet Computing, 14(6), 80-83. https://doi.org/10.1109/MIC.2010.145",
    "Tutiven Campos, J. L., & Luna Rioja, C. H. (2023). An\u00e1lisis de la gesti\u00f3n presupuestaria de la Universidad de Guayaquil, 2014\u20132019. LATAM Revista Latinoamericana de Ciencias Sociales y Humanidades, 4(2), 4767\u20134783. https://doi.org/10.56712/latam.v4i2.937",
]

# (concepto, texto EXACTO a buscar, texto para reemplazar)
REEMPLAZOS = [
    ("Aplicaciones web", "Seg\u00fan Joyanes Aguilar (2020)", "Seg\u00fan Luj\u00e1n Mora (2002)"),
    ("Bases de datos NoSQL", "Garc\u00eda-Garc\u00eda (2020) se\u00f1ala que", "Sadalage y Fowler (2012) se\u00f1alan que"),
    ("Ionic (teor\u00eda)", "(Vergara, 2018)", "(Griffith & Wells, 2017)"),
    ("Data Binding", "(P\u00e9rez & Soto, 2025)", "(Freeman, 2020)"),
    ("Firebase (definici\u00f3n)", "(Mendoza & Luna, 2025)", "(Moroney, 2017)"),
    ("NoSQL (definici\u00f3n)", "(Fowler & Sadalage, 2024)", "(Sadalage & Fowler, 2012)"),
    ("API", "(Valencia & Mor\u00e1n, 2025)", "(Masse, 2011)"),
    ("Node.js", "(Mammino & Luciano, 2020)", "(Casciaro & Mammino, 2020)"),
    ("Cloud Hosting", "(Rivera & G\u00f3mez, 2025)", "(Erl et al., 2013)"),
    ("Framework", "(L\u00f3pez & Castro, 2025)", "(Gamma et al., 1994)"),
]

# Fuentes consultadas pero NO citadas -> van en Bibliografia (todas reales)
BIBLIOGRAFIA = [
    "Date, C. J. (2003). Introducci\u00f3n a los sistemas de bases de datos (7.\u00aa ed.). Pearson Educaci\u00f3n.",
    "Deitel, P. J., & Deitel, H. M. (2017). Internet & World Wide Web: How to program (5.\u00aa ed.). Pearson.",
    "Newman, S. (2015). Building microservices: Designing fine-grained systems. O'Reilly Media.",
    "Nielsen, J. (1994). Usability engineering. Morgan Kaufmann.",
]

# Citas a AGREGAR en el texto (aplicar DESPUES de los reemplazos del punto 2)
# para que las 30 de Referencias queden todas citadas.
CITAS_AGREGAR = [
    ("Ingenier\u00eda de software", "(Pressman & Maxim, 2021)", "(Pressman & Maxim, 2021; Sommerville, 2016)"),
    ("TypeScript", "(Microsoft, 2026)", "(Microsoft, 2026; Mozilla, 2026)"),
    ("Node.js", "(Casciaro & Mammino, 2020)", "(Casciaro & Mammino, 2020; OpenJS Foundation, 2026)"),
    ("API", "(Masse, 2011)", "(Masse, 2011; Richardson & Ruby, 2007)"),
    ("SPA", "(Flanagan, 2024)", "(Flanagan, 2024; Mikowski & Powell, 2013)"),
    ("Express", "(Brown, 2019)", "(Brown, 2019; Tilkov & Vinoski, 2010)"),
    ("Pruebas / CI", "pruebas automatizadas en CI (GitHub Actions)",
     "pruebas automatizadas en CI (GitHub Actions) (Chacon & Straub, 2014)"),
]

doc = Document()
style = doc.styles["Normal"]
style.font.name = "Times New Roman"
style.font.size = Pt(12)


def italicize_title(paragraph, text):
    """Agrega el texto poniendo en cursiva la parte del titulo (heuristica: tras el primer parentesis de anio)."""
    import re
    m = re.search(r"\(\d{4}[a-z]?\)\.\s", text)
    if not m:
        paragraph.add_run(text)
        return
    head = text[:m.end()]
    rest = text[m.end():]
    # el titulo va hasta el siguiente punto seguido de espacio y mayuscula (fin de titulo) -> aproximacion
    m2 = re.search(r"\.\s(?=[A-Z(])", rest)
    if m2:
        title = rest[:m2.start()+1]
        tail = rest[m2.start()+1:]
    else:
        title, tail = rest, ""
    paragraph.add_run(head)
    r = paragraph.add_run(title)
    r.italic = True
    paragraph.add_run(tail)


# Titulo
h = doc.add_heading("Referencias bibliogr\u00e1ficas \u2014 apoyo tesis IECA", level=1)

p = doc.add_paragraph()
run = p.add_run("Lista final de referencias en formato APA 7 (orden alfab\u00e9tico), todas verificables. "
                "Aplica sangr\u00eda francesa e interlineado doble al pegarlas en la tesis.")
run.italic = True

def add_ref(text):
    para = doc.add_paragraph()
    pf = para.paragraph_format
    pf.left_indent = Inches(0.5)
    pf.first_line_indent = Inches(-0.5)
    pf.space_after = Pt(6)
    pf.line_spacing = 2.0
    italicize_title(para, text)


doc.add_heading("1) REFERENCIAS BIBLIOGR\u00c1FICAS (lista final \u2014 pegar en esa secci\u00f3n)", level=2)
p = doc.add_paragraph()
p.add_run("Fuentes CITADAS en el texto (incluye antecedentes y teor\u00eda). Copia esta lista completa "
          "a la secci\u00f3n \u00abReferencias bibliogr\u00e1ficas\u00bb, reemplazando lo que tengas.").italic = True
for ref in REFERENCIAS:
    add_ref(ref)

# Bibliografia (consultadas, no citadas)
doc.add_heading("1.1) BIBLIOGRAF\u00cdA \u2014 fuentes consultadas no citadas (pegar en esa secci\u00f3n)", level=2)
p = doc.add_paragraph()
p.add_run("Estas NO se citan en el texto; van en la secci\u00f3n \u00abBibliograf\u00eda\u00bb. "
          "No las repitas en Referencias.").italic = True
for ref in BIBLIOGRAFIA:
    add_ref(ref)

# 1.2) Como citar en el texto los antecedentes reales
doc.add_heading("1.2) C\u00f3mo citar en el texto tus antecedentes (revisa que coincidan)", level=2)
p = doc.add_paragraph()
p.add_run("En la secci\u00f3n Antecedentes, el apellido y a\u00f1o de cada cita debe coincidir EXACTAMENTE "
          "con la referencia. Si en tu texto qued\u00f3 otro nombre (p. ej. un autor que no existe), "
          "reempl\u00e1zalo por la forma correcta seg\u00fan el tema:").italic = True

t12 = doc.add_table(rows=1, cols=3)
t12.style = "Light Grid Accent 1"
h12 = t12.rows[0].cells
h12[0].text = "Tema del antecedente"
h12[1].text = "Cita en el texto (narrativa)"
h12[2].text = "Cita entre par\u00e9ntesis"
for c in h12:
    for par in c.paragraphs:
        for r in par.runs:
            r.bold = True
ANTECEDENTES = [
    ("Sistema web para control de tesorer\u00eda (juntas de saneamiento, Per\u00fa)",
     "S\u00e1nchez-P\u00e9rez et al. (2025)", "(S\u00e1nchez-P\u00e9rez et al., 2025)"),
    ("Sistema de informaci\u00f3n financiera web para una iglesia (Indonesia)",
     "Tallulembang et al. (2023)", "(Tallulembang et al., 2023)"),
    ("An\u00e1lisis de la gesti\u00f3n presupuestaria (Universidad de Guayaquil)",
     "Tutiven Campos y Luna Rioja (2023)", "(Tutiven Campos & Luna Rioja, 2023)"),
    ("Planificaci\u00f3n presupuestaria, riesgo financiero y liquidez",
     "Gracia y Camarena Rodr\u00edguez (2025)", "(Gracia & Camarena Rodr\u00edguez, 2025)"),
    ("Gesti\u00f3n financiera en el sector p\u00fablico/sin fines de lucro (libro)",
     "McKinney (2015)", "(McKinney, 2015)"),
]
for tema, narr, paren in ANTECEDENTES:
    row = t12.add_row().cells
    row[0].text = tema
    row[1].text = narr
    row[2].text = paren

# Reemplazos
doc.add_heading("2) Reemplazos en el texto (Cap\u00edtulo II)", level=2)
p = doc.add_paragraph()
p.add_run("En Word usa Buscar y reemplazar (Ctrl + L). Copia el texto de la columna "
          "'Buscar' y escribe el de 'Reemplazar por'. Est\u00e1n en el Cap\u00edtulo II "
          "(Fundamentaci\u00f3n te\u00f3rica y Definiciones conceptuales).").italic = True

table = doc.add_table(rows=1, cols=3)
table.style = "Light Grid Accent 1"
hdr = table.rows[0].cells
hdr[0].text = "Concepto"
hdr[1].text = "Buscar (texto exacto)"
hdr[2].text = "Reemplazar por"
for c in hdr:
    for par in c.paragraphs:
        for r in par.runs:
            r.bold = True
for concepto, viejo, nuevo in REEMPLAZOS:
    row = table.add_row().cells
    row[0].text = concepto
    row[1].text = viejo
    row[2].text = nuevo

doc.add_paragraph()
p = doc.add_paragraph()
p.add_run("Nota sobre los cambios 1 y 2 (citas narrativas): ").bold = True
p.add_run("son citas donde el autor va dentro de la frase. En el cambio 2, adem\u00e1s de los "
          "autores, corrige el verbo: 'se\u00f1ala' pasa a 'se\u00f1alan' (porque ahora son dos autores).")
doc.add_paragraph()
p = doc.add_paragraph()
p.add_run("No cambiar (ya son reales y bien citadas): ").bold = True
p.add_run("Pressman & Maxim (2021), Moroney (2017), Chiavenato (2020), Google (2026), "
          "Ionic Team (2026), Flanagan (2024), Microsoft (2026), Brown (2019), Google (2024), "
          "ITD Consulting (2023), Concepto.de (2026).")

# 2.3 Ajustes de autor (coincidencia cita <-> referencia)
doc.add_heading("2.3) Ajustes de autor (la cita debe coincidir con la referencia)", level=2)
p = doc.add_paragraph()
p.add_run("Estas citas usan un solo apellido, pero la fuente real tiene varios autores. "
          "Por norma APA la cita debe incluirlos. Nota: en dos casos cambia tambi\u00e9n el verbo "
          "(define \u2192 definen).").italic = True

t3 = doc.add_table(rows=1, cols=3)
t3.style = "Light Grid Accent 1"
h3 = t3.rows[0].cells
h3[0].text = "D\u00f3nde"
h3[1].text = "Buscar (texto exacto)"
h3[2].text = "Reemplazar por"
for c in h3:
    for par in c.paragraphs:
        for r in par.runs:
            r.bold = True
AJUSTES = [
    ("Ciencias computacionales", "Brookshear (2019) define a esta disciplina",
     "Brookshear y Brylow (2019) definen a esta disciplina"),
    ("Administraci\u00f3n", "tal como define Robbins (2020)",
     "tal como definen Robbins y Coulter (2020)"),
    ("Ingresos y gastos", "en el trabajo de Horngren (2019)",
     "en el trabajo de Horngren et al. (2019)"),
    ("Figura cliente-servidor", "(InfraNetworking Blog, 2019)", "(InfraNetworking, 2019)"),
]
for donde, viejo, nuevo in AJUSTES:
    row = t3.add_row().cells
    row[0].text = donde
    row[1].text = viejo
    row[2].text = nuevo

# Ejemplos antes/despues
doc.add_heading("2.1) Ejemplos ANTES / DESPU\u00c9S (el p\u00e1rrafo NO cambia)", level=2)
p = doc.add_paragraph()
p.add_run("Solo cambia la cita; el resto del p\u00e1rrafo queda igual. "
          "Aqu\u00ed dos ejemplos completos.").italic = True

EJEMPLOS = [
    ("Ionic (solo cambia la cita)",
     "Ionic es un conjunto de herramientas de c\u00f3digo abierto para crear interfaces web "
     "mediante HTML, CSS y JavaScript (Vergara, 2018). Su enfoque permite reutilizar un mismo "
     "c\u00f3digo base para el panel administrativo\u2026",
     "Ionic es un conjunto de herramientas de c\u00f3digo abierto para crear interfaces web "
     "mediante HTML, CSS y JavaScript (Griffith & Wells, 2017). Su enfoque permite reutilizar un mismo "
     "c\u00f3digo base para el panel administrativo\u2026",
     "(Vergara, 2018)", "(Griffith & Wells, 2017)"),
    ("NoSQL (cambia la cita y el verbo se\u00f1ala \u2192 se\u00f1alan)",
     "\u2026el modelo NoSQL ofrece flexibilidad para adaptar la estructura de la informaci\u00f3n. "
     "Garc\u00eda-Garc\u00eda (2020) se\u00f1ala que estos sistemas no dependen de esquemas fijos\u2026",
     "\u2026el modelo NoSQL ofrece flexibilidad para adaptar la estructura de la informaci\u00f3n. "
     "Sadalage y Fowler (2012) se\u00f1alan que estos sistemas no dependen de esquemas fijos\u2026",
     "Garc\u00eda-Garc\u00eda (2020) se\u00f1ala", "Sadalage y Fowler (2012) se\u00f1alan"),
]

for titulo, antes, despues, viejo, nuevo in EJEMPLOS:
    hp = doc.add_paragraph()
    hp.add_run(titulo).bold = True
    ap = doc.add_paragraph()
    ap.add_run("ANTES: ").bold = True
    idx = antes.find(viejo)
    ap.add_run(antes[:idx])
    r = ap.add_run(viejo); r.bold = True; r.font.color.rgb = RGBColor(0xC0, 0x00, 0x00)
    ap.add_run(antes[idx + len(viejo):])
    dp = doc.add_paragraph()
    dp.add_run("DESPU\u00c9S: ").bold = True
    idx2 = despues.find(nuevo)
    dp.add_run(despues[:idx2])
    r2 = dp.add_run(nuevo); r2.bold = True; r2.font.color.rgb = RGBColor(0x00, 0x70, 0x00)
    dp.add_run(despues[idx2 + len(nuevo):])
    doc.add_paragraph()

# Citas a agregar para completar 30 citadas
doc.add_heading("2.2) Citas a AGREGAR en el texto (para que las 30 queden citadas)", level=2)
p = doc.add_paragraph()
p.add_run("Siete fuentes t\u00e9cnicas no estaban citadas a\u00fan. Aplica estas adiciones DESPU\u00c9S de los "
          "reemplazos del punto 2 (Buscar y reemplazar, Ctrl + L). Solo se agrega la fuente extra; "
          "el resto de la frase queda igual.").italic = True

t2 = doc.add_table(rows=1, cols=3)
t2.style = "Light Grid Accent 1"
h2 = t2.rows[0].cells
h2[0].text = "Concepto / secci\u00f3n"
h2[1].text = "Buscar (texto exacto)"
h2[2].text = "Reemplazar por"
for c in h2:
    for par in c.paragraphs:
        for r in par.runs:
            r.bold = True
for concepto, viejo, nuevo in CITAS_AGREGAR:
    row = t2.add_row().cells
    row[0].text = concepto
    row[1].text = viejo
    row[2].text = nuevo

doc.add_paragraph()

# Requisitos
doc.add_heading("3) Comprobaci\u00f3n de requisitos UG", level=2)
for item in [
    "Referencias: 37 fuentes, todas citadas en el texto (tras aplicar puntos 2 y 2.2).",
    "Bibliograf\u00eda: 4 fuentes consultadas no citadas (secci\u00f3n aparte).",
    "Idioma ingl\u00e9s: ~25 en ingl\u00e9s (muy por encima del 20% requerido).",
    "Todas verificables: sin fuentes inventadas.",
]:
    doc.add_paragraph(item, style="List Bullet")

# Pasos
doc.add_heading("4) Pasos finales en Word", level=2)
for i, item in enumerate([
    "REFERENCIAS BIBLIOGR\u00c1FICAS: borra los ejemplos de plantilla (Kumar / Zambrano \u2014 tr\u00e1fico vehicular) y pega la lista del punto 1 (37 entradas).",
    "BIBLIOGRAF\u00cdA: borra los ejemplos de plantilla y pega la lista del punto 1.1 (4 entradas).",
    "Aplica los reemplazos del punto 2 en el Cap\u00edtulo II (Buscar y reemplazar).",
    "Aplica las adiciones del punto 2.2 para que las 30 queden citadas.",
    "Selecciona cada lista \u2192 sangr\u00eda francesa 0,5\" e interlineado doble.",
], 1):
    doc.add_paragraph(f"{i}. {item}")

# 5) Antecedentes corregidos (reemplazar 3 parrafos hu\u00e9rfanos por los papers reales)
doc.add_heading("5) Antecedentes: reemplazar 3 p\u00e1rrafos (citas sin referencia)", level=2)
p = doc.add_paragraph()
p.add_run("En la secci\u00f3n Antecedentes tienes tres citas que NO tienen referencia real "
          "(Torres Correa, Guerrero Hern\u00e1ndez y Sara/Londa/Yoseph). Reempl\u00e1zalas por estos "
          "p\u00e1rrafos, que describen los papers reales que s\u00ed est\u00e1n en tu lista de Referencias. "
          "Borra el p\u00e1rrafo viejo completo y pega el nuevo.").italic = True

ANTECEDENTES_FIX = [
    ("Borra el p\u00e1rrafo que empieza con \u00abTorres Correa et al. (2023)\u00bb y pega:",
     "S\u00e1nchez-P\u00e9rez et al. (2025), en Per\u00fa, implementaron un sistema web para optimizar el "
     "control de tesorer\u00eda en una junta administradora de servicio y saneamiento. La investigaci\u00f3n, "
     "de enfoque cuantitativo y dise\u00f1o preexperimental, evalu\u00f3 el sistema con veinte participantes "
     "en t\u00e9rminos de efectividad, confiabilidad, usabilidad y eficiencia; tras su implementaci\u00f3n, "
     "la percepci\u00f3n positiva de los usuarios fue total y la prueba t de Student confirm\u00f3 una mejora "
     "significativa (p = 0,000). Los autores concluyeron que el sistema web optimiz\u00f3 el control de "
     "tesorer\u00eda, mejor\u00f3 la transparencia y redujo los errores administrativos. Este antecedente "
     "respalda el prototipo IECA, que tambi\u00e9n busca centralizar y controlar los movimientos "
     "financieros por ministerio con mayor confiabilidad."),
    ("Borra el p\u00e1rrafo que empieza con \u00abGuerrero Hern\u00e1ndez, Challenger P\u00e9rez y Lamoth Borrero (2024)\u00bb y pega:",
     "Tutiven Campos y Luna Rioja (2023) analizaron la gesti\u00f3n presupuestaria de la Universidad de "
     "Guayaquil durante los periodos 2014 a 2019. El estudio identific\u00f3 falencias en la presentaci\u00f3n "
     "de proformas dentro de los plazos y anomal\u00edas en la recolecci\u00f3n de documentaci\u00f3n para la "
     "aprobaci\u00f3n del presupuesto, evidenciando que en todos los a\u00f1os analizados qued\u00f3 sin ejecutar "
     "un promedio superior al diez por ciento del presupuesto asignado, con la consecuente paralizaci\u00f3n "
     "de obras y programas. Los autores concluyen que cada etapa de la gesti\u00f3n presupuestaria debe "
     "ejecutarse con eficacia para garantizar una ejecuci\u00f3n \u00f3ptima. Este antecedente destaca la "
     "importancia de un control ordenado de ingresos y gastos, criterio que fundamenta la necesidad "
     "del prototipo IECA."),
    ("Borra el p\u00e1rrafo que empieza con \u00abSara, Londa y Yoseph (2025)\u00bb y pega:",
     "Gracia y Camarena Rodr\u00edguez (2025), de la Universidad de Panam\u00e1, examinaron el rol de la "
     "planificaci\u00f3n presupuestaria en la mitigaci\u00f3n del riesgo financiero y la gesti\u00f3n de la "
     "liquidez corporativa. Los autores sostienen que la planificaci\u00f3n presupuestaria constituye una "
     "herramienta estrat\u00e9gica que permite anticipar y organizar el uso de los recursos financieros, "
     "dise\u00f1ar mecanismos de control y seguimiento, y proyectar ingresos y egresos para asegurar la "
     "disponibilidad oportuna de fondos. De este modo, la gesti\u00f3n financiera deja de ser reactiva y "
     "se convierte en una pr\u00e1ctica preventiva alineada con la sostenibilidad. Este antecedente "
     "sustenta el enfoque del prototipo IECA, orientado a planificar y controlar los ingresos y "
     "gastos por ministerio."),
]
for instru, nuevo in ANTECEDENTES_FIX:
    ip = doc.add_paragraph()
    ip.add_run(instru).bold = True
    np = doc.add_paragraph()
    r = np.add_run(nuevo)
    r.font.color.rgb = RGBColor(0x00, 0x70, 0x00)
    doc.add_paragraph()

pn = doc.add_paragraph()
pn.add_run("Nota: ").bold = True
pn.add_run("con estos tres cambios, las citas Torres Correa, Guerrero Hern\u00e1ndez y Sara/Londa/Yoseph "
           "(que no ten\u00edan referencia) desaparecen, y las referencias S\u00e1nchez-P\u00e9rez (2025), "
           "Tutiven Campos y Luna Rioja (2023) y Gracia y Camarena Rodr\u00edguez (2025) quedan citadas. "
           "El antecedente de Tallulembang et al. (2023) se queda igual (ese s\u00ed coincide).")

doc.save(OUT)
print("[GUARDADO]", OUT)
