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
  Radio,
  Stack,
  RadioGroup,
} from "@chakra-ui/react";

import PhotographyGraphic from "./PhotographyGraphic";

const CIRCLES_OF_CONFUSION: Record<
  string,
  {
    sensorWidth: number;
    sensorHeight: number;
  }
> = {
  "Micro Four Thirds": {
    sensorWidth: 17.3,
    sensorHeight: 13,
  },
  "APS-C": {
    sensorWidth: 24,
    sensorHeight: 16,
  },
  "Super 35": {
    sensorWidth: 30,
    sensorHeight: 21,
  },
  "35mm (full frame)": {
    sensorWidth: 35,
    sensorHeight: 24,
  },
  "4.5x6 (Medium Format)": {
    sensorWidth: 60,
    sensorHeight: 45,
  },
  "6x6 (Medium Format)": {
    sensorWidth: 60,
    sensorHeight: 60,
  },
  "6x7 (Medium Format)": {
    sensorWidth: 70,
    sensorHeight: 60,
  },
  "6x9 (Medium Format)": {
    sensorWidth: 90,
    sensorHeight: 60,
  },
};

const SYSTEMS = ["Metric", "Imperial"] as const;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function App() {
  const [distanceToSubjectInInches, setDistanceToSubjectInInches] =
    useState(72);
  const [focalLengthInMillimeters, setFocalLengthInMillimeters] = useState(50);
  const [aperture, setAperture] = useState(1.8);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const effectiveFocalLength = focalLengthInMillimeters * speedMultiplier;
  const effectiveAperture = aperture * speedMultiplier;
  
  const [system, setSystem] = useState<(typeof SYSTEMS)[number]>("Metric");
  const [sensor, setSensor] = useState("35mm (full frame)");

  const distanceToSubjectInMM = distanceToSubjectInInches * 25.4;

  const sensorDiagonalInMillimeters = Math.sqrt(
    CIRCLES_OF_CONFUSION[sensor].sensorWidth * CIRCLES_OF_CONFUSION[sensor].sensorWidth +
      CIRCLES_OF_CONFUSION[sensor].sensorHeight *
        CIRCLES_OF_CONFUSION[sensor].sensorHeight
  );
  const circleOfConfusionInMillimeters = sensorDiagonalInMillimeters / 1500;

  const hyperFocalDistanceInMM =
    effectiveFocalLength +
    (effectiveFocalLength * effectiveFocalLength) /
      (effectiveAperture * circleOfConfusionInMillimeters);
  const depthOfFieldFarLimitInMM =
    (hyperFocalDistanceInMM * distanceToSubjectInMM) /
    (hyperFocalDistanceInMM -
      (distanceToSubjectInMM - focalLengthInMillimeters));
  const depthOfFieldNearLimitInMM =
    (hyperFocalDistanceInMM * distanceToSubjectInMM) /
    (hyperFocalDistanceInMM +
      (distanceToSubjectInMM - focalLengthInMillimeters));

  const farDistanceInInches = 360;
  const nearFocalPointInInches = clamp(
    depthOfFieldNearLimitInMM / 25.4,
    0,
    farDistanceInInches
  );
  let farFocalPointInInches = clamp(
    depthOfFieldFarLimitInMM / 25.4,
    0,
    farDistanceInInches
  );
  if (farFocalPointInInches < nearFocalPointInInches) {
    farFocalPointInInches = farDistanceInInches;
  }

  const sensorHeight = CIRCLES_OF_CONFUSION[sensor].sensorHeight;
  const verticalFieldOfView =
    (2 * Math.atan(sensorHeight / 2 / effectiveFocalLength) * 180) /
    Math.PI;

  const labelStyles = {
    mt: "2",
    ml: "-2.5",
    fontSize: "12",
  };

  const distanceMarks = useMemo(() => {
    if (system === "Imperial") {
      return new Array(Math.floor(farDistanceInInches / 24) + 1)
        .fill(0)
        .map((_v, i) => (i + 1) * 24)
        .map((val) => ({
          value: val,
          label: `${val / 12}'`,
        }));
    } else {
      const farDistanceInMeters = farDistanceInInches * 0.0254;
      function convertMetersToInches(meters: number) {
        return meters * 39.3701;
      }
      return new Array(Math.floor(farDistanceInMeters) + 1)
        .fill(0)
        .map((_val, val) => ({
          value: convertMetersToInches(val + 1),
          label: `${val + 1}m`,
        }));
      return [];
    }
  }, [system, farDistanceInInches]);

  return (
    <>
      <Box p={2} pt={6}>
          <PhotographyGraphic
          distanceToSubjectInInches={distanceToSubjectInInches}
          nearFocalPointInInches={nearFocalPointInInches}
          farFocalPointInInches={farFocalPointInInches}
          farDistanceInInches={farDistanceInInches}
          
          focalLength={effectiveFocalLength}
          aperture={effectiveAperture}
          system={system}
          verticalFieldOfView={verticalFieldOfView}
          onChangeDistance={(val) => setDistanceToSubjectInInches(val)}
        />
      </Box>

      <Box px={6}>
        <Box pt={6}>
          <Flex gap={2}>
            <Box w="20%">
              <Text align="right">Units</Text>
            </Box>

            <Box flexGrow={1}>
              <RadioGroup
                onChange={(v) => setSystem(v as "Imperial" | "Metric")}
                value={system}
              >
                <Stack direction="row">
                  {SYSTEMS.map((system) => (
                    <Radio value={system} key={system}>
                      {system}
                    </Radio>
                  ))}
                </Stack>
              </RadioGroup>
            </Box>
          </Flex>
        </Box>

        <Box pt={6}>
          <Flex gap={2}>
            <Box w="20%">
              <Text align="right">
                Subject Distance ({system === "Imperial" ? "ft" : "m"})
              </Text>
            </Box>
            <Box flexGrow={1}>
              <Slider
                aria-label="distance to subject"
                value={distanceToSubjectInInches}
                onChange={(val: number) => setDistanceToSubjectInInches(val)}
                min={10}
                max={400}
                step={1}
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
                value={focalLengthInMillimeters}
                onChange={(val: number) => setFocalLengthInMillimeters(val)}
                min={3}
                max={400}
                step={1}
              >
                {[14, 28, 35, 50, 70, 85, 100, 135, 155, 200].map((val) => (
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
          <Flex gap={2} mt={2}>
            <Box w="20%"></Box>
            <Box flexGrow={1}>
            </Box>
          </Flex>
        </Box>

        <Box pt={6}>
          <Flex gap={2}>
            <Box w="20%">
              <Text align="right">Aperture</Text>
            </Box>
            <Box flexGrow={1}>
              <Slider
                aria-label="aperture"
                value={aperture}
                onChange={(val: number) => setAperture(val)}
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
            <Flex gap={2} width="50%">
              <Box w="20%" mt={2}>
                <Text align="right">Sensor Size</Text>
              </Box>
              <Box flexGrow={1}>
                <Select
                  value={sensor}
                  placeholder="Sensor"
                  onChange={(evt) => {
                    if (!evt?.target?.value) {
                      return;
                    }
                    setSensor(evt?.target?.value);
                  }}
                >
                  {Object.entries(CIRCLES_OF_CONFUSION).map(([key]) => (
                    <option key={key} value={key}>
                      {key}
                    </option>
                  ))}
                </Select>
              </Box>
            </Flex>

            <Flex gap={2} width="50%">
              <Box w="20%" mt={2}>
                <Text align="right">Speedboost/Teleconverter</Text>
              </Box>
              <Box flexGrow={1}>
                <Select
                  value={speedMultiplier}
                  onChange={(e) => setSpeedMultiplier(parseFloat(e.target.value))}
                >
                  {[0.71,1,1.4,1.7,2].map((val) => (
                    <option key={val} value={val}>
                      {val}x
                    </option>
                  ))}
                </Select>
              </Box>
            </Flex>
          </Flex>
        </Box>

        <Box pt={6}>
          <Text>
            Real: {focalLengthInMillimeters}mm f/{aperture} | Effective: {effectiveFocalLength.toFixed(0)}mm f/{effectiveAperture.toFixed(1)}
          </Text>
        </Box>
      </Box>
    </>
  );
}

export default App;
