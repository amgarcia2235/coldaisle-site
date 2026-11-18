/* Cold Aisle event decoder. Runs entirely in this browser: it makes no network requests and stores nothing.
   The tables and wording are the Cold Aisle app's own (IPMI v2.0 tables 42-1, 42-2 and 42-3). */
(function (root) {
"use strict";
var SENSOR_NAMES = {"1":"Temperature","2":"Voltage","3":"Current","4":"Fan","5":"Physical Security","6":"Platform Security","7":"Processor","8":"Power Supply","9":"Power Unit","10":"Cooling Device","11":"Other Units","12":"Memory","13":"Drive Slot","14":"POST Memory Resize","15":"System Firmware","16":"Event Logging","17":"Watchdog","18":"System Event","19":"Critical Interrupt","20":"Button","21":"Module / Board","22":"Microcontroller","23":"Add-in Card","24":"Chassis","25":"Chip Set","26":"Other FRU","27":"Cable / Interconnect","28":"Terminator","29":"System Boot","30":"Boot Error","31":"OS Boot","32":"OS Stop","33":"Slot / Connector","34":"ACPI Power State","35":"Watchdog","36":"Platform Alert","37":"Entity Presence","38":"Monitor ASIC","39":"LAN","40":"Management Health","41":"Battery","42":"Session Audit","43":"Version Change","44":"FRU State"};
var THRESHOLD = {"0":["dropped below its lower warning limit","below its lower warning limit","warning"],"1":["crossed its lower warning limit, rising","at its lower warning limit","warning"],"2":["dropped below its lower critical limit","below its lower critical limit","critical"],"3":["crossed its lower critical limit, rising","at its lower critical limit","critical"],"4":["dropped below its lower non-recoverable limit","below its lower non-recoverable limit","critical"],"5":["crossed its lower non-recoverable limit, rising","at its lower non-recoverable limit","critical"],"6":["crossed its upper warning limit, falling","at its upper warning limit","warning"],"7":["rose above its upper warning limit","above its upper warning limit","warning"],"8":["crossed its upper critical limit, falling","at its upper critical limit","critical"],"9":["rose above its upper critical limit","above its upper critical limit","critical"],"10":["crossed its upper non-recoverable limit, falling","at its upper non-recoverable limit","critical"],"11":["rose above its upper non-recoverable limit","above its upper non-recoverable limit","critical"]};
var GENERIC = {"2":[["Became idle","info"],["Became active","info"],["Became busy","info"]],"3":[["State cleared","info"],["State asserted","warning"]],"4":[["Predicted failure cleared","info"],["Predicted to fail","warning"]],"5":[["Within its limit","info"],["Limit exceeded","warning"]],"6":[["Performance met","info"],["Performance lagging","warning"]],"7":[["Back to OK","info"],["Went from OK to warning","warning"],["Became critical","critical"],["Became non-recoverable","critical"],["Improved to warning","warning"],["Improved to critical","critical"],["Non-recoverable","critical"],["Monitoring","info"],["Informational","info"]],"8":[["Removed or absent","warning"],["Inserted or present","info"]],"9":[["Disabled","warning"],["Enabled","info"]],"10":[["Running","info"],["In test","info"],["Powered off","info"],["Online","info"],["Offline","info"],["Off duty","info"],["Degraded","warning"],["Power save","info"],["Install error","critical"]],"11":[["Fully redundant","info"],["Redundancy lost","critical"],["Redundancy degraded","warning"],["Not redundant, still enough to run","warning"],["Not redundant, now enough to run","warning"],["Not redundant, not enough to run","critical"],["Redundancy degraded from fully redundant","warning"],["Redundancy degraded from not redundant","warning"]],"12":[["Device power state D0","info"],["Device power state D1","info"],["Device power state D2","info"],["Device power state D3","info"]]};
var SPECIFIC = {"5":{"0":["Chassis intrusion detected","warning"],"1":["Drive bay intrusion detected","warning"],"2":["I/O card area intrusion detected","warning"],"3":["Processor area intrusion detected","warning"],"4":["Network cable unplugged","warning"],"5":["Unauthorized dock","warning"],"6":["Fan area intrusion detected","warning"]},"6":{"0":["Secure mode violation attempt","warning"],"1":["Wrong user password at boot","warning"],"2":["Wrong setup password at boot","warning"],"3":["Wrong network boot password","warning"],"4":["Wrong password at boot","warning"],"5":["Out-of-band access password violation","warning"]},"7":{"0":["Processor internal error (IERR)","critical"],"1":["Processor shut down from overheating (thermal trip)","critical"],"2":["Processor self-test failed (FRB1/BIST)","critical"],"3":["Processor hung during startup (FRB2)","critical"],"4":["Processor failed to start (FRB3)","critical"],"5":["Processor configuration error","critical"],"6":["Uncorrectable processor error","critical"],"7":["Processor present","info"],"8":["Processor disabled","warning"],"9":["Terminator present","info"],"10":["Processor throttled to cool down","warning"],"11":["Uncorrectable machine check exception","critical"],"12":["Correctable machine check error","warning"]},"8":{"0":["Power supply present","info"],"1":["Power supply failed","critical"],"2":["Power supply is predicted to fail","warning"],"3":["Power supply lost input power","critical"],"4":["Power supply input lost or out of range","critical"],"5":["Power supply input out of range","warning"],"6":["Power supply configuration error","critical"],"7":["Power supply on standby","info"]},"9":{"0":["Powered off","info"],"1":["Power cycled","info"],"2":["Powered down at the 240 VA limit","warning"],"3":["Powered down by an interlock","warning"],"4":["AC power lost","critical"],"5":["Soft power control failed","critical"],"6":["Power unit failed","critical"],"7":["Power unit is predicted to fail","warning"]},"12":{"0":["Correctable memory error (ECC)","warning"],"1":["Uncorrectable memory error (ECC)","critical"],"2":["Memory parity error","critical"],"3":["Memory scrub failed","critical"],"4":["Memory module disabled","warning"],"5":["Correctable memory error limit reached","warning"],"6":["Memory module present","info"],"7":["Memory configuration error","critical"],"8":["Spare memory module in use","info"],"9":["Memory throttled to cool down","warning"],"10":["Memory critically overheated","critical"]},"13":{"0":["Drive present","info"],"1":["Drive fault","critical"],"2":["Drive is predicted to fail","warning"],"3":["Hot spare","info"],"4":["Consistency check in progress","info"],"5":["Drive is in a critical array","critical"],"6":["Drive is in a failed array","critical"],"7":["Rebuild in progress","warning"],"8":["Rebuild aborted","warning"]},"15":{"0":["Startup (POST) error","critical"],"1":["System firmware hung","critical"],"2":["System firmware progress","info"]},"16":{"0":["Correctable memory error logging disabled","warning"],"1":["Logging disabled for an event type","warning"],"2":["Event log cleared","info"],"3":["All event logging disabled","warning"],"4":["Event log is full","warning"],"5":["Event log is almost full","warning"],"6":["Correctable machine check logging disabled","warning"]},"17":{"0":["BIOS watchdog reset","warning"],"1":["OS watchdog reset","warning"],"2":["OS watchdog shutdown","warning"],"3":["OS watchdog power down","warning"],"4":["OS watchdog power cycle","warning"],"5":["OS watchdog NMI","warning"],"6":["OS watchdog expired","warning"],"7":["OS watchdog pre-timeout interrupt","warning"]},"18":{"0":["System reconfigured","info"],"1":["Vendor system boot event","info"],"2":["Undetermined system hardware failure","critical"],"3":["Entry added to the auxiliary log","info"],"4":["Event filter action taken","info"],"5":["Clock synchronised","info"]},"19":{"0":["Front panel NMI button pressed","warning"],"1":["Bus timeout","critical"],"2":["I/O channel check NMI","critical"],"3":["Software NMI","warning"],"4":["PCI parity error (PERR)","critical"],"5":["PCI system error (SERR)","critical"],"6":["EISA fail-safe timeout","critical"],"7":["Bus correctable error","warning"],"8":["Bus uncorrectable error","critical"],"9":["Fatal NMI","critical"],"10":["Bus fatal error","critical"],"11":["Bus degraded","warning"]},"20":{"0":["Power button pressed","info"],"1":["Sleep button pressed","info"],"2":["Reset button pressed","info"],"3":["FRU latch opened","info"],"4":["FRU service request button pressed","info"]},"25":{"0":["Soft power control failure","critical"],"1":["Chip set thermal trip","critical"]},"27":{"0":["Cable connected","info"],"1":["Incorrect cable connection","warning"]},"29":{"0":["Started by power up","info"],"1":["Started by hard reset","info"],"2":["Started by warm reset","info"],"3":["User requested PXE boot","info"],"4":["Automatic boot to diagnostics","info"],"5":["Hard reset started by the OS or software","info"],"6":["Warm reset started by the OS or software","info"],"7":["System restart","info"]},"30":{"0":["No bootable media","critical"],"1":["Non-bootable disk left in the drive","warning"],"2":["PXE server not found","warning"],"3":["Invalid boot sector","critical"],"4":["Timed out waiting for a boot source choice","warning"]},"31":{"0":["Booted from drive A:","info"],"1":["Booted from drive C:","info"],"2":["PXE boot completed","info"],"3":["Diagnostic boot completed","info"],"4":["Booted from CD-ROM","info"],"5":["Booted from ROM","info"],"6":["Boot completed","info"]},"32":{"0":["OS stopped while loading","critical"],"1":["OS crashed (critical stop)","critical"],"2":["OS stopped gracefully","info"],"3":["OS shut down gracefully","info"],"4":["Soft shutdown started by an event filter","info"],"5":["OS agent not responding","warning"]},"33":{"0":["Slot fault","critical"],"1":["Slot identify light on","info"],"2":["Device installed in slot","info"],"3":["Slot ready for installation","info"],"4":["Slot ready for removal","info"],"5":["Slot powered off","info"],"6":["Slot removal requested","info"],"7":["Slot interlock","info"],"8":["Slot disabled","warning"],"9":["Slot holds a spare device","info"]},"34":{"0":["Running (S0)","info"],"1":["Sleeping (S1)","info"],"2":["Sleeping (S2)","info"],"3":["Sleeping (S3)","info"],"4":["Hibernating (S4)","info"],"5":["Soft off (S5)","info"],"6":["Soft off (S4/S5)","info"],"7":["Mechanical off (G3)","info"],"8":["Sleeping","info"],"9":["Sleeping (G1)","info"],"10":["Soft off by override (S5)","info"],"11":["Legacy on","info"],"12":["Legacy off","info"],"14":["Unknown power state","info"]},"35":{"0":["Watchdog timer expired","warning"],"1":["Watchdog hard reset","warning"],"2":["Watchdog power down","warning"],"3":["Watchdog power cycle","warning"],"8":["Watchdog timer interrupt","warning"]},"37":{"0":["Present","info"],"1":["Absent","info"],"2":["Disabled","warning"]},"39":{"0":["LAN heartbeat lost","warning"],"1":["LAN heartbeat","info"]},"40":{"0":["Sensor access degraded or unavailable","warning"],"1":["Controller access degraded or unavailable","warning"],"2":["Management controller offline","critical"],"3":["Management controller unavailable","critical"],"4":["Sensor failure","critical"],"5":["FRU failure","critical"]},"41":{"0":["Battery low","warning"],"1":["Battery failed","critical"],"2":["Battery present","info"]},"42":{"0":["Session activated","info"],"1":["Session deactivated","info"],"2":["Invalid user name or password","warning"],"3":["Account disabled after bad passwords","warning"]},"43":{"0":["Hardware change detected","info"],"1":["Firmware or software change detected","info"],"2":["Hardware incompatibility detected","warning"],"3":["Firmware or software incompatibility detected","warning"],"4":["Invalid or unsupported hardware version","warning"],"5":["Invalid or unsupported firmware or software version","warning"],"6":["Hardware change completed","info"],"7":["Firmware or software change completed","info"]},"44":{"0":["FRU not installed","info"],"1":["FRU inactive","info"],"2":["FRU activation requested","info"],"3":["FRU activation in progress","info"],"4":["FRU active","info"],"5":["FRU deactivation requested","info"],"6":["FRU deactivation in progress","info"],"7":["FRU communication lost","warning"]}};
var ADVICE = {"temperatureHigh":["Something in the server is hotter than the limit set for it. Servers slow themselves down, and in the end switch off, to protect the parts.","Look at the fans in Sensors, then at the room: blocked vents, a missing blanking panel or drive filler, a failed fan, or warm intake air. If one part runs hot while its neighbours do not, check its heatsink."],"thermalTrip":["A part got hot enough that the server cut its own power to protect it.","Do not just power it back on. Check that every fan turns and that the processor heatsink is seated and has thermal paste, then start it and watch the temperatures."],"fanSlow":["A fan is turning slower than its limit, or has stopped. The other fans usually speed up to cover for it.","Find the fan by its name on the board or in the manual. Look for a cable in the blades or a loose connector, then replace the fan. A limit set too high for a slow, quiet fan gives the same event; that is fixed in the BMC's fan settings."],"voltageOut":["A supply voltage on the board went outside its allowed range.","If it happens once during power on or off, it is usually harmless. If it repeats while running, suspect the power supply first: swap it or move the server to its other supply, then look at the board."],"powerSupplyFailed":["A power supply reported a fault or is predicted to fail.","With a second supply the server keeps running. Reseat the faulty supply, then replace it. Check its fan and the status light on its back."],"powerInputLost":["A power supply is fitted but is getting no power, or power that is out of range.","Check that supply's cord at both ends, then the outlet, the PDU breaker and the feed behind it. Two supplies losing input at once points at the feed, not at the supplies."],"redundancyLost":["The server has lost its spare: one more failure of the same kind (a power supply, a fan) would take it down.","Look just above or below in the log for the event that names the failed part, and deal with that part."],"memoryCorrected":["The server found a memory error and corrected it. Nothing was lost. One now and then is normal; a steady stream from the same module means that module is wearing out.","See which module is named, here or in the operating system's log. If the same one keeps coming back, reseat it, and replace it if that does not stop the errors."],"memoryFailed":["A memory error could not be corrected, or a module was switched off or set up wrongly. This usually crashes or restarts the server.","Find the module that is named and replace it. If no module is named, test them one at a time or run the maker's memory test."],"processorFault":["A processor reported an internal error or did not start properly. The cause is often something else the processor depends on: memory, power, a card, or heat.","Read the events just before this one. If it repeats, reseat the processor and memory, update the BIOS, and take out recently added cards to narrow it down."],"busError":["A device on the board's internal bus (often a PCI card or its slot) reported an error.","Note the slot if one is named. Reseat that card, try it in another slot, and update its firmware and driver."],"driveFault":["A drive reported a fault.","Check the array's state before pulling anything. Identify the drive by its bay light, confirm the serial number, then replace it and watch the rebuild."],"drivePredicted":["A drive is predicted to fail. It still works for now.","Make sure the data is backed up or the array is healthy, then replace the drive at a quiet time."],"arrayDegraded":["A drive array is running without its full protection, or a rebuild stopped.","Open the RAID controller's own page or tool to see which drive is out. Do not remove any other drive from that array until it has rebuilt."],"intrusion":["The chassis cover was opened, or the intrusion switch thinks so.","If nobody was working on the server, find out who was. If the cover is on, check the switch and its cable; the alert is cleared in the BIOS or BMC."],"watchdog":["The watchdog timer ran out: the operating system or the BIOS stopped checking in, so the BMC took the action it was set to take (often a reset).","Look for an operating system crash or hang at that time. If the server was simply busy or starting slowly, lengthen the watchdog time or turn it off in the BIOS."],"startupError":["The server hit an error, or hung, while starting up, before the operating system.","Watch the screen during start-up on the console for the message or code. Common causes are memory, a card, or changed BIOS settings."],"bootMedia":["The server started but found nothing it could boot from.","Check the boot order in the BIOS, that the boot drive is detected, and for network boot that the cable and the boot server are up."],"osCrash":["The operating system stopped with a fatal error (a crash, a panic or a blue screen).","The cause is in the operating system's own crash log or on the console screen. Check the hardware events just before this one as well."],"battery":["A battery is low or has failed: usually the coin cell that keeps the clock and BIOS settings, sometimes a RAID controller's battery.","Replace the battery named by the sensor. After changing the coin cell, set the clock and check the BIOS settings."],"logFull":["The event log is full or nearly full. When full, most BMCs stop recording new events.","Save what you need from the log, then clear it."],"bmcHealth":["The BMC itself could not read a sensor or reach one of its own parts. Readings from it may be missing or stale.","If it keeps happening, restart the BMC (a cold reset; the server keeps running), then update the BMC firmware."],"passwordFailed":["Someone entered a wrong password, at the server or over the network.","One or two is a typing mistake. Many in a row is someone guessing: check who can reach this BMC and change the password."],"vendorRecord":["This entry is in the board maker's own format, which the IPMI standard does not describe, so it cannot be put into words here.","The BMC's own web page usually shows it decoded. The numbers under this text are what the maker's support will ask for."]};
function has(text, words) { return words.some(function (w) { return text.indexOf(w) !== -1; }); }
function within(n, list) { return list.indexOf(n) !== -1; }
function hex2(n) { return (n < 16 ? "0" : "") + n.toString(16).toUpperCase(); }
function hexLower(bytes) { return bytes.map(function (b) { return (b < 16 ? "0" : "") + b.toString(16); }).join(""); }

function sensorName(type) {
  if (SENSOR_NAMES[type]) return SENSOR_NAMES[type];
  return type >= 0xC0 ? "Vendor-specific" : "Other";
}

var ALL_NAMES = (function () {
  var out = [];
  for (var t = 1; t <= 0x2C; t++) { var n = sensorName(t); if (n !== "Other") out.push(n); }
  return out.sort(function (a, b) { return b.length - a.length; });
})();

function sensorSpecificTopic(s, o) {
  if (s === 0x05 && o === 0) return "intrusion";
  if (s === 0x06 && o >= 1 && o <= 5) return "passwordFailed";
  if (s === 0x07) {
    if (o === 1) return "thermalTrip";
    if (o === 0x0A) return "temperatureHigh";
    if (o === 0 || (o >= 2 && o <= 6) || o === 0x0B) return "processorFault";
    return null;
  }
  if (s === 0x08) {
    if (o === 1 || o === 2 || o === 6) return "powerSupplyFailed";
    if (o >= 3 && o <= 5) return "powerInputLost";
    return null;
  }
  if (s === 0x09) {
    if (o === 4) return "powerInputLost";
    if (o >= 5 && o <= 7) return "powerSupplyFailed";
    return null;
  }
  if (s === 0x0C) {
    if (o === 0 || o === 5) return "memoryCorrected";
    if ((o >= 1 && o <= 4) || o === 7) return "memoryFailed";
    if (o === 0x0A) return "temperatureHigh";
    return null;
  }
  if (s === 0x0D) {
    if (o === 1) return "driveFault";
    if (o === 2) return "drivePredicted";
    if (o === 5 || o === 6 || o === 8) return "arrayDegraded";
    return null;
  }
  if (s === 0x0F && (o === 0 || o === 1)) return "startupError";
  if (s === 0x10) {
    if (o === 0) return "memoryCorrected";
    if (o === 4 || o === 5) return "logFull";
    return null;
  }
  if (s === 0x11 && o <= 3) return "watchdog";
  if (s === 0x23 && (o <= 3 || o === 8)) return "watchdog";
  if (s === 0x13 && (o === 1 || o === 4 || o === 5 || (o >= 7 && o <= 0x0B))) return "busError";
  if (s === 0x1E && o <= 4) return "bootMedia";
  if (s === 0x20 && (o === 0 || o === 1)) return "osCrash";
  if (s === 0x28 && o <= 5) return "bmcHealth";
  if (s === 0x29 && (o === 0 || o === 1)) return "battery";
  return null;
}

function ipmiTopic(sensorType, eventType, offset, isDeassertion) {
  if (isDeassertion) return null;
  switch (eventType) {
    case 0x01:
      var upper = offset >= 0x7 && offset % 2 === 1, lower = offset <= 0x4 && offset % 2 === 0;
      if (sensorType === 0x01) return upper ? "temperatureHigh" : null;
      if (sensorType === 0x02) return upper || lower ? "voltageOut" : null;
      if (sensorType === 0x04) return lower ? "fanSlow" : null;
      return null;
    case 0x0B: return within(offset, [1, 2, 3, 5, 6, 7]) ? "redundancyLost" : null;
    case 0x04:
      if (offset !== 1) return null;
      return sensorType === 0x0D ? "drivePredicted" : sensorType === 0x08 ? "powerSupplyFailed" : null;
    case 0x07:
      if (!within(offset, [1, 2, 3, 6])) return null;
      if (sensorType === 0x01) return "temperatureHigh";
      if (sensorType === 0x02) return "voltageOut";
      if (sensorType === 0x04) return "fanSlow";
      if (sensorType === 0x08) return "powerSupplyFailed";
      return null;
    case 0x6F: return sensorSpecificTopic(sensorType, offset);
    default: return null;
  }
}

function textTopic(message, category, severity) {
  if (severity === "info") return null;
  var t = (message + " " + (category || "")).toLowerCase();
  if (has(t, ["redundan"])) return "redundancyLost";
  if (has(t, ["uncorrectable", "multi-bit", "multibit"]) && has(t, ["memory", "dimm", "ecc"])) return "memoryFailed";
  if (has(t, ["correctable", "single-bit"]) && has(t, ["memory", "dimm", "ecc"])) return "memoryCorrected";
  if (has(t, ["thermal trip", "thermtrip"])) return "thermalTrip";
  if (has(t, ["ierr", "machine check", "frb"])) return "processorFault";
  if (has(t, ["ac lost", "ac loss"])) return "powerInputLost";
  if (has(t, ["fan"])) return "fanSlow";
  if (has(t, ["temperature", "overheat", "thermal", "over temp"])) return "temperatureHigh";
  if (has(t, ["power supply", "psu"])) return has(t, ["input", "ac lost", "ac loss", "power cord"]) ? "powerInputLost" : "powerSupplyFailed";
  if (has(t, ["voltage"])) return "voltageOut";
  if (has(t, ["intrusion"])) return "intrusion";
  if (has(t, ["watchdog"])) return "watchdog";
  if (has(t, ["predict"]) && has(t, ["drive", "disk"])) return "drivePredicted";
  if (has(t, ["drive", "disk"]) && has(t, ["fault", "fail"])) return "driveFault";
  if (has(t, ["battery"])) return "battery";
  if (has(t, ["sel full", "log full", "log almost full"])) return "logFull";
  if (has(t, ["no bootable media"])) return "bootMedia";
  return null;
}

function adviceFor(topic) { return topic ? { topic: topic, means: ADVICE[topic][0], tryThis: ADVICE[topic][1] } : null; }

/* 16 bytes of hexadecimal, however they are spaced. */
function recordFromHex(line) {
  var tokens = line.replace(/,/g, " ").split(" ").filter(function (t) { return t.length > 0; });
  tokens = tokens.map(function (t) { return t.toLowerCase().indexOf("0x") === 0 ? t.slice(2) : t; });
  tokens = tokens.map(function (t) { return t.length === 3 && t.charAt(2) === "h" ? t.slice(0, 2) : t; });
  if (!tokens.length || !tokens.every(function (t) { return /^[0-9a-fA-F]+$/.test(t); })) return null;
  var digits = tokens.join("");
  if (digits.length !== 32) return null;
  var bytes = [];
  for (var i = 0; i < 32; i += 2) bytes.push(parseInt(digits.substr(i, 2), 16));
  return bytes;
}

function decodeRecord(raw) {
  var recordType = raw[2];
  var stamp = recordType < 0xE0 ? (raw[3] + raw[4] * 256 + raw[5] * 65536 + raw[6] * 16777216) : null;
  /* Below 0x20000000 the value is seconds since the BMC started, not a date. */
  var date = stamp !== null && stamp >= 0x20000000 && stamp !== 0xFFFFFFFF ? stamp : null;
  if (recordType !== 0x02) {
    return { kind: "record", bytes: raw, timestamp: date, severity: "info", message: "Vendor-specific record",
      detail: "Record type 0x" + hex2(recordType) + ", data " + hexLower(raw.slice(3)),
      category: "Vendor-specific", advice: adviceFor("vendorRecord"), vendor: true };
  }
  var sensorType = raw[10], sensorNumber = raw[11], deassert = (raw[12] & 0x80) !== 0, eventType = raw[12] & 0x7F;
  var data = raw.slice(13, 16), offset = data[0] & 0x0F, category = sensorName(sensorType);
  var subject = category + " sensor", message, severity, meaning;
  if (eventType === 0x01 && THRESHOLD[offset]) {
    meaning = THRESHOLD[offset];
    if (deassert) { message = subject + " is no longer " + meaning[1]; severity = "info"; }
    else { message = subject + " " + meaning[0]; severity = meaning[2]; }
  } else {
    if (eventType === 0x6F) meaning = SPECIFIC[sensorType] ? SPECIFIC[sensorType][offset] : null;
    else meaning = GENERIC[eventType] ? GENERIC[eventType][offset] : null;
    if (meaning) {
      message = deassert ? "Cleared: " + meaning[0] : meaning[0];
      severity = deassert ? "info" : meaning[1];
    } else { message = category + " event"; severity = "info"; }
  }
  var detail = category + " sensor 0x" + hex2(sensorNumber) + ", event type 0x" + hex2(eventType) + ", offset " + offset +
    ", " + (deassert ? "deasserted" : "asserted") + ", data " + hexLower(data);
  if (date === null && stamp !== null && stamp !== 0xFFFFFFFF) detail += ". Logged " + stamp + " s after the BMC started, before its clock was set";
  return { kind: "record", bytes: raw, timestamp: date, severity: severity, message: message, detail: detail,
    category: category, advice: adviceFor(ipmiTopic(sensorType, eventType, offset, deassert)), vendor: false };
}

function described(message, category, cleared, date, detail, kind) {
  var topic = cleared ? null : textTopic(message, category, "warning");
  var severe = topic !== null && has(message.toLowerCase(), ["critical", "non-recoverable", "fail", "lost", "uncorrectable", "ierr"]);
  return { kind: kind, timestamp: date, severity: topic === null ? "info" : severe ? "critical" : "warning",
    message: message, detail: detail, category: category, advice: adviceFor(topic) };
}

function parseListDate(d, t) {
  var a = /^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):(\d{2})$/.exec(d + " " + t);
  if (!a) return null;
  var v = new Date(+a[3], +a[1] - 1, +a[2], +a[4], +a[5], +a[6]);
  if (v.getMonth() !== +a[1] - 1 || v.getDate() !== +a[2] || v.getHours() !== +a[4] || v.getMinutes() !== +a[5]) return null;
  return Math.floor(v.getTime() / 1000);
}

function listEntry(f) {
  var sensor = f[3], event = f[4], lower = sensor.toLowerCase();
  var cleared = f.slice(5).some(function (x) { return x.toLowerCase().indexOf("deassert") === 0; });
  var category = "Event";
  for (var i = 0; i < ALL_NAMES.length; i++) if (lower.indexOf(ALL_NAMES[i].toLowerCase()) === 0) { category = ALL_NAMES[i]; break; }
  return described((cleared ? "Cleared: " : "") + sensor + ": " + event, category, cleared, parseListDate(f[1], f[2]), "ipmitool record " + f[0], "list");
}

var TRIM = /^[ \t   -   　]+|[ \t   -   　]+$/g;
function trimLine(s) { return s.replace(TRIM, ""); }

function entryFromLine(raw) {
  var line = trimLine(raw);
  if (!line) return null;
  var bytes = recordFromHex(line);
  if (bytes) return decodeRecord(bytes);
  var fields = line.split("|").map(trimLine);
  if (fields.length >= 5) return listEntry(fields);
  return described(line, "Pasted line", false, null, null, "line");
}

function str(v) { if (typeof v !== "string") return null; var t = v.trim(); return t ? t : null; }

function redfishDate(text) {
  if (!text) return null;
  var re = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/;
  var m = re.exec(text);
  if (!m) return null;
  var ms = Date.parse(m[1] + "-" + m[2] + "-" + m[3] + "T" + m[4] + ":" + m[5] + ":" + m[6] + (m[8] || "Z"));
  return isNaN(ms) ? null : Math.floor(ms / 1000);
}

function redfishEntry(m) {
  var o = m && typeof m === "object" && !Array.isArray(m) ? m : {};
  var severity = o.Severity === "Critical" ? "critical" : o.Severity === "Warning" ? "warning" : "info";
  var message = str(o.Message) || str(o.Name) || str(o.MessageId) || "Event";
  var detail = [];
  if (str(o.MessageId)) detail.push(str(o.MessageId));
  if (str(o.EntryCode)) detail.push(str(o.EntryCode));
  if (str(o.EntryType)) detail.push(str(o.EntryType) + " entry " + (str(o.Id) || ""));
  var category = str(o.SensorType) || str(o.EntryType) || "Event";
  return { kind: "redfish", timestamp: redfishDate(str(o.Created) || str(o.EventTimestamp)), severity: severity, message: message,
    detail: detail.length ? detail.join(", ") : null, category: category, advice: adviceFor(textTopic(message, category, severity)) };
}

function translate(text) {
  var trimmed = String(text).replace(/^\s+|\s+$/g, "");
  if (!trimmed) return [];
  if (trimmed.charAt(0) === "{" || trimmed.charAt(0) === "[") {
    var json, ok = true;
    try { json = JSON.parse(trimmed); } catch (e) { ok = false; }
    if (ok) {
      var isObj = json && typeof json === "object" && !Array.isArray(json);
      var members;
      if (isObj && Object.prototype.hasOwnProperty.call(json, "Members")) members = Array.isArray(json.Members) ? json.Members : [];
      else members = Array.isArray(json) && json.length ? json : [json];
      if (members.length) return members.map(redfishEntry);
    }
  }
  var out = [];
  trimmed.split(/\r\n|[\n\r\v\f\u0085\u2028\u2029]/).forEach(function (l) { var e = entryFromLine(l); if (e) out.push(e); });
  return out;
}

root.ColdAisleDecoder = { translate: translate, decodeRecord: decodeRecord, recordFromHex: recordFromHex, textTopic: textTopic, ipmiTopic: ipmiTopic, advice: ADVICE };

})(typeof window !== "undefined" ? window : this);
