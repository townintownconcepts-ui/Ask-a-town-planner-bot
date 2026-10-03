// LANDRIZA - Product 1: Know Your Land Before You Buy
// Powered by DUISCA

function getLandrizaReport(lat, lon, plotSize) {
  const report = {
    location: "Ibeju-Lekki, Lagos",
    lat: lat,
    lon: lon,
    plotSize: plotSize || "600m²",
    scorecard: {
      developmentPressure: "HIGH",
      roadAccessibility: "MEDIUM",
      floodExposure: "MODERATE",
      existingDevelopment: "HIGH",
      infrastructure: "MEDIUM",
      planningSensitivity: "MODERATE",
      developmentPotential: "Requires professional review"
    },
    explanations: {
      developmentPressure: "HIGH demand from nearby industrial & logistics projects (Dangote Refinery, Lekki Free Zone). 347 buildings within 1km.",
      roadAccessibility: "Access via Epe-Ibeju Road, 450m to tarred road. Last 120m untarred - seasonal congestion.",
      floodExposure: "Low-lying near wetlands. Elevation 12m. Seasonal flooding possible - needs drainage plan.",
      existingDevelopment: "Surrounded by ongoing residential & commercial builds - high growth corridor.",
      infrastructure: "Power & water available within 500m. Drainage works in progress.",
      planningSensitivity: "Subject to Lagos State Physical Planning permit. Not in govt acquisition."
    },
    overallRisk: "MODERATE",
    recommendation: "Proceed with detailed flood assessment & drainage plan before construction."
  };
  return report;
}

function formatForWhatsApp(report) {
return `*🏘️ LANDRIZA - Property Intelligence Report*
*Know Your Land Before You Buy*

📍 *Location:* ${report.location}
📌 *Coords:* ${report.lat}, ${report.lon}
📐 *Plot Size:* ${report.plotSize}

*--- SCORECARD ---*
🏗️ Dev Pressure: *${report.scorecard.developmentPressure}* 🔴
🛣️ Road Access: *${report.scorecard.roadAccessibility}* 🟡
🌊 Flood Exposure: *${report.scorecard.floodExposure}* 🟡
🏘️ Existing Dev: *${report.scorecard.existingDevelopment}* 🔴
🔌 Infrastructure: *${report.scorecard.infrastructure}* 🟡
⚖️ Planning: *${report.scorecard.planningSensitivity}* 🟡

*--- WHY? ---*
• ${report.explanations.developmentPressure}
• ${report.explanations.roadAccessibility}
• ${report.explanations.floodExposure}

*Overall Risk:* *${report.overallRisk}*
*Recommendation:* ${report.recommendation}

*Powered by DUISCA | Talk to Planner: 09131137895*`;
}

module.exports = { getLandrizaReport, formatForWhatsApp };
