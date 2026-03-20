/**
 * CompressionGraphic.tsx
 *
 * Top-down bird's-eye SVG: camera → sensor → FOV cone → subject → background.
 * Styled to match PhotographyGraphic.tsx.
 *
 * SCALE DIRECTION:
 *   Wide lens → short working distance → background proportionally FAR → high ratio → DISTORTION.
 *   Long lens → long working distance → background proportionally closer → low ratio → COMPRESSION.
 *   compressionRatio = cameraToBackground / cameraToSubject
 */

function formatMM(mm: number, precision = 1): string {
  if (mm >= 10000) return `${(mm / 1000).toFixed(1)} m`;
  if (mm >= 1000)  return `${(mm / 1000).toFixed(2)} m`;
  return `${mm.toFixed(precision)} mm`;
}

function buildViewPath(
  originX: number,
  topY: number,
  botY: number,
  halfAngleRad: number,
  farX: number,
  svgTop: number,
  svgBot: number
): string {
  const spread = (x: number) => (x - originX) * Math.tan(halfAngleRad);
  const topAtFar = topY - spread(farX);
  const botAtFar = botY + spread(farX);
  const xTopClip = topY > svgTop ? originX + (topY - svgTop) / Math.tan(halfAngleRad) : Infinity;
  const xBotClip = botY < svgBot ? originX + (svgBot - botY) / Math.tan(halfAngleRad) : Infinity;
  let path = `M${originX},${topY}`;
  if (xTopClip < farX) {
    path += ` L${xTopClip},${svgTop} L${farX},${svgTop}`;
  } else {
    path += ` L${farX},${Math.max(svgTop, topAtFar)}`;
  }
  path += ` L${farX},${Math.min(svgBot, botAtFar)}`;
  if (xBotClip < farX) path += ` L${xBotClip},${svgBot}`;
  path += ` L${originX},${botY} Z`;
  return path;
}

export interface CompressionGraphicProps {
  focalLengthMM: number;
  sensorWidth: number;
  sensorHeight: number;
  sensorName: string;
  frameWidthMM: number;
  backgroundDistanceMM: number;
  aperture: number;
  lensCoverageDiameterMM: number;   // shared with PhotographyGraphic
}

export default function CompressionGraphic({
  focalLengthMM,
  sensorWidth,
  sensorHeight,
  sensorName,
  frameWidthMM,
  backgroundDistanceMM,
  aperture,
  lensCoverageDiameterMM,
}: CompressionGraphicProps) {

  // ── Physics ────────────────────────────────────────────────────────────────
  const cameraToSubjectMM    = (focalLengthMM * frameWidthMM) / sensorWidth;
  // Depth‑of‑Field calculations (same as PhotographyGraphic)
  const sensorDiagonal = Math.sqrt(sensorWidth ** 2 + sensorHeight ** 2);
  const coc = sensorDiagonal / 1500;
  const hyperfocalMM = focalLengthMM + (focalLengthMM ** 2) / (aperture * coc);
  // const distanceToSubjectMM = cameraToSubjectMM; // not needed for compression graphic
  const cameraToBackgroundMM = cameraToSubjectMM + backgroundDistanceMM;
  // ratio: high (wide/close) → distortion; low (tele/far) → compression
  const compressionRatio = cameraToBackgroundMM / cameraToSubjectMM;

  // Lens coverage bracket color logic (same as PhotographyGraphic)
  const circleCoverssSensor = lensCoverageDiameterMM >= sensorDiagonal;


  // ── Scale direction (CORRECTED) ────────────────────────────────────────────
  // t=0 → compression (tele, ratio close to 1, red end)
  // t=1 → distortion  (wide, ratio high, blue end)
  // We map ratio from ~1 (tele extreme) to ~15 (ultra-wide extreme)
  // t increases as ratio increases (distortion direction)
  const maxRatioForScale = 5;
  const t = Math.min((compressionRatio - 1) / (maxRatioForScale - 1), 1); // 0=compression, 1=distortion

  // Color: t=0 (compression) → red/warm, t=1 (distortion) → blue/cool
  const cr = Math.round(220 - t * (220 - 26));
  const cg = Math.round(60  + t * (106 - 60));
  const cb = Math.round(50  + t * (255 - 50));
  const scaleColor = `rgb(${cr},${cg},${cb})`;


function scaleDescription(t: number): { label: string; sublabel: string } {
  // t is 0 (compression) → 1 (distortion), matching the scale bar position
  // Thresholds derived from original ratio breakpoints (maxRatioForScale = 15)
  if (t >= 0.83) return { label: "Extreme Distortion",  sublabel: "ultra-wide or very close — severe facial geometry stretching" };
  if (t >= 0.66) return { label: "Strong Distortion",   sublabel: "wide angle — noticeable nose/ear size exaggeration" };
  if (t >= 0.5) return { label: "Mild Distortion",     sublabel: "moderate wide — slight perspective stretching" };
  if (t >= 0.46) return { label: "Neutral",             sublabel: "natural perspective — minimal distortion or compression" };
  if (t >= 0.3) return { label: "Mild Compression",    sublabel: "short telephoto — subtle background stacking" };
  if (t >= 0.16) return { label: "Strong Compression",  sublabel: "telephoto — background appears noticeably closer" };
  return                   { label: "Extreme Compression", sublabel: "super-telephoto — background nearly flat with subject" };
}

  const { label: scaleLabel, sublabel: scaleSublabel } = scaleDescription(t);


  // ── Sensor display (mirrors PhotographyGraphic) ───────────────────────────
  const sensorDisplayFaceHeight = 20;
  const mmPerSVG                = sensorWidth / sensorDisplayFaceHeight;
  const toSVGmm                 = (mm: number) => mm / mmPerSVG;
  const sensorDisplayFaceWidth  = toSVGmm(sensorHeight);
  const svgHeight = sensorDisplayFaceHeight * 4;
  const centerY   = svgHeight / 2;
  // Compute lens radius and cone geometry (same as PhotographyGraphic)
  const lensRadiusSVG = toSVGmm(lensCoverageDiameterMM / 2);
  const coneTopY    = centerY - lensRadiusSVG;
  const coneBotY    = centerY + lensRadiusSVG;
  const halfAngleRad = Math.atan((lensCoverageDiameterMM / 2) / focalLengthMM);
  const horizontalFoVDeg = 2 * halfAngleRad * (180 / Math.PI);
  const verticalFoVDeg   = 2 * Math.atan((sensorHeight / 2) / focalLengthMM) * (180 / Math.PI);


  const sensorLeft  = 0;
  const sensorRight = sensorDisplayFaceWidth;
  const sensorTop   = centerY - sensorDisplayFaceHeight / 2;
  // Helper clamp (same as PhotographyGraphic)
  const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

  const coneOriginX = sensorRight;
  // coneTopY and coneBotY are now defined above using lensRadiusSVG

  // ── Scene X scaling ────────────────────────────────────────────────────────
  const sceneWidthSVG = 280;
  const totalSceneMM  = cameraToBackgroundMM * 1.1;
  const scaleX        = sceneWidthSVG / totalSceneMM;
  const toSVGx        = (mm: number) => sensorRight + mm * scaleX;

  // DoF calculations (same as PhotographyGraphic)
  const maxDisplayMM = 15000;
  const dFocus = cameraToSubjectMM - focalLengthMM;
  const nearLimitMM = (hyperfocalMM * cameraToSubjectMM) / (hyperfocalMM + dFocus);
  const rawFarMM = (hyperfocalMM * cameraToSubjectMM) / (hyperfocalMM - dFocus);
  const farLimitMM = clamp(
    rawFarMM < 0 || rawFarMM > maxDisplayMM ? maxDisplayMM : rawFarMM,
    nearLimitMM,
    maxDisplayMM
  );
  const clampedNearMM = clamp(nearLimitMM, 0, maxDisplayMM);
  const svgNear = toSVGx(clampedNearMM);
  const svgFarDof = toSVGx(farLimitMM);
  const dofSpanSVG = svgFarDof - svgNear;

  const svgFar     = toSVGx(totalSceneMM);
  const svgSubject = toSVGx(cameraToSubjectMM);
  const svgBg      = toSVGx(cameraToBackgroundMM);

  const viewPath = buildViewPath(coneOriginX, coneTopY, coneBotY, halfAngleRad, svgFar, 0, svgHeight);

  const maxHalf        = svgHeight / 2 - 1;
  const subjectHalfSVG = Math.min(Math.tan(halfAngleRad) * cameraToSubjectMM    * scaleX, maxHalf);
  const bgHalfSVG      = Math.min(Math.tan(halfAngleRad) * cameraToBackgroundMM * scaleX, maxHalf);

  // ── Viewbox / padding ─────────────────────────────────────────────────────
  const labelPad = 24;
  const rulerPad = 22;
  const viewBoxX = sensorLeft - 8;
  const viewBoxW = svgFar - viewBoxX + 6;

  // Scale bar
  const barX = viewBoxX + 2;
  const barW = Math.min(90, viewBoxW * 0.30);
  const barY = -labelPad + 2;
  const barH = 5;
  // marker position: t=0 (compression) at RIGHT, t=1 (distortion) at LEFT
  // So marker moves left→right as distortion increases (t increases)
  const markerX = barX + t * barW;



  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`${viewBoxX} ${-labelPad} ${viewBoxW} ${svgHeight + labelPad + rulerPad}`}
      style={{ width: "100%", height: "auto" }}
    >
      <defs>
        {/* Distortion(blue/left) ←→ Compression(red/right) — but marker moves left=compression, right=distortion */}
        <linearGradient id="scaleGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="rgb(220,60,50)"  />  {/* compression = left */}
          <stop offset="45%"  stopColor="rgb(130,140,170)" />
          <stop offset="100%" stopColor="rgb(26,106,255)"  />  {/* distortion = right */}
        </linearGradient>
      </defs>

      {/* ── Scale bar: Compression ←→ Distortion ── */}
      <rect x={barX} y={barY} width={barW} height={barH} rx={1}
        fill="url(#scaleGrad)" fillOpacity={0.45} stroke="#aaa" strokeWidth={0.3} />
      <text x={barX + 1}       y={barY + barH - 1} fontSize={2.2} fill="rgb(220,60,50)">Compression</text>
      <text x={barX + barW - 1} y={barY + barH - 1} fontSize={2.2} textAnchor="end" fill="rgb(26,106,255)">Distortion</text>
      {/* marker triangle pointing up from below the bar */}
      <polygon
        points={`${markerX},${barY + barH + 0.5} ${markerX - 1.8},${barY + barH + 4} ${markerX + 1.8},${barY + barH + 4}`}
        fill={scaleColor}
      />
      {/* ratio + label */}
      <text x={barX} y={barY + barH + 9.5} fontSize={3.2} fontWeight="bold" fill={scaleColor}>
        {compressionRatio.toFixed(2)}× — {scaleLabel}
      </text>
      <text x={barX} y={barY + barH + 14} fontSize={2.4} fill="#666">
        {scaleSublabel}
      </text>

      {/* ── FOV cone ── */}
      <path d={viewPath} fill="#c8d8e8" fillOpacity={0.5} />

      {/* DoF region overlay */}
      <rect x={svgNear} y={0} width={dofSpanSVG} height={svgHeight}
        fill="#e05555" fillOpacity={0.15} />
      <line x1={svgNear} y1={0} x2={svgNear} y2={svgHeight}
        stroke="#c44" strokeWidth={0.3} strokeDasharray="1.5,1.5" />
      <line x1={svgFarDof} y1={0} x2={svgFarDof} y2={svgHeight}
        stroke="#c44" strokeWidth={0.3} strokeDasharray="1.5,1.5" />

      {/* ── Sensor rectangle ── */}
      <rect x={sensorLeft} y={sensorTop}
        width={sensorDisplayFaceWidth} height={sensorDisplayFaceHeight}
        fill="#1a6aff" fillOpacity={0.2} stroke="#1a6aff" strokeWidth={0.6} rx={0.3} />
      <text x={sensorLeft + sensorDisplayFaceWidth / 2} y={sensorTop - 4.5}
        fontSize={3} fontWeight="bold" textAnchor="middle" fill="#1a6aff">{sensorName}</text>
      <text x={sensorLeft + sensorDisplayFaceWidth / 2} y={sensorTop - 1.2}
        fontSize={2.4} textAnchor="middle" fill="#1a6aff">{sensorWidth}×{sensorHeight} mm</text>

      {/* ── Lens bracket ── */}
      <line x1={coneOriginX - 1} y1={coneTopY} x2={coneOriginX + 1} y2={coneTopY}
        stroke={circleCoverssSensor ? "#22aa55" : "#e07700"} strokeWidth={0.5} />
      <line x1={coneOriginX - 1} y1={coneBotY} x2={coneOriginX + 1} y2={coneBotY}
        stroke={circleCoverssSensor ? "#22aa55" : "#e07700"} strokeWidth={0.5} />
      <line x1={coneOriginX} y1={coneTopY} x2={coneOriginX} y2={coneBotY}
        stroke={circleCoverssSensor ? "#22aa55" : "#e07700"} strokeWidth={0.4} strokeDasharray="1.5,1" />

      {/* FoV annotation */}
      <text x={coneOriginX + 10} y={coneTopY - 1.5} fontSize={2.4} textAnchor="start" fill="#3a7aaa">
        Sensor FOV: H {horizontalFoVDeg.toFixed(1)}°  V {verticalFoVDeg.toFixed(1)}°
      </text>

      {/* Focal length label */}
      <text x={sensorLeft + sensorDisplayFaceWidth / 2} y={-labelPad + 4}
        fontSize={3.5} fontWeight="bold" textAnchor="middle" fill="#222">
        {focalLengthMM.toFixed(0)}mm
      </text>

      {/* ── Subject line ── */}
      <line x1={svgSubject} y1={centerY - subjectHalfSVG} x2={svgSubject} y2={centerY + subjectHalfSVG}
        stroke="#e07700" strokeWidth={1.2} strokeLinecap="round" />
      <line x1={svgSubject - 1.5} y1={centerY - subjectHalfSVG} x2={svgSubject + 1.5} y2={centerY - subjectHalfSVG}
        stroke="#e07700" strokeWidth={0.5} />
      <line x1={svgSubject - 1.5} y1={centerY + subjectHalfSVG} x2={svgSubject + 1.5} y2={centerY + subjectHalfSVG}
        stroke="#e07700" strokeWidth={0.5} />
      <text x={svgSubject + 2.5} y={centerY - subjectHalfSVG + 3.5} fontSize={2.4} textAnchor="start" fill="#e07700">
        {formatMM(frameWidthMM)} frame
      </text>
      <text x={svgSubject} y={svgHeight + 3.5} fontSize={3} textAnchor="middle" fill="#e07700">Subject</text>

      {/* ── Background line ── */}
      <line x1={svgBg} y1={centerY - bgHalfSVG} x2={svgBg} y2={centerY + bgHalfSVG}
        stroke="#888" strokeWidth={1.0} strokeLinecap="round" />
      <line x1={svgBg - 1.5} y1={centerY - bgHalfSVG} x2={svgBg + 1.5} y2={centerY - bgHalfSVG} stroke="#888" strokeWidth={0.5} />
      <line x1={svgBg - 1.5} y1={centerY + bgHalfSVG} x2={svgBg + 1.5} y2={centerY + bgHalfSVG} stroke="#888" strokeWidth={0.5} />
      <text x={svgBg} y={svgHeight + 3.5} fontSize={3} textAnchor="middle" fill="#666">Background</text>

      {/* ── Rulers ── */}
      <line x1={coneOriginX} y1={svgHeight + 12} x2={svgSubject} y2={svgHeight + 12} stroke="#e07700" strokeWidth={0.25} />
      <line x1={coneOriginX} y1={svgHeight + 10} x2={coneOriginX} y2={svgHeight + 14} stroke="#e07700" strokeWidth={0.25} />
      <line x1={svgSubject}  y1={svgHeight + 10} x2={svgSubject}  y2={svgHeight + 14} stroke="#e07700" strokeWidth={0.25} />
      <text x={(coneOriginX + svgSubject) / 2} y={svgHeight + 18} fontSize={2.6} textAnchor="middle" fill="#e07700">
        {formatMM(cameraToSubjectMM)}
      </text>
      <line x1={svgSubject} y1={svgHeight + 12} x2={svgBg} y2={svgHeight + 12} stroke="#888" strokeWidth={0.25} />
      <line x1={svgBg} y1={svgHeight + 10} x2={svgBg} y2={svgHeight + 14} stroke="#888" strokeWidth={0.25} />
      <text x={(svgSubject + svgBg) / 2} y={svgHeight + 18} fontSize={2.6} textAnchor="middle" fill="#888">
        +{formatMM(backgroundDistanceMM)}
      </text>
    </svg>
  );
}
