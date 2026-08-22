/**
 * Sovereign AI Workbench — Local Knowledge Store
 * Curated repository of refinery SOPs, standards, and engineering specifications stored completely on-premise.
 */

export const REFINERY_KNOWLEDGE_DOCUMENTS = [
  {
    doc_id: "SOP-MRPL-INSP-042",
    title: "Crude Storage Tank In-Service Inspection & Thickness Evaluation Procedure",
    standard_ref: "OISD-STD-129 / API-653",
    effective_date: "2025-01-01",
    sections: [
      {
        section_id: "SEC-3.1",
        heading: "Retirement Thickness & Safe Operating Limits",
        page: 14,
        content: "For atmospheric storage tanks storing Class-A/B hydrocarbons, if any shell course exhibits measured thickness less than t_min calculated as per API-653 Section 4.3.3, the tank must be de-rated or isolated immediately. Shell Course 3 retirement limit for 20m diameter tanks is established at 6.80 mm."
      },
      {
        section_id: "SEC-4.2",
        heading: "Corrosion Under Insulation (CUI) Management",
        page: 22,
        content: "When CUI is detected in the vicinity of critical nozzles or shell seams, insulation must be removed to a minimum perimeter of 300 mm around the affected zone. Full ultrasonic A-scan grid mapping (50mm x 50mm grid) is mandatory prior to repair clearance."
      },
      {
        section_id: "SEC-7.4",
        heading: "Emergency Repair & Approval Protocol",
        page: 38,
        content: "Temporary patch plates are strictly prohibited on shell courses exceeding 12 mm nominal thickness. Permanent flush weld insert patches with 100% radiographic examination (RT) and magnetic particle testing (MPT) must be approved by the Chief Inspection Engineer and GM (Operations)."
      }
    ]
  },
  {
    doc_id: "SOP-MRPL-SAFE-018",
    title: "Refinery Permit-To-Work (PTW) & Hot Work Safety Protocol",
    standard_ref: "OISD-STD-105",
    effective_date: "2025-06-15",
    sections: [
      {
        section_id: "SEC-2.1",
        heading: "Hot Work Authorization in Hydrocarbon Tankage Area",
        page: 8,
        content: "Hot work within 15 meters of storage tanks requires continuous combustible gas monitoring (LEL < 0%). Positive isolation via spade/blind insertion is mandatory. Gas test certificates must be renewed every 4 hours."
      }
    ]
  }
];

export function listKnowledgeDocuments() {
  return REFINERY_KNOWLEDGE_DOCUMENTS;
}
