"use client";

import {
  Document, Page, View, Text, Image, StyleSheet, Link,
} from "@react-pdf/renderer";
import type { CVData, CVColorKey } from "@/lib/cv/types";
import { CV_COLORS } from "@/lib/cv/types";

/* ─── Helpers ──────────────────────────────────────────────── */

function dateRange(start: string, end: string, current: boolean) {
  if (!start) return "";
  return `${start} – ${current ? "Présent" : end || ""}`;
}

/** Format ISO date (YYYY-MM-DD from <input type="date">) to DD/MM/YYYY */
function formatBirthdate(raw: string): string {
  if (!raw) return "";
  const [y, m, d] = raw.split("-");
  if (!y || !m || !d) return raw;
  return `${d}/${m}/${y}`;
}

function bullets(description: string): string[] {
  return description.split("\n").map((l) => l.trim()).filter(Boolean);
}

/* ─── Shared palette ───────────────────────────────────────── */

function palette(color: CVColorKey) {
  return CV_COLORS[color];
}

/* ═══════════════════════════════════════════════════════════
   TEMPLATE: CLASSIQUE — sidebar left, content right
═══════════════════════════════════════════════════════════ */

function ClassiqueDoc({ data }: { data: CVData }) {
  const pal = palette(data.design.color);
  const showPhoto = data.design.showPhoto && !!data.personal.photo;

  const S = StyleSheet.create({
    page:        { flexDirection: "row", backgroundColor: "#FFFFFF", fontFamily: "Helvetica" },
    sidebar:     { width: 185, backgroundColor: pal.primary, paddingTop: 30, paddingBottom: 24, flexShrink: 0 },
    main:        { flex: 1, paddingTop: 30, paddingRight: 28, paddingBottom: 24, paddingLeft: 22 },

    // Sidebar
    photoWrap:   { alignItems: "center", marginBottom: 16 },
    photo:       { width: 80, height: 80, borderRadius: 40, border: "2.5px solid rgba(255,255,255,.6)" },
    photoFallback: { width: 80, height: 80, borderRadius: 40, backgroundColor: "rgba(255,255,255,.2)", alignItems: "center", justifyContent: "center" },
    initials:    { fontSize: 22, color: "#FFFFFF", fontFamily: "Helvetica-Bold" },

    sNameWrap:   { alignItems: "center", paddingHorizontal: 14, marginBottom: 20 },
    sName:       { fontSize: 13, fontFamily: "Helvetica-Bold", color: "#FFFFFF", textAlign: "center", lineHeight: 1.3 },
    sJobTitle:   { fontSize: 8.5, color: "rgba(255,255,255,.8)", textAlign: "center", marginTop: 3, letterSpacing: 0.5 },

    sDivider:    { height: 0.75, backgroundColor: "rgba(255,255,255,.3)", marginHorizontal: 14, marginBottom: 14 },

    sSectionTitle: { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: "rgba(255,255,255,.6)", letterSpacing: 1.2, textTransform: "uppercase", paddingHorizontal: 14, marginBottom: 7 },
    sItem:       { paddingHorizontal: 14, marginBottom: 5 },
    sItemLabel:  { fontSize: 7, color: "rgba(255,255,255,.55)", marginBottom: 1.5 },
    sItemValue:  { fontSize: 8, color: "#FFFFFF", lineHeight: 1.3 },
    sItemLink:   { fontSize: 8, color: "rgba(255,255,255,.85)", textDecoration: "none" },

    skillRow:    { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, marginBottom: 5 },
    skillName:   { flex: 1, fontSize: 8, color: "#FFFFFF", lineHeight: 1.2 },
    dotRow:      { flexDirection: "row", gap: 2 },
    dot:         { width: 6, height: 6, borderRadius: 3 },

    langRow:     { paddingHorizontal: 14, marginBottom: 6 },
    langName:    { fontSize: 8.5, fontFamily: "Helvetica-Bold", color: "#FFFFFF" },
    langLevel:   { fontSize: 7.5, color: "rgba(255,255,255,.7)", marginTop: 1 },

    // Main content
    mSection:    { marginBottom: 16 },
    mTitle:      { fontSize: 9, fontFamily: "Helvetica-Bold", color: pal.primary, letterSpacing: 1.1, textTransform: "uppercase", marginBottom: 6, paddingBottom: 4, borderBottom: `1.5px solid ${pal.primary}` },
    summary:     { fontSize: 9, color: "#374151", lineHeight: 1.55, marginBottom: 0 },

    expEntry:    { marginBottom: 10 },
    expHeader:   { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 2 },
    expPos:      { fontSize: 9.5, fontFamily: "Helvetica-Bold", color: "#111827", flex: 1 },
    expDate:     { fontSize: 7.5, color: "#9CA3AF", flexShrink: 0, marginLeft: 6 },
    expCompany:  { fontSize: 8.5, color: pal.primary, marginBottom: 3 },
    expBullet:   { flexDirection: "row", marginBottom: 2 },
    bulletDot:   { fontSize: 8, color: "#9CA3AF", marginRight: 4, marginTop: 0.5 },
    bulletText:  { fontSize: 8, color: "#4B5563", lineHeight: 1.4, flex: 1 },

    eduEntry:    { marginBottom: 9 },
    eduHeader:   { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 1 },
    eduDegree:   { fontSize: 9.5, fontFamily: "Helvetica-Bold", color: "#111827", flex: 1 },
    eduDate:     { fontSize: 7.5, color: "#9CA3AF", flexShrink: 0, marginLeft: 6 },
    eduSchool:   { fontSize: 8.5, color: pal.primary },
    eduDesc:     { fontSize: 8, color: "#6B7280", marginTop: 2, lineHeight: 1.35 },
  });

  const initials = `${data.personal.firstName?.[0] ?? ""}${data.personal.lastName?.[0] ?? ""}`.toUpperCase();
  const contactItems = [
    data.personal.email && { label: "Email", value: data.personal.email },
    data.personal.phone && { label: "Téléphone", value: data.personal.phone },
    data.personal.address && { label: "Adresse", value: data.personal.address },
    data.personal.birthdate && { label: "Naissance", value: formatBirthdate(data.personal.birthdate) },
    data.personal.linkedin && { label: "LinkedIn", value: data.personal.linkedin },
    data.personal.github && { label: "GitHub", value: data.personal.github },
    data.personal.website && { label: "Site web", value: data.personal.website },
  ].filter(Boolean) as { label: string; value: string }[];

  // Group skills by category
  const skillsByCategory = data.skills.reduce<Record<string, typeof data.skills>>((acc, s) => {
    const cat = s.category || "Compétences";
    (acc[cat] ??= []).push(s);
    return acc;
  }, {});

  return (
    <Document>
      <Page size="A4" style={S.page}>
        {/* ── Sidebar ── */}
        <View style={S.sidebar}>
          {/* Photo */}
          <View style={S.photoWrap}>
            {showPhoto ? (
              <Image src={data.personal.photo} style={S.photo} />
            ) : (
              <View style={S.photoFallback}>
                <Text style={S.initials}>{initials}</Text>
              </View>
            )}
          </View>

          {/* Name + title */}
          <View style={S.sNameWrap}>
            <Text style={S.sName}>{data.personal.firstName} {data.personal.lastName}</Text>
            {data.personal.jobTitle ? <Text style={S.sJobTitle}>{data.personal.jobTitle.toUpperCase()}</Text> : null}
          </View>

          <View style={S.sDivider} />

          {/* Contact */}
          {contactItems.length > 0 && (
            <View style={{ marginBottom: 14 }}>
              <Text style={S.sSectionTitle}>Contact</Text>
              {contactItems.map((c, i) => (
                <View key={i} style={S.sItem}>
                  <Text style={S.sItemLabel}>{c.label}</Text>
                  <Text style={S.sItemValue}>{c.value}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Skills */}
          {Object.entries(skillsByCategory).map(([cat, skills]) => (
            <View key={cat} style={{ marginBottom: 12 }}>
              <Text style={S.sSectionTitle}>{cat}</Text>
              {skills.map((sk) => (
                <View key={sk.id} style={S.skillRow}>
                  <Text style={S.skillName}>{sk.name}</Text>
                  <View style={S.dotRow}>
                    {[1, 2, 3, 4, 5].map((d) => (
                      <View
                        key={d}
                        style={[S.dot, { backgroundColor: d <= sk.level ? "rgba(255,255,255,.9)" : "rgba(255,255,255,.2)" }]}
                      />
                    ))}
                  </View>
                </View>
              ))}
            </View>
          ))}

          {/* Languages */}
          {data.languages.length > 0 && (
            <View>
              <Text style={S.sSectionTitle}>Langues</Text>
              {data.languages.map((l) => (
                <View key={l.id} style={S.langRow}>
                  <Text style={S.langName}>{l.name}</Text>
                  <Text style={S.langLevel}>{l.level}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ── Main ── */}
        <View style={S.main}>
          {/* Summary */}
          {data.personal.summary ? (
            <View style={S.mSection}>
              <Text style={S.mTitle}>Profil</Text>
              <Text style={S.summary}>{data.personal.summary}</Text>
            </View>
          ) : null}

          {/* Experience */}
          {data.experiences.length > 0 && (
            <View style={S.mSection}>
              <Text style={S.mTitle}>Expérience professionnelle</Text>
              {data.experiences.map((exp) => (
                <View key={exp.id} style={S.expEntry}>
                  <View style={S.expHeader}>
                    <Text style={S.expPos}>{exp.position}</Text>
                    <Text style={S.expDate}>{dateRange(exp.startDate, exp.endDate, exp.current)}</Text>
                  </View>
                  <Text style={S.expCompany}>{exp.company}{exp.location ? ` · ${exp.location}` : ""}</Text>
                  {bullets(exp.description).map((b, i) => (
                    <View key={i} style={S.expBullet}>
                      <Text style={S.bulletDot}>•</Text>
                      <Text style={S.bulletText}>{b}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          )}

          {/* Education */}
          {data.education.length > 0 && (
            <View style={S.mSection}>
              <Text style={S.mTitle}>Formation</Text>
              {data.education.map((edu) => (
                <View key={edu.id} style={S.eduEntry}>
                  <View style={S.eduHeader}>
                    <Text style={S.eduDegree}>{edu.degree}{edu.field ? ` en ${edu.field}` : ""}</Text>
                    <Text style={S.eduDate}>{dateRange(edu.startDate, edu.endDate, false)}</Text>
                  </View>
                  <Text style={S.eduSchool}>{edu.institution}{edu.location ? ` · ${edu.location}` : ""}</Text>
                  {edu.description ? <Text style={S.eduDesc}>{edu.description}</Text> : null}
                </View>
              ))}
            </View>
          )}
        </View>
      </Page>
    </Document>
  );
}

/* ═══════════════════════════════════════════════════════════
   TEMPLATE: MODERNE — full-width header, then two columns
═══════════════════════════════════════════════════════════ */

function ModerneDoc({ data }: { data: CVData }) {
  const pal = palette(data.design.color);
  const showPhoto = data.design.showPhoto && !!data.personal.photo;

  const S = StyleSheet.create({
    page:        { backgroundColor: "#FFFFFF", fontFamily: "Helvetica" },

    // Header
    header:      { backgroundColor: pal.primary, paddingHorizontal: 32, paddingTop: 24, paddingBottom: 22, flexDirection: "row", alignItems: "center" },
    headerLeft:  { flex: 1 },
    hName:       { fontSize: 22, fontFamily: "Helvetica-Bold", color: "#FFFFFF", letterSpacing: 0.5 },
    hTitle:      { fontSize: 10, color: "rgba(255,255,255,.8)", marginTop: 4, letterSpacing: 0.5 },
    hContactRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 10 },
    hContact:    { fontSize: 7.5, color: "rgba(255,255,255,.85)" },
    photoWrap:   { marginLeft: 20 },
    photo:       { width: 72, height: 72, borderRadius: 36, border: "2.5px solid rgba(255,255,255,.5)" },

    // Body columns
    body:        { flexDirection: "row", paddingHorizontal: 20, paddingTop: 18, paddingBottom: 20 },
    leftCol:     { width: 160, paddingRight: 16, borderRight: `1.5px solid ${pal.light}` },
    rightCol:    { flex: 1, paddingLeft: 16 },

    sectionTitle: { fontSize: 8.5, fontFamily: "Helvetica-Bold", color: pal.primary, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8, paddingBottom: 3, borderBottom: `1px solid ${pal.light}` },
    sectionBlock: { marginBottom: 14 },

    skillRow:    { flexDirection: "row", alignItems: "center", marginBottom: 5 },
    skillName:   { flex: 1, fontSize: 8, color: "#374151" },
    dotRow:      { flexDirection: "row", gap: 2.5 },
    dot:         { width: 6, height: 6, borderRadius: 3 },

    langRow:     { marginBottom: 5 },
    langName:    { fontSize: 8.5, fontFamily: "Helvetica-Bold", color: "#1F2937" },
    langLevel:   { fontSize: 7.5, color: "#9CA3AF" },

    summary:     { fontSize: 9, color: "#374151", lineHeight: 1.55, marginBottom: 0 },

    expEntry:    { marginBottom: 11 },
    expHeader:   { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 1.5 },
    expPos:      { fontSize: 9.5, fontFamily: "Helvetica-Bold", color: "#111827", flex: 1 },
    expDate:     { fontSize: 7.5, color: "#9CA3AF", flexShrink: 0, marginLeft: 6 },
    expCompany:  { fontSize: 8.5, color: pal.primary, marginBottom: 3 },
    expBullet:   { flexDirection: "row", marginBottom: 2 },
    bulletDot:   { fontSize: 8, color: "#9CA3AF", marginRight: 4, marginTop: 0.5 },
    bulletText:  { fontSize: 8, color: "#4B5563", lineHeight: 1.4, flex: 1 },

    eduEntry:    { marginBottom: 9 },
    eduDegree:   { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#111827" },
    eduSchool:   { fontSize: 8.5, color: pal.primary, marginTop: 1.5 },
    eduDate:     { fontSize: 7.5, color: "#9CA3AF", marginTop: 1 },
    eduDesc:     { fontSize: 8, color: "#6B7280", marginTop: 2, lineHeight: 1.35 },
  });

  const contactParts = [
    data.personal.email, data.personal.phone, data.personal.address,
    data.personal.birthdate ? formatBirthdate(data.personal.birthdate) : null,
    data.personal.linkedin, data.personal.github, data.personal.website,
  ].filter(Boolean) as string[];

  const skillsByCategory = data.skills.reduce<Record<string, typeof data.skills>>((acc, s) => {
    const cat = s.category || "Compétences";
    (acc[cat] ??= []).push(s);
    return acc;
  }, {});

  return (
    <Document>
      <Page size="A4" style={S.page}>
        {/* Header */}
        <View style={S.header}>
          <View style={S.headerLeft}>
            <Text style={S.hName}>{data.personal.firstName} {data.personal.lastName}</Text>
            {data.personal.jobTitle ? <Text style={S.hTitle}>{data.personal.jobTitle}</Text> : null}
            <View style={S.hContactRow}>
              {contactParts.map((c, i) => (
                <Text key={i} style={S.hContact}>{c}</Text>
              ))}
            </View>
          </View>
          {showPhoto && (
            <View style={S.photoWrap}>
              <Image src={data.personal.photo} style={S.photo} />
            </View>
          )}
        </View>

        {/* Body */}
        <View style={S.body}>
          {/* Left column */}
          <View style={S.leftCol}>
            {/* Skills */}
            {Object.entries(skillsByCategory).map(([cat, skills]) => (
              <View key={cat} style={S.sectionBlock}>
                <Text style={S.sectionTitle}>{cat}</Text>
                {skills.map((sk) => (
                  <View key={sk.id} style={S.skillRow}>
                    <Text style={S.skillName}>{sk.name}</Text>
                    <View style={S.dotRow}>
                      {[1, 2, 3, 4, 5].map((d) => (
                        <View key={d} style={[S.dot, { backgroundColor: d <= sk.level ? pal.primary : "#E5E7EB" }]} />
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            ))}

            {/* Languages */}
            {data.languages.length > 0 && (
              <View style={S.sectionBlock}>
                <Text style={S.sectionTitle}>Langues</Text>
                {data.languages.map((l) => (
                  <View key={l.id} style={S.langRow}>
                    <Text style={S.langName}>{l.name}</Text>
                    <Text style={S.langLevel}>{l.level}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Right column */}
          <View style={S.rightCol}>
            {data.personal.summary ? (
              <View style={S.sectionBlock}>
                <Text style={S.sectionTitle}>Profil</Text>
                <Text style={S.summary}>{data.personal.summary}</Text>
              </View>
            ) : null}

            {data.experiences.length > 0 && (
              <View style={S.sectionBlock}>
                <Text style={S.sectionTitle}>Expérience</Text>
                {data.experiences.map((exp) => (
                  <View key={exp.id} style={S.expEntry}>
                    <View style={S.expHeader}>
                      <Text style={S.expPos}>{exp.position}</Text>
                      <Text style={S.expDate}>{dateRange(exp.startDate, exp.endDate, exp.current)}</Text>
                    </View>
                    <Text style={S.expCompany}>{exp.company}{exp.location ? ` · ${exp.location}` : ""}</Text>
                    {bullets(exp.description).map((b, i) => (
                      <View key={i} style={S.expBullet}>
                        <Text style={S.bulletDot}>•</Text>
                        <Text style={S.bulletText}>{b}</Text>
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            )}

            {data.education.length > 0 && (
              <View style={S.sectionBlock}>
                <Text style={S.sectionTitle}>Formation</Text>
                {data.education.map((edu) => (
                  <View key={edu.id} style={S.eduEntry}>
                    <Text style={S.eduDegree}>{edu.degree}{edu.field ? ` en ${edu.field}` : ""}</Text>
                    <Text style={S.eduSchool}>{edu.institution}{edu.location ? ` · ${edu.location}` : ""}</Text>
                    <Text style={S.eduDate}>{dateRange(edu.startDate, edu.endDate, false)}</Text>
                    {edu.description ? <Text style={S.eduDesc}>{edu.description}</Text> : null}
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </Page>
    </Document>
  );
}

/* ═══════════════════════════════════════════════════════════
   TEMPLATE: MINIMALISTE — single clean column
═══════════════════════════════════════════════════════════ */

function MinimalisteDoc({ data }: { data: CVData }) {
  const pal = palette(data.design.color);
  const showPhoto = data.design.showPhoto && !!data.personal.photo;

  const S = StyleSheet.create({
    page:        { backgroundColor: "#FFFFFF", fontFamily: "Helvetica", paddingHorizontal: 48, paddingVertical: 40 },

    topRow:      { flexDirection: "row", alignItems: "center", marginBottom: 18 },
    topInfo:     { flex: 1 },
    name:        { fontSize: 22, fontFamily: "Helvetica-Bold", color: "#111827", letterSpacing: 0.3 },
    jobTitle:    { fontSize: 10.5, color: pal.primary, marginTop: 3 },
    photo:       { width: 60, height: 60, borderRadius: 30, marginLeft: 16 },

    contactRow:  { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 18 },
    contactItem: { fontSize: 7.5, color: "#6B7280", paddingRight: 8, borderRight: "0.75px solid #D1D5DB" },

    divider:     { height: 1, backgroundColor: "#E5E7EB", marginBottom: 16 },

    section:     { marginBottom: 16 },
    sTitle:      { fontSize: 8, fontFamily: "Helvetica-Bold", color: pal.primary, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 },

    summary:     { fontSize: 9.5, color: "#374151", lineHeight: 1.6 },

    expEntry:    { flexDirection: "row", marginBottom: 10 },
    expLeft:     { width: 80, flexShrink: 0 },
    expDate:     { fontSize: 7.5, color: "#9CA3AF", lineHeight: 1.4 },
    expRight:    { flex: 1 },
    expPos:      { fontSize: 9.5, fontFamily: "Helvetica-Bold", color: "#111827", marginBottom: 1.5 },
    expCompany:  { fontSize: 8.5, color: pal.primary, marginBottom: 3 },
    expBullet:   { flexDirection: "row", marginBottom: 2 },
    bulletDot:   { fontSize: 8, color: "#9CA3AF", marginRight: 4, marginTop: 0.5 },
    bulletText:  { fontSize: 8, color: "#4B5563", lineHeight: 1.4, flex: 1 },

    eduEntry:    { flexDirection: "row", marginBottom: 9 },
    eduLeft:     { width: 80, flexShrink: 0 },
    eduDate:     { fontSize: 7.5, color: "#9CA3AF", lineHeight: 1.4 },
    eduRight:    { flex: 1 },
    eduDegree:   { fontSize: 9.5, fontFamily: "Helvetica-Bold", color: "#111827" },
    eduSchool:   { fontSize: 8.5, color: pal.primary, marginTop: 1.5 },

    skillsRow:   { flexDirection: "row", flexWrap: "wrap", gap: 6 },
    skillChip:   { fontSize: 8, color: "#374151", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, border: `1px solid ${pal.primary}`, backgroundColor: pal.light },

    langRow:     { flexDirection: "row", gap: 16, flexWrap: "wrap" },
    langItem:    { fontSize: 8.5, color: "#374151" },
    langLevel:   { color: "#9CA3AF" },
  });

  const contactParts = [
    data.personal.email, data.personal.phone, data.personal.address,
    data.personal.birthdate ? formatBirthdate(data.personal.birthdate) : null,
    data.personal.linkedin, data.personal.github, data.personal.website,
  ].filter(Boolean) as string[];

  return (
    <Document>
      <Page size="A4" style={S.page}>
        {/* Name + photo */}
        <View style={S.topRow}>
          <View style={S.topInfo}>
            <Text style={S.name}>{data.personal.firstName} {data.personal.lastName}</Text>
            {data.personal.jobTitle ? <Text style={S.jobTitle}>{data.personal.jobTitle}</Text> : null}
          </View>
          {showPhoto && <Image src={data.personal.photo} style={S.photo} />}
        </View>

        {/* Contact */}
        {contactParts.length > 0 && (
          <View style={S.contactRow}>
            {contactParts.map((c, i) => (
              <Text key={i} style={[S.contactItem, i === contactParts.length - 1 ? { borderRight: "none" } : {}]}>{c}</Text>
            ))}
          </View>
        )}

        <View style={S.divider} />

        {/* Summary */}
        {data.personal.summary ? (
          <View style={S.section}>
            <Text style={S.sTitle}>Profil</Text>
            <Text style={S.summary}>{data.personal.summary}</Text>
          </View>
        ) : null}

        {/* Experience */}
        {data.experiences.length > 0 && (
          <View style={S.section}>
            <Text style={S.sTitle}>Expérience</Text>
            {data.experiences.map((exp) => (
              <View key={exp.id} style={S.expEntry}>
                <View style={S.expLeft}>
                  <Text style={S.expDate}>{dateRange(exp.startDate, exp.endDate, exp.current)}</Text>
                </View>
                <View style={S.expRight}>
                  <Text style={S.expPos}>{exp.position}</Text>
                  <Text style={S.expCompany}>{exp.company}{exp.location ? ` · ${exp.location}` : ""}</Text>
                  {bullets(exp.description).map((b, i) => (
                    <View key={i} style={S.expBullet}>
                      <Text style={S.bulletDot}>–</Text>
                      <Text style={S.bulletText}>{b}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Education */}
        {data.education.length > 0 && (
          <View style={S.section}>
            <Text style={S.sTitle}>Formation</Text>
            {data.education.map((edu) => (
              <View key={edu.id} style={S.eduEntry}>
                <View style={S.eduLeft}>
                  <Text style={S.eduDate}>{dateRange(edu.startDate, edu.endDate, false)}</Text>
                </View>
                <View style={S.eduRight}>
                  <Text style={S.eduDegree}>{edu.degree}{edu.field ? ` en ${edu.field}` : ""}</Text>
                  <Text style={S.eduSchool}>{edu.institution}{edu.location ? ` · ${edu.location}` : ""}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Skills */}
        {data.skills.length > 0 && (
          <View style={S.section}>
            <Text style={S.sTitle}>Compétences</Text>
            <View style={S.skillsRow}>
              {data.skills.map((sk) => (
                <Text key={sk.id} style={S.skillChip}>{sk.name}</Text>
              ))}
            </View>
          </View>
        )}

        {/* Languages */}
        {data.languages.length > 0 && (
          <View style={S.section}>
            <Text style={S.sTitle}>Langues</Text>
            <View style={S.langRow}>
              {data.languages.map((l) => (
                <Text key={l.id} style={S.langItem}>
                  {l.name} <Text style={S.langLevel}>({l.level})</Text>
                </Text>
              ))}
            </View>
          </View>
        )}
      </Page>
    </Document>
  );
}

/* ═══════════════════════════════════════════════════════════
   TEMPLATE: ATS — machine-readable, plain text structure
═══════════════════════════════════════════════════════════ */

function ATSDoc({ data }: { data: CVData }) {
  const S = StyleSheet.create({
    page:        { backgroundColor: "#FFFFFF", fontFamily: "Helvetica", paddingHorizontal: 56, paddingVertical: 48 },
    name:        { fontSize: 18, fontFamily: "Helvetica-Bold", color: "#000000", marginBottom: 3 },
    jobTitle:    { fontSize: 10, color: "#333333", marginBottom: 8 },
    contactLine: { fontSize: 8.5, color: "#333333", marginBottom: 14 },
    section:     { marginBottom: 14 },
    sTitle:      { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#000000", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 4, paddingBottom: 3, borderBottom: "1px solid #000000" },
    summary:     { fontSize: 9, color: "#222222", lineHeight: 1.6 },
    expEntry:    { marginBottom: 9 },
    expPos:      { fontSize: 9.5, fontFamily: "Helvetica-Bold", color: "#000000" },
    expMeta:     { fontSize: 8.5, color: "#333333", marginTop: 1, marginBottom: 2 },
    expBullet:   { flexDirection: "row", marginBottom: 1.5 },
    bulletDot:   { fontSize: 8.5, color: "#555555", marginRight: 5, marginTop: 0.5 },
    bulletText:  { fontSize: 8.5, color: "#333333", lineHeight: 1.4, flex: 1 },
    eduEntry:    { marginBottom: 8 },
    eduDegree:   { fontSize: 9.5, fontFamily: "Helvetica-Bold", color: "#000000" },
    eduMeta:     { fontSize: 8.5, color: "#333333", marginTop: 1 },
    skillLine:   { fontSize: 8.5, color: "#333333", lineHeight: 1.5 },
    langLine:    { fontSize: 8.5, color: "#333333", lineHeight: 1.5 },
  });

  const contactParts = [
    data.personal.email, data.personal.phone,
    data.personal.birthdate ? formatBirthdate(data.personal.birthdate) : null,
    data.personal.linkedin, data.personal.github, data.personal.website,
    data.personal.address,
  ].filter(Boolean) as string[];

  return (
    <Document>
      <Page size="A4" style={S.page}>
        <Text style={S.name}>{data.personal.firstName} {data.personal.lastName}</Text>
        {data.personal.jobTitle ? <Text style={S.jobTitle}>{data.personal.jobTitle}</Text> : null}
        {contactParts.length > 0 && (
          <Text style={S.contactLine}>{contactParts.join("  |  ")}</Text>
        )}

        {data.personal.summary ? (
          <View style={S.section}>
            <Text style={S.sTitle}>Profil</Text>
            <Text style={S.summary}>{data.personal.summary}</Text>
          </View>
        ) : null}

        {data.experiences.length > 0 && (
          <View style={S.section}>
            <Text style={S.sTitle}>Expérience Professionnelle</Text>
            {data.experiences.map((exp) => (
              <View key={exp.id} style={S.expEntry}>
                <Text style={S.expPos}>{exp.position}</Text>
                <Text style={S.expMeta}>{exp.company}{exp.location ? `, ${exp.location}` : ""}  {dateRange(exp.startDate, exp.endDate, exp.current)}</Text>
                {bullets(exp.description).map((b, i) => (
                  <View key={i} style={S.expBullet}>
                    <Text style={S.bulletDot}>-</Text>
                    <Text style={S.bulletText}>{b}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        {data.education.length > 0 && (
          <View style={S.section}>
            <Text style={S.sTitle}>Formation</Text>
            {data.education.map((edu) => (
              <View key={edu.id} style={S.eduEntry}>
                <Text style={S.eduDegree}>{edu.degree}{edu.field ? ` en ${edu.field}` : ""}</Text>
                <Text style={S.eduMeta}>{edu.institution}{edu.location ? `, ${edu.location}` : ""}  {dateRange(edu.startDate, edu.endDate, false)}</Text>
                {edu.description ? (
                  <View style={S.expBullet}>
                    <Text style={S.bulletDot}>-</Text>
                    <Text style={S.bulletText}>{edu.description}</Text>
                  </View>
                ) : null}
              </View>
            ))}
          </View>
        )}

        {data.skills.length > 0 && (
          <View style={S.section}>
            <Text style={S.sTitle}>Compétences</Text>
            <Text style={S.skillLine}>{data.skills.map((s) => s.name).join(", ")}</Text>
          </View>
        )}

        {data.languages.length > 0 && (
          <View style={S.section}>
            <Text style={S.sTitle}>Langues</Text>
            {data.languages.map((l) => (
              <Text key={l.id} style={S.langLine}>{l.name} : {l.level}</Text>
            ))}
          </View>
        )}
      </Page>
    </Document>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN EXPORT — picks the right template
═══════════════════════════════════════════════════════════ */

export default function CVDocument({ data }: { data: CVData }) {
  if (data.design.atsMode) return <ATSDoc data={data} />;
  switch (data.design.template) {
    case "moderne":     return <ModerneDoc     data={data} />;
    case "minimaliste": return <MinimalisteDoc data={data} />;
    default:            return <ClassiqueDoc   data={data} />;
  }
}
