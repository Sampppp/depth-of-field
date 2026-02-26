import { useRef } from "react";
import { toImperial, toMetric } from "./utils/units";

function findXAtY(
  x: number,
  y: number,
  angle: number,
  targetY: number
): number {
  const angleRadians = angle * (Math.PI / 180);
  const slope = Math.tan(angleRadians);
  return ((targetY - y) / slope + x) * -1;
}

function findYAtX(
  x: number,
  _y: number,
  angle: number,
  targetX: number
): number {
  const angleRadians = angle * (Math.PI / 180);
  const slope = Math.tan(angleRadians);
  return slope * (targetX - x);
}

function buildViewPath(
  x: number,
  y: number,
  verticalFieldOfView: number,
  farDistanceInInches: number,
  height: number
) {
  let path = `M${x},${y - 1}`;

  const topRayIntercept = findXAtY(x, y, verticalFieldOfView / 2, 0);
  if (topRayIntercept < farDistanceInInches) {
    path += ` L${topRayIntercept},0 L${farDistanceInInches},0`;
  } else {
    const topRayInterceptY = findYAtX(
      x,
      y,
      verticalFieldOfView / 2,
      farDistanceInInches
    );
    path += ` L${farDistanceInInches},${y - topRayInterceptY}`;
  }
  path += ` L${farDistanceInInches},${y}`;

  const bottomRayIntercept = findXAtY(x, y, -verticalFieldOfView / 2, height);
  if (bottomRayIntercept < farDistanceInInches) {
    path += ` L${farDistanceInInches},${height} L${bottomRayIntercept},${height}`;
  } else {
    const bottomRayInterceptY = findYAtX(
      x,
      y,
      -(verticalFieldOfView / 2),
      farDistanceInInches
    );
    path += ` L${farDistanceInInches},${y + -bottomRayInterceptY}`;
  }

  path += ` L${x},${y + 1} Z`;

  return path;
}

export default function PhotographyGraphic({
  distanceToSubjectInInches,
  nearFocalPointInInches,
  farFocalPointInInches,
  farDistanceInInches,
  focalLength,
  aperture,
  system,
  verticalFieldOfView,
  onChangeDistance,
}: {
  distanceToSubjectInInches: number;
  nearFocalPointInInches: number;
  farFocalPointInInches: number;
  farDistanceInInches: number;
  focalLength: number;
  aperture: number;
  system: string;
  verticalFieldOfView: number;
  onChangeDistance?: (distance: number) => void;
}) {
  const convertUnits = system === "Imperial" ? toImperial : toMetric;

  const svgRef = useRef<SVGSVGElement>(null);
  const mouseDownRef = useRef(false);
  function onMouseDown() {
    mouseDownRef.current = true;
  }
  function onMouseUp() {
    mouseDownRef.current = false;
  }
  function onMouseMove(evt: React.MouseEvent<SVGSVGElement, MouseEvent>) {
    if (mouseDownRef.current) {
      const pt = svgRef.current!.createSVGPoint(); // Created once for document

      pt.x = evt.clientX;
      pt.y = evt.clientY;

      const cursorpt = pt.matrixTransform(
        svgRef.current!.getScreenCTM()!.inverse()
      );
      const x = Math.max(5, Math.min(farDistanceInInches, cursorpt.x));
      onChangeDistance?.(x);
    }
  }

  const height = 50;

  const viewPath = buildViewPath(
    0,
    25,
    verticalFieldOfView,
    farDistanceInInches,
    height
  );

  return (
    <svg
      ref={svgRef}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onMouseMove={onMouseMove}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`-43.5 0 ${farDistanceInInches} ${height + 12}`}
      style={{ width: "100%", height: "auto" }}
    >
      <defs>
        <style>
          {`
.cls-1 {
  stroke-width: 0px;
}      
`}
        </style>
        <clipPath id="fov">
          <path d={viewPath} />
        </clipPath>
        <clipPath id="subject">
          <rect x={0} y={0} width={500} height={height} />
        </clipPath>
      </defs>

      {/* <rect
        x={0}
        y={0}
        width={farDistanceInInches}
        height={height}
        fill="#f3f3f3"
      /> */}

      <path d={viewPath} fill="#ccc" />

      <path
        className="cls-1"
        transform="translate(-39.9 6) scale(0.92)"
        d="M 35 25 H 43.5 V 16 H 35 Z" 
        stroke="black" 
        clipPath="url(#subject)"
      />

      <line
        x1={nearFocalPointInInches}
        y1={height + 7}
        x2={nearFocalPointInInches}
        y2={height + 9}
        stroke="#aaa"
        strokeWidth={0.2}
      />
      <line
        x1={farFocalPointInInches}
        y1={height + 7}
        x2={farFocalPointInInches}
        y2={height + 9}
        stroke="#aaa"
        strokeWidth={0.2}
      />
      <line
        x1={nearFocalPointInInches}
        y1={height + 8}
        x2={farFocalPointInInches}
        y2={height + 8}
        stroke="#aaa"
        strokeWidth={0.2}
      />
      <text
        x={
          nearFocalPointInInches +
          (farFocalPointInInches - nearFocalPointInInches) / 2
        }
        y={height + 10.7}
        fontSize={3}
        textAnchor="middle"
      >
        {convertUnits(farFocalPointInInches - nearFocalPointInInches)}
      </text>

      <text x={-1} y={5} fontSize={4} fontWeight="bold" textAnchor="end">
        {focalLength.toFixed(0)}mm f/{aperture.toFixed(1)}
      </text>

      {farFocalPointInInches - nearFocalPointInInches > 18 && (
        <>
          <text
            fontSize={3}
            textAnchor="start"
            transform={`translate(${nearFocalPointInInches - 0.5} ${
              height - 1
            }) rotate(-90)`}
          >
            {convertUnits(nearFocalPointInInches, 0)}
          </text>
          <text
            fontSize={3}
            textAnchor="start"
            transform={`translate(${farFocalPointInInches + 0.5} 1) rotate(90)`}
          >
            {convertUnits(farFocalPointInInches, 0)}
          </text>
        </>
      )}
      <text
        x={distanceToSubjectInInches}
        y={height + 3.5}
        fontSize={3}
        textAnchor="middle"
      >
        {convertUnits(distanceToSubjectInInches, 0)}
      </text>

      

      <line
        x1={distanceToSubjectInInches}
        y1={0}
        x2={distanceToSubjectInInches}
        y2={height}
        stroke="#aaa"
        strokeWidth={0.2}
      />

      <rect
        x={nearFocalPointInInches}
        y={0}
        width={farFocalPointInInches - nearFocalPointInInches}
        height={height}
        fill="red"
        fillOpacity={0.2}
      />
    </svg>
  );
}
