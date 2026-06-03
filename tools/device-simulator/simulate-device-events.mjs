import fs from "node:fs/promises";
import path from "node:path";

async function postDeviceEvent(apiUrl, deviceToken, payload) {
  const response = await fetch(`${apiUrl}/time-events/device`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-device-token": deviceToken,
    },
    body: JSON.stringify(payload),
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      `HTTP ${response.status} dla ${payload.action} ${payload.rfidCardId}: ${JSON.stringify(body)}`,
    );
  }

  return body;
}

async function main() {
  const configPath =
    process.argv[2] ||
    path.join(
      process.cwd(),
      "tools/device-simulator/device-events.example.json",
    );

  const rawConfig = await fs.readFile(configPath, "utf-8");
  const config = JSON.parse(rawConfig);

  if (!config.apiUrl) {
    throw new Error("Brak apiUrl w konfiguracji.");
  }

  if (!config.deviceToken) {
    throw new Error("Brak deviceToken w konfiguracji.");
  }

  if (!Array.isArray(config.events) || config.events.length === 0) {
    throw new Error("Brak zdarzeń w konfiguracji.");
  }

  console.log("Symulator urządzeń WorkFlow");
  console.log(`API: ${config.apiUrl}`);
  console.log(`Liczba scenariuszy: ${config.events.length}`);

  for (const event of config.events) {
    console.log("");
    console.log(
      `${event.rfidCardId} @ ${event.readerSerialNumber}: IN ${event.in}`,
    );

    const inResult = await postDeviceEvent(config.apiUrl, config.deviceToken, {
      readerSerialNumber: event.readerSerialNumber,
      rfidCardId: event.rfidCardId,
      action: "IN",
      eventTime: event.in,
    });

    console.log(`IN OK: ${inResult.data.timeEvent.id}`);

    console.log(
      `${event.rfidCardId} @ ${event.readerSerialNumber}: OUT ${event.out}`,
    );

    const outResult = await postDeviceEvent(config.apiUrl, config.deviceToken, {
      readerSerialNumber: event.readerSerialNumber,
      rfidCardId: event.rfidCardId,
      action: "OUT",
      eventTime: event.out,
    });

    console.log(`OUT OK: ${outResult.data.timeEvent.id}`);

    if (outResult.data.timeEntry) {
      console.log(
        `TimeEntry OK: ${outResult.data.timeEntry.id}, ${outResult.data.timeEntry.calculatedHours}h, ${outResult.data.timeEntry.status}`,
      );
    } else {
      console.log("TimeEntry nie został utworzony.");
    }
  }

  console.log("");
  console.log("Symulacja zakończona.");
}

main().catch((error) => {
  console.error(
    "Błąd symulatora:",
    error instanceof Error ? error.message : error,
  );
  process.exit(1);
});
