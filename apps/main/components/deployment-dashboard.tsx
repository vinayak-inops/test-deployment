import React, { useState } from 'react';

// Type definitions
type PanelId = 'pre' | 'face' | 'cctv' | 'mobile' | 'block' | 'zone' | 'int' | 'uat';

interface NavItem {
  id: PanelId;
  label: string;
  dotColor: string;
  section: string;
}

interface Step {
  title: string;
  tag: string;
  tagText: string;
  content: React.ReactNode;
}

interface StepStates {
  pre: boolean[];
  face: boolean[];
  cctv: boolean[];
  mobile: boolean[];
  block: boolean[];
  zone: boolean[];
  int: boolean[];
  uat: boolean[];
}

interface OpenSteps {
  pre: boolean[];
  face: boolean[];
  cctv: boolean[];
  mobile: boolean[];
  uat: boolean[];
}

const InOpsDeployment: React.FC = () => {
  const [activePanel, setActivePanel] = useState<PanelId>('pre');
  const [stepStates, setStepStates] = useState<StepStates>({
    pre: Array(5).fill(false),
    face: Array(4).fill(false),
    cctv: Array(4).fill(false),
    mobile: Array(4).fill(false),
    block: Array(0).fill(false),
    zone: Array(0).fill(false),
    int: Array(0).fill(false),
    uat: Array(6).fill(false)
  });
  const [openSteps, setOpenSteps] = useState<OpenSteps>({
    pre: Array(5).fill(false),
    face: Array(4).fill(false),
    cctv: Array(4).fill(false),
    mobile: Array(4).fill(false),
    uat: Array(6).fill(false)
  });

  const toggleStep = (panelId: keyof OpenSteps, index: number): void => {
    setOpenSteps(prev => ({
      ...prev,
      [panelId]: prev[panelId].map((val, i) => i === index ? !val : val)
    }));
  };

  const markDone = (panelId: keyof StepStates, index: number, e: React.MouseEvent<HTMLButtonElement>): void => {
    e.stopPropagation();
    setStepStates(prev => ({
      ...prev,
      [panelId]: prev[panelId].map((val, i) => i === index ? true : val)
    }));
  };

  const getProgress = (panelId: keyof StepStates): number => {
    const total = stepStates[panelId].length;
    const done = stepStates[panelId].filter(v => v).length;
    return total > 0 ? (done / total) * 100 : 0;
  };

  const navItems: NavItem[] = [
    { id: 'pre', label: 'Pre-deployment', dotColor: '#888', section: 'Deployment' },
    { id: 'face', label: 'Face device', dotColor: '#185FA5', section: 'Attendance Modes' },
    { id: 'cctv', label: 'CCTV attendance', dotColor: '#534AB7', section: 'Attendance Modes' },
    { id: 'mobile', label: 'Mobile app', dotColor: '#0F6E56', section: 'Attendance Modes' },
    { id: 'block', label: 'CLRA blocking', dotColor: '#A32D2D', section: 'Rules Engine' },
    { id: 'zone', label: 'Zone access', dotColor: '#BA7517', section: 'Rules Engine' },
    { id: 'int', label: 'Integration sync', dotColor: '#3B6D11', section: 'Go-Live' },
    { id: 'uat', label: 'UAT & handover', dotColor: '#5F5E5A', section: 'Go-Live' }
  ];

  const groupedNavItems = navItems.reduce<Record<string, NavItem[]>>((acc, item) => {
    if (!acc[item.section]) acc[item.section] = [];
    acc[item.section].push(item);
    return acc;
  }, {});

  // Step data for each panel
  const preSteps: Step[] = [
    { title: 'Site survey & gate mapping', tag: 'tag-hw', tagText: 'Hardware', content: (
      <>
        <p>Walk all entry/exit gates and map each to an attendance mode. Identify hazardous zones, canteen, admin block, and shop-floor access points separately.</p>
        <ul><li>Gate count, gate type (main/secondary/emergency)</li><li>Proximity to server room / LAN point (&lt;100m for Face device)</li><li>Outdoor vs indoor (IP66 rating needed outdoors)</li><li>Identify manned vs unmanned access points</li></ul>
      </>
    ) },
    { title: 'Network & power assessment', tag: 'tag-net', tagText: 'Network', content: (
      <>
        <p>Face devices need static LAN IP or reliable Wi-Fi (≥10 Mbps). CCTV cameras need PoE switches or 12V DC runs. Mobile app needs 4G/5G coverage or plant Wi-Fi with SSID whitelist.</p>
        <ul><li>Ping test from device install location to InOps server: &lt;80ms</li><li>PoE switch capacity confirmation (15.4W per camera port)</li><li>UPS backup for server & PoE switches</li><li>Static IP or DHCP reservation list prepared</li></ul>
      </>
    ) },
    { title: 'Contractor master data load', tag: 'tag-compliance', tagText: 'Compliance', content: (
      <>
        <p>All contractors and their workers must be pre-loaded into InOps CLMS before Day 1. Incomplete data causes blocking loops on go-live day.</p>
        <ul><li>Contractor license (Form XIII) validity dates</li><li>Each worker's PF UAN & ESI IP number</li><li>Worker photo for face enrolment baseline</li><li>Work order / PO number mapped to contractor</li><li>Principal employer Form I/II registration on file</li></ul>
      </>
    ) },
    { title: 'InOps server & tenant setup', tag: 'tag-sw', tagText: 'Software', content: (
      <>
        <p>Provision the plant tenant in InOps. Configure shift calendar, OT rules, and wage components before device pairing.</p>
        <ul><li>Shift master: A/B/C shifts with break times</li><li>OT threshold: 9 hrs / day, 48 hrs / week (Factories Act)</li><li>Wage components: Basic, DA, HRA per contractor</li><li>Holiday calendar for the financial year</li></ul>
      </>
    ) },
    { title: 'Roles & approver matrix', tag: 'tag-config', tagText: 'Config', content: (
      <>
        <p>Map Principal Employer (PE) officers, contractor supervisors, and security personnel to InOps roles. Define who gets block-override authority.</p>
        <ul><li>PE officer: can override soft blocks, receives daily muster alerts</li><li>Contractor supervisor: muster approval, attendance correction</li><li>Security: real-time block alert on device screen</li><li>HR admin: compliance dashboard, Form 13/14 generation</li></ul>
      </>
    ) }
  ];

  const faceSteps: Step[] = [
    { title: 'Device mounting & cable run', tag: 'tag-hw', tagText: 'Hardware', content: (
      <>
        <p>Mount face device at 155–165 cm from floor (average eye level). Avoid direct sunlight or backlit backgrounds — use anti-glare panels if needed.</p>
        <ul><li>LAN cable (Cat6) run from device to PoE switch / server room</li><li>Optional: Wiegand output to existing flap barrier / boom gate relay</li><li>Power: 12V DC adapter or PoE (check device spec)</li><li>Optional: LED beacon connected to relay for visual block signal</li></ul>
      </>
    ) },
    { title: 'Device pairing to InOps', tag: 'tag-sw', tagText: 'Software', content: (
      <>
        <p>Register device MAC address in InOps device console. Assign gate name, direction (IN / OUT / BOTH), and shift coverage.</p>
        <ul><li>Set device IP (static) and point to InOps API endpoint</li><li>Test heartbeat: device should appear ONLINE in console within 60s</li><li>Configure offline mode: device buffers up to 10,000 punches locally if connectivity drops</li></ul>
      </>
    ) },
    { title: 'Worker face enrolment', tag: 'tag-config', tagText: 'Config', content: (
      <>
        <p>Enrol every contract worker with minimum 3 face angles. InOps pushes templates to all paired devices via sync job.</p>
        <ul><li>Enrolment at onboarding kiosk or directly on device</li><li>Minimum quality threshold: 70% confidence score before saving</li><li>Workers without enrolment cannot clock-in — system shows "Enrolment Pending" on device screen and triggers supervisor alert</li><li>Re-enrolment period: 90 days (face template refresh)</li></ul>
      </>
    ) },
    { title: 'Barrier / relay integration', tag: 'tag-hw', tagText: 'Hardware', content: (
      <>
        <p>Connect device relay output to flap barrier or boom gate control board. Define open/block signal logic.</p>
        <ul><li>ALLOW signal: relay closes for 3 seconds → barrier opens</li><li>BLOCK signal: relay stays open → barrier remains closed + buzzer triggers</li><li>Emergency override: physical key switch bypasses relay (fire safety)</li><li>Test ALLOW and BLOCK scenarios with dummy worker records before go-live</li></ul>
      </>
    ) }
  ];

  const cctvSteps: Step[] = [
    { title: 'Camera placement audit', tag: 'tag-hw', tagText: 'Hardware', content: (
      <>
        <p>InOps CCTV module needs cameras mounted such that the face is visible at entry — not a top-down view. Conduct a walk-through with camera angle verification tool.</p>
        <ul><li>Camera height: 2.2–3m from floor, angle 15–20° downward</li><li>Field of view: covers 100% of walkway width, min 2m detection range</li><li>Lighting: 200 lux minimum at face plane; add IR illuminators for night shifts</li><li>Identify cameras already compliant vs those needing repositioning</li></ul>
      </>
    ) },
    { title: 'RTSP stream integration', tag: 'tag-net', tagText: 'Network', content: (
      <>
        <p>InOps Edge Agent connects to camera RTSP streams. Edge device (mini-PC or NVR plugin) runs inference locally — no raw video leaves the plant.</p>
        <ul><li>Configure RTSP URL per camera in InOps Edge console</li><li>Test stream: latency &lt; 500ms, no dropped frames</li><li>VLAN isolation recommended: cameras on separate network segment</li><li>NVR ONVIF compatibility check (Profile S mandatory)</li></ul>
      </>
    ) },
    { title: 'AI model calibration', tag: 'tag-config', tagText: 'Config', content: (
      <>
        <p>Run the calibration wizard in InOps after face enrolment is complete. The model adapts to lighting conditions and worker protective equipment (helmets, masks).</p>
        <ul><li>Shadow calibration: run wizard once per shift (day/night differences)</li><li>PPE mode: enable if workers wear helmets — switches to ear/jaw geometry</li><li>Minimum confidence threshold: 75% for a valid punch</li><li>Low-confidence events flagged for supervisor review (not auto-blocked)</li></ul>
      </>
    ) },
    { title: 'Time recording & dwell logic', tag: 'tag-sw', tagText: 'Software', content: (
      <>
        <p>Configure InOps dwell rules to convert camera detections into valid IN/OUT punches. Prevent false punches from pass-bys.</p>
        <ul><li>Minimum dwell time: 2 seconds in camera zone = valid detection</li><li>Anti-passback: second IN punch suppressed if no OUT punch in between</li><li>Time record accuracy: punches rounded to nearest minute</li><li>CCTV evidence link: each attendance record links to a 10s video clip stored on NVR</li></ul>
      </>
    ) }
  ];

  const mobileSteps: Step[] = [
    { title: 'App deployment & MDM', tag: 'tag-sw', tagText: 'Software', content: (
      <>
        <p>Distribute InOps Worker App via Google Play / Enterprise MDM. Workers with personal devices use Play Store; company-issued devices use MDM push.</p>
        <ul><li>Minimum Android 9 / iOS 14</li><li>MDM policy: prevent app uninstall during working hours</li><li>Contractor supervisor gets Supervisor App with muster approval view</li><li>App requires: Camera, Location (precise), Bluetooth permissions</li></ul>
      </>
    ) },
    { title: 'Geo-fence & site boundary config', tag: 'tag-config', tagText: 'Config', content: (
      <>
        <p>Draw geo-fence polygons for each plant zone in InOps admin. Workers can only clock-in when device GPS is inside the fence.</p>
        <ul><li>Main plant boundary: outer geo-fence (clock-in allowed)</li><li>Restricted zones: inner negative fence (triggers alert if worker enters)</li><li>Accuracy buffer: ±30m tolerance for GPS drift in large plants</li><li>GPS spoofing detection: app checks mock location flag — punch rejected if spoof detected</li></ul>
      </>
    ) },
    { title: 'BLE beacon / Wi-Fi SSID anchoring', tag: 'tag-hw', tagText: 'Hardware', content: (
      <>
        <p>For indoor areas where GPS is unreliable (covered shop floors), deploy BLE beacons or use plant Wi-Fi SSID as secondary location proof.</p>
        <ul><li>BLE beacon: install at entry door, worker app must detect beacon within 5m to punch</li><li>Wi-Fi SSID: whitelist plant SSIDs in InOps — punch requires device connected to listed SSID</li><li>Fallback priority: GPS → BLE beacon → Wi-Fi SSID → Supervisor override</li></ul>
      </>
    ) },
    { title: 'Liveness & face-match verification', tag: 'tag-config', tagText: 'Config', content: (
      <>
        <p>Workers take a selfie at punch. App runs on-device liveness check (blink / turn) and matches against enrolled face template. Not just photo storage.</p>
        <ul><li>Liveness test: randomised challenge (blink, turn left/right)</li><li>Face match against InOps enrolled template (server-side verify)</li><li>Match threshold: 70% confidence — below threshold flagged for supervisor</li><li>Mask mode: enabled where PPE is mandatory — uses periocular features</li></ul>
      </>
    ) }
  ];

  const uatSteps: Step[] = [
    { title: 'Happy path: full clock-in / clock-out', tag: 'tag-sw', tagText: 'Test', content: <p>Use a test worker record. Clock-in via Face device → verify IN punch in InOps dashboard. Clock-out → verify duration computed correctly. Repeat for CCTV and Mobile app.</p> },
    { title: 'CLRA hard block test', tag: 'tag-compliance', tagText: 'Compliance', content: <p>Set a test contractor's license expiry date to yesterday. Attempt clock-in — verify barrier does NOT open, device screen shows "Access Denied — License Expired", and alert fires in supervisor app within 10 seconds.</p> },
    { title: 'Zone restriction test', tag: 'tag-compliance', tagText: 'Compliance', content: <p>Assign a test worker only to Zone C. Attempt entry at a Zone A gate. Verify hard block fires. Then grant Zone A access via work order update and re-test — verify entry is allowed.</p> },
    { title: 'OT soft block & override', tag: 'tag-sw', tagText: 'Test', content: <p>Log 9 hours against a test worker. Attempt a second clock-in for the same day. Verify soft block fires, supervisor receives approval request, approval grants access, and OT record is created in Form 17.</p> },
    { title: 'Offline recovery test', tag: 'tag-net', tagText: 'Network', content: <p>Disconnect Face device from LAN. Generate 20 test punches. Reconnect — verify all 20 punches sync to InOps within 2 minutes and no duplicates are created.</p> },
    { title: 'Compliance document generation', tag: 'tag-compliance', tagText: 'Compliance', content: <p>Generate Form 13 and Form 14 for the test contractor for the current month. Verify all worker names, UAN numbers, and attendance counts are correct. PE officer signs off on format.</p> }
  ];

  const renderStepList = (steps: Step[], panelId: keyof StepStates & keyof OpenSteps) => (
    <div className="step-grid">
      {steps.map((step, idx) => (
        <div key={idx} className={`step ${stepStates[panelId][idx] ? 'done' : ''}`} onClick={() => toggleStep(panelId, idx)}>
          <div className="step-head">
            <div className="step-num">{idx + 1}</div>
            <span>{step.title}</span>
            <span className={`step-tag ${step.tag}`}>{step.tagText}</span>
          </div>
          <div className={`step-body ${openSteps[panelId][idx] ? 'open' : ''}`}>
            {step.content}
            {!stepStates[panelId][idx] && (
              <button className="mark-btn" onClick={(e) => markDone(panelId, idx, e)}>
                {panelId === 'uat' ? 'Mark passed' : 'Mark complete'}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div>
      <style>{`
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        :root {
          --color-background-primary: #fff;
          --color-background-secondary: #f5f4f0;
          --color-text-primary: #1a1a18;
          --color-text-secondary: #5f5e5a;
          --color-text-tertiary: #9c9a92;
          --color-border-tertiary: rgba(0,0,0,0.12);
          --color-border-secondary: rgba(0,0,0,0.22);
          --border-radius-md: 8px;
          --border-radius-lg: 12px;
          --font-sans: system-ui, -apple-system, sans-serif;
          --c-teal: #0F6E56;
          --c-teal-light: #E1F5EE;
          --c-amber: #BA7517;
          --c-amber-light: #FAEEDA;
          --c-red: #A32D2D;
          --c-red-light: #FCEBEB;
          --c-blue: #185FA5;
          --c-blue-light: #E6F1FB;
          --c-gray: #5F5E5A;
          --c-gray-light: #F1EFE8;
          --c-green: #3B6D11;
          --c-green-light: #EAF3DE;
          --c-purple: #534AB7;
          --c-purple-light: #EEEDFE;
        }
        @media (prefers-color-scheme: dark) {
          :root {
            --color-background-primary: #1e1e1c;
            --color-background-secondary: #2a2a27;
            --color-text-primary: #e8e6de;
            --color-text-secondary: #9c9a92;
            --color-text-tertiary: #6b6a63;
            --color-border-tertiary: rgba(255,255,255,0.1);
            --color-border-secondary: rgba(255,255,255,0.18);
            --c-teal-light: #083d2f;
            --c-amber-light: #3d2a06;
            --c-red-light: #3d1010;
            --c-blue-light: #0c2d52;
            --c-green-light: #1a3308;
            --c-purple-light: #1e1a4a;
          }
        }
        body {
          font-family: var(--font-sans);
          background: var(--color-background-secondary);
          min-height: 100vh;
        }
        .wrap {
          display: grid;
          grid-template-columns: 200px 1fr;
          gap: 0;
          border: 0.5px solid var(--color-border-tertiary);
          border-radius: var(--border-radius-lg);
          overflow: hidden;
          background: var(--color-background-primary);
          max-width: 960px;
          margin: 0 auto;
          box-shadow: 0 2px 12px rgba(0,0,0,0.08);
        }
        .nav {
          background: var(--color-background-secondary);
          border-right: 0.5px solid var(--color-border-tertiary);
          padding: 12px 0;
        }
        .nav-section {
          font-size: 11px;
          font-weight: 500;
          color: var(--color-text-tertiary);
          padding: 8px 14px 4px;
          letter-spacing: .05em;
          text-transform: uppercase;
        }
        .nav-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 7px 14px;
          cursor: pointer;
          font-size: 13px;
          color: var(--color-text-secondary);
          border-left: 2px solid transparent;
          transition: all .15s;
        }
        .nav-item:hover {
          background: var(--color-background-primary);
          color: var(--color-text-primary);
        }
        .nav-item.active {
          background: var(--color-background-primary);
          color: var(--color-text-primary);
          border-left-color: var(--c-teal);
          font-weight: 500;
        }
        .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .panel {
          padding: 20px 24px;
          min-height: 560px;
        }
        .ph {
          font-size: 17px;
          font-weight: 500;
          color: var(--color-text-primary);
          margin-bottom: 4px;
        }
        .ps {
          font-size: 13px;
          color: var(--color-text-secondary);
          margin-bottom: 18px;
        }
        .step-grid {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .step {
          border: 0.5px solid var(--color-border-tertiary);
          border-radius: var(--border-radius-md);
          padding: 12px 14px;
          cursor: pointer;
          transition: border-color .15s;
        }
        .step:hover {
          border-color: var(--color-border-secondary);
        }
        .step.done {
          border-color: #9FE1CB;
          background: rgba(29,158,117,0.06);
        }
        .step.done .step-head span {
          text-decoration: line-through;
          color: var(--color-text-tertiary);
        }
        .step-head {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .step-num {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: var(--color-background-secondary);
          border: 0.5px solid var(--color-border-secondary);
          font-size: 11px;
          font-weight: 500;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: var(--color-text-secondary);
        }
        .step.done .step-num {
          background: #5DCAA5;
          border-color: #1D9E75;
          color: #fff;
        }
        .step-head span {
          font-size: 13px;
          font-weight: 500;
          flex: 1;
          color: var(--color-text-primary);
        }
        .step-tag {
          font-size: 10px;
          padding: 2px 7px;
          border-radius: 20px;
          font-weight: 500;
          flex-shrink: 0;
        }
        .tag-hw { background: var(--c-amber-light); color: var(--c-amber); }
        .tag-sw { background: var(--c-blue-light); color: var(--c-blue); }
        .tag-net { background: var(--c-purple-light); color: var(--c-purple); }
        .tag-compliance { background: var(--c-red-light); color: var(--c-red); }
        .tag-config { background: var(--c-green-light); color: var(--c-green); }
        .step-body {
          display: none;
          margin-top: 10px;
          padding-top: 10px;
          border-top: 0.5px solid var(--color-border-tertiary);
        }
        .step-body.open {
          display: block;
        }
        .step-body p {
          font-size: 12px;
          color: var(--color-text-secondary);
          line-height: 1.6;
          margin-bottom: 6px;
        }
        .step-body ul {
          padding-left: 16px;
          font-size: 12px;
          color: var(--color-text-secondary);
          line-height: 1.8;
        }
        .mark-btn {
          margin-top: 10px;
          font-size: 11px;
          padding: 4px 12px;
          cursor: pointer;
          border: 0.5px solid var(--color-border-secondary);
          border-radius: var(--border-radius-md);
          background: transparent;
          color: var(--color-text-secondary);
        }
        .mark-btn:hover {
          background: var(--color-background-secondary);
        }
        .block-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
          margin-top: 4px;
        }
        .block-table th {
          text-align: left;
          padding: 7px 10px;
          font-weight: 500;
          font-size: 11px;
          background: var(--color-background-secondary);
          color: var(--color-text-secondary);
          border-bottom: 0.5px solid var(--color-border-tertiary);
        }
        .block-table td {
          padding: 8px 10px;
          border-bottom: 0.5px solid var(--color-border-tertiary);
          vertical-align: top;
          line-height: 1.5;
          color: var(--color-text-secondary);
        }
        .block-table td strong {
          color: var(--color-text-primary);
        }
        .block-table tr:last-child td {
          border-bottom: none;
        }
        .sev {
          font-size: 10px;
          padding: 2px 7px;
          border-radius: 20px;
          font-weight: 500;
          white-space: nowrap;
        }
        .sev-hard { background: var(--c-red-light); color: var(--c-red); }
        .sev-soft { background: var(--c-amber-light); color: var(--c-amber); }
        .sev-info { background: var(--c-blue-light); color: var(--c-blue); }
        .mode-card {
          border: 0.5px solid var(--color-border-tertiary);
          border-radius: var(--border-radius-md);
          padding: 14px;
          margin-bottom: 12px;
        }
        .mode-title {
          font-size: 13px;
          font-weight: 500;
          margin-bottom: 6px;
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--color-text-primary);
        }
        .mode-badge {
          font-size: 10px;
          padding: 2px 8px;
          border-radius: 20px;
          font-weight: 500;
        }
        .flow {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
          margin-top: 8px;
        }
        .flow-node {
          font-size: 11px;
          padding: 4px 10px;
          border-radius: 20px;
          background: var(--color-background-secondary);
          border: 0.5px solid var(--color-border-secondary);
          color: var(--color-text-secondary);
        }
        .flow-arrow {
          font-size: 12px;
          color: var(--color-text-tertiary);
        }
        .int-row {
          display: grid;
          grid-template-columns: 110px 1fr;
          gap: 10px;
          align-items: start;
          padding: 8px 0;
          border-bottom: 0.5px solid var(--color-border-tertiary);
          font-size: 12px;
          color: var(--color-text-secondary);
        }
        .int-row:last-child {
          border-bottom: none;
        }
        .int-label {
          font-weight: 500;
          color: var(--color-text-secondary);
          font-size: 11px;
          padding-top: 2px;
        }
        .zone-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
          margin-top: 4px;
        }
        .zone-card {
          border: 0.5px solid var(--color-border-tertiary);
          border-radius: var(--border-radius-md);
          padding: 10px 12px;
        }
        .zone-name {
          font-size: 12px;
          font-weight: 500;
          margin-bottom: 4px;
        }
        .zone-rule {
          font-size: 11px;
          color: var(--color-text-secondary);
          line-height: 1.6;
        }
        .progress-bar {
          height: 4px;
          background: var(--color-background-secondary);
          border-radius: 2px;
          margin-bottom: 16px;
          overflow: hidden;
        }
        .progress-fill {
          height: 100%;
          background: #1D9E75;
          border-radius: 2px;
          transition: width .3s;
        }
        .section-note {
          font-size: 11px;
          padding: 8px 12px;
          border-radius: var(--border-radius-md);
          margin-bottom: 14px;
          line-height: 1.6;
        }
        .note-warn { background: var(--c-amber-light); color: var(--c-amber); }
        .note-info { background: var(--c-blue-light); color: var(--c-blue); }
        .note-danger { background: var(--c-red-light); color: var(--c-red); }
        .header {
          max-width: 960px;
          margin: 0 auto 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .header h1 {
          font-size: 15px;
          font-weight: 500;
          color: var(--color-text-primary);
        }
        .header p {
          font-size: 12px;
          color: var(--color-text-tertiary);
        }
      `}</style>

      <div className="header">
        <div><h1>InOps — Integrated Attendance Deployment Script</h1></div>
        <div><p>Face Device · CCTV · Mobile App · CLRA Blocking Engine</p></div>
      </div>

      <div className="wrap">
        <nav className="nav">
          {Object.entries(groupedNavItems).map(([section, items]) => (
            <React.Fragment key={section}>
              <div className="nav-section">{section}</div>
              {items.map((item: NavItem) => (
                <div
                  key={item.id}
                  className={`nav-item ${activePanel === item.id ? 'active' : ''}`}
                  onClick={() => setActivePanel(item.id)}
                >
                  <span className="dot" style={{ background: item.dotColor }}></span>
                  {item.label}
                </div>
              ))}
            </React.Fragment>
          ))}
        </nav>

        <div>
          {/* Pre-deployment Panel */}
          {activePanel === 'pre' && (
            <div className="panel">
              <div className="ph">Pre-deployment checklist</div>
              <div className="ps">Complete all items before any hardware is installed or app is rolled out.</div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${getProgress('pre')}%` }}></div>
              </div>
              {renderStepList(preSteps, 'pre')}
            </div>
          )}

          {/* Face Device Panel */}
          {activePanel === 'face' && (
            <div className="panel">
              <div className="ph">Mode 1 — Face recognition access control device</div>
              <div className="ps">Biometric-grade entry/exit logging with physical barrier integration.</div>
              <div className="section-note note-info">Best suited for main gates and shop-floor entry points. Provides the highest trust score for compliance purposes.</div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${getProgress('face')}%` }}></div>
              </div>
              {renderStepList(faceSteps, 'face')}
              <div className="mode-card" style={{ marginTop: 16 }}>
                <div className="mode-title"><span className="mode-badge" style={{ background: 'var(--c-blue-light)', color: 'var(--c-blue)' }}>Punch flow</span></div>
                <div className="flow">
                  <div className="flow-node">Worker faces device</div><div className="flow-arrow">→</div>
                  <div className="flow-node">Face match (on-device)</div><div className="flow-arrow">→</div>
                  <div className="flow-node">InOps blocking check</div><div className="flow-arrow">→</div>
                  <div className="flow-node">ALLOW / BLOCK signal</div><div className="flow-arrow">→</div>
                  <div className="flow-node">Attendance record created</div>
                </div>
              </div>
            </div>
          )}

          {/* CCTV Panel */}
          {activePanel === 'cctv' && (
            <div className="panel">
              <div className="ph">Mode 2 — CCTV-based attendance & time recording</div>
              <div className="ps">AI-driven identification from existing CCTV infrastructure. No touch, no device at every gate.</div>
              <div className="section-note note-warn">Requires minimum 2MP IP camera with 25fps. Analogue CCTV must be upgraded via DVR-to-NVR bridge before deployment.</div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${getProgress('cctv')}%` }}></div>
              </div>
              {renderStepList(cctvSteps, 'cctv')}
            </div>
          )}

          {/* Mobile App Panel */}
          {activePanel === 'mobile' && (
            <div className="panel">
              <div className="ph">Mode 3 — Mobile app attendance (verified)</div>
              <div className="ps">Not just a selfie store — multi-factor verification with liveness, GPS, and Wi-Fi/BLE beacon proof.</div>
              <div className="section-note note-info">Ideal for field workers, remote sites, and contractors who move between multiple plant locations. Verification layers are configurable per contractor tier.</div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${getProgress('mobile')}%` }}></div>
              </div>
              {renderStepList(mobileSteps, 'mobile')}
            </div>
          )}

          {/* CLRA Blocking Panel */}
          {activePanel === 'block' && (
            <div className="panel">
              <div className="ph">CLRA blocking rules — contract labour</div>
              <div className="ps">Applicable to all large manufacturers under the Contract Labour (Regulation & Abolition) Act, 1970. Blocking is automatic; override requires authorised PE officer action.</div>
              <div className="section-note note-danger">Hard blocks physically prevent entry (barrier stays closed / app punch rejected). Soft blocks allow entry but raise an alert and flag the shift for compliance review.</div>
              <table className="block-table">
                <thead>
                  <tr><th>Trigger condition</th><th>Rule basis</th><th>Block type</th><th>Override</th></tr>
                </thead>
                <tbody>
                  <tr><td><strong>Contractor license expired</strong> — Form XIII validity lapsed</td><td>CLRA Sec 7 / Rule 21</td><td><span className="sev sev-hard">Hard block</span></td><td>PE officer + renewed license upload</td></tr>
                  <tr><td><strong>Worker not enrolled</strong> — no PF UAN linked in InOps</td><td>CLRA Sec 21(2) / EPF Act</td><td><span className="sev sev-hard">Hard block</span></td><td>HR admin after UAN verification</td></tr>
                  <tr><td><strong>ESI IP not registered</strong> — worker not covered under ESIC</td><td>ESI Act Sec 2(9)</td><td><span className="sev sev-hard">Hard block</span></td><td>HR admin + IP number upload</td></tr>
                  <tr><td><strong>Work order / PO expired</strong> — contractor's active PO end date passed</td><td>PE liability under CLRA Sec 20</td><td><span className="sev sev-hard">Hard block</span></td><td>PE officer + PO renewal in system</td></tr>
                  <tr><td><strong>Daily OT limit exceeded</strong> — worker already completed 9 hrs today</td><td>Factories Act Sec 51/54</td><td><span className="sev sev-soft">Soft block</span></td><td>Shift supervisor approval with reason code</td></tr>
                  <tr><td><strong>Weekly hour cap reached</strong> — 48 hrs logged in current week</td><td>Factories Act Sec 51</td><td><span className="sev sev-soft">Soft block</span></td><td>Factory manager approval only</td></tr>
                  <tr><td><strong>Monthly day cap</strong> — 26 working days already logged this month</td><td>CLRA Muster compliance</td><td><span className="sev sev-soft">Soft block</span></td><td>PE officer; creates Form 14 exception entry</td></tr>
                  <tr><td><strong>Worker under 18 years</strong> — DOB in profile flags minor</td><td>Factories Act Sec 67 / Child Labour Act</td><td><span className="sev sev-hard">Hard block</span></td><td>No override — contractor must remove worker</td></tr>
                  <tr><td><strong>Dual contractor on same day</strong> — worker already clocked-in under a different contractor today</td><td>CLRA Reg 75 — muster integrity</td><td><span className="sev sev-hard">Hard block</span></td><td>HR admin reconciliation; raises compliance incident</td></tr>
                  <tr><td><strong>Form XIII renewal pending</strong> — &lt; 30 days to license expiry</td><td>Proactive CLRA compliance</td><td><span className="sev sev-info">Advisory</span></td><td>No block — reminder to contractor & PE officer</td></tr>
                  <tr><td><strong>Safety induction not completed</strong> — new worker, no induction record</td><td>Factories Act Sec 111A / Internal policy</td><td><span className="sev sev-soft">Soft block</span></td><td>Safety officer marks induction complete in app</td></tr>
                </tbody>
             </table>
            </div>
          )}

          {/* Zone Access Panel */}
          {activePanel === 'zone' && (
            <div className="panel">
              <div className="ph">Zone-based access restriction</div>
              <div className="ps">Assign workers and contractor groups to permitted zones. Face device and CCTV module enforce zone rules at each gate in real time.</div>
              <div className="section-note note-warn">Zone rules stack on top of CLRA blocks — a worker must pass both CLRA check AND zone check to enter.</div>
              <div className="zone-grid">
                <div className="zone-card">
                  <div className="zone-name" style={{ color: 'var(--c-red)' }}>Zone A — Hazardous / restricted</div>
                  <div className="zone-rule">Examples: Press shop, paint booth, chemical store, electrical substation.<br /><br />Access: Only workers with valid safety certification AND contractor with hazardous-area rider on Form XIII. Certification expiry = hard block. PPE compliance check mandatory at zone gate.</div>
                </div>
                <div className="zone-card">
                  <div className="zone-name" style={{ color: 'var(--c-amber)' }}>Zone B — Core shop floor</div>
                  <div className="zone-rule">Examples: Assembly line, welding bay, machining area.<br /><br />Access: Workers tagged to this contractor's work order scope. Workers from unrelated contracts (e.g. canteen contractor) are hard-blocked. Shift restriction enforced — B-shift worker cannot enter during A-shift.</div>
                </div>
                <div className="zone-card">
                  <div className="zone-name" style={{ color: 'var(--c-blue)' }}>Zone C — General plant</div>
                  <div className="zone-rule">Examples: Warehouse, despatch, loading bay.<br /><br />Access: All active enrolled workers with valid contractor license. Visitor pass holders allowed with escort flag. OT workers allowed with supervisor approval punch.</div>
                </div>
                <div className="zone-card">
                  <div className="zone-name" style={{ color: 'var(--c-teal)' }}>Zone D — Admin / canteen</div>
                  <div className="zone-rule">Examples: HR office, canteen, first-aid room, welfare facilities.<br /><br />Access: All enrolled workers regardless of work order scope. CLRA mandates welfare facilities must be accessible — no access restriction allowed here. Blocking here is advisory only.</div>
                </div>
              </div>
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 10, color: 'var(--color-text-primary)' }}>Zone configuration steps in InOps</div>
                <div className="int-row"><div className="int-label">Step 1</div><div>Create zones in InOps → Site Management → Zone Master. Assign a zone code, zone type, and list of gates belonging to each zone.</div></div>
                <div className="int-row"><div className="int-label">Step 2</div><div>Map contractor work orders to permitted zones. A contractor approved for Zone B can also access Zone C and D by default unless restricted.</div></div>
                <div className="int-row"><div className="int-label">Step 3</div><div>Tag certification requirements to Zone A gates. Link certification types (e.g. "Hazardous Area Entry") to the zone. System checks worker's certification record at every IN punch.</div></div>
                <div className="int-row"><div className="int-label">Step 4</div><div>Test each gate: punch an enrolled worker who should be blocked — verify block signal fires and alert reaches supervisor app within 10 seconds.</div></div>
              </div>
            </div>
          )}

          {/* Integration Panel */}
          {activePanel === 'int' && (
            <div className="panel">
              <div className="ph">Integration & data sync</div>
              <div className="ps">All three attendance modes feed a single InOps attendance ledger. Deduplication, reconciliation, and downstream payroll sync run automatically.</div>
              <div className="int-row" style={{ borderTop: '0.5px solid var(--color-border-tertiary)' }}><div className="int-label">Face device</div><div>Punches sync to InOps server every 60 seconds via HTTPS POST. Offline buffer auto-flushes on reconnect. Duplicate punches within 5-min window auto-suppressed.</div></div>
              <div className="int-row"><div className="int-label">CCTV module</div><div>Edge Agent pushes verified detection events to InOps every 30 seconds. Events carry camera ID, timestamp, worker ID, confidence score. Low-confidence events held in review queue.</div></div>
              <div className="int-row"><div className="int-label">Mobile app</div><div>Punch submitted immediately on worker action. Includes GPS lat/long, BLE beacon ID (if detected), face match score, and device IMEI. Server validates and creates attendance record.</div></div>
              <div className="int-row"><div className="int-label">Deduplication</div><div>If same worker is detected by Face device AND CCTV within 3-min window at same gate, only one attendance record is created. Source = Face device (higher trust score).</div></div>
              <div className="int-row"><div className="int-label">Payroll export</div><div>Attendance ledger → Wage calculation engine → CSV/API export to payroll system daily at shift close. Supports SAP, Ramco, Keka, and custom API.</div></div>
              <div className="int-row"><div className="int-label">Compliance docs</div><div>Form 13 (Register of Workmen), Form 14 (Muster Roll), Form 17 (OT Register) auto-generated from InOps ledger. Available as PDF on demand or scheduled email to PE officer.</div></div>
            </div>
          )}

          {/* UAT Panel */}
          {activePanel === 'uat' && (
            <div className="panel">
              <div className="ph">UAT & handover</div>
              <div className="ps">Run all scenarios below before signing off. Involve PE officer, contractor supervisor, and security in the UAT session.</div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${getProgress('uat')}%` }}></div>
              </div>
              {renderStepList(uatSteps, 'uat')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InOpsDeployment;