export function generateIndustrialCopy({
  platform,
  topic = "",
  product = "",
  specs = "",
  applications = "",
  targetAudience = "",
  angle = "Auto",
  cta = ""
}) {
  const itemTitle = product || topic || "Industrial Precision Instrumentation";
  const audience = targetAudience ? `Targeted for ${targetAudience}: ` : "";
  const action = cta || "Connect with Nunes Instrumentation for application support, technical datasheets, and official quotation.";

  const effectiveAngle = angle === "Auto"
    ? (/calibrat|standard|accuracy|nabl|iso/i.test(itemTitle) ? "Calibration & NABL Compliance"
      : /how|select|choose|guid/i.test(itemTitle) ? "How-To Guide"
      : /fail|downtime|error|trouble/i.test(itemTitle) ? "Cost & Downtime Prevention"
      : "Product Spotlight")
    : angle;

  if (platform === "LinkedIn") {
    let hook = "";
    if (effectiveAngle === "Product Spotlight") {
      hook = `Engineered for rigorous plant environments: ${itemTitle}. In industrial operations, precision is the baseline between seamless uptime and catastrophic failure.`;
    } else if (effectiveAngle === "Problem / Solution") {
      hook = `Inaccurate field measurements quietly drain industrial plant margins through premature equipment replacements and compliance audit flags. Here is how ${itemTitle} resolves this.`;
    } else if (effectiveAngle === "Calibration & NABL Compliance") {
      hook = `ISO/IEC 17025 and NABL audit readiness: Maintaining measurement traceability with ${itemTitle}.`;
    } else if (effectiveAngle === "Cost & Downtime Prevention") {
      hook = `Predictive maintenance and precision inspection: Why maintenance leaders choose ${itemTitle} to eliminate unplanned shutdown risks.`;
    } else {
      hook = `Engineering Insights: Technical evaluation and deployment standards for ${itemTitle}.`;
    }

    const techBlock = specs
      ? `\nKey Technical Specifications:\n• ${specs.split("|").map(s => s.trim()).join("\n• ")}`
      : `\nKey Engineering Considerations:\n• Traceable calibration compliance\n• Standardized measurement accuracy & long-term stability\n• Heavy-duty industrial ingress protection`;

    const appBlock = applications
      ? `\nCritical Applications:\n${applications.split(",").map(a => `→ ${a.trim()}`).join("\n")}`
      : "";

    return `${hook}\n\n${audience}${techBlock}${appBlock}\n\nWhy Nunes Instrumentation:\nWith decades of industrial engineering experience, Nunes Instrumentation delivers calibrated, certified, and field-tested instrumentation solutions across India.\n\n${action}\n\n#NunesInstrumentation #IndustrialEngineering #ProcessControl #QualityAssurance #CalibrationStandards #PlantMaintenance #B2BManufacturing`;
  }

  if (platform === "Facebook") {
    let hook = "";
    if (effectiveAngle === "Product Spotlight") {
      hook = `Looking to upgrade your testing equipment? Discover the ${itemTitle} by Nunes Instrumentation.`;
    } else if (effectiveAngle === "Problem / Solution") {
      hook = `Struggling with erratic measurements or difficult field testing? The ${itemTitle} is built to deliver rock-solid reliability.`;
    } else {
      hook = `Industrial Equipment Spotlight: ${itemTitle} — Dependable performance when quality matters most.`;
    }

    const specLines = specs
      ? `\nKey Features:\n${specs.split("|").map(s => `✓ ${s.trim()}`).slice(0, 4).join("\n")}`
      : "";

    return `${hook}\n\n${specLines}\n\nAt Nunes Instrumentation, we supply genuine testing instruments backed by technical warranty, calibration reports, and prompt after-sales service.\n\n📍 Office & Support: Kolkata, India | Shipping Nationwide\n${action}\n\n#NunesInstrumentation #TestingEquipment #IndustrialTools #QualityAssurance #EngineeringIndia`;
  }

  if (platform === "Instagram") {
    const hook = `⚡ Technical Showcase: ${itemTitle}`;
    const bullets = specs
      ? specs.split("|").slice(0, 4).map(s => `🔹 ${s.trim()}`).join("\n")
      : "🔹 Certified High Precision & Accuracy\n🔹 Rugged Ergonomic Field Design\n🔹 Rapid Measurement Response";

    const appSummary = applications ? `\n\n📌 Applications: ${applications}` : "";

    return `${hook}\n\n${bullets}${appSummary}\n\nDesigned for plant engineers, calibration laboratories, and QA specialists who demand uncompromising repeatability.\n\n💬 Send us a DM or visit our profile link for pricing and catalogs.\n\n${action}\n\n#nunesinstrumentation #instrumentation #testingequipment #industrialtools #laboratoryequipment #measurementsolutions #engineeringtools #qualitycontrol #processengineering #calibrationlab #electricalengineering #manufacturingindia`;
  }

  if (platform === "WhatsApp") {
    const titleHeader = `*NUNES INSTRUMENTATION UPDATE*\n*${itemTitle.toUpperCase()}*`;
    const specBullets = specs
      ? `\n\n*Key Specifications:*\n${specs.split("|").slice(0, 4).map(s => `• ${s.trim()}`).join("\n")}`
      : "";
    const appText = applications ? `\n\n*Applications:* ${applications}` : "";

    return `${titleHeader}${specBullets}${appText}\n\n*Why Nunes:* Certified instruments, NABL traceable calibration certificates available, and fast dispatched delivery across India.\n\n👉 *Reply directly to this chat* or call our team for model datasheets, stock availability, and special industrial pricing.\n\n_Nunes Instrumentation — Serving Industrial Testing Since Decades_`;
  }

  if (platform === "YouTube") {
    return `${itemTitle} — Technical Review & Industrial Demonstration | Nunes Instrumentation\n\nIn this technical demonstration, Nunes Instrumentation explores the operation, calibration procedures, key specifications, and industrial use cases for ${itemTitle}.\n\nSpecifications Overview:\n${specs || "Complete parameters covered in this video demonstration."}\n\n⏱ Video Timestamps:\n0:00 - Introduction & Unboxing\n1:15 - Key Specifications & Build Quality\n2:45 - Live Operational Testing & Measurement\n4:10 - Calibration & Compliance Verification\n5:30 - How to Order & Inquiries\n\n${action}\n\nSubscribe to Nunes Instrumentation for practical measurement guides, product walkthroughs, and calibration tutorials.\n\n#NunesInstrumentation #MeasurementEquipment #Calibration #IndustrialTools`;
  }

  return `${itemTitle}\n\n${specs}\n\n${action}`;
}
