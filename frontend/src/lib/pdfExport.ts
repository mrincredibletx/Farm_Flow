import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { TerrainAnalysisResponse } from './types';

export function generateAgronomicPDFReport(data: TerrainAnalysisResponse) {
  const doc = new jsPDF();
  const metrics = data.metrics;
  const routes = data.drainage_routes || [];
  const risk = data.risk_simulation;
  const advisory = data.ai_advisory;

  // Header Banner
  doc.setFillColor(10, 16, 29);
  doc.rect(0, 0, 210, 36, 'F');

  doc.setTextColor(0, 240, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('SMART AGRICULTURAL DRAINAGE SYSTEM', 14, 15);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text('Terrain Intelligence & Engineered Runoff Management Report', 14, 22);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.text('Project Owner: Rakesh Bangra (B.Tech CSE, UEM Jaipur)', 14, 29);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-GB')}`, 155, 29);

  let currentY = 44;

  // Executive Summary Section
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('1. Executive Topographic & Hydrological Summary', 14, currentY);
  currentY += 6;

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  const summaryText = data.summary || 'Field terrain elevation analyzed with DEM grid pooling and spatial gradient modeling.';
  const splitSummary = doc.splitTextToSize(summaryText, 182);
  doc.text(splitSummary, 14, currentY);
  currentY += splitSummary.length * 5 + 4;

  // Field Metrics Table
  if (metrics) {
    autoTable(doc, {
      startY: currentY,
      head: [['Hydrological Metric', 'Value', 'Agronomic Interpretation']],
      body: [
        ['Minimum Elevation', `${metrics.min_elevation.toFixed(2)} m`, 'Deepest ground basin / natural catchment point'],
        ['Maximum Elevation', `${metrics.max_elevation.toFixed(2)} m`, 'Highest crest / field ridge boundary'],
        ['Topographic Relief (ΔZ)', `${metrics.elevation_range.toFixed(2)} m`, 'Vertical drop available for gravitational drainage'],
        ['Field Surface Area', `${metrics.total_area_acres.toFixed(2)} acres (${metrics.total_area_hectares.toFixed(2)} ha)`, 'Calculated via spherical Shoelace geodesic projection'],
        ['Dominant Runoff Direction', metrics.dominant_slope_direction, 'Primary surface flow vector for channel discharge'],
        ['Average Surface Slope', `${metrics.average_slope_percent.toFixed(2)}%`, metrics.average_slope_percent < 1.0 ? 'Sluggish grade; artificial ditching required' : 'Adequate natural gravitational runoff'],
        ['Critical Sinks (Depressions)', `${metrics.high_risk_points_count} Sinks`, 'Severe waterlogging risk zones (>70% ponding probability)'],
      ],
      theme: 'grid',
      headStyles: { fillColor: [14, 116, 144], textColor: 255, fontSize: 9, fontStyle: 'bold' },
      styles: { fontSize: 8.5, cellPadding: 3 },
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;
  }

  // Section 2: Drainage Channel Specifications
  if (routes.length > 0) {
    if (currentY > 230) {
      doc.addPage();
      currentY = 20;
    }

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('2. Engineered Drainage Ditch Specifications (A* Pathfinding)', 14, currentY);
    currentY += 6;

    const routeRows = routes.map((r, i) => [
      `Channel #${i + 1}`,
      `${r.length_meters.toFixed(1)} m`,
      `${r.elevation_drop_meters.toFixed(2)} m`,
      `${r.slope_percent.toFixed(2)}%`,
      `${r.excavation_volume_m3.toFixed(1)} m³`,
      `INR ₹${r.estimated_cost_inr.toLocaleString()}`,
      r.recommended_ditch_type,
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['Route ID', 'Length', 'Fall (ΔZ)', 'Slope', 'Excavation', 'Est. Cost', 'Channel Design Type']],
      body: routeRows,
      theme: 'striped',
      headStyles: { fillColor: [30, 41, 59], textColor: [0, 240, 255], fontSize: 8.5, fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 2.5 },
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;
  }

  // Section 3: Soil & Rainfall Scenario Simulation
  if (risk) {
    if (currentY > 230) {
      doc.addPage();
      currentY = 20;
    }

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('3. Soil & Rainfall Infiltration Modeling (SCS-CN)', 14, currentY);
    currentY += 6;

    autoTable(doc, {
      startY: currentY,
      head: [['Soil Classification', 'Rainfall Depth', 'Runoff Volume', 'Depression Ponding', 'Saturation Time', 'Crop Loss Risk']],
      body: [
        [
          `${risk.soil_name} (CN ${risk.curve_number})`,
          `${risk.rainfall_event_mm} mm`,
          `${risk.runoff_volume_m3.toLocaleString()} m³ (${risk.runoff_volume_megaliters} ML)`,
          `${risk.estimated_ponding_depth_cm} cm`,
          `${risk.drainage_time_hours} hrs`,
          `${risk.crop_loss_risk_percent}% (${risk.risk_level})`,
        ],
      ],
      theme: 'grid',
      headStyles: { fillColor: [225, 29, 72], textColor: 255, fontSize: 8.5 },
      styles: { fontSize: 8, cellPadding: 3 },
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;
  }

  // Section 4: AI Agronomic Advisory & Crop Protection
  if (advisory) {
    if (currentY > 220) {
      doc.addPage();
      currentY = 20;
    }

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('4. Agronomic Advisory & Crop Protection Protocol', 14, currentY);
    currentY += 6;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(71, 85, 105);
    doc.text(`Source: ${advisory.generated_by}`, 14, currentY);
    currentY += 6;

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(14, 116, 144);
    doc.text('Recommended Drainage Interventions:', 14, currentY);
    currentY += 5;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    advisory.drainage_recommendations.forEach((rec) => {
      const split = doc.splitTextToSize(`• ${rec}`, 182);
      doc.text(split, 14, currentY);
      currentY += split.length * 4.5;
    });

    currentY += 3;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(225, 29, 72);
    doc.text('Crop Tolerance & Hypoxia Mitigation:', 14, currentY);
    currentY += 5;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    advisory.crop_vulnerability_advice.forEach((tip) => {
      const split = doc.splitTextToSize(`• ${tip}`, 182);
      doc.text(split, 14, currentY);
      currentY += split.length * 4.5;
    });

    currentY += 3;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(5, 150, 105);
    doc.text('Economic Return on Investment (ROI):', 14, currentY);
    currentY += 5;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    const roiSplit = doc.splitTextToSize(advisory.estimated_roi_assessment, 182);
    doc.text(roiSplit, 14, currentY);
    currentY += roiSplit.length * 4.5 + 8;
  }

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('Smart Agricultural Drainage System • B.Tech CSE Final Project • UEM Jaipur', 14, 290);
    doc.text(`Page ${p} of ${totalPages}`, 185, 290);
  }

  doc.save('Agricultural_Drainage_Report_Phase2.pdf');
}
