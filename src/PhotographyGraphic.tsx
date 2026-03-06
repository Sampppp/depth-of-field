import { useRef } from "react";

function formatMM(mm: number, precision = 1): string {
  if (mm >= 10000) return `${(mm / 1000).toFixed(1)} m`;
  if (mm >= 1000) return `${(mm / 1000).toFixed(2)} m`;
  return `${mm.toFixed(precision)} mm`;
}

/**
 * Build the FOV trapezoid path.
 *
 * The cone's left edge spans (originX, topY) to (originX, botY) —
 * these are the top/bottom of the lens image circle at the focal plane,
 * NOT the sensor edges.
 *
 * Each ray diverges outward at halfAngleRad:
 *   top ray:    y = topY - (x - originX) * tan(halfAngleRad)
 *   bottom ray: y = botY + (x - originX) * tan(halfAngleRad)
 *
 * Clipped at farX and svgTop/svgBot.
 */
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

  const xTopClip = topY > svgTop
    ? originX + (topY - svgTop) / Math.tan(halfAngleRad)
    : Infinity;
  const xBotClip = botY < svgBot
    ? originX + (svgBot - botY) / Math.tan(halfAngleRad)
    : Infinity;

  let path = `M${originX},${topY}`;

  if (xTopClip < farX) {
    path += ` L${xTopClip},${svgTop} L${farX},${svgTop}`;
  } else {
    path += ` L${farX},${Math.max(svgTop, topAtFar)}`;
  }

  path += ` L${farX},${Math.min(svgBot, botAtFar)}`;

  if (xBotClip < farX) {
    path += ` L${xBotClip},${svgBot}`;
  }

  path += ` L${originX},${botY} Z`;
  return path;
}

export default function PhotographyGraphic({
  distanceToSubjectMM,
  nearLimitMM,
  farLimitMM,
  farDistanceMM,
  focalLength,
  aperture,
  sensorWidth,
  sensorHeight,
  sensorName,
  lensCoverageDiameterMM,
  onChangeDistance,
}: {
  distanceToSubjectMM: number;
  nearLimitMM: number;
  farLimitMM: number;
  farDistanceMM: number;
  focalLength: number;
  aperture: number;
  sensorWidth: number;
  sensorHeight: number;
  sensorName: string;
  /** Lens image circle diameter in mm */
  lensCoverageDiameterMM: number;
  onChangeDistance?: (distanceMM: number) => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const mouseDownRef = useRef(false);

  // --- Scale: sensor oriented on its side ---
  // sensorWidth spans vertically (the face the cone emerges from).
  // sensorHeight is the horizontal depth of the rect.
  const sensorDisplayFaceHeight = 20; // SVG units — represents sensorWidth mm
  const mmPerSVG = sensorWidth / sensorDisplayFaceHeight;
  const toSVGmm = (mm: number) => mm / mmPerSVG;

  // Sensor rect: face (width dim) is vertical, depth (height dim) is horizontal
  const sensorDisplayFaceWidth = toSVGmm(sensorHeight);

  // Lens image circle in SVG units
  const lensRadiusSVG = toSVGmm(lensCoverageDiameterMM / 2);

  // SVG canvas — tall enough to contain the cone even if it exceeds sensor bounds
  const svgHeight = Math.max(sensorDisplayFaceHeight * 4, lensRadiusSVG * 2 * 1.4);
  const centerY   = svgHeight / 2;

  // Sensor rect: depth runs left→right, face runs top→bottom
  const sensorLeft   = 0;
  const sensorRight  = sensorDisplayFaceWidth;
  const sensorTop    = centerY - sensorDisplayFaceHeight / 2;

  // Cone origin = right edge of sensor, but cone half-height = lens coverage radius
  const coneOriginX  = sensorRight;
  const coneTopY     = centerY - lensRadiusSVG;
  const coneBotY     = centerY + lensRadiusSVG;

  // Half-angle from lens coverage: atan(coverageRadius / focalLength)
  // Both in mm, so ratio is correct regardless of SVG scale.
  const halfAngleRad = Math.atan((lensCoverageDiameterMM / 2) / focalLength);

  // FoV angles based on lens coverage (what the lens actually captures)
  const coverageFoVDeg = 2 * Math.atan((lensCoverageDiameterMM / 2) / focalLength) * (180 / Math.PI);
  // FoV angles that land on the sensor (what the sensor records)
  const horizontalFoVDeg = 2 * Math.atan(sensorWidth  / 2 / focalLength) * (180 / Math.PI);
  const verticalFoVDeg   = 2 * Math.atan(sensorHeight / 2 / focalLength) * (180 / Math.PI);

  // --- Scene X scaling ---
  const sceneWidthSVG = 280;
  const scaleX = sceneWidthSVG / farDistanceMM;
  function toSVGx(mm: number): number {
    return sensorRight + mm * scaleX;
  }

  const svgFar     = toSVGx(farDistanceMM);
  const svgSubject = toSVGx(distanceToSubjectMM);
  const svgNear    = toSVGx(nearLimitMM);
  const svgFarDof  = toSVGx(farLimitMM);

  const viewPath = buildViewPath(
    coneOriginX, coneTopY, coneBotY,
    halfAngleRad,
    svgFar,
    0, svgHeight
  );

  function onMouseDown() { mouseDownRef.current = true; }
  function onMouseUp()   { mouseDownRef.current = false; }
  function onMouseMove(evt: React.MouseEvent<SVGSVGElement>) {
    if (!mouseDownRef.current || !svgRef.current) return;
    const pt = svgRef.current.createSVGPoint();
    pt.x = evt.clientX;
    const cursorpt = pt.matrixTransform(svgRef.current.getScreenCTM()!.inverse());
    const distMM = Math.max(200, Math.min(farDistanceMM, (cursorpt.x - sensorRight) / scaleX));
    onChangeDistance?.(distMM);
  }

  const dofSpanSVG     = svgFarDof - svgNear;
  const showEdgeLabels = dofSpanSVG > sceneWidthSVG * 0.05;

  const labelPad = 14;
  const rulerPad = 16;
  const viewBoxX = sensorLeft - 8;
  const viewBoxW = svgFar - viewBoxX + 6;

  // Does the image circle over-cover or under-cover the sensor?
  const sensorDiagonal      = Math.sqrt(sensorWidth ** 2 + sensorHeight ** 2);
  const circleCoverssSensor = lensCoverageDiameterMM >= sensorDiagonal;

  return (
    <svg
      ref={svgRef}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onMouseMove={onMouseMove}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`${viewBoxX} ${-labelPad} ${viewBoxW} ${svgHeight + labelPad + rulerPad}`}
      style={{ width: "100%", height: "auto", cursor: "ew-resize" }}
    >
      {/* ── FOV cone (lens image circle coverage) ── */}
      <path d={viewPath} fill="#c8d8e8" fillOpacity={0.5} />

      {/* ── DoF region ── */}
      <rect x={svgNear} y={0} width={dofSpanSVG} height={svgHeight}
        fill="#e05555" fillOpacity={0.15} />
      <line x1={svgNear}   y1={0} x2={svgNear}   y2={svgHeight}
        stroke="#c44" strokeWidth={0.3} strokeDasharray="1.5,1.5" />
      <line x1={svgFarDof} y1={0} x2={svgFarDof} y2={svgHeight}
        stroke="#c44" strokeWidth={0.3} strokeDasharray="1.5,1.5" />

      {/* ── Subject distance line ── */}
      <line x1={svgSubject} y1={0} x2={svgSubject} y2={svgHeight}
        stroke="#555" strokeWidth={0.3} strokeDasharray="2,1.5" />

      {/* ── Sensor rectangle ── */}
      <rect
        x={sensorLeft} y={sensorTop}
        width={sensorDisplayFaceWidth} height={sensorDisplayFaceHeight}
        fill="#1a6aff" fillOpacity={0.2}
        stroke="#1a6aff" strokeWidth={0.6}
        rx={0.3}
      />

      {/* Lens coverage bracket at cone origin —
          shows where image circle top/bottom sit relative to sensor */}
      <line
        x1={coneOriginX - 1} y1={coneTopY}
        x2={coneOriginX + 1} y2={coneTopY}
        stroke={circleCoverssSensor ? "#22aa55" : "#e07700"} strokeWidth={0.5}
      />
      <line
        x1={coneOriginX - 1} y1={coneBotY}
        x2={coneOriginX + 1} y2={coneBotY}
        stroke={circleCoverssSensor ? "#22aa55" : "#e07700"} strokeWidth={0.5}
      />
      <line
        x1={coneOriginX} y1={coneTopY}
        x2={coneOriginX} y2={coneBotY}
        stroke={circleCoverssSensor ? "#22aa55" : "#e07700"} strokeWidth={0.4}
        strokeDasharray="1.5,1"
      />

      {/* Sensor label */}
      <text
        x={sensorLeft + sensorDisplayFaceWidth / 2} y={sensorTop - 4.5}
        fontSize={3} fontWeight="bold" textAnchor="middle" fill="#1a6aff"
      >
        {sensorName}
      </text>
      <text
        x={sensorLeft + sensorDisplayFaceWidth / 2} y={sensorTop - 1.2}
        fontSize={2.4} textAnchor="middle" fill="#1a6aff"
      >
        {sensorWidth}×{sensorHeight} mm
      </text>

      {/* Coverage / FoV annotation */}
      <text
        x={coneOriginX + 10} y={centerY - lensRadiusSVG - 1.5}
        fontSize={2.4} textAnchor="start"
        fill={circleCoverssSensor ? "#22aa55" : "#e07700"}
      >
        ∅{lensCoverageDiameterMM.toFixed(1)} mm circle · {coverageFoVDeg.toFixed(1)}°
      </text>
      <text x={coneOriginX + 10} y={centerY - 2} fontSize={2.4} textAnchor="start" fill="#3a7aaa">
        Sensor FOV: H {horizontalFoVDeg.toFixed(1)}°  V {verticalFoVDeg.toFixed(1)}°
      </text>

      {/* ── Ruler below ── */}
      <line x1={svgNear}   y1={svgHeight + 6} x2={svgNear}   y2={svgHeight + 9} stroke="#888" strokeWidth={0.25} />
      <line x1={svgFarDof} y1={svgHeight + 6} x2={svgFarDof} y2={svgHeight + 9} stroke="#888" strokeWidth={0.25} />
      <line x1={svgNear}   y1={svgHeight + 7.5} x2={svgFarDof} y2={svgHeight + 7.5} stroke="#888" strokeWidth={0.25} />

      <text
        x={svgNear + dofSpanSVG / 2} y={svgHeight + 12}
        fontSize={3} textAnchor="middle" fill="#555"
      >
        DoF: {formatMM(farLimitMM - nearLimitMM)}
      </text>

      {showEdgeLabels && (
        <>
          <text fontSize={2.8} textAnchor="start" fill="#c44"
            transform={`translate(${svgNear - 0.5} ${svgHeight - 1}) rotate(-90)`}>
            {formatMM(nearLimitMM)}
          </text>
          <text fontSize={2.8} textAnchor="start" fill="#c44"
            transform={`translate(${svgFarDof + 0.5} 1) rotate(90)`}>
            {formatMM(farLimitMM)}
          </text>
        </>
      )}

      {/* Subject distance label */}
      <text x={svgSubject} y={svgHeight + 3.5} fontSize={3} textAnchor="middle" fill="#333">
        {formatMM(distanceToSubjectMM)}
      </text>

      {/* Lens info */}
      <text
        x={sensorLeft + sensorDisplayFaceWidth / 2} y={-labelPad + 4}
        fontSize={3.5} fontWeight="bold" textAnchor="middle" fill="#222"
      >
        {focalLength.toFixed(0)}mm f/{aperture.toFixed(1)}
      </text>
    </svg>
  );
}