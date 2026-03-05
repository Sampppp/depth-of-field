import { useState, useMemo } from "react";
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
} from "@chakra-ui/react";

import PhotographyGraphic from "./PhotographyGraphic";

function SensorComparison({
  sensorWidth,
  sensorHeight,
  lensCoverageDiameterMM,
}: {
  sensorWidth: number;
  sensorHeight: number;
  lensCoverageDiameterMM: number;
}) {
  const fullWidth = 36; // 35mm full frame width in mm
  const fullHeight = 24; // full frame height in mm (3:2 aspect)

  const sensorDiagonal = Math.sqrt(sensorWidth ** 2 + sensorHeight ** 2);
  const imageCircleRadius = lensCoverageDiameterMM / 2;

  // Determine viewBox size to fit everything
  const maxDim = Math.max(
    fullWidth,
    fullHeight,
    sensorWidth,
    sensorHeight,
    imageCircleRadius * 2
  );
  const viewBoxSize = maxDim * 1.2; // add some padding
  const offset = viewBoxSize / 2;

  return (
    <svg
      width="600"
      height="400"
      viewBox={`${-offset} ${-offset} ${viewBoxSize} ${viewBoxSize}`}
      style={{ border: "1px solid #ccc", marginTop: "0.5rem" }}
    >
      {/* Full‑frame reference rectangle */}
      <rect
        x={-fullWidth / 2}
        y={-fullHeight / 2}
        width={fullWidth}
        height={fullHeight}
        fill="none"
        stroke="#ff6600"
        strokeDasharray="4,2"
        strokeWidth={0.5}
      />
      {/* Selected sensor rectangle */}
      <rect
        x={-sensorWidth / 2}
        y={-sensorHeight / 2}
        width={sensorWidth}
        height={sensorHeight}
        fill="rgba(0,120,255,0.2)"
        stroke="#0066ff"
        strokeWidth={0.5}
      />
      {/* Image circle */}
      <circle
        cx={0}
        cy={0}
        r={imageCircleRadius}
        fill="none"
        stroke="#00aa00"
        strokeDasharray="2,2"
        strokeWidth={0.5}
      />
      {/* Diameter label */}
      <text
        x={imageCircleRadius + 2}
        y={0}
        fontSize={2}
        fill="#00aa00"
      >
        Image circle: {lensCoverageDiameterMM.toFixed(1)} mm
      </text>
      {/* Labels */}
      <text x={-fullWidth / 2} y={-fullHeight / 2 - 2} fontSize={2} fill="#ff6600">
        35mm FF ({fullWidth}×{fullHeight} mm)
      </text>
      <text x={-sensorWidth / 2} y={sensorHeight / 2 + 4} fontSize={2} fill="#0066ff">
        {sensorWidth}×{sensorHeight} mm
      </text>
    </svg>
  );
}

// All sensor dimensions in mm
const SENSORS: Record<string, { sensorWidth: number; sensorHeight: number }> = {
  "Micro Four Thirds": { sensorWidth: 17.3, sensorHeight: 13 },
  "APS-C": { sensorWidth: 23.6, sensorHeight: 15.6 },
  "Super 35": { sensorWidth: 24.89, sensorHeight: 18.66 },
  "35mm (full frame)": { sensorWidth: 36, sensorHeight: 24 },
  "4.5x6 (Medium Format)": { sensorWidth: 56, sensorHeight: 42 },
  "6x6 (Medium Format)": { sensorWidth: 56, sensorHeight: 56 },
  "6x7 (Medium Format)": { sensorWidth: 70, sensorHeight: 56 },
  "6x9 (Medium Format)": { sensorWidth: 84, sensorHeight: 56 },
};

// Lens dimensions (used for coverage calculation)
const LENSES: Record<string, { lensWidth: number; lensHeight: number }> = {
  "Micro Four Thirds": { lensWidth: 17.3, lensHeight: 13 },
  "APS-C": { lensWidth: 23.6, lensHeight: 15.6 },
  "Super 35": { lensWidth: 24.89, lensHeight: 18.66 },
  "35mm (full frame)": { lensWidth: 36, lensHeight: 24 },
  "4.5x6 (Medium Format)": { lensWidth: 56, lensHeight: 42 },
  "6x6 (Medium Format)": { lensWidth: 56, lensHeight: 56 },
  "6x7 (Medium Format)": { lensWidth: 70, lensHeight: 56 },
  "6x9 (Medium Format)": { lensWidth: 84, lensHeight: 56 },
};

const FULL_FRAME_WIDTH = SENSORS["35mm (full frame)"].sensorWidth; // 36mm

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function App() {
  // All distances stored in mm internally
  const [distanceToSubjectMM, setDistanceToSubjectMM] = useState(2000); // 2m
  const [focalLengthMM, setFocalLengthMM] = useState(50);
  const [aperture, setAperture] = useState(1.8);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [sensor, setSensor] = useState("35mm (full frame)");
  const [lens, setLens] = useState("35mm (full frame)");

  const { sensorWidth, sensorHeight } = SENSORS[sensor];
  const { lensWidth, lensHeight } = LENSES[lens];

  // Horizontal crop factor: >1 for sensors smaller than FF, <1 for MF
  const cropFactor = FULL_FRAME_WIDTH / sensorWidth;

  // Speed booster/teleconverter scales the physical focal length on the mount
  const effectiveFocalLength = focalLengthMM * speedMultiplier;

  // Aperture (f-number) scales with speed multiplier: booster makes it faster
  const effectiveAperture = aperture * speedMultiplier;

  // 35mm equivalent focal length for reference only (not used in DoF calc)
  const equivalentFocalLength = effectiveFocalLength * cropFactor;

  // CoC derived from sensor diagonal
  const sensorDiagonal = Math.sqrt(sensorWidth ** 2 + sensorHeight ** 2);
  const lensDiagonal = Math.sqrt(lensWidth ** 2 + lensHeight ** 2);
  const lensCoverageDiameterMM = lensDiagonal * speedMultiplier;
  const coc = sensorDiagonal / 1500; // mm

  // Hyperfocal distance (mm)
  // H = f + f² / (N x c)  ≈ f²/(Nxc) when f << H
  const hyperfocalMM =
    effectiveFocalLength +
    (effectiveFocalLength ** 2) / (effectiveAperture * coc);

  // Depth of field limits (mm)
  // Near = H·d / (H + (d - f))
  // Far  = H·d / (H - (d - f))
  const dFocus = distanceToSubjectMM - effectiveFocalLength;
  const nearLimitMM =
    (hyperfocalMM * distanceToSubjectMM) / (hyperfocalMM + dFocus);
  const rawFarLimitMM =
    (hyperfocalMM * distanceToSubjectMM) / (hyperfocalMM - dFocus);

  // Maximum displayable distance (15m)
  const maxDisplayMM = 15000;
  const farLimitMM = clamp(
    rawFarLimitMM < 0 || rawFarLimitMM > maxDisplayMM
      ? maxDisplayMM
      : rawFarLimitMM,
    nearLimitMM,
    maxDisplayMM
  );
  const clampedNearMM = clamp(nearLimitMM, 0, maxDisplayMM);

  // Vertical FoV (degrees) — uses physical sensor height and effective focal length
  const verticalFoV =
    (2 *
      Math.atan(sensorHeight / 2 / effectiveFocalLength) *
      180) /
    Math.PI;

  const labelStyles = { mt: "2", ml: "-2.5", fontSize: "12" };

  // Distance slider marks every 1m, in mm
  const distanceMarks = useMemo(() => {
    const maxMeters = Math.floor(maxDisplayMM / 1000);
    return Array.from({ length: maxMeters }, (_, i) => ({
      value: (i + 1) * 1000,
      label: `${i + 1}m`,
    }));
  }, []);

  const dofMM = farLimitMM - clampedNearMM;
  const dofDisplay =
    dofMM >= 1000
      ? `${(dofMM / 1000).toFixed(2)} m`
      : `${dofMM.toFixed(0)} mm`;

  return (
    <>
      <Box p={2} pt={6}>
        <PhotographyGraphic
          distanceToSubjectMM={distanceToSubjectMM}
          nearLimitMM={clampedNearMM}
          farLimitMM={farLimitMM}
          farDistanceMM={maxDisplayMM}
          focalLength={effectiveFocalLength}
          aperture={effectiveAperture}
          verticalFieldOfView={verticalFoV}
          onChangeDistance={(mm) => setDistanceToSubjectMM(mm)}
        />
      </Box>

      <Box px={6}>
        <Box pt={6}>
          <Flex gap={2}>
            <Box w="20%">
              <Text align="right">Subject Distance</Text>
            </Box>
            <Box flexGrow={1}>
              <Slider
                aria-label="distance to subject"
                value={distanceToSubjectMM}
                onChange={(val) => setDistanceToSubjectMM(val)}
                min={200}
                max={maxDisplayMM}
                step={100}
              >
                {distanceMarks.map(({ label, value }) => (
                  <SliderMark key={value} value={value} {...labelStyles}>
                    {label}
                  </SliderMark>
                ))}
                <SliderTrack>
                  <SliderFilledTrack />
                </SliderTrack>
                <SliderThumb />
              </Slider>
            </Box>
          </Flex>
        </Box>

        <Box pt={6}>
          <Flex gap={2}>
            <Box w="20%">
              <Text align="right">Focal Length (mm)</Text>
            </Box>
            <Box flexGrow={1}>
              <Slider
                aria-label="focal length"
                value={focalLengthMM}
                onChange={(val) => setFocalLengthMM(val)}
                min={3}
                max={600}
                step={1}
              >
                {[14, 28, 35, 50, 85, 100, 135, 200, 300, 400, 600].map(
                  (val) => (
                    <SliderMark key={val} value={val} {...labelStyles}>
                      {val}
                    </SliderMark>
                  )
                )}
                <SliderTrack>
                  <SliderFilledTrack />
                </SliderTrack>
                <SliderThumb />
              </Slider>
            </Box>
          </Flex>
        </Box>

        <Box pt={6}>
          <Flex gap={2}>
            <Box w="20%">
              <Text align="right">Aperture (f/)</Text>
            </Box>
            <Box flexGrow={1}>
              <Slider
                aria-label="aperture"
                value={aperture}
                onChange={(val) => setAperture(val)}
                min={0.95}
                max={22}
                step={0.1}
              >
                {[0.95, 1.4, 1.8, 2.8, 4, 5.6, 8, 11, 16, 22].map((val) => (
                  <SliderMark key={val} value={val} {...labelStyles}>
                    {val}
                  </SliderMark>
                ))}
                <SliderTrack>
                  <SliderFilledTrack />
                </SliderTrack>
                <SliderThumb />
              </Slider>
            </Box>
          </Flex>
        </Box>

        <Box pt={6}>
          <Flex gap={2}>
            {/* Sensor selector */}
            <Flex gap={2} width="33%">
              <Box w="20%" mt={2}>
                <Text align="right">Sensor</Text>
              </Box>
              <Box flexGrow={1}>
                <Select
                  value={sensor}
                  onChange={(e) => e.target.value && setSensor(e.target.value)}
                >
                  {Object.keys(SENSORS).map((key) => (
                    <option key={key} value={key}>
                      {key}
                    </option>
                  ))}
                </Select>
              </Box>
            </Flex>

            {/* Lens selector */}
            <Flex gap={2} width="33%">
              <Box w="20%" mt={2}>
                <Text align="right">Lens coverage</Text>
              </Box>
              <Box flexGrow={1}>
                <Select
                  value={lens}
                  onChange={(e) => e.target.value && setLens(e.target.value)}
                >
                  {Object.keys(LENSES).map((key) => (
                    <option key={key} value={key}>
                      {key}
                    </option>
                  ))}
                </Select>
              </Box>
            </Flex>

            {/* Speed booster selector */}
            <Flex gap={2} width="33%">
              <Box w="20%" mt={2}>
                <Text align="right">Speed Booster / Teleconverter</Text>
              </Box>
              <Box flexGrow={1}>
                <Select
                  value={speedMultiplier}
                  onChange={(e) =>
                    setSpeedMultiplier(parseFloat(e.target.value))
                  }
                >
                  {[0.58, 0.71, 1, 1.4, 1.7, 2].map((val) => (
                    <option key={val} value={val}>
                      {val}x
                    </option>
                  ))}
                </Select>
              </Box>
            </Flex>
          </Flex>
        </Box>

        <Box pt={4} pb={4}>
          <Flex gap={6} wrap="wrap">
            <Text fontSize="sm">
              <b>Physical:</b> {focalLengthMM}mm f/{aperture}
            </Text>
            <Text fontSize="sm">
              <b>Effective:</b> {effectiveFocalLength.toFixed(0)}mm f/
              {effectiveAperture.toFixed(1)}
            </Text>
            <Text fontSize="sm">
              <b>35mm equiv:</b> {equivalentFocalLength.toFixed(0)}mm (crop{" "}
              {cropFactor.toFixed(2)}x)
            </Text>
            <Text fontSize="sm">
              <b>CoC:</b> {coc.toFixed(3)} mm
            </Text>
            <Text fontSize="sm">
              <b>Hyperfocal:</b>{" "}
              {hyperfocalMM >= 1000
                ? `${(hyperfocalMM / 1000).toFixed(2)} m`
                : `${hyperfocalMM.toFixed(0)} mm`}
            </Text>
            <Text fontSize="sm">
              <b>DoF:</b> {dofDisplay}
            </Text>
          </Flex>
        </Box>

        {/* Sensor comparison graphic */}
        <SensorComparison
          sensorWidth={sensorWidth}
          sensorHeight={sensorHeight}
          lensCoverageDiameterMM={lensCoverageDiameterMM}
        />
      </Box>
    </>
  );
}

export default App;
