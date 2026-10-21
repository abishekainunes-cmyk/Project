const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, HeadingLevel, LevelFormat, BorderStyle, WidthType,
  ShadingType, PageNumber, PageBreak, VerticalAlign, Header, Footer,
  TabStopType, TabStopPosition
} = require('docx');
const fs = require('fs');

const teal = "0F6E56";
const tealLight = "E1F5EE";
const tealMid = "1D9E75";
const slate = "1A202C";
const slateLight = "F8F9FA";
const slateGray = "4A5568";
const amber = "BA7517";
const amberLight = "FAEEDA";
const rose = "993C1D";
const roseLight = "FAECE7";
const white = "FFFFFF";
const borderGray = "DDDDDD";

const border = { style: BorderStyle.SINGLE, size: 1, color: borderGray };
const borders = { top: border, bottom: border, left: border, right: border };
const noBorder = { style: BorderStyle.NONE, size: 0, color: white };
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 160 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: tealMid, space: 6 } },
    children: [new TextRun({ text, bold: true, size: 36, font: "Arial", color: slate })]
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 320, after: 120 },
    children: [new TextRun({ text, bold: true, size: 28, font: "Arial", color: teal })]
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 240, after: 100 },
    children: [new TextRun({ text, bold: true, size: 24, font: "Arial", color: slateGray })]
  });
}

function para(runs, spacing = {}) {
  return new Paragraph({
    spacing: { before: 80, after: 140, ...spacing },
    children: Array.isArray(runs) ? runs : [new TextRun({ text: runs, size: 22, font: "Arial", color: slate })]
  });
}

function run(text, opts = {}) {
  return new TextRun({ text, size: 22, font: "Arial", color: slate, ...opts });
}

function boldRun(text, color = slate) {
  return new TextRun({ text, size: 22, font: "Arial", color, bold: true });
}

function italicRun(text) {
  return new TextRun({ text, size: 22, font: "Arial", color: slateGray, italics: true });
}

function bullet(text, bold_prefix = null) {
  const children = bold_prefix
    ? [new TextRun({ text: bold_prefix + " ", size: 22, font: "Arial", bold: true, color: teal }),
       new TextRun({ text, size: 22, font: "Arial", color: slate })]
    : [new TextRun({ text, size: 22, font: "Arial", color: slate })];
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    spacing: { before: 60, after: 60 },
    children
  });
}

function subbullet(text) {
  return new Paragraph({
    numbering: { reference: "subbullets", level: 0 },
    spacing: { before: 40, after: 40 },
    children: [new TextRun({ text, size: 20, font: "Arial", color: slateGray })]
  });
}

function numbered(text, bold_prefix = null) {
  const children = bold_prefix
    ? [new TextRun({ text: bold_prefix + " ", size: 22, font: "Arial", bold: true, color: teal }),
       new TextRun({ text, size: 22, font: "Arial", color: slate })]
    : [new TextRun({ text, size: 22, font: "Arial", color: slate })];
  return new Paragraph({
    numbering: { reference: "numbers", level: 0 },
    spacing: { before: 60, after: 60 },
    children
  });
}

function callout(label, text, bgColor, labelColor) {
  return new Table({
    width: { size: 9026, type: WidthType.DXA },
    columnWidths: [9026],
    spacing: { before: 160, after: 160 },
    rows: [new TableRow({
      children: [new TableCell({
        borders: noBorders,
        width: { size: 9026, type: WidthType.DXA },
        shading: { fill: bgColor, type: ShadingType.CLEAR },
        margins: { top: 140, bottom: 140, left: 180, right: 180 },
        children: [
          new Paragraph({ spacing: { before: 0, after: 60 }, children: [new TextRun({ text: label, size: 20, font: "Arial", bold: true, color: labelColor })] }),
          new Paragraph({ spacing: { before: 0, after: 0 }, children: [new TextRun({ text, size: 20, font: "Arial", color: slate })] })
        ]
      })]
    })]
  });
}

function spacer(size = 160) {
  return new Paragraph({ spacing: { before: size, after: 0 }, children: [new TextRun("")] });
}

function sectionBadge(text, color = tealMid) {
  return new Table({
    width: { size: 9026, type: WidthType.DXA },
    columnWidths: [9026],
    rows: [new TableRow({
      children: [new TableCell({
        borders: noBorders,
        shading: { fill: color, type: ShadingType.CLEAR },
        margins: { top: 120, bottom: 120, left: 200, right: 200 },
        children: [new Paragraph({
          children: [new TextRun({ text, size: 26, font: "Arial", bold: true, color: white })]
        })]
      })]
    })]
  });
}

function requirementRow(id, desc, priority, source) {
  const priColor = priority === "Critical" ? rose : priority === "High" ? amber : teal;
  return new TableRow({
    children: [
      new TableCell({ borders, width: { size: 1000, type: WidthType.DXA }, shading: { fill: slateLight, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: id, size: 18, font: "Arial", bold: true, color: teal })] })] }),
      new TableCell({ borders, width: { size: 5500, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: desc, size: 20, font: "Arial", color: slate })] })] }),
      new TableCell({ borders, width: { size: 1100, type: WidthType.DXA }, shading: { fill: priority === "Critical" ? roseLight : priority === "High" ? amberLight : tealLight, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 100, right: 100 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: priority, size: 18, font: "Arial", bold: true, color: priColor })] })] }),
      new TableCell({ borders, width: { size: 1426, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: source, size: 18, font: "Arial", color: slateGray })] })] }),
    ]
  });
}

function tableHeader(cols, widths) {
  return new TableRow({
    tableHeader: true,
    children: cols.map((col, i) => new TableCell({
      borders,
      width: { size: widths[i], type: WidthType.DXA },
      shading: { fill: teal, type: ShadingType.CLEAR },
      margins: { top: 80, bottom: 80, left: 100, right: 100 },
      children: [new Paragraph({ children: [new TextRun({ text: col, size: 20, font: "Arial", bold: true, color: white })] })]
    }))
  });
}

const doc = new Document({
  numbering: {
    config: [
      { reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "subbullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u25E6", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 1080, hanging: 360 } } } }] },
      { reference: "numbers", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    ]
  },
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 36, bold: true, font: "Arial", color: slate }, paragraph: { spacing: { before: 400, after: 160 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 28, bold: true, font: "Arial", color: teal }, paragraph: { spacing: { before: 320, after: 120 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 24, bold: true, font: "Arial", color: slateGray }, paragraph: { spacing: { before: 240, after: 100 }, outlineLevel: 2 } },
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 11906, height: 16838 },
        margin: { top: 1440, right: 1260, bottom: 1440, left: 1260 }
      }
    },
    headers: {
      default: new Header({
        children: [
          new Paragraph({
            border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: tealMid, space: 4 } },
            spacing: { before: 0, after: 120 },
            children: [
              new TextRun({ text: "NICMS — National Integrated Case Management System", size: 18, font: "Arial", color: slateGray }),
              new TextRun({ text: "   |   ", size: 18, font: "Arial", color: "BBBBBB" }),
              new TextRun({ text: "Software Requirements Specification (SRS)", size: 18, font: "Arial", color: slateGray }),
              new TextRun({ text: "   |   Loons Lab — Confidential", size: 18, font: "Arial", color: "BBBBBB" }),
            ]
          })
        ]
      })
    },
    footers: {
      default: new Footer({
        children: [
          new Paragraph({
            border: { top: { style: BorderStyle.SINGLE, size: 4, color: tealMid, space: 4 } },
            spacing: { before: 120, after: 0 },
            tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
            children: [
              new TextRun({ text: "Prepared by: Abishek Pranav GV   |   Business Analyst, Loons Lab   |   May 7, 2026", size: 18, font: "Arial", color: slateGray }),
              new TextRun({ text: "\t", size: 18 }),
              new TextRun({ text: "Page ", size: 18, font: "Arial", color: slateGray }),
              new PageNumber({ size: 18, font: "Arial", color: slateGray })
            ]
          })
        ]
      })
    },
    children: [

      // ===== COVER PAGE =====
      spacer(600),
      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [9026],
        rows: [new TableRow({ children: [new TableCell({
          borders: noBorders,
          shading: { fill: teal, type: ShadingType.CLEAR },
          margins: { top: 500, bottom: 500, left: 400, right: 400 },
          children: [
            new Paragraph({ alignment: AlignmentType.LEFT, spacing: { before: 0, after: 80 }, children: [new TextRun({ text: "SOFTWARE REQUIREMENTS SPECIFICATION", size: 20, font: "Arial", color: "9FE1CB", bold: true })] }),
            new Paragraph({ alignment: AlignmentType.LEFT, spacing: { before: 0, after: 120 }, children: [new TextRun({ text: "National Integrated Case Management System", size: 52, font: "Arial", color: white, bold: true })] }),
            new Paragraph({ alignment: AlignmentType.LEFT, spacing: { before: 0, after: 200 }, children: [new TextRun({ text: "NICMS", size: 52, font: "Arial", color: "9FE1CB", bold: true })] }),
            new Paragraph({ alignment: AlignmentType.LEFT, spacing: { before: 80, after: 0 }, children: [new TextRun({ text: "Sri Lanka  \u2014  A Unified Digital Platform for SGBV & TFGBV Case Management", size: 22, font: "Arial", color: "C5ECD9" })] }),
          ]
        })] })]
      }),
      spacer(240),
      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [4513, 4513],
        rows: [
          new TableRow({ children: [
            new TableCell({ borders: noBorders, width: { size: 4513, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 0, right: 200 }, children: [
              new Paragraph({ children: [new TextRun({ text: "Prepared by", size: 18, font: "Arial", color: slateGray })] }),
              new Paragraph({ children: [new TextRun({ text: "Abishek Pranav GV", size: 22, font: "Arial", bold: true, color: slate })] }),
              new Paragraph({ children: [new TextRun({ text: "Business Analyst, Loons Lab", size: 20, font: "Arial", color: slateGray })] }),
            ] }),
            new TableCell({ borders: noBorders, width: { size: 4513, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 200, right: 0 }, children: [
              new Paragraph({ children: [new TextRun({ text: "Version & Date", size: 18, font: "Arial", color: slateGray })] }),
              new Paragraph({ children: [new TextRun({ text: "v1.0 — May 7, 2026", size: 22, font: "Arial", bold: true, color: slate })] }),
              new Paragraph({ children: [new TextRun({ text: "Classification: Confidential", size: 20, font: "Arial", color: slateGray })] }),
            ] }),
          ]}),
        ]
      }),
      new Paragraph({ children: [new PageBreak()] }),

      // ===== SECTION 0: FOREWORD =====
      sectionBadge("A Personal Note Before We Begin"),
      spacer(120),
      para([
        run("Before I lay out the technical specifications, I want to take a moment to explain why this document exists — and why it matters to me personally.")
      ]),
      para([
        run("When I first read the problem brief, I did not see a system design challenge. I saw something that made me uncomfortable in a way I could not immediately explain. Then it hit me: someone, somewhere, has already lived through exactly this — the terrifying experience of walking into a police station to report something that broke them, only to be redirected somewhere else. Then redirected again. Each time having to relive the worst moment of their life, to a new face, in a new office, filling out a new form — only to feel like they are walking in circles while their evidence quietly disappears and their abuser goes untouched.")
      ]),
      para([
        run("This SRS is my attempt to document a system that says: "),
        boldRun("\"We heard you. You don't have to say it again.\"", teal)
      ]),
      para([
        italicRun("— Abishek Pranav GV, Business Analyst, Loons Lab")
      ]),
      new Paragraph({ children: [new PageBreak()] }),

      // ===== SECTION 1 =====
      h1("1. Problem Understanding"),
      h2("1.1 The Core Problem — In Plain Words"),
      para([
        run("Sri Lanka has "),
        boldRun("six government organizations"),
        run(" that are each responsible for a different slice of justice when it comes to Sexual and Gender-Based Violence (SGBV) and Technology-Facilitated Gender-Based Violence (TFGBV). On paper, this sounds thorough. In reality, it creates a labyrinth that punishes survivors for simply trying to get help.")
      ]),
      para([
        run("A survivor of an intimate image leak, for example, might logically start at their local police station. The police direct them to the CCID for the digital angle. The CCID flags that a child was involved — so now NCPA enters the picture. A counselor at MoWCA is needed, but she doesn't know the case exists yet. SLCERT could take down the content, but nobody has formally notified them. And through all of this shuffling of responsibility, "),
        boldRun("the survivor is asked — again and again — to tell their story.", rose)
      ]),
      callout(
        "The Real Human Cost",
        "Every repeated retelling is not just an inconvenience. Clinical research on trauma confirms that forcing survivors to repeatedly re-narrate traumatic events can deepen psychological harm. Re-victimization through bureaucratic process is real, documented, and preventable. The system as it exists today is not neutral — it is actively causing harm by design.",
        roseLight, rose
      ),
      spacer(80),
      para([run("The result? Survivors drop out. Evidence decays. Perpetrators walk free. Not because the law failed, but because the "), boldRun("process failed."), run(" This is the problem we are solving.")]),

      h2("1.2 The Six Organizations and Their Mandates"),
      spacer(80),
      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [2200, 3200, 3626],
        rows: [
          tableHeader(["Organization", "Primary Mandate", "Gap in Current System"], [2200, 3200, 3626]),
          new TableRow({ children: [
            new TableCell({ borders, width: { size: 2200, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: "Police Children & Women Bureau (CWB)", size: 20, font: "Arial", bold: true, color: slate })] })] }),
            new TableCell({ borders, width: { size: 3200, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: "First-response law enforcement for physical and domestic violence", size: 20, font: "Arial", color: slate })] })] }),
            new TableCell({ borders, width: { size: 3626, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: "No standardized handoff protocol to digital crime units; cases sit unrouted", size: 20, font: "Arial", color: slateGray })] })] }),
          ]}),
          new TableRow({ children: [
            new TableCell({ borders, width: { size: 2200, type: WidthType.DXA }, shading: { fill: slateLight, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: "Cyber Crimes Investigation Division (CCID)", size: 20, font: "Arial", bold: true, color: slate })] })] }),
            new TableCell({ borders, width: { size: 3200, type: WidthType.DXA }, shading: { fill: slateLight, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: "Investigation of technology-facilitated crimes, digital forensics", size: 20, font: "Arial", color: slate })] })] }),
            new TableCell({ borders, width: { size: 3626, type: WidthType.DXA }, shading: { fill: slateLight, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: "Receives digital evidence via email or physical media — no chain-of-custody standard", size: 20, font: "Arial", color: slateGray })] })] }),
          ]}),
          new TableRow({ children: [
            new TableCell({ borders, width: { size: 2200, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: "National Child Protection Authority (NCPA)", size: 20, font: "Arial", bold: true, color: slate })] })] }),
            new TableCell({ borders, width: { size: 3200, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: "Statutory body for all matters relating to child welfare and protection", size: 20, font: "Arial", color: slate })] })] }),
            new TableCell({ borders, width: { size: 3626, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: "Cases involving minors often not flagged until late in process; delayed escalation", size: 20, font: "Arial", color: slateGray })] })] }),
          ]}),
          new TableRow({ children: [
            new TableCell({ borders, width: { size: 2200, type: WidthType.DXA }, shading: { fill: slateLight, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: "Ministry of Women & Child Affairs (MoWCA)", size: 20, font: "Arial", bold: true, color: slate })] })] }),
            new TableCell({ borders, width: { size: 3200, type: WidthType.DXA }, shading: { fill: slateLight, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: "Counseling, rehabilitation, and social support for survivors", size: 20, font: "Arial", color: slate })] })] }),
            new TableCell({ borders, width: { size: 3626, type: WidthType.DXA }, shading: { fill: slateLight, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: "Referrals arrive via informal channels; counselors often unaware of active cases", size: 20, font: "Arial", color: slateGray })] })] }),
          ]}),
          new TableRow({ children: [
            new TableCell({ borders, width: { size: 2200, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: "Sri Lanka CERT (SLCERT)", size: 20, font: "Arial", bold: true, color: slate })] })] }),
            new TableCell({ borders, width: { size: 3200, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: "National cybersecurity response; platform takedowns and IP tracing", size: 20, font: "Arial", color: slate })] })] }),
            new TableCell({ borders, width: { size: 3626, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: "Takedown requests depend on manual email chains; no SLA tracking", size: 20, font: "Arial", color: slateGray })] })] }),
          ]}),
          new TableRow({ children: [
            new TableCell({ borders, width: { size: 2200, type: WidthType.DXA }, shading: { fill: slateLight, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: "Legal Aid Commission", size: 20, font: "Arial", bold: true, color: slate })] })] }),
            new TableCell({ borders, width: { size: 3200, type: WidthType.DXA }, shading: { fill: slateLight, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: "Free legal representation and court support for survivors", size: 20, font: "Arial", color: slate })] })] }),
            new TableCell({ borders, width: { size: 3626, type: WidthType.DXA }, shading: { fill: slateLight, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: "Engaged only at the very end of the process — often too late to preserve key evidence", size: 20, font: "Arial", color: slateGray })] })] }),
          ]}),
        ]
      }),
      spacer(160),
      new Paragraph({ children: [new PageBreak()] }),

      // ===== SECTION 2 =====
      h1("2. Strategic Assumptions"),
      para([run("Because no detailed requirements document was provided, this SRS is built on a set of deliberate, well-reasoned assumptions. These are not guesses — they are informed design decisions grounded in the problem context. If any assumption needs revisiting, it is clearly labeled so stakeholders can challenge it without unraveling the rest of the design.")]),
      spacer(80),

      h2("2.1 Organizational Assumptions"),
      bullet("A1 — Lead Agency Model:", "One agency must own each case. The system will auto-assign a \"Lead Owner\" based on incident type. All other agencies are collaborators. This prevents the \"not my problem\" scenario that kills cases today."),
      bullet("A2 — Voluntary Collaboration Framework:", "All six agencies have agreed in principle to data sharing for case management purposes. A formal MoU (Memorandum of Understanding) exists or will be drafted before go-live. Without this, the system cannot legally share case data across organizations."),
      bullet("A3 — Officers Have Basic Digital Literacy:", "Agency officers can use a web-based dashboard on a laptop or tablet. Mobile support is a Phase 2 feature, not Day 1."),
      bullet("A4 — Each Agency Has a Designated System Administrator:", "There is at least one person per agency who manages user access, approvals, and escalations internally. NICMS does not manage internal org hierarchies."),
      bullet("A5 — Existing Case Files Are Out of Scope:", "This system handles new cases from go-live onwards. Migration of historical records is a separate project."),

      spacer(100),
      h2("2.2 Survivor & User Assumptions"),
      bullet("A6 — Not All Survivors Are Digitally Comfortable:", "The public portal must be usable by someone who has never filed an online form. Conversational language, icon-driven choices, and zero technical jargon are mandatory — not optional polish."),
      bullet("A7 — The Threat May Be in the Same Room:", "We assume that in a significant number of cases, the abuser shares a device, a home, or an account with the survivor. The platform must be designed around this threat model. This is why the Panic Button and Justice Key features are core architecture, not afterthoughts."),
      bullet("A8 — Survivors May Not Know Which Agency to Contact:", "The system must ask \"what happened\" — not \"which department handles your problem.\" Routing logic lives in the backend, invisible to the user."),
      bullet("A9 — Anonymity Is a Right, Not an Exception:", "Any survivor must be able to report, upload evidence, and track their case without ever providing a name, phone number, or email address. The Justice Key (16-digit anonymous code) is the mechanism for this."),

      spacer(100),
      h2("2.3 Technical Assumptions"),
      bullet("A10 — Internet Connectivity Is Unreliable in Rural Areas:", "The public portal must function in offline-first mode. Reports started without signal must be preserved locally on the device and synced when connectivity returns. Loss of internet should never mean loss of a survivor's report."),
      bullet("A11 — Evidence Integrity Is a Legal Requirement:", "Any uploaded file — screenshot, video, document — must be treated as potential court evidence from the moment it is received. SHA-256 cryptographic checksums are generated at upload and stored immutably. This chain of custody must be defensible in a Sri Lankan court of law."),
      bullet("A12 — Zero-Knowledge Encryption for All Case Data:", "Victim personally identifiable information (PII) must be encrypted such that Loons Lab developers, cloud infrastructure providers, and unauthorized government employees cannot access it. Only the authorized officer with the correct digital key for a specific case can decrypt that case's sensitive data."),
      bullet("A13 — The System Must Handle Concurrent Multi-Agency Access:", "A case may be simultaneously accessed by a Police officer updating a report, a CCID analyst uploading evidence, and a MoWCA counselor reviewing the timeline. The system must handle concurrent edits gracefully with version locking on the Unified Case File."),
      bullet("A14 — Platform Must Be Browser-Based (No App Install Required):", "Requiring survivors or officers to install an app creates a barrier. The system is a responsive web application accessible on any device through a browser. There is no native mobile app in Phase 1."),

      spacer(100),
      h2("2.4 Compliance & Legal Assumptions"),
      bullet("A15 — Governed by Sri Lankan Law:", "The system will comply with the Personal Data Protection Act (PDPA) of Sri Lanka and any relevant provisions of the Computer Crimes Act. Data residency will be within Sri Lanka."),
      bullet("A16 — NCPA Involvement Is Auto-Triggered for Minors:", "If a survivor indicates that the victim is under 18 years old at any point in the intake, NCPA is automatically added to the case — regardless of the initial incident type. This is a mandatory legal workflow, not a user choice."),
      bullet("A17 — The 4-Hour Handshake SLA Is Enforceable:", "When a case is referred from one agency to another, the receiving agency has 4 hours to formally \"accept\" the referral within the system. Failure to do so triggers an automatic escalation alert to the referring agency's supervisor. This SLA has been agreed to by all participating agencies."),
      new Paragraph({ children: [new PageBreak()] }),

      // ===== SECTION 3 =====
      h1("3. Software Requirements Specification (SRS)"),
      h2("3.1 Product Overview"),
      para([run("NICMS is a "), boldRun("centralized, trauma-informed digital case management platform"), run(" that serves two distinct user groups: survivors and officers. It is not a reporting portal that simply collects data. It is a living ecosystem where cases are actively managed, agencies collaborate in real time, evidence is preserved with legal integrity, and survivors are never left wondering what is happening with their case.")]),
      spacer(80),
      callout(
        "Design Philosophy",
        "Every design decision in this system starts with the same question: \"Is this feature designed for the convenience of the bureaucracy, or for the safety of the survivor?\" When those two goals conflict — and they will — survivor safety wins. Always.",
        tealLight, teal
      ),
      spacer(120),

      h2("3.2 Functional Requirements — Public Portal (Survivor Facing)"),
      spacer(80),
      sectionBadge("FR-01 to FR-08: The Survivor Journey", tealMid),
      spacer(120),

      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [900, 4626, 1100, 2400],
        rows: [
          tableHeader(["Req. ID", "Description", "Priority", "Rationale"], [900, 4626, 1100, 2400]),
          requirementRow("FR-01", "Conversational Incident Intake Form — The reporting flow must feel like a guided conversation, not a government form. Questions appear one at a time. Language is plain, warm, and free of legal jargon. Dynamic logic adapts follow-up questions based on answers (e.g., if user selects 'social media,' the next question asks for platform links and screenshots).", "Critical", "Re-victimization prevention; increases form completion rate"),
          requirementRow("FR-02", "Justice Key Generation — Any survivor who opts to report anonymously receives a unique 16-digit alphanumeric code (format: JK-XXXX-XXXX-XXXX) immediately upon submission. This key is the sole identifier for their case. No email, phone, or name is required. The key must be generated client-side and displayed once, clearly, before submission is finalized.", "Critical", "Assumption A9 — anonymity as a right"),
          requirementRow("FR-03", "Anonymous Case Tracking via Justice Key — Any person holding a valid Justice Key can enter it on the tracking page (from any device, any browser, no login) to view: current case status, which agencies are involved, timestamps of each action, and whether their evidence vault is sealed and intact.", "Critical", "Survivor agency; prevents helplessness and drop-off"),
          requirementRow("FR-04", "Evidence Vault with SHA-256 Fingerprinting — Every file uploaded (images, videos, PDFs, audio recordings) must immediately receive a SHA-256 cryptographic checksum. This hash is stored in an immutable audit log. The system must display a visual confirmation to the survivor that their evidence is 'sealed.' No modification to the original file is possible after upload.", "Critical", "Assumption A11 — legal chain of custody"),
          requirementRow("FR-05", "Offline-First Caching — If a survivor begins a report and loses internet connectivity, all entered data must be cached locally using browser IndexedDB storage. A visible banner must inform the user of the offline state. On reconnection, data syncs automatically and the user is notified.", "High", "Assumption A10 — rural connectivity"),
          requirementRow("FR-06", "Panic Button (Safety Exit) — A persistent floating button labeled 'Quick Exit' must appear on every page of the public portal. Clicking it immediately navigates the browser to a neutral external page (e.g., a weather search). No browser history of the NICMS session should be recoverable after this action. This feature must work even on slow connections and during form completion.", "Critical", "Assumption A7 — shared device threat model"),
          requirementRow("FR-07", "Adaptive Language & Accessibility — The public portal must be available in Sinhala, Tamil, and English. All form labels and help text must be written at a reading level accessible to a person with a Grade 6 education. Screen reader compatibility (WCAG 2.1 AA) is mandatory.", "High", "Inclusivity; Sri Lanka's linguistic diversity"),
          requirementRow("FR-08", "Multi-Platform Attachment — Survivors reporting TFGBV incidents must be able to paste social media URLs, platform names, and upload screenshots or videos directly in the form. The system must accept all common file formats (JPEG, PNG, MP4, MOV, PDF, MP3) up to 500MB total per submission.", "High", "TFGBV evidence is often digital-only"),
        ]
      }),
      spacer(200),

      h2("3.3 Functional Requirements — Agency Nexus (Officer Facing)"),
      spacer(80),
      sectionBadge("FR-09 to FR-17: The Officer Workspace", slateGray),
      spacer(120),

      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [900, 4626, 1100, 2400],
        rows: [
          tableHeader(["Req. ID", "Description", "Priority", "Rationale"], [900, 4626, 1100, 2400]),
          requirementRow("FR-09", "Unified Case File (UCF) — Every case has one canonical file visible to all authorized agencies. The UCF contains: incident summary, full evidence vault, case timeline with all agency actions, survivor contact details (if provided, encrypted), and a Collaboration Hub. No agency has a 'private' version of a case.", "Critical", "Single source of truth; eliminates re-questioning"),
          requirementRow("FR-10", "Auto-Routing Intelligence — Upon intake, the system analyzes incident type, keywords, evidence type, and any minor-involvement flag to assign a Lead Agency and notify all relevant supporting agencies simultaneously. Routing logic is rule-based and auditable by system administrators.", "Critical", "Removes human delay in case assignment"),
          requirementRow("FR-11", "Digital Handshake Protocol — Every inter-agency referral requires a formal acceptance within the system. The receiving agency must acknowledge the referral within 4 hours. If they do not, an automated high-priority alert is sent to their designated supervisor. The handshake timestamp is permanently recorded in the case audit log.", "Critical", "Assumption A17 — accountability SLA"),
          requirementRow("FR-12", "Kanban Case Dashboard — The officer-facing dashboard presents all cases as Kanban cards across four stages: New Report, Under Review, Action Needed, and Resolved. Cards display case ID, incident type, priority level, assigned agencies, and time elapsed. Officers can filter by agency, date range, priority, and incident type.", "High", "Visual case management; prevents backlog blindness"),
          requirementRow("FR-13", "Secure In-Case Collaboration Chat — Each case has a dedicated, end-to-end encrypted messaging thread accessible only to officers assigned to that case. Messages are permanently logged as part of the case audit trail and cannot be deleted. This replaces informal WhatsApp or email communications between agencies.", "High", "Formal, documented inter-agency communication"),
          requirementRow("FR-14", "Case Priority Auto-Escalation — Cases marked High Priority that remain in 'New Report' status for more than 2 hours must be automatically escalated to a supervisory alert. Cases involving minors are always treated as High Priority regardless of incident type.", "Critical", "Prevents high-risk cases from falling through cracks"),
          requirementRow("FR-15", "Evidence Access with Role-Based Permissions — Officers can only access evidence from cases assigned to their agency. A SLCERT officer cannot view the counseling notes from a MoWCA referral, and vice versa. Permission boundaries are defined by case role, not organizational rank.", "Critical", "Assumption A12 — zero-knowledge privacy model"),
          requirementRow("FR-16", "Incident Heatmap & Analytics — A geographic visualization of case distribution by district, overlaid with case type, allows supervisors to identify hotspots, allocate resources, and generate compliance reports for policy bodies.", "Medium", "Policy-level visibility; resource planning"),
          requirementRow("FR-17", "Audit Trail & Immutable Log — Every action in the system — file upload, case assignment, message sent, status change, handshake accepted, login, evidence accessed — is recorded in a tamper-proof audit log with timestamp, actor, and IP address. This log is the system of record in any legal proceeding.", "Critical", "Legal defensibility; internal accountability"),
        ]
      }),
      spacer(200),
      new Paragraph({ children: [new PageBreak()] }),

      h2("3.4 Non-Functional Requirements"),
      spacer(80),

      h3("3.4.1 Security"),
      bullet("NFR-S1 — End-to-end encryption for all data in transit (TLS 1.3 minimum) and at rest (AES-256)."),
      bullet("NFR-S2 — Zero-knowledge architecture: case PII is encrypted with agency-specific keys. Loons Lab infrastructure cannot decrypt survivor data."),
      bullet("NFR-S3 — Multi-factor authentication (MFA) is mandatory for all officer accounts."),
      bullet("NFR-S4 — Automated session timeout after 15 minutes of inactivity for officer-facing portals."),
      bullet("NFR-S5 — Penetration testing must be completed by a certified third party before production launch."),
      bullet("NFR-S6 — All production data must reside on servers physically located within Sri Lanka (data residency compliance)."),

      spacer(100),
      h3("3.4.2 Performance"),
      bullet("NFR-P1 — The public portal must achieve a full page load time of under 3 seconds on a 3G mobile connection."),
      bullet("NFR-P2 — File upload confirmation and SHA-256 checksum generation must complete within 5 seconds for files under 50MB."),
      bullet("NFR-P3 — The system must support 500 concurrent officer sessions without performance degradation."),
      bullet("NFR-P4 — Database query response time for case lookups must not exceed 800ms at the 95th percentile."),
      bullet("NFR-P5 — System availability: 99.5% uptime SLA, with scheduled maintenance only between 02:00–04:00 local time."),

      spacer(100),
      h3("3.4.3 Usability"),
      bullet("NFR-U1 — A survivor with no prior digital platform experience must be able to complete a full incident report in under 8 minutes. This benchmark must be validated in usability testing with real users before launch."),
      bullet("NFR-U2 — All public-facing error messages must be written in plain language. No technical error codes visible to survivors."),
      bullet("NFR-U3 — The platform must meet WCAG 2.1 Level AA accessibility standards, including screen reader support, keyboard navigation, and sufficient color contrast."),
      bullet("NFR-U4 — Color palette on the public portal must avoid red and aggressive imagery. Clinical research consistently shows that calm tones (blue-greens, whites, soft grays) reduce perceived stress in trauma-adjacent contexts."),

      spacer(100),
      h3("3.4.4 Reliability & Data Integrity"),
      bullet("NFR-R1 — Offline-first architecture must ensure zero data loss during connectivity interruptions during form submission."),
      bullet("NFR-R2 — Evidence file checksums must be re-verified on a nightly schedule. Any tamper detection must trigger an immediate security alert to the system administrator."),
      bullet("NFR-R3 — Daily automated backups of all case data, stored in a geographically separate data center, with point-in-time recovery capability going back 90 days."),
      spacer(120),
      new Paragraph({ children: [new PageBreak()] }),

      // ===== SECTION 4 =====
      h1("4. High-Level System Design"),
      h2("4.1 System Architecture Overview"),
      para([run("NICMS is architected as two distinct but deeply connected applications sharing a single secure backend. The separation is intentional and important: the public portal is designed to feel like a safe, warm space. The agency nexus is designed to feel like a powerful command center. Same data. Completely different experience. This architectural separation also allows each surface to be secured and deployed independently.")]),
      spacer(120),

      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [4400, 4626],
        rows: [
          tableHeader(["Component 1: Public Portal", "Component 2: Agency Nexus"], [4400, 4626]),
          new TableRow({ children: [
            new TableCell({ borders, width: { size: 4400, type: WidthType.DXA }, margins: { top: 120, bottom: 120, left: 140, right: 140 }, children: [
              new Paragraph({ spacing: { before: 0, after: 80 }, children: [new TextRun({ text: "Primary Users", size: 20, font: "Arial", bold: true, color: teal })] }),
              new Paragraph({ spacing: { before: 0, after: 120 }, children: [new TextRun({ text: "Survivors, concerned citizens, anonymous reporters", size: 20, font: "Arial", color: slate })] }),
              new Paragraph({ spacing: { before: 0, after: 80 }, children: [new TextRun({ text: "Key Design Principle", size: 20, font: "Arial", bold: true, color: teal })] }),
              new Paragraph({ spacing: { before: 0, after: 120 }, children: [new TextRun({ text: "Minimalist, calming, non-threatening. No police or government branding. Survivor psychological safety above all.", size: 20, font: "Arial", color: slate })] }),
              new Paragraph({ spacing: { before: 0, after: 80 }, children: [new TextRun({ text: "Core Features", size: 20, font: "Arial", bold: true, color: teal })] }),
              new Paragraph({ spacing: { before: 0, after: 40 }, children: [new TextRun({ text: "\u2022  Conversational incident reporting form", size: 20, font: "Arial", color: slate })] }),
              new Paragraph({ spacing: { before: 0, after: 40 }, children: [new TextRun({ text: "\u2022  Evidence upload with vault sealing", size: 20, font: "Arial", color: slate })] }),
              new Paragraph({ spacing: { before: 0, after: 40 }, children: [new TextRun({ text: "\u2022  Justice Key generation for anonymous access", size: 20, font: "Arial", color: slate })] }),
              new Paragraph({ spacing: { before: 0, after: 40 }, children: [new TextRun({ text: "\u2022  Panic button (instant safe exit)", size: 20, font: "Arial", color: slate })] }),
              new Paragraph({ spacing: { before: 0, after: 40 }, children: [new TextRun({ text: "\u2022  Case progress tracking (anonymous)", size: 20, font: "Arial", color: slate })] }),
              new Paragraph({ spacing: { before: 0, after: 40 }, children: [new TextRun({ text: "\u2022  Offline-first caching and sync", size: 20, font: "Arial", color: slate })] }),
            ] }),
            new TableCell({ borders, width: { size: 4626, type: WidthType.DXA }, margins: { top: 120, bottom: 120, left: 140, right: 140 }, children: [
              new Paragraph({ spacing: { before: 0, after: 80 }, children: [new TextRun({ text: "Primary Users", size: 20, font: "Arial", bold: true, color: teal })] }),
              new Paragraph({ spacing: { before: 0, after: 120 }, children: [new TextRun({ text: "Officers from all six government agencies", size: 20, font: "Arial", color: slate })] }),
              new Paragraph({ spacing: { before: 0, after: 80 }, children: [new TextRun({ text: "Key Design Principle", size: 20, font: "Arial", bold: true, color: teal })] }),
              new Paragraph({ spacing: { before: 0, after: 120 }, children: [new TextRun({ text: "Powerful, clear, fast. Every case visible. Every action accountable. Every agency a click away from collaboration.", size: 20, font: "Arial", color: slate })] }),
              new Paragraph({ spacing: { before: 0, after: 80 }, children: [new TextRun({ text: "Core Features", size: 20, font: "Arial", bold: true, color: teal })] }),
              new Paragraph({ spacing: { before: 0, after: 40 }, children: [new TextRun({ text: "\u2022  Kanban case board (New / Review / Action / Resolved)", size: 20, font: "Arial", color: slate })] }),
              new Paragraph({ spacing: { before: 0, after: 40 }, children: [new TextRun({ text: "\u2022  Unified Case File (UCF) with all agency data", size: 20, font: "Arial", color: slate })] }),
              new Paragraph({ spacing: { before: 0, after: 40 }, children: [new TextRun({ text: "\u2022  Digital Handshake Protocol with SLA alerts", size: 20, font: "Arial", color: slate })] }),
              new Paragraph({ spacing: { before: 0, after: 40 }, children: [new TextRun({ text: "\u2022  Secure in-case collaboration chat", size: 20, font: "Arial", color: slate })] }),
              new Paragraph({ spacing: { before: 0, after: 40 }, children: [new TextRun({ text: "\u2022  Evidence vault access (role-based permissions)", size: 20, font: "Arial", color: slate })] }),
              new Paragraph({ spacing: { before: 0, after: 40 }, children: [new TextRun({ text: "\u2022  Incident heatmap and analytics", size: 20, font: "Arial", color: slate })] }),
            ] }),
          ]}),
        ]
      }),
      spacer(160),

      h2("4.2 Case Routing Logic"),
      para([run("Routing happens automatically at the moment of submission, based on rules defined and maintained by system administrators. The logic is not a black box — every routing decision is recorded and auditable. Here is how the auto-routing decision tree works:")]),
      spacer(80),
      numbered("Incident type is analyzed from the intake form (physical, TFGBV, child, other)."),
      numbered("If the victim is under 18 at any point in the form, NCPA is added to all cases regardless of type."),
      numbered("If the incident involves digital platforms, CCID and SLCERT are added. The CCID becomes co-lead for evidence preservation. SLCERT receives a takedown request task."),
      numbered("For physical/domestic violence cases, Police CWB is always the lead. MoWCA is always notified for psychological support referral."),
      numbered("Lead agency is assigned. All other agencies receive simultaneous notification with 4-hour handshake requirement."),
      numbered("If the survivor indicates they are in immediate danger, an emergency alert is sent to Police CWB regardless of the incident type selected."),
      spacer(120),
      new Paragraph({ children: [new PageBreak()] }),

      // ===== SECTION 5 =====
      h1("5. Constraints & Known Risks"),
      spacer(80),

      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [1600, 4226, 3200],
        rows: [
          tableHeader(["Risk ID", "Risk Description", "Mitigation Strategy"], [1600, 4226, 3200]),
          new TableRow({ children: [
            new TableCell({ borders, width: { size: 1600, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: "RISK-01", size: 20, font: "Arial", bold: true, color: rose })] })] }),
            new TableCell({ borders, width: { size: 4226, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: "Agency resistance to adopting the platform. Each organization has its own legacy system and culture. Officers may resist changing workflows, especially if leadership does not mandate use.", size: 20, font: "Arial", color: slate })] })] }),
            new TableCell({ borders, width: { size: 3200, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: "Conduct co-design workshops with frontline officers from each agency before development begins. Build champions within each organization during the pilot phase.", size: 20, font: "Arial", color: slate })] })] }),
          ]}),
          new TableRow({ children: [
            new TableCell({ borders, width: { size: 1600, type: WidthType.DXA }, shading: { fill: slateLight, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: "RISK-02", size: 20, font: "Arial", bold: true, color: amber })] })] }),
            new TableCell({ borders, width: { size: 4226, type: WidthType.DXA }, shading: { fill: slateLight, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: "Data breach exposing survivor identity. A system that aggregates sensitive victim data is a high-value target for malicious actors, including potentially the perpetrators themselves.", size: 20, font: "Arial", color: slate })] })] }),
            new TableCell({ borders, width: { size: 3200, type: WidthType.DXA }, shading: { fill: slateLight, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: "Zero-knowledge encryption, mandatory MFA, role-based access, third-party penetration testing, and government-grade security audits prior to launch.", size: 20, font: "Arial", color: slate })] })] }),
          ]}),
          new TableRow({ children: [
            new TableCell({ borders, width: { size: 1600, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: "RISK-03", size: 20, font: "Arial", bold: true, color: amber })] })] }),
            new TableCell({ borders, width: { size: 4226, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: "False or malicious reports flooding the system. An anonymous, low-friction reporting system may attract bad-faith reports that waste agency resources.", size: 20, font: "Arial", color: slate })] })] }),
            new TableCell({ borders, width: { size: 3200, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: "AI-assisted triage to flag low-credibility submissions. Define a verification workflow in Phase 2. Rate-limit anonymous submissions per Justice Key per 24 hours.", size: 20, font: "Arial", color: slate })] })] }),
          ]}),
          new TableRow({ children: [
            new TableCell({ borders, width: { size: 1600, type: WidthType.DXA }, shading: { fill: slateLight, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: "RISK-04", size: 20, font: "Arial", bold: true, color: teal })] })] }),
            new TableCell({ borders, width: { size: 4226, type: WidthType.DXA }, shading: { fill: slateLight, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: "Survivors losing their Justice Key with no recovery mechanism. Unlike a password, there is no \"forgot key\" flow by design — for privacy reasons.", size: 20, font: "Arial", color: slate })] })] }),
            new TableCell({ borders, width: { size: 3200, type: WidthType.DXA }, shading: { fill: slateLight, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: "Display the Justice Key prominently, allow it to be printed or screenshot before leaving the page. In Phase 2, explore an optional trusted contact recovery mechanism.", size: 20, font: "Arial", color: slate })] })] }),
          ]}),
          new TableRow({ children: [
            new TableCell({ borders, width: { size: 1600, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: "RISK-05", size: 20, font: "Arial", bold: true, color: teal })] })] }),
            new TableCell({ borders, width: { size: 4226, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: "Legal admissibility of digital evidence in Sri Lankan courts is not fully standardized. A SHA-256 checksum may not be sufficient alone as proof of integrity.", size: 20, font: "Arial", color: slate })] })] }),
            new TableCell({ borders, width: { size: 3200, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: "Engage the Attorney General's Department and Legal Aid Commission in the design review. Ensure the audit log format is compatible with existing court submission standards.", size: 20, font: "Arial", color: slate })] })] }),
          ]}),
        ]
      }),
      spacer(200),
      new Paragraph({ children: [new PageBreak()] }),

      // ===== SECTION 6 =====
      h1("6. What Success Looks Like"),
      para([run("I want to end this document not with a list of metrics but with a picture of what success actually looks like — because the numbers are meaningless without the human context behind them.")]),
      spacer(100),
      callout(
        "The Vision",
        "Success is a survivor in Galle who picks up their phone at 11 PM, shaking, and types what happened to them. They receive a Justice Key. They sleep. In the morning, they open the tracking page and see that two agencies are already working on their case. They didn't have to call anyone. They didn't have to repeat their story. They didn't have to prove themselves to a skeptical officer in a fluorescent-lit waiting room. The system believed them automatically — and acted.\n\nThat is what we are building.",
        tealLight, teal
      ),
      spacer(140),
      para([run("In measurable terms, we will consider this project a success when:")]),
      spacer(60),
      bullet("The average time between incident report and Lead Agency assignment falls below 10 minutes (from the current estimated average of 48+ hours)."),
      bullet("Survivor case drop-off rate — defined as cases where the survivor never follows up after initial report — decreases by at least 40% within 6 months of launch."),
      bullet("100% of inter-agency referrals are formally acknowledged within 4 hours, with a full digital audit trail."),
      bullet("Zero cases of evidence tampering are reported, verified by nightly checksum re-validation."),
      bullet("At least 70% of survivor users rate the reporting experience as \"easy\" or \"very easy\" in post-submission feedback."),
      bullet("All six agencies are active on the platform with at least 80% of new SGBV/TFGBV cases processed through NICMS within 3 months of go-live."),
      spacer(200),

      // ===== CLOSING =====
      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [9026],
        rows: [new TableRow({ children: [new TableCell({
          borders: noBorders,
          shading: { fill: slateLight, type: ShadingType.CLEAR },
          margins: { top: 240, bottom: 240, left: 280, right: 280 },
          children: [
            new Paragraph({ alignment: AlignmentType.LEFT, spacing: { before: 0, after: 100 }, children: [new TextRun({ text: "Document Prepared By", size: 18, font: "Arial", color: slateGray })] }),
            new Paragraph({ alignment: AlignmentType.LEFT, spacing: { before: 0, after: 60 }, children: [new TextRun({ text: "Abishek Pranav GV", size: 28, font: "Arial", bold: true, color: slate })] }),
            new Paragraph({ alignment: AlignmentType.LEFT, spacing: { before: 0, after: 60 }, children: [new TextRun({ text: "Business Analyst — Loons Lab", size: 22, font: "Arial", color: slateGray })] }),
            new Paragraph({ alignment: AlignmentType.LEFT, spacing: { before: 0, after: 0 }, children: [new TextRun({ text: "NICMS Project Lead   |   Version 1.0   |   May 7, 2026   |   Confidential", size: 18, font: "Arial", color: slateGray })] }),
          ]
        })] })]
      }),
      spacer(60),
      para([italicRun("\"This is not about database tables or API integrations. It is about reducing the distance between a cry for help and a meaningful response.\"")]),

    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync('/home/claude/NICMS_SRS_Abishek_Pranav.docx', buffer);
  console.log('Done');
});
