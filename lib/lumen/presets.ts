/**
 * Lumen — Pre-made document templates
 * Each template has:
 *   - previewHtml : full standalone HTML for the iframe gallery preview
 *   - editorContent : semantic body HTML loaded into the WYSIWYG editor
 */

export interface LumenPreset {
  id:            string;
  name:          string;
  description:   string;
  icon:          string;
  fields:        string[];        // variable names used in this template
  previewHtml:   string;          // full HTML for iframe preview
  editorContent: string;          // body HTML for TipTap editor
}

export interface LumenCategory {
  id:          string;
  name:        string;
  icon:        string;
  description: string;
  color:       string;
  presets:     LumenPreset[];
}

// ── Shared CSS for iframe previews ────────────────────────────────────────────
const BASE = `*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Segoe UI', Arial, sans-serif; color: #111827; background: #fff; padding: 40px; }
.doc { max-width: 700px; margin: 0 auto; }`;

// ═══════════════════════════════════════════════════════════════════════════════
// FACTURES & DEVIS
// ═══════════════════════════════════════════════════════════════════════════════

const FACTURE_PREVIEW = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><style>${BASE}
.hd{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:16px;border-bottom:3px solid #1d4ed8;margin-bottom:28px}
.hd h1{font-size:22px;font-weight:800;color:#1d4ed8}.hd p{font-size:12px;color:#6b7280;margin-top:4px}
.meta{text-align:right;font-size:13px;color:#374151;line-height:1.8}
.badge{display:inline-block;background:#dbeafe;color:#1d4ed8;font-weight:700;font-size:11px;padding:2px 10px;border-radius:99px;margin-bottom:6px}
.box{background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:14px 18px;margin-bottom:24px}
.lbl{font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#9ca3af;margin-bottom:5px}
table{width:100%;border-collapse:collapse;margin-bottom:20px}
thead tr{background:#1d4ed8;color:#fff}thead th{padding:9px 11px;text-align:left;font-size:12px}
tbody td{padding:8px 11px;font-size:13px;border-bottom:1px solid #e5e7eb}tbody tr:nth-child(even){background:#f9fafb}
.tot{display:flex;justify-content:flex-end}.tot-inner{width:240px}
.tr{display:flex;justify-content:space-between;font-size:13px;padding:5px 0;color:#374151;border-bottom:1px solid #f3f4f6}
.tr.fin{font-size:15px;font-weight:800;color:#1d4ed8;border-top:2px solid #1d4ed8;border-bottom:none;padding-top:8px;margin-top:3px}
.foot{margin-top:36px;padding-top:12px;border-top:1px solid #e5e7eb;font-size:11px;color:#9ca3af;display:flex;justify-content:space-between}
</style></head><body><div class="doc">
<div class="hd"><div><h1>{{ entreprise }}</h1><p>{{ adresse_entreprise }}<br>SIRET : {{ siret }}</p></div>
<div class="meta"><div class="badge">FACTURE</div><br>N° {{ numero_facture }}<br>Date : {{ date }}<br>Échéance : {{ echeance }}</div></div>
<div class="box"><div class="lbl">Facturé à</div><p style="font-size:14px;line-height:1.7">{{ nom_client }}<br>{{ adresse_client }}<br>{{ ville_client }}</p></div>
<table><thead><tr><th>Description</th><th>Qté</th><th>Prix U. HT</th><th>Total HT</th></tr></thead>
<tbody><tr><td>{{ description_service }}</td><td>{{ quantite }}</td><td>{{ prix_unitaire }} €</td><td>{{ total_ht }} €</td></tr></tbody></table>
<div class="tot"><div class="tot-inner">
<div class="tr"><span>Total HT</span><span>{{ total_ht }} €</span></div>
<div class="tr"><span>TVA ({{ taux_tva }}%)</span><span>{{ montant_tva }} €</span></div>
<div class="tr fin"><span>Total TTC</span><span>{{ total_ttc }} €</span></div>
</div></div>
<div class="foot"><span>{{ entreprise }} · {{ contact_entreprise }}</span><span>Merci de votre confiance</span></div>
</div></body></html>`;

const FACTURE_EDITOR = `<h1>FACTURE N° {{ numero_facture }}</h1>
<p><strong>{{ entreprise }}</strong><br>{{ adresse_entreprise }}<br>SIRET : {{ siret }} · {{ contact_entreprise }}</p>
<hr>
<p><strong>Date :</strong> {{ date }} &nbsp;|&nbsp; <strong>Échéance :</strong> {{ echeance }}</p>
<h2>Facturé à</h2>
<p>{{ nom_client }}<br>{{ adresse_client }}<br>{{ ville_client }}</p>
<table>
<tr><th>Description</th><th>Qté</th><th>Prix unitaire HT</th><th>Total HT</th></tr>
<tr><td>{{ description_service }}</td><td>{{ quantite }}</td><td>{{ prix_unitaire }} €</td><td>{{ total_ht }} €</td></tr>
</table>
<p><strong>Total HT :</strong> {{ total_ht }} €</p>
<p><strong>TVA {{ taux_tva }}% :</strong> {{ montant_tva }} €</p>
<p><strong>Total TTC :</strong> {{ total_ttc }} €</p>
<hr>
<p>{{ entreprise }} · {{ contact_entreprise }}</p>`;

const DEVIS_EDITOR = `<h1>DEVIS N° {{ numero_devis }}</h1>
<p><strong>{{ entreprise }}</strong><br>{{ adresse_entreprise }}<br>SIRET : {{ siret }} · {{ contact_entreprise }}</p>
<hr>
<p><strong>Date :</strong> {{ date }} &nbsp;|&nbsp; <strong>Validité :</strong> {{ validite }}</p>
<h2>Destinataire</h2>
<p>{{ nom_client }}<br>{{ adresse_client }}<br>{{ ville_client }}</p>
<table>
<tr><th>Description</th><th>Qté</th><th>Prix unitaire HT</th><th>Total HT</th></tr>
<tr><td>{{ description_service }}</td><td>{{ quantite }}</td><td>{{ prix_unitaire }} €</td><td>{{ total_ht }} €</td></tr>
</table>
<p><strong>Total HT :</strong> {{ total_ht }} €</p>
<p><strong>TVA {{ taux_tva }}% :</strong> {{ montant_tva }} €</p>
<p><strong>Total TTC :</strong> {{ total_ttc }} €</p>
<hr>
<p>Devis valable jusqu'au {{ validite }}. {{ entreprise }} · {{ contact_entreprise }}</p>`;

// ═══════════════════════════════════════════════════════════════════════════════
// COURRIERS
// ═══════════════════════════════════════════════════════════════════════════════

const LETTRE_COMM_EDITOR = `<p><strong>{{ entreprise }}</strong><br>{{ adresse_entreprise }}<br>{{ contact_entreprise }}</p>
<p style="text-align:right">{{ nom_client }}<br>{{ adresse_client }}<br>{{ ville_client }}</p>
<p>{{ lieu }}, le {{ date }}</p>
<p><strong>Objet : {{ objet }}</strong></p>
<p>{{ formule_appel }} {{ nom_client }},</p>
<p>{{ contenu }}</p>
<p>Dans l'attente de votre retour, nous restons disponibles à {{ contact_entreprise }}.</p>
<p>Veuillez agréer, {{ formule_appel }} {{ nom_client }}, l'expression de nos sincères salutations.</p>
<p><strong>{{ signataire }}</strong><br>{{ poste }}</p>`;

const LETTRE_FORM_EDITOR = `<p><strong>{{ expediteur }}</strong><br>{{ adresse_expediteur }}<br>{{ contact_expediteur }}</p>
<p style="text-align:right">{{ destinataire }}<br>{{ adresse_destinataire }}</p>
<p>{{ lieu }}, le {{ date }}</p>
<p><strong>Objet : {{ objet }}</strong></p>
<p>{{ formule_appel }},</p>
<p>{{ contenu }}</p>
<p>Dans l'attente de votre réponse, je vous prie d'agréer, {{ formule_appel }}, l'expression de mes respectueuses salutations.</p>
<p><strong>{{ expediteur }}</strong></p>`;

// ═══════════════════════════════════════════════════════════════════════════════
// ATTESTATIONS & CERTIFICATS
// ═══════════════════════════════════════════════════════════════════════════════

const ATTEST_EDITOR = `<h1 style="text-align:center">ATTESTATION</h1>
<p style="text-align:center"><strong>{{ organisation }}</strong><br>{{ adresse_organisation }}</p>
<hr>
<p>Je soussigné(e) <strong>{{ signataire }}</strong>, <strong>{{ poste }}</strong> de <strong>{{ organisation }}</strong>,</p>
<p>certifie que</p>
<p><strong>{{ nom_personne }}</strong></p>
<p>{{ motif_attestation }}</p>
<p>du <strong>{{ date_debut }}</strong> au <strong>{{ date_fin }}</strong>.</p>
<hr>
<p>Fait à {{ lieu }}, le {{ date }}</p>
<p><strong>{{ signataire }}</strong><br>{{ poste }}</p>`;

const CERTIF_EDITOR = `<h1 style="text-align:center">CERTIFICAT</h1>
<p style="text-align:center">{{ sous_titre }}</p>
<p style="text-align:center"><strong>{{ organisation }}</strong></p>
<hr>
<p style="text-align:center">est décerné à</p>
<h2 style="text-align:center">{{ nom_beneficiaire }}</h2>
<p style="text-align:center">{{ motif }}</p>
<p style="text-align:center">{{ details }}</p>
<hr>
<p>Le {{ date }} à {{ lieu }}</p>
<p><strong>{{ signataire }}</strong> — {{ poste }}</p>
<p><strong>{{ validateur }}</strong> — {{ poste_validateur }}</p>`;

// ═══════════════════════════════════════════════════════════════════════════════
// COMPTABILITÉ
// ═══════════════════════════════════════════════════════════════════════════════

const RECU_EDITOR = `<h1>Reçu de paiement N° {{ numero_recu }}</h1>
<p><strong>Date :</strong> {{ date }}</p>
<hr>
<p><strong>Payé par :</strong> {{ payeur }}</p>
<p><strong>Montant :</strong> {{ montant }} €</p>
<p><strong>Motif :</strong> {{ motif }}</p>
<p><strong>Mode de paiement :</strong> {{ mode_paiement }}</p>
<p><strong>Encaissé par :</strong> {{ encaisse_par }}</p>
<hr>
<p>{{ organisation }} · {{ contact_organisation }}</p>`;

const NOTE_FRAIS_EDITOR = `<h1>Note de frais</h1>
<p><strong>{{ organisation }}</strong> · Période : {{ periode }}</p>
<hr>
<p><strong>Collaborateur :</strong> {{ nom_collaborateur }}</p>
<p><strong>Projet / Service :</strong> {{ projet }}</p>
<p><strong>Date de soumission :</strong> {{ date }}</p>
<p><strong>Responsable :</strong> {{ responsable }}</p>
<table>
<tr><th>Date</th><th>Description</th><th>Catégorie</th><th>Montant</th></tr>
<tr><td>{{ date_depense }}</td><td>{{ description_depense }}</td><td>{{ categorie_depense }}</td><td>{{ montant_depense }} €</td></tr>
</table>
<p><strong>Total : {{ total_frais }} €</strong></p>
<hr>
<p>Collaborateur : {{ nom_collaborateur }} &nbsp;|&nbsp; Validé par : {{ responsable }}</p>`;

// ═══════════════════════════════════════════════════════════════════════════════
// SIMPLE generic preview for non-facture templates
// ═══════════════════════════════════════════════════════════════════════════════
function simplePreview(editorContent: string): string {
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
<style>${BASE}
h1{font-size:22px;font-weight:800;margin-bottom:8px}
h2{font-size:17px;font-weight:700;margin:14px 0 5px}
p{margin-bottom:8px;font-size:14px;line-height:1.8;color:#374151}
hr{border:none;border-top:1px solid #e5e7eb;margin:14px 0}
table{width:100%;border-collapse:collapse;margin:10px 0}
th{background:#1d4ed8;color:#fff;padding:8px 10px;text-align:left;font-size:12px}
td{padding:7px 10px;border:1px solid #e5e7eb;font-size:13px}
</style></head><body><div class="doc">${editorContent}</div></body></html>`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CATEGORY DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

export const LUMEN_CATEGORIES: LumenCategory[] = [
  {
    id:          "factures",
    name:        "Factures & Devis",
    icon:        "🧾",
    description: "Factures professionnelles, devis et propositions commerciales",
    color:       "#1d4ed8",
    presets: [
      {
        id:            "facture",
        name:          "Facture standard",
        description:   "Facture avec détail des prestations, TVA et total TTC.",
        icon:          "🧾",
        fields:        ["entreprise","adresse_entreprise","siret","contact_entreprise","numero_facture","date","echeance","nom_client","adresse_client","ville_client","description_service","quantite","prix_unitaire","total_ht","taux_tva","montant_tva","total_ttc"],
        previewHtml:   FACTURE_PREVIEW,
        editorContent: FACTURE_EDITOR,
      },
      {
        id:            "devis",
        name:          "Devis",
        description:   "Proposition commerciale chiffrée avec date de validité.",
        icon:          "📋",
        fields:        ["entreprise","adresse_entreprise","siret","contact_entreprise","numero_devis","date","validite","nom_client","adresse_client","ville_client","description_service","quantite","prix_unitaire","total_ht","taux_tva","montant_tva","total_ttc"],
        previewHtml:   simplePreview(DEVIS_EDITOR),
        editorContent: DEVIS_EDITOR,
      },
    ],
  },
  {
    id:          "courriers",
    name:        "Courriers",
    icon:        "✉️",
    description: "Lettres formelles et commerciales personnalisées",
    color:       "#059669",
    presets: [
      {
        id:            "lettre-commerciale",
        name:          "Lettre commerciale",
        description:   "Courrier professionnel d'entreprise avec objet et formule de politesse.",
        icon:          "✉️",
        fields:        ["entreprise","adresse_entreprise","contact_entreprise","nom_client","adresse_client","ville_client","lieu","date","objet","formule_appel","contenu","signataire","poste"],
        previewHtml:   simplePreview(LETTRE_COMM_EDITOR),
        editorContent: LETTRE_COMM_EDITOR,
      },
      {
        id:            "lettre-formelle",
        name:          "Lettre formelle",
        description:   "Lettre officielle entre particuliers ou à une administration.",
        icon:          "📄",
        fields:        ["expediteur","adresse_expediteur","contact_expediteur","destinataire","adresse_destinataire","lieu","date","objet","formule_appel","contenu"],
        previewHtml:   simplePreview(LETTRE_FORM_EDITOR),
        editorContent: LETTRE_FORM_EDITOR,
      },
    ],
  },
  {
    id:          "attestations",
    name:        "Attestations & Certificats",
    icon:        "🏅",
    description: "Documents officiels, certifications et diplômes",
    color:       "#7c3aed",
    presets: [
      {
        id:            "attestation",
        name:          "Attestation",
        description:   "Attestation certifiant un emploi, une présence ou un statut.",
        icon:          "🏅",
        fields:        ["organisation","adresse_organisation","signataire","poste","nom_personne","motif_attestation","date_debut","date_fin","lieu","date"],
        previewHtml:   simplePreview(ATTEST_EDITOR),
        editorContent: ATTEST_EDITOR,
      },
      {
        id:            "certificat",
        name:          "Certificat / Diplôme",
        description:   "Certificat ou diplôme personnalisé à remettre à un bénéficiaire.",
        icon:          "🎖️",
        fields:        ["organisation","sous_titre","nom_beneficiaire","motif","details","date","lieu","signataire","poste","validateur","poste_validateur"],
        previewHtml:   simplePreview(CERTIF_EDITOR),
        editorContent: CERTIF_EDITOR,
      },
    ],
  },
  {
    id:          "comptabilite",
    name:        "Comptabilité",
    icon:        "💰",
    description: "Reçus de paiement, notes de frais et documents financiers",
    color:       "#b45309",
    presets: [
      {
        id:            "recu-paiement",
        name:          "Reçu de paiement",
        description:   "Reçu simple confirmant la réception d'un paiement.",
        icon:          "💳",
        fields:        ["numero_recu","date","payeur","montant","motif","mode_paiement","encaisse_par","organisation","contact_organisation"],
        previewHtml:   simplePreview(RECU_EDITOR),
        editorContent: RECU_EDITOR,
      },
      {
        id:            "note-frais",
        name:          "Note de frais",
        description:   "Fiche de remboursement de frais professionnels.",
        icon:          "📊",
        fields:        ["organisation","periode","nom_collaborateur","projet","date","responsable","date_depense","description_depense","categorie_depense","montant_depense","total_frais"],
        previewHtml:   simplePreview(NOTE_FRAIS_EDITOR),
        editorContent: NOTE_FRAIS_EDITOR,
      },
    ],
  },
];

// Flat list for backward compat
export const PRESETS: LumenPreset[] = LUMEN_CATEGORIES.flatMap((c) => c.presets);
