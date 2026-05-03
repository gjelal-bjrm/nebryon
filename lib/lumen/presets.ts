/**
 * Lumen — Pre-made document templates
 * Each template includes a name, category, description, required fields, and full HTML.
 */

export type TemplateCategory = "entreprise" | "personnel" | "comptabilite" | "autre";

export interface LumenPreset {
  id:          string;
  name:        string;
  category:    TemplateCategory;
  description: string;
  icon:        string;
  fields:      string[];   // variable names used in the template
  html:        string;
}

// ── Shared CSS injected in every template ────────────────────────────────────
const BASE_CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; background: #fff; color: #111827; padding: 40px; }
  .doc { max-width: 700px; margin: 0 auto; }
  @media print { body { padding: 0; } }
`;

// ── ENTREPRISE ────────────────────────────────────────────────────────────────

const FACTURE_HTML = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><style>${BASE_CSS}
  .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:32px; }
  .brand h1 { font-size:22px; font-weight:800; color:#1d4ed8; }
  .brand p  { font-size:12px; color:#6b7280; margin-top:4px; }
  .meta { text-align:right; font-size:13px; color:#374151; line-height:1.7; }
  .meta .badge { display:inline-block; background:#dbeafe; color:#1d4ed8; font-weight:700;
    font-size:11px; padding:2px 10px; border-radius:99px; margin-bottom:6px; }
  .client-box { background:#f9fafb; border:1px solid #e5e7eb; border-radius:8px;
    padding:16px 20px; margin-bottom:28px; }
  .client-box .label { font-size:10px; text-transform:uppercase; letter-spacing:1px;
    color:#9ca3af; margin-bottom:6px; }
  .client-box p { font-size:14px; line-height:1.7; color:#374151; }
  table { width:100%; border-collapse:collapse; margin-bottom:24px; }
  thead tr { background:#1d4ed8; color:#fff; }
  thead th { padding:10px 12px; text-align:left; font-size:12px; font-weight:600; }
  tbody tr:nth-child(even) { background:#f9fafb; }
  tbody td { padding:9px 12px; font-size:13px; color:#374151; border-bottom:1px solid #e5e7eb; }
  .total-box { display:flex; justify-content:flex-end; }
  .total-inner { width:260px; }
  .total-row { display:flex; justify-content:space-between; font-size:13px;
    padding:6px 0; color:#374151; border-bottom:1px solid #f3f4f6; }
  .total-row.final { font-size:16px; font-weight:800; color:#1d4ed8;
    border-top:2px solid #1d4ed8; border-bottom:none; padding-top:10px; margin-top:4px; }
  .footer { margin-top:40px; padding-top:14px; border-top:1px solid #e5e7eb;
    font-size:11px; color:#9ca3af; display:flex; justify-content:space-between; }
</style></head><body><div class="doc">
  <div class="header">
    <div class="brand">
      <h1>{{ entreprise }}</h1>
      <p>{{ adresse_entreprise }}<br>SIRET : {{ siret }}</p>
    </div>
    <div class="meta">
      <div class="badge">FACTURE</div><br>
      N° {{ numero_facture }}<br>
      Date : {{ date }}<br>
      Échéance : {{ echeance }}
    </div>
  </div>
  <div class="client-box">
    <div class="label">Facturé à</div>
    <p><strong>{{ nom_client }}</strong><br>{{ adresse_client }}<br>{{ ville_client }}</p>
  </div>
  <table>
    <thead><tr><th>Description</th><th>Qté</th><th>Prix U. HT</th><th>Total HT</th></tr></thead>
    <tbody>
      <tr><td>{{ description_service }}</td><td>{{ quantite }}</td><td>{{ prix_unitaire }} €</td><td>{{ total_ht }} €</td></tr>
    </tbody>
  </table>
  <div class="total-box"><div class="total-inner">
    <div class="total-row"><span>Total HT</span><span>{{ total_ht }} €</span></div>
    <div class="total-row"><span>TVA ({{ taux_tva }}%)</span><span>{{ montant_tva }} €</span></div>
    <div class="total-row final"><span>Total TTC</span><span>{{ total_ttc }} €</span></div>
  </div></div>
  <div class="footer">
    <span>{{ entreprise }} — {{ contact_entreprise }}</span>
    <span>Merci de votre confiance</span>
  </div>
</div></body></html>`;

const DEVIS_HTML = FACTURE_HTML
  .replace(/FACTURE/g, "DEVIS")
  .replace(/numero_facture/g, "numero_devis")
  .replace(/Échéance/g, "Validité")
  .replace(/echeance/g, "validite")
  .replace(/Facturé à/g, "Destinataire")
  .replace(/Merci de votre confiance/g, "Devis valable jusqu'au {{ validite }}");

const LETTRE_COMMERCIALE_HTML = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><style>${BASE_CSS}
  .header { display:flex; justify-content:space-between; margin-bottom:36px; }
  .sender { font-size:13px; color:#374151; line-height:1.8; }
  .sender strong { font-size:15px; color:#111827; }
  .recipient { text-align:right; font-size:13px; color:#374151; line-height:1.8; }
  .date-line { margin-bottom:24px; font-size:13px; color:#6b7280; }
  .subject { margin-bottom:20px; font-weight:700; font-size:14px; color:#1d4ed8;
    border-left:4px solid #1d4ed8; padding-left:12px; }
  .body { font-size:14px; line-height:1.9; color:#374151; }
  .body p { margin-bottom:14px; }
  .signature { margin-top:40px; font-size:13px; color:#374151; }
  .footer { margin-top:50px; padding-top:12px; border-top:1px solid #e5e7eb;
    font-size:11px; color:#9ca3af; text-align:center; }
</style></head><body><div class="doc">
  <div class="header">
    <div class="sender">
      <strong>{{ entreprise }}</strong><br>{{ adresse_entreprise }}<br>{{ contact_entreprise }}
    </div>
    <div class="recipient">
      {{ nom_client }}<br>{{ adresse_client }}<br>{{ ville_client }}
    </div>
  </div>
  <p class="date-line">{{ lieu }}, le {{ date }}</p>
  <p class="subject">Objet : {{ objet }}</p>
  <div class="body">
    <p>{{ formule_appel }} {{ nom_client }},</p>
    <p>{{ contenu }}</p>
    <p>Dans l'attente de votre retour, nous restons disponibles à {{ contact_entreprise }}.</p>
    <p>Veuillez agréer, {{ formule_appel }} {{ nom_client }}, l'expression de nos sincères salutations.</p>
  </div>
  <div class="signature">
    <br><strong>{{ signataire }}</strong><br>{{ poste }}
  </div>
  <div class="footer">{{ entreprise }} · {{ contact_entreprise }}</div>
</div></body></html>`;

// ── PERSONNEL ─────────────────────────────────────────────────────────────────

const LETTRE_FORMELLE_HTML = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><style>${BASE_CSS}
  .sender { font-size:13px; line-height:1.8; color:#374151; margin-bottom:30px; }
  .recipient { font-size:13px; line-height:1.8; color:#374151;
    text-align:right; margin-bottom:30px; }
  .date-line { font-size:13px; color:#6b7280; margin-bottom:22px; }
  .subject { font-weight:700; font-size:14px; margin-bottom:20px;
    border-left:3px solid #374151; padding-left:12px; }
  .body { font-size:14px; line-height:1.9; color:#374151; }
  .body p { margin-bottom:14px; }
  .signature { margin-top:44px; font-size:13px; }
</style></head><body><div class="doc">
  <div class="sender">
    <strong>{{ expediteur }}</strong><br>{{ adresse_expediteur }}<br>{{ contact_expediteur }}
  </div>
  <div class="recipient">
    {{ destinataire }}<br>{{ adresse_destinataire }}
  </div>
  <p class="date-line">{{ lieu }}, le {{ date }}</p>
  <p class="subject">Objet : {{ objet }}</p>
  <div class="body">
    <p>{{ formule_appel }},</p>
    <p>{{ contenu }}</p>
    <p>Dans l'attente de votre réponse, je vous prie d'agréer, {{ formule_appel }},
      l'expression de mes respectueuses salutations.</p>
  </div>
  <div class="signature">
    <br><strong>{{ expediteur }}</strong>
  </div>
</div></body></html>`;

const ATTESTATION_HTML = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><style>${BASE_CSS}
  .logo-area { text-align:center; padding-bottom:20px; border-bottom:2px solid #111827;
    margin-bottom:30px; }
  .logo-area h2 { font-size:18px; font-weight:800; color:#111827; }
  .logo-area p  { font-size:12px; color:#6b7280; }
  .title { text-align:center; font-size:22px; font-weight:800; text-transform:uppercase;
    letter-spacing:3px; color:#111827; margin:30px 0; }
  .content { font-size:15px; line-height:2; color:#374151; text-align:center;
    margin-bottom:32px; }
  .content strong { color:#111827; }
  .seal-area { display:flex; justify-content:space-between; align-items:flex-end;
    margin-top:50px; padding-top:20px; border-top:1px solid #e5e7eb; }
  .seal-area .sig { font-size:13px; color:#374151; }
  .seal-area .date-sig { font-size:13px; color:#6b7280; text-align:right; }
</style></head><body><div class="doc">
  <div class="logo-area">
    <h2>{{ organisation }}</h2>
    <p>{{ adresse_organisation }}</p>
  </div>
  <p class="title">Attestation</p>
  <div class="content">
    <p>Je soussigné(e) <strong>{{ signataire }}</strong>, <strong>{{ poste }}</strong></p>
    <p>de <strong>{{ organisation }}</strong>,</p>
    <p>certifie que</p>
    <p><strong>{{ nom_personne }}</strong></p>
    <p>{{ motif_attestation }}</p>
    <p>du <strong>{{ date_debut }}</strong> au <strong>{{ date_fin }}</strong>.</p>
  </div>
  <div class="seal-area">
    <div class="sig">
      <strong>{{ signataire }}</strong><br>
      {{ poste }}
    </div>
    <div class="date-sig">
      Fait à {{ lieu }},<br>le {{ date }}
    </div>
  </div>
</div></body></html>`;

// ── COMPTABILITÉ ──────────────────────────────────────────────────────────────

const RECU_HTML = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><style>${BASE_CSS}
  .card { border:2px solid #111827; border-radius:12px; padding:32px; max-width:480px; margin:0 auto; }
  .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:28px; }
  .badge { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:2px;
    color:#fff; background:#111827; padding:4px 12px; border-radius:99px; }
  .numero { font-size:12px; color:#6b7280; margin-top:6px; }
  .amount { text-align:right; font-size:32px; font-weight:900; color:#111827; }
  .amount span { font-size:16px; font-weight:400; color:#6b7280; }
  .row { display:flex; justify-content:space-between; font-size:13px; color:#374151;
    padding:8px 0; border-bottom:1px solid #f3f4f6; }
  .row .label { color:#9ca3af; }
  .footer { margin-top:24px; text-align:center; font-size:11px; color:#9ca3af; }
</style></head><body><div class="doc">
  <div class="card">
    <div class="header">
      <div>
        <div class="badge">Reçu de paiement</div>
        <div class="numero">N° {{ numero_recu }}</div>
      </div>
      <div class="amount">{{ montant }} €<br><span>TTC</span></div>
    </div>
    <div class="row"><span class="label">Date</span><span>{{ date }}</span></div>
    <div class="row"><span class="label">Payé par</span><span><strong>{{ payeur }}</strong></span></div>
    <div class="row"><span class="label">Motif</span><span>{{ motif }}</span></div>
    <div class="row"><span class="label">Mode de paiement</span><span>{{ mode_paiement }}</span></div>
    <div class="row"><span class="label">Encaissé par</span><span>{{ encaisse_par }}</span></div>
    <div class="footer">{{ organisation }} · {{ contact_organisation }}</div>
  </div>
</div></body></html>`;

const NOTE_FRAIS_HTML = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><style>${BASE_CSS}
  .header { margin-bottom:28px; padding-bottom:16px; border-bottom:2px solid #111827; }
  .header h1 { font-size:20px; font-weight:800; }
  .header p  { font-size:13px; color:#6b7280; margin-top:4px; }
  .info-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:24px; }
  .info-item .label { font-size:10px; text-transform:uppercase; letter-spacing:1px; color:#9ca3af; }
  .info-item .value { font-size:14px; color:#111827; font-weight:600; margin-top:2px; }
  table { width:100%; border-collapse:collapse; margin-bottom:16px; }
  thead tr { background:#111827; color:#fff; }
  thead th { padding:9px 12px; text-align:left; font-size:12px; }
  tbody tr:nth-child(even) { background:#f9fafb; }
  tbody td { padding:8px 12px; font-size:13px; border-bottom:1px solid #e5e7eb; }
  .total { text-align:right; font-size:16px; font-weight:800; margin-top:8px; }
  .sign { margin-top:40px; display:flex; justify-content:space-between; }
  .sign .bloc { font-size:13px; color:#374151; }
</style></head><body><div class="doc">
  <div class="header">
    <h1>Note de frais</h1>
    <p>{{ organisation }} · Période : {{ periode }}</p>
  </div>
  <div class="info-grid">
    <div class="info-item"><div class="label">Collaborateur</div><div class="value">{{ nom_collaborateur }}</div></div>
    <div class="info-item"><div class="label">Service / Projet</div><div class="value">{{ projet }}</div></div>
    <div class="info-item"><div class="label">Date de soumission</div><div class="value">{{ date }}</div></div>
    <div class="info-item"><div class="label">Responsable</div><div class="value">{{ responsable }}</div></div>
  </div>
  <table>
    <thead><tr><th>Date</th><th>Description</th><th>Catégorie</th><th>Montant</th></tr></thead>
    <tbody>
      <tr><td>{{ date_depense }}</td><td>{{ description_depense }}</td><td>{{ categorie_depense }}</td><td>{{ montant_depense }} €</td></tr>
    </tbody>
  </table>
  <p class="total">Total : {{ total_frais }} €</p>
  <div class="sign">
    <div class="bloc"><strong>Collaborateur</strong><br><br>{{ nom_collaborateur }}</div>
    <div class="bloc" style="text-align:right"><strong>Validé par</strong><br><br>{{ responsable }}</div>
  </div>
</div></body></html>`;

// ── AUTRE ─────────────────────────────────────────────────────────────────────

const CERTIFICAT_HTML = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><style>${BASE_CSS}
  body { text-align:center; }
  .border-deco { border:3px double #1d4ed8; padding:48px 56px; max-width:600px; margin:0 auto; }
  .org { font-size:13px; text-transform:uppercase; letter-spacing:3px; color:#6b7280; margin-bottom:24px; }
  .title { font-size:28px; font-weight:900; text-transform:uppercase; letter-spacing:4px;
    color:#1d4ed8; margin-bottom:8px; }
  .subtitle { font-size:13px; color:#9ca3af; margin-bottom:36px; }
  .certifie { font-size:13px; color:#6b7280; margin-bottom:6px; }
  .name { font-size:26px; font-weight:800; color:#111827; margin-bottom:6px; font-style:italic; }
  .raison { font-size:14px; color:#374151; margin-bottom:4px; }
  .detail { font-size:13px; color:#6b7280; margin-bottom:36px; }
  .footer-sig { display:flex; justify-content:space-between; margin-top:48px;
    font-size:12px; color:#374151; }
  .footer-sig .bloc { text-align:center; }
  .line { width:140px; border-top:1px solid #9ca3af; margin:0 auto 6px; }
</style></head><body><div class="doc">
  <div class="border-deco">
    <p class="org">{{ organisation }}</p>
    <p class="title">Certificat</p>
    <p class="subtitle">{{ sous_titre }}</p>
    <p class="certifie">est décerné à</p>
    <p class="name">{{ nom_beneficiaire }}</p>
    <p class="raison">{{ motif }}</p>
    <p class="detail">{{ details }}</p>
    <p class="detail">Le {{ date }} à {{ lieu }}</p>
    <div class="footer-sig">
      <div class="bloc"><div class="line"></div>{{ signataire }}<br><small>{{ poste }}</small></div>
      <div class="bloc"><div class="line"></div>{{ validateur }}<br><small>{{ poste_validateur }}</small></div>
    </div>
  </div>
</div></body></html>`;

// ── Exports ───────────────────────────────────────────────────────────────────

export const PRESETS: LumenPreset[] = [
  {
    id:          "facture",
    name:        "Facture",
    category:    "entreprise",
    description: "Facture professionnelle avec détail des prestations, TVA et total TTC.",
    icon:        "🧾",
    fields:      ["entreprise","adresse_entreprise","siret","numero_facture","date","echeance","contact_entreprise","nom_client","adresse_client","ville_client","description_service","quantite","prix_unitaire","total_ht","taux_tva","montant_tva","total_ttc"],
    html:        FACTURE_HTML,
  },
  {
    id:          "devis",
    name:        "Devis",
    category:    "entreprise",
    description: "Proposition commerciale chiffrée avec date de validité.",
    icon:        "📋",
    fields:      ["entreprise","adresse_entreprise","siret","numero_devis","date","validite","contact_entreprise","nom_client","adresse_client","ville_client","description_service","quantite","prix_unitaire","total_ht","taux_tva","montant_tva","total_ttc"],
    html:        DEVIS_HTML,
  },
  {
    id:          "lettre-commerciale",
    name:        "Lettre commerciale",
    category:    "entreprise",
    description: "Courrier professionnel d'entreprise avec objet et formule de politesse.",
    icon:        "✉️",
    fields:      ["entreprise","adresse_entreprise","contact_entreprise","nom_client","adresse_client","ville_client","lieu","date","objet","formule_appel","contenu","signataire","poste"],
    html:        LETTRE_COMMERCIALE_HTML,
  },
  {
    id:          "lettre-formelle",
    name:        "Lettre formelle",
    category:    "personnel",
    description: "Lettre officielle entre particuliers ou à une administration.",
    icon:        "📄",
    fields:      ["expediteur","adresse_expediteur","contact_expediteur","destinataire","adresse_destinataire","lieu","date","objet","formule_appel","contenu"],
    html:        LETTRE_FORMELLE_HTML,
  },
  {
    id:          "attestation",
    name:        "Attestation",
    category:    "personnel",
    description: "Attestation officielle certifiant un emploi, une présence ou un titre.",
    icon:        "🏅",
    fields:      ["organisation","adresse_organisation","signataire","poste","nom_personne","motif_attestation","date_debut","date_fin","lieu","date"],
    html:        ATTESTATION_HTML,
  },
  {
    id:          "recu-paiement",
    name:        "Reçu de paiement",
    category:    "comptabilite",
    description: "Reçu simple confirmant la réception d'un paiement.",
    icon:        "💳",
    fields:      ["numero_recu","date","payeur","montant","motif","mode_paiement","encaisse_par","organisation","contact_organisation"],
    html:        RECU_HTML,
  },
  {
    id:          "note-frais",
    name:        "Note de frais",
    category:    "comptabilite",
    description: "Fiche de remboursement de frais professionnels.",
    icon:        "📊",
    fields:      ["organisation","periode","nom_collaborateur","projet","date","responsable","date_depense","description_depense","categorie_depense","montant_depense","total_frais"],
    html:        NOTE_FRAIS_HTML,
  },
  {
    id:          "certificat",
    name:        "Certificat",
    category:    "autre",
    description: "Certificat ou diplôme personnalisé à remettre à un bénéficiaire.",
    icon:        "🎖️",
    fields:      ["organisation","sous_titre","nom_beneficiaire","motif","details","date","lieu","signataire","poste","validateur","poste_validateur"],
    html:        CERTIFICAT_HTML,
  },
];

export const CATEGORIES: { id: TemplateCategory | "all"; label: string }[] = [
  { id: "all",          label: "Tous"          },
  { id: "entreprise",   label: "Entreprise"    },
  { id: "personnel",    label: "Personnel"     },
  { id: "comptabilite", label: "Comptabilité"  },
  { id: "autre",        label: "Autre"         },
];
