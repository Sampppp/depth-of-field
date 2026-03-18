/**
 * CompressionPage.tsx
 *
 * Compression visualizer page. Subject is fixed; camera moves to maintain
 * framing as focal length changes. Shares all styling with the DoF page.
 *
 * Controls:
 *   - Focal length
 *   - Framing width (real-world width captured at subject plane)
 *   - Background distance from subject (min 10mm = 0.01m)
 *   - Sensor selector
 */

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

import CompressionGraphic from "./CompressionGraphic";

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

function formatMM(mm: number, precision = 1): string {
  if (mm >= 10000) return `${(mm / 1000).toFixed(1)} m`;
  if (mm >= 1000)  return `${(mm / 1000).toFixed(2)} m`;
  return `${mm.toFixed(precision)} mm`;
}

export default function CompressionPage() {
  const [focalLengthMM,        setFocalLengthMM]        = useState(85);
  const [frameWidthMM,         setFrameWidthMM]          = useState(600);
  const [backgroundDistanceMM, setBackgroundDistanceMM]  = useState(5000);  const [sensor,               setSensor]                = useState("35mm (full frame)");

  const { sensorWidth, sensorHeight } = SENSORS[sensor];
  const cropFactor   = FULL_FRAME_WIDTH / sensorWidth;
  const equivalentFL = focalLengthMM * cropFactor;

  const cameraToSubjectMM    = (focalLengthMM * frameWidthMM) / sensorWidth;
  const cameraToBackgroundMM = cameraToSubjectMM + backgroundDistanceMM;
  const compressionRatio     = cameraToBackgroundMM / cameraToSubjectMM;

  const labelStyles = { mt: "2", ml: "-2.5", fontSize: "12" };

  const bgMarks = useMemo(() => [
    { value: 1,     label: "1mm" },
    { value: 50,    label: "50mm" },
    { value: 100,   label: "100mm" },
    { value: 200,   label: "200mm" },
    { value: 500,   label: "0.5m" },
    { value: 1000,  label: "1m" },
    { value: 2000,  label: "2m" },
    { value: 5000,  label: "5m" },
    { value: 10000, label: "10m" },
    { value: 20000, label: "20m" },
    { value: 50000, label: "50m" },
  ], []);

  const frameMarks = useMemo(() => [
    { value: 150,   label: "15cm" },
    { value: 300,   label: "30cm" },
    { value: 600,   label: "60cm" },
    { value: 1000,  label: "1m" },
    { value: 2000,  label: "2m" },
    { value: 5000,  label: "5m" },
    { value: 10000, label: "10m" },
  ], []);

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
        {/* ── Focal length ── */}
        <Box pt={6}>
          <Flex gap={2}>
            <Box w="20%"><Text align="right">Focal Length (mm)</Text></Box>
            <Box flexGrow={1}>
              <Slider aria-label="focal length" value={focalLengthMM}
                onChange={(val) => setFocalLengthMM(val)} min={3} max={600} step={1}>
                {[14, 28, 35, 50, 85, 100, 135, 200, 300, 400, 600].map((val) => (
                  <SliderMark key={val} value={val} {...labelStyles}>{val}</SliderMark>
                ))}
                <SliderTrack><SliderFilledTrack /></SliderTrack>
                <SliderThumb />
              </Slider>
            </Box>
          </Flex>
        </Box>

        {/* ── Framing width ── */}
        <Box pt={6}>
          <Flex gap={2}>
            <Box w="20%"><Text align="right">Framing Width</Text></Box>
            <Box flexGrow={1}>
              <Slider aria-label="framing width" value={frameWidthMM}
                onChange={(val) => setFrameWidthMM(val)} min={100} max={10000} step={50}>
                {frameMarks.map(({ label, value }) => (
                  <SliderMark key={value} value={value} {...labelStyles}>{label}</SliderMark>
                ))}
                <SliderTrack><SliderFilledTrack /></SliderTrack>
                <SliderThumb />
              </Slider>
            </Box>
          </Flex>
        </Box>

        {/* ── Background distance ── */}
        <Box pt={6}>
          <Flex gap={2}>
            <Box w="20%"><Text align="right">Background Distance (from subject)</Text></Box>
            <Box flexGrow={1}>
              <Slider aria-label="background distance" value={backgroundDistanceMM}
                onChange={(val) => setBackgroundDistanceMM(val)} min={1} max={50000} step={1}>
                {bgMarks.map(({ label, value }) => (
                  <SliderMark key={value} value={value} {...labelStyles}>{label}</SliderMark>
                ))}
                <SliderTrack><SliderFilledTrack /></SliderTrack>
                <SliderThumb />
              </Slider>
            </Box>
          </Flex>
        </Box>

        {/* ── Sensor ── */}
        <Box pt={6}>
          <Flex gap={2} width="40%">
            <Box w="25%" mt={2}><Text align="right">Sensor</Text></Box>
            <Box flexGrow={1}>
              <Select value={sensor} onChange={(e) => e.target.value && setSensor(e.target.value)}>
                {Object.keys(SENSORS).map((key) => (
                  <option key={key} value={key}>{key}</option>
                ))}
              </Select>
            </Box>
          </Flex>
        </Box>

        {/* ── Stats ── */}
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