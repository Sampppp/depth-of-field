# Depth Of Field Simulator

A web application that allows you to figure out the depth of field of a camera lens. You can adjust the aperture, focal length, Speedbooster/Teleconverter multiplier, and distance to the subject to see how the depth of field changes. The application also shows the hyperfocal distance and the near and far limits of the depth of field.

## Project Summary

This project visualizes how various photographic parameters interact to affect depth of field (DoF). Below is a concise reference of the key relationships:

| Variable | Relationship | Linked To | Nature of Link |
|----------|--------------|-----------|----------------|
| **Focal Length** | Directly scales subject distance when framing width is fixed | Subject distance, DoF | When focal length ↑, distance ↑; DoF stays constant |
| **Aperture (f‑stop)** | Inversely linked to hyperfocal distance | Hyperfocal distance, DoF | Larger aperture (smaller f‑number) → hyperfocal ↓, DoF ↑ |
| **Sensor Size** | Inversely linked to hyperfocal distance | Hyperfocal distance, DoF (when framing width fixed) | Larger sensor → hyperfocal ↑, DoF ↓ |
| **Hyperfocal Distance** | Central hub: <br>• ↑Focal Length → ↓Hyperfocal <br>• ↓Aperture (larger opening) → ↓Hyperfocal <br>• ↑Sensor size → ↑Hyperfocal | – | – |
| **Depth of Field (DoF)** | Depends on aperture, focal length, sensor size, subject distance, and framing width | Aperture, Focal Length, Sensor Size, Subject distance, Framing width | • Aperture ↑ (smaller opening) → DoF ↓ <br>• Sensor size ↑ (with constant framing) → DoF ↓ <br>• Focal length ↑ (with constant framing) → DoF ↓ <br>• Subject distance ↑ (with constant framing) → DoF ↑ <br>• Framing width ↑ (with constant distance) → DoF ↓ |

### Quick Takeaways
- **Hyperfocal distance** shrinks with longer focal lengths and wider apertures, and grows with larger sensors.  
- **DoF** widens with smaller apertures, shorter focal lengths, smaller sensors, and greater subject distances (when framing stays the same).  
- When framing width is constant, changing subject distance scales with focal length, while sensor size inversely affects DoF.  
- With a fixed subject distance, increasing framing width (or using a longer focal length) reduces DoF.  

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

```bash
npm install
npm run dev
