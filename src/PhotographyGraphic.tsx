import { useRef } from "react";

function formatMM(mm: number, precision = 1): string {
  if (mm >= 10000) return `${(mm / 1000).toFixed(1)} m`;
  if (mm >= 1000) return `${(mm / 1000).toFixed(2)} m`;
  return `${mm.toFixed(precision)} mm`;
}

function findXAtY(x: number, y: number, angle: number, targetY: number): number {
  const angleRadians = (angle * Math.PI) / 180;
  const slope = Math.tan(angleRadians);
  return (targetY - y) / slope + x;
}

function findYAtX(x: number, y: number, angle: number, targetX: number): number {
  const angleRadians = (angle * Math.PI) / 180;
  const slope = Math.tan(angleRadians);
  return y + slope * (targetX - x);
}

function buildViewPath(
  x: number,
  y: number,
  verticalFieldOfView: number,
  farDistance: number,
  height: number
) {
  let path = `M${x},${y - 1}`;

  const halfAngle = verticalFieldOfView / 2;

  // Top ray
  const topRayAtTop = findXAtY(x, y, halfAngle, 0);
  if (topRayAtTop > 0 && topRayAtTop < farDistance) {
    path += ` L${topRayAtTop},0 L${farDistance},0`;
  } else {
    const topY = findYAtX(x, y, halfAngle, farDistance);
    path += ` L${farDistance},${topY}`;
  }
  path += ` L${farDistance},${y}`;

  // Bottom ray
  const bottomRayAtBottom = findXAtY(x, y, -halfAngle, height);
  if (bottomRayAtBottom > 0 && bottomRayAtBottom < farDistance) {
    path += ` L${farDistance},${height} L${bottomRayAtBottom},${height}`;
  } else {
    const bottomY = findYAtX(x, y, -halfAngle, farDistance);
    path += ` L${farDistance},${bottomY}`;
  }

  path += ` L${x},${y + 1} Z`;
  return path;
}

export default function PhotographyGraphic({
  distanceToSubjectMM,
  nearLimitMM,
  farLimitMM,
  farDistanceMM,
  focalLength,
  aperture,
  verticalFieldOfView,
  onChangeDistance,
}: {
  distanceToSubjectMM: number;
  nearLimitMM: number;
  farLimitMM: number;
  farDistanceMM: number;
  focalLength: number;
  aperture: number;
  verticalFieldOfView: number;
  onChangeDistance?: (distanceMM: number) => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const mouseDownRef = useRef(false);

  const height = 50;
  // Scale: SVG units = mm / scale, so farDistanceMM maps to a manageable SVG width
  // We'll work directly in mm but scale the viewBox
  const scale = farDistanceMM / 360; // normalize to ~360 SVG units wide

  const toSVG = (mm: number) => mm / scale;

  const svgFar = toSVG(farDistanceMM);
  const svgSubject = toSVG(distanceToSubjectMM);
  const svgNear = toSVG(nearLimitMM);
  const svgFar_ = toSVG(farLimitMM);

  const cameraX = -4;
  const cameraY = height / 2;

  const viewPath = buildViewPath(cameraX, cameraY, verticalFieldOfView, svgFar, height);

  function onMouseDown() {
    mouseDownRef.current = true;
  }
  function onMouseUp() {
    mouseDownRef.current = false;
  }
  function onMouseMove(evt: React.MouseEvent<SVGSVGElement>) {
    if (!mouseDownRef.current || !svgRef.current) return;
    const pt = svgRef.current.createSVGPoint();
    pt.x = evt.clientX;
    const cursorpt = pt.matrixTransform(svgRef.current.getScreenCTM()!.inverse());
    const clampedSVG = Math.max(toSVG(10), Math.min(svgFar, cursorpt.x));
    onChangeDistance?.(clampedSVG * scale);
  }

  const dofWidth = svgFar_ - svgNear;
  const showLabels = dofWidth > svgFar * 0.05;

  return (
    <svg
      ref={svgRef}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onMouseMove={onMouseMove}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`-45 0 ${svgFar + 5} ${height + 14}`}
      style={{ width: "100%", height: "auto", cursor: "ew-resize" }}
    >
      {/* FOV cone */}
      <path d={viewPath} fill="#c8d8e8" fillOpacity={0.5} />

      {/* Camera icon */}
      <rect x={-8} y={cameraY - 5} width={7} height={10} rx={1} fill="#555" />
      <rect x={-1} y={cameraY - 3} width={3} height={6} rx={1} fill="#777" />

      {/* DoF region */}
      <rect
        x={svgNear}
        y={0}
        width={dofWidth}
        height={height}
        fill="#e05555"
        fillOpacity={0.18}
      />

      {/* Subject line */}
      <line x1={svgSubject} y1={0} x2={svgSubject} y2={height} stroke="#555" strokeWidth={0.3} strokeDasharray="2,1" />

      {/* Near/far DoF tick marks */}
      <line x1={svgNear} y1={height + 6} x2={svgNear} y2={height + 9} stroke="#888" strokeWidth={0.25} />
      <line x1={svgFar_} y1={height + 6} x2={svgFar_} y2={height + 9} stroke="#888" strokeWidth={0.25} />
      <line x1={svgNear} y1={height + 7.5} x2={svgFar_} y2={height + 7.5} stroke="#888" strokeWidth={0.25} />

      {/* DoF span label */}
      <text
        x={svgNear + dofWidth / 2}
        y={height + 11.5}
        fontSize={3}
        textAnchor="middle"
        fill="#555"
      >
        DoF: {formatMM(farLimitMM - nearLimitMM)}
      </text>

      {/* Near/far labels */}
      {showLabels && (
        <>
          <text
            fontSize={2.8}
            textAnchor="start"
            fill="#c44"
            transform={`translate(${svgNear - 0.5} ${height - 1}) rotate(-90)`}
          >
            {formatMM(nearLimitMM)}
          </text>
          <text
            fontSize={2.8}
            textAnchor="start"
            fill="#c44"
            transform={`translate(${svgFar_ + 0.5} 1) rotate(90)`}
          >
            {formatMM(farLimitMM)}
          </text>
        </>
      )}

      {/* Subject distance label */}
      <text x={svgSubject} y={height + 3.5} fontSize={3} textAnchor="middle" fill="#333">
        {formatMM(distanceToSubjectMM)}
      </text>

      {/* Lens info */}
      <text x={-1} y={5} fontSize={4} fontWeight="bold" textAnchor="end" fill="#222">
        {focalLength.toFixed(0)}mm f/{aperture.toFixed(1)}
      </text>
    </svg>
  );
}