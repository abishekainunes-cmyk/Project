export const NUNES_PRODUCT_CATEGORIES = [
  {
    id: "pressure",
    name: "Pressure & Calibration",
    icon: "⏱",
    products: [
      {
        name: "Digital Pressure Calibrator (High Precision ±0.025% FS)",
        category: "Pressure",
        specs: "Range: -1 to 700 bar | Accuracy: ±0.025% F.S. | Dual sensor capability | HART Communication | NABL Traceable Calibration Certificate",
        applications: "Pharma cleanrooms, petrochemical process calibration, power generation plants, NABL testing laboratories",
        usp: "Rugged IP67 shock-resistant housing with built-in barometric reference and multi-unit digital display"
      },
      {
        name: "Hydraulic Dead Weight Tester (Primary Standard)",
        category: "Pressure",
        specs: "Range: 1 to 1200 bar | Accuracy: ±0.015% of reading | Tungsten Carbide Piston Cylinder | Stainless Steel Masses",
        applications: "Primary pressure calibration laboratories, defense instrumentation, boiler inspection",
        usp: "Ultra-low friction piston-cylinder assembly with high repeatability and lifetime stability"
      },
      {
        name: "Pneumatic Hand Test Pump (-0.95 to 40 bar)",
        category: "Pressure",
        specs: "Vacuum: -0.95 bar to 40 bar pneumatic | Fine vernier volume adjustment | Quick-fit BSP/NPT connectors",
        applications: "Field calibration of pressure transmitters, switches, and analog gauges",
        usp: "Effortless hand-squeeze pumping with ultra-fine pressure vernier control"
      }
    ]
  },
  {
    id: "electrical",
    name: "Electrical & Electronics",
    icon: "⚡",
    products: [
      {
        name: "5kV Industrial Digital Insulation Tester (Megohmmeter)",
        category: "Electrical",
        specs: "Test Voltages: 500V, 1000V, 2500V, 5000V | Range: Up to 10 TΩ | Polarization Index (PI) & Dielectric Absorption Ratio (DAR)",
        applications: "High-voltage transformer testing, power cable diagnostics, HT motor winding insulation testing",
        usp: "High short-circuit current (3mA) for fast capacitive loading and automated diagnostic ratio calculation"
      },
      {
        name: "True-RMS 1000A AC/DC Power Clamp Meter",
        category: "Electrical",
        specs: "1000A AC/DC Current | 1000V AC/DC Voltage | Inrush Current capture | Harmonics & Power Factor (PF) measurement",
        applications: "Substation commissioning, industrial VFD diagnostics, heavy motor maintenance, solar inverter testing",
        usp: "CAT IV 600V safety rated with dual display, non-contact voltage (NCV), and data logging via Bluetooth"
      },
      {
        name: "Precision Benchtop Digital Multimeter (6.5 Digit)",
        category: "Electrical",
        specs: "6.5 Digit Resolution | DCV basic accuracy 0.0035% | 10,000 readings/sec | True RMS ACV/ACI | USB & LAN standard",
        applications: "R&D electronic testing, quality assurance labs, automated test equipment (ATE) racks",
        usp: "Exceptional measurement stability with dual parameter display and built-in mathematical analysis"
      }
    ]
  },
  {
    id: "temperature",
    name: "Temperature & Thermal",
    icon: "🌡",
    products: [
      {
        name: "Dry-Block Temperature Calibrator (-30°C to 650°C)",
        category: "Temperature",
        specs: "Range: -30°C to 150°C / 50°C to 650°C | Stability: ±0.03°C | Multi-hole interchangeable inserts | Fast heating/cooling",
        applications: "On-site thermocouple, RTD Pt100, and dial thermometer calibration in food, pharma, and thermal plants",
        usp: "Microprocessor PID control with multi-zone heating for uniform axial temperature profile"
      },
      {
        name: "High-Resolution Industrial Thermal Imager (384×288)",
        category: "Temperature",
        specs: "Detector: 384×288 uncooled microbolometer | Temp Range: -20°C to 650°C | Sensitivity: <40mK | Manual focus & Laser pointer",
        applications: "Electrical panel hot-spot detection, refractory kiln monitoring, bearing friction analysis, steam trap inspection",
        usp: "Dual visual-thermal blending, automated hot/cold spot tracking, and comprehensive PC reporting software"
      },
      {
        name: "Multifunction Process Calibrator (mA, mV, V, TC, RTD)",
        category: "Temperature",
        specs: "Simulate & Measure: 0-24mA, 0-10V, 13 Thermocouple types, 8 RTD types | 24V Loop Power | Step/Ramp output",
        applications: "PLC/DCS loop checking, transmitter zero/span trimming, process instrumentation validation",
        usp: "Simultaneous source and measure on a high-contrast backlit screen with cold junction compensation"
      }
    ]
  },
  {
    id: "environmental",
    name: "Environmental & QA Testing",
    icon: "🔬",
    products: [
      {
        name: "Digital Sound Level Meter (Class 1 / Type 2 IEC 61672)",
        category: "Environmental",
        specs: "Range: 30 to 130 dB | A/C/Z frequency weighting | Fast/Slow/Impulse time weighting | Real-time 1/1 & 1/3 Octave logging",
        applications: "Factory noise compliance (OSHA), environmental pollution audits, acoustic machinery design",
        usp: "Detachable 1/2-inch prepolarized condenser microphone with high dynamic range and USB PC interface"
      },
      {
        name: "Digital Halogen Moisture Analyzer (0.01% / 1mg)",
        category: "QA Testing",
        specs: "Capacity: 110g | Readability: 1mg / 0.01% moisture | Rapid halogen ring heating up to 200°C | Multiple drying profiles",
        applications: "Food processing, chemical powder testing, plastics manufacturing, agricultural grain testing",
        usp: "Fast 5-minute automated endpoint detection with GLP/GMP compliant printout and graphical drying curves"
      },
      {
        name: "Digital Coating Thickness Gauge (Dual F/NF Probe)",
        category: "QA Testing",
        specs: "Magnetic induction & Eddy current | Range: 0 to 1500 µm | Accuracy: ±(1.5% + 1µm) | Continuous & Single test modes",
        applications: "Automotive paint inspection, powder coating QA, galvanizing verification, marine corrosion protection",
        usp: "Automatic substrate identification (Ferrous vs Non-Ferrous) with statistical memory and multi-point calibration"
      }
    ]
  }
];

export const NUNES_CURATED_MEDIA = [
  {
    name: "Industrial Calibration Station",
    url: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80",
    category: "Calibration"
  },
  {
    name: "Digital Test Equipment & Gauge",
    url: "https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=1200&q=80",
    category: "Pressure"
  },
  {
    name: "Plant Electrical Testing & Inspection",
    url: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=1200&q=80",
    category: "Electrical"
  },
  {
    name: "Laboratory Quality & Measurement",
    url: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=1200&q=80",
    category: "Quality Lab"
  },
  {
    name: "Industrial Process Automation & Control",
    url: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1200&q=80",
    category: "Automation"
  }
];
