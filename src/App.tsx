import { useState } from "react";
import {
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  SliderMark,
  Box,
  Flex,
  Text,
  Select,
  Button,
  ButtonGroup,
} from "@chakra-ui/react";

import PhotographyGraphic from "./PhotographyGraphic";
import CompressionPage from "./CompressionPage";
import {
  flToNorm, normToFl,
  apToNorm, normToAp,
  distToNorm, normToDist,
} from "./utils/logSlider";

// ── Sensor comparison SVG ────────────────────────────────────────────────────
function SensorComparison({
  sensorWidth,
  sensorHeight,
  lensCoverageDiameterMM,
}: {
  sensorWidth: number;
  sensorHeight: number;
  lensCoverageDiameterMM: number;
}) {
  const fullWidth = 36;
  const fullHeight = 24;
  const imageCircleRadius = lensCoverageDiameterMM / 2;
  const maxDim = Math.max(fullWidth, fullHeight, sensorWidth, sensorHeight, imageCircleRadius * 2);
  const viewBoxSize = maxDim * 1.2;
  const offset = viewBoxSize / 2;

  return (
    <svg
      width="600" height="400"
      viewBox={`${-offset} ${-offset} ${viewBoxSize} ${viewBoxSize}`}
      style={{ border: "1px solid #ccc", marginTop: "0.5rem" }}
    >
      <rect x={-fullWidth / 2} y={-fullHeight / 2} width={fullWidth} height={fullHeight}
        fill="none" stroke="#ff6600" strokeDasharray="4,2" strokeWidth={0.5} />
      <rect x={-sensorWidth / 2} y={-sensorHeight / 2} width={sensorWidth} height={sensorHeight}
        fill="rgba(0,120,255,0.2)" stroke="#0066ff" strokeWidth={0.5} />
      <circle cx={0} cy={0} r={imageCircleRadius}
        fill="none" stroke="#00aa00" strokeDasharray="2,2" strokeWidth={0.5} />
      <text x={imageCircleRadius + 2} y={0} fontSize={2} fill="#00aa00">
        Image circle: {lensCoverageDiameterMM.toFixed(1)} mm
      </text>
      <text x={-fullWidth / 2} y={-fullHeight / 2 - 2} fontSize={2} fill="#ff6600">
        35mm FF ({fullWidth}×{fullHeight} mm)
      </text>
      <text x={-sensorWidth / 2} y={sensorHeight / 2 + 4} fontSize={2} fill="#0066ff">
        {sensorWidth}×{sensorHeight} mm
      </text>
    </svg>
  );
}

// ── Data ─────────────────────────────────────────────────────────────────────
const SENSORS: Record<string, { sensorWidth: number; sensorHeight: number }> = {
  "Micro Four Thirds":      { sensorWidth: 17.3,  sensorHeight: 13 },
  "APS-C":                  { sensorWidth: 23.6,  sensorHeight: 15.6 },
  "Super 35":               { sensorWidth: 24.89, sensorHeight: 18.66 },
  "35mm (full frame)":      { sensorWidth: 36,    sensorHeight: 24 },
  "4.5x6 (Medium Format)":  { sensorWidth: 56,    sensorHeight: 42 },
  "6x6 (Medium Format)":    { sensorWidth: 56,    sensorHeight: 56 },
  "6x7 (Medium Format)":    { sensorWidth: 70,    sensorHeight: 56 },
  "6x9 (Medium Format)":    { sensorWidth: 84,    sensorHeight: 56 },
};

const LENSES: Record<string, { lensWidth: number; lensHeight: number }> = {
  "Micro Four Thirds":      { lensWidth: 17.3,  lensHeight: 13 },
  "APS-C":                  { lensWidth: 23.6,  lensHeight: 15.6 },
  "Super 35":               { lensWidth: 24.89, lensHeight: 18.66 },
  "35mm (full frame)":      { lensWidth: 36,    lensHeight: 24 },
  "4.5x6 (Medium Format)":  { lensWidth: 56,    lensHeight: 42 },
  "6x6 (Medium Format)":    { lensWidth: 56,    lensHeight: 56 },
  "6x7 (Medium Format)":    { lensWidth: 70,    lensHeight: 56 },
  "6x9 (Medium Format)":    { lensWidth: 84,    lensHeight: 56 },
};

const FULL_FRAME_WIDTH = SENSORS["35mm (full frame)"].sensorWidth;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

// Marks: real values pre-converted to normalized positions
const FL_MARKS = [8, 14, 24, 35, 50, 85, 135, 200, 300, 400, 600].map(v => ({
  norm: flToNorm(v), label: `${v}`,
}));
const AP_MARKS = [0.95, 1.4, 1.8, 2.8, 4, 5.6, 8, 11, 16, 22].map(v => ({
  norm: apToNorm(v), label: `${v}`,
}));
const DIST_MARKS = [200, 500, 1000, 2000, 3000, 5000, 8000, 15000].map(v => ({
  norm: distToNorm(v),
  label: v >= 1000 ? `${v / 1000}m` : `${v}mm`,
}));

type Page = "dof" | "compression";

// ── App ───────────────────────────────────────────────────────────────────────
function App() {
  const [page, setPage] = useState<Page>("dof");

  // All state in real units
  const [distanceToSubjectMM, setDistanceToSubjectMM] = useState(2000);
  const [focalLengthMM,       setFocalLengthMM]       = useState(50);
  const [aperture,            setAperture]             = useState(1.8);
  const [speedMultiplier,     setSpeedMultiplier]      = useState(1);
  const [sensor,              setSensor]               = useState("35mm (full frame)");
  const [lens,                setLens]                 = useState("35mm (full frame)");

  const { sensorWidth, sensorHeight } = SENSORS[sensor];
  const { lensWidth, lensHeight }     = LENSES[lens];

  const cropFactor             = FULL_FRAME_WIDTH / sensorWidth;
  const effectiveFocalLength   = focalLengthMM * speedMultiplier;
  const effectiveAperture      = aperture * speedMultiplier;
  const equivalentFocalLength  = effectiveFocalLength * cropFactor;

  const sensorDiagonal         = Math.sqrt(sensorWidth ** 2 + sensorHeight ** 2);
  const lensDiagonal           = Math.sqrt(lensWidth ** 2 + lensHeight ** 2);
  const lensCoverageDiameterMM = lensDiagonal * speedMultiplier;
  const coc                    = sensorDiagonal / 1500;

  const hyperfocalMM =
    effectiveFocalLength +
    (effectiveFocalLength ** 2) / (effectiveAperture * coc);

  const maxDisplayMM  = 15000;
  const dFocus        = distanceToSubjectMM - effectiveFocalLength;
  const nearLimitMM   = (hyperfocalMM * distanceToSubjectMM) / (hyperfocalMM + dFocus);
  const rawFarMM      = (hyperfocalMM * distanceToSubjectMM) / (hyperfocalMM - dFocus);
  const farLimitMM    = clamp(
    rawFarMM < 0 || rawFarMM > maxDisplayMM ? maxDisplayMM : rawFarMM,
    nearLimitMM, maxDisplayMM
  );
  const clampedNearMM = clamp(nearLimitMM, 0, maxDisplayMM);

  const labelStyles = { mt: "2", ml: "-2.5", fontSize: "12" };

  const dofMM      = farLimitMM - clampedNearMM;
  const dofDisplay = dofMM >= 1000
    ? `${(dofMM / 1000).toFixed(2)} m`
    : `${dofMM.toFixed(0)} mm`;

  return (
    <>
      {/* ── Tab switcher ── */}
      <Box px={6} pt={4} pb={0}>
        <ButtonGroup size="sm" isAttached variant="outline">
          <Button
            onClick={() => setPage("dof")}
            colorScheme={page === "dof" ? "blue" : "gray"}
            variant={page === "dof" ? "solid" : "outline"}
          >
            Depth of Field
          </Button>
          <Button
            onClick={() => setPage("compression")}
            colorScheme={page === "compression" ? "blue" : "gray"}
            variant={page === "compression" ? "solid" : "outline"}
          >
            Compression
          </Button>
        </ButtonGroup>
      </Box>

      {/* ── Depth of Field page ── */}
      {page === "dof" && (
        <>
          <Box p={2} pt={6}>
            <PhotographyGraphic
              distanceToSubjectMM={distanceToSubjectMM}
              nearLimitMM={clampedNearMM}
              farLimitMM={farLimitMM}
              farDistanceMM={maxDisplayMM}
              focalLength={effectiveFocalLength}
              aperture={effectiveAperture}
              sensorWidth={sensorWidth}
              sensorHeight={sensorHeight}
              sensorName={sensor}
              lensCoverageDiameterMM={lensCoverageDiameterMM}
              onChangeDistance={(mm) => setDistanceToSubjectMM(mm)}
            />
          </Box>

          <Box px={6}>
            {/* Subject Distance — log scale */}
            <Box pt={6}>
              <Flex gap={2}>
                <Box w="20%"><Text align="right">Subject Distance</Text></Box>
                <Box flexGrow={1}>
                  <Slider
                    aria-label="distance to subject"
                    value={distToNorm(distanceToSubjectMM)}
                    onChange={(n) => setDistanceToSubjectMM(normToDist(n))}
                    min={0} max={1000} step={1}
                  >
                    {DIST_MARKS.map(({ norm, label }) => (
                      <SliderMark key={norm} value={norm} {...labelStyles}>{label}</SliderMark>
                    ))}
                    <SliderTrack><SliderFilledTrack /></SliderTrack>
                    <SliderThumb />
                  </Slider>
                </Box>
              </Flex>
            </Box>

            {/* Focal Length — log scale */}
            <Box pt={6}>
              <Flex gap={2}>
                <Box w="20%"><Text align="right">Focal Length (mm)</Text></Box>
                <Box flexGrow={1}>
                  <Slider
                    aria-label="focal length"
                    value={flToNorm(focalLengthMM)}
                    onChange={(n) => setFocalLengthMM(normToFl(n))}
                    min={180} max={1000} step={1}
                  >
                    {FL_MARKS.map(({ norm, label }) => (
                      <SliderMark key={norm} value={norm} {...labelStyles}>{label}</SliderMark>
                    ))}
                    <SliderTrack><SliderFilledTrack /></SliderTrack>
                    <SliderThumb />
                  </Slider>
                </Box>
              </Flex>
            </Box>

            {/* Aperture — log₂ stop scale */}
            <Box pt={6}>
              <Flex gap={2}>
                <Box w="20%"><Text align="right">Aperture (f/)</Text></Box>
                <Box flexGrow={1}>
                  <Slider
                    aria-label="aperture"
                    value={apToNorm(aperture)}
                    onChange={(n) => setAperture(normToAp(n))}
                    min={80} max={1000} step={1}
                  >
                    {AP_MARKS.map(({ norm, label }) => (
                      <SliderMark key={norm} value={norm} {...labelStyles}>{label}</SliderMark>
                    ))}
                    <SliderTrack><SliderFilledTrack /></SliderTrack>
                    <SliderThumb />
                  </Slider>
                </Box>
              </Flex>
            </Box>

            {/* Sensor / Lens / Speed booster */}
            <Box pt={6}>
              <Flex gap={2}>
                <Flex gap={2} width="33%">
                  <Box w="20%" mt={2}><Text align="right">Sensor</Text></Box>
                  <Box flexGrow={1}>
                    <Select value={sensor} onChange={(e) => e.target.value && setSensor(e.target.value)}>
                      {Object.keys(SENSORS).map(k => <option key={k} value={k}>{k}</option>)}
                    </Select>
                  </Box>
                </Flex>
                <Flex gap={2} width="33%">
                  <Box w="20%" mt={2}><Text align="right">Lens coverage</Text></Box>
                  <Box flexGrow={1}>
                    <Select value={lens} onChange={(e) => e.target.value && setLens(e.target.value)}>
                      {Object.keys(LENSES).map(k => <option key={k} value={k}>{k}</option>)}
                    </Select>
                  </Box>
                </Flex>
                <Flex gap={2} width="33%">
                  <Box w="20%" mt={2}><Text align="right">Speed Booster / Teleconverter</Text></Box>
                  <Box flexGrow={1}>
                    <Select value={speedMultiplier} onChange={(e) => setSpeedMultiplier(parseFloat(e.target.value))}>
                      {[0.58, 0.71, 1, 1.4, 1.7, 2].map(v => <option key={v} value={v}>{v}x</option>)}
                    </Select>
                  </Box>
                </Flex>
              </Flex>
            </Box>

            {/* Stats */}
            <Box pt={4} pb={4}>
              <Flex gap={6} wrap="wrap">
                <Text fontSize="sm"><b>Physical:</b> {focalLengthMM}mm f/{aperture.toFixed(1)}</Text>
                <Text fontSize="sm"><b>Effective:</b> {effectiveFocalLength.toFixed(0)}mm f/{effectiveAperture.toFixed(1)}</Text>
                <Text fontSize="sm"><b>35mm equiv:</b> {equivalentFocalLength.toFixed(0)}mm (crop {cropFactor.toFixed(2)}x)</Text>
                <Text fontSize="sm"><b>Distance:</b> {distanceToSubjectMM >= 1000 ? `${(distanceToSubjectMM / 1000).toFixed(2)} m` : `${distanceToSubjectMM} mm`}</Text>
                <Text fontSize="sm"><b>CoC:</b> {coc.toFixed(3)} mm</Text>
                <Text fontSize="sm"><b>Hyperfocal:</b> {hyperfocalMM >= 1000 ? `${(hyperfocalMM / 1000).toFixed(2)} m` : `${hyperfocalMM.toFixed(0)} mm`}</Text>
                <Text fontSize="sm"><b>DoF:</b> {dofDisplay}</Text>
              </Flex>
            </Box>

            <SensorComparison
              sensorWidth={sensorWidth}
              sensorHeight={sensorHeight}
              lensCoverageDiameterMM={lensCoverageDiameterMM}
            />
          </Box>
        </>
      )}

      {/* ── Compression page ── */}
      {page === "compression" && <CompressionPage />}
    </>
  );
}

export default App;