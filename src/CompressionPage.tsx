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
} from "@chakra-ui/react";

import CompressionGraphic from "./CompressionGraphic";
import {
  flToNorm, normToFl,
  bgToNorm, normToBg,
  frameToNorm, normToFrame,
} from "./utils/logSlider";

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

const FULL_FRAME_WIDTH = 36;

function formatMM(mm: number): string {
  if (mm >= 10000) return `${(mm / 1000).toFixed(1)} m`;
  if (mm >= 1000)  return `${(mm / 1000).toFixed(2)} m`;
  return `${mm.toFixed(0)} mm`;
}

// Marks pre-converted to normalized positions
const FL_MARKS = [8, 14, 24, 35, 50, 85, 135, 200, 300, 400, 600].map(v => ({
  norm: flToNorm(v), label: `${v}`,
}));

const FRAME_MARKS = [100, 200, 300, 600, 1000, 2000, 5000, 10000].map(v => ({
  norm: frameToNorm(v),
  label: v >= 1000 ? `${v / 1000}m` : `${v}mm`,
}));

const BG_MARKS = [1, 10, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 50000].map(v => ({
  norm: bgToNorm(v),
  label: v >= 1000 ? `${v / 1000}m` : `${v}mm`,
}));

export default function CompressionPage() {
  const [focalLengthMM,        setFocalLengthMM]        = useState(85);
  const [frameWidthMM,         setFrameWidthMM]          = useState(600);
  const [backgroundDistanceMM, setBackgroundDistanceMM]  = useState(5000);
  const [sensor,               setSensor]                = useState("35mm (full frame)");

  const { sensorWidth, sensorHeight } = SENSORS[sensor];
  const cropFactor   = FULL_FRAME_WIDTH / sensorWidth;
  const equivalentFL = focalLengthMM * cropFactor;

  const cameraToSubjectMM    = (focalLengthMM * frameWidthMM) / sensorWidth;
  const cameraToBackgroundMM = cameraToSubjectMM + backgroundDistanceMM;
  const compressionRatio     = cameraToBackgroundMM / cameraToSubjectMM;

  const labelStyles = { mt: "2", ml: "-2.5", fontSize: "12" };

  return (
    <Box p={2} pt={4}>
      <Box px={4}>
        <CompressionGraphic
          focalLengthMM={focalLengthMM}
          sensorWidth={sensorWidth}
          sensorHeight={sensorHeight}
          sensorName={sensor}
          frameWidthMM={frameWidthMM}
          backgroundDistanceMM={backgroundDistanceMM}
        />
      </Box>

      <Box px={6}>
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

        {/* Framing Width — log scale */}
        <Box pt={6}>
          <Flex gap={2}>
            <Box w="20%"><Text align="right">Framing Width</Text></Box>
            <Box flexGrow={1}>
              <Slider
                aria-label="framing width"
                value={frameToNorm(frameWidthMM)}
                onChange={(n) => setFrameWidthMM(normToFrame(n))}
                min={0} max={1000} step={1}
              >
                {FRAME_MARKS.map(({ norm, label }) => (
                  <SliderMark key={norm} value={norm} {...labelStyles}>{label}</SliderMark>
                ))}
                <SliderTrack><SliderFilledTrack /></SliderTrack>
                <SliderThumb />
              </Slider>
            </Box>
          </Flex>
        </Box>

        {/* Background Distance — log scale, 1mm–50m */}
        <Box pt={6}>
          <Flex gap={2}>
            <Box w="20%"><Text align="right">Background Distance (from subject)</Text></Box>
            <Box flexGrow={1}>
              <Slider
                aria-label="background distance"
                value={bgToNorm(backgroundDistanceMM)}
                onChange={(n) => setBackgroundDistanceMM(normToBg(n))}
                min={0} max={1000} step={1}
              >
                {BG_MARKS.map(({ norm, label }) => (
                  <SliderMark key={norm} value={norm} {...labelStyles}>{label}</SliderMark>
                ))}
                <SliderTrack><SliderFilledTrack /></SliderTrack>
                <SliderThumb />
              </Slider>
            </Box>
          </Flex>
        </Box>

        {/* Sensor */}
        <Box pt={6}>
          <Flex gap={2} width="40%">
            <Box w="25%" mt={2}><Text align="right">Sensor</Text></Box>
            <Box flexGrow={1}>
              <Select value={sensor} onChange={(e) => e.target.value && setSensor(e.target.value)}>
                {Object.keys(SENSORS).map(k => <option key={k} value={k}>{k}</option>)}
              </Select>
            </Box>
          </Flex>
        </Box>

        {/* Stats */}
        <Box pt={4} pb={4}>
          <Flex gap={6} wrap="wrap">
            <Text fontSize="sm"><b>Focal length:</b> {focalLengthMM}mm</Text>
            <Text fontSize="sm"><b>35mm equiv:</b> {equivalentFL.toFixed(0)}mm (crop {cropFactor.toFixed(2)}×)</Text>
            <Text fontSize="sm"><b>Frame width:</b> {formatMM(frameWidthMM)}</Text>
            <Text fontSize="sm"><b>Camera → Subject:</b> {formatMM(cameraToSubjectMM)}</Text>
            <Text fontSize="sm"><b>Camera → Background:</b> {formatMM(cameraToBackgroundMM)}</Text>
            <Text fontSize="sm"><b>Compression ratio:</b> {compressionRatio.toFixed(3)}×</Text>
          </Flex>
        </Box>
      </Box>
    </Box>
  );
}