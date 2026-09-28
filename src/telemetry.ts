export type TelemetryEventName =
  | "candidate_session_started"
  | "resume_upload_started"
  | "resume_upload_failed"
  | "resume_normalized"
  | "resume_clarification_resolved";

export interface Telemetry {
  track(
    event: TelemetryEventName,
    properties: Record<string, string | number | boolean | undefined>,
  ): void;
}

const allowedPropertyKeys = new Set([
  "organizationId",
  "sessionId",
  "category",
  "status",
  "clarificationKind",
]);

export class ConsolePrivacySafeTelemetry implements Telemetry {
  track(
    event: TelemetryEventName,
    properties: Record<string, string | number | boolean | undefined>,
  ): void {
    const safeProperties = Object.fromEntries(
      Object.entries(properties).filter(
        ([key, value]) => allowedPropertyKeys.has(key) && value !== undefined,
      ),
    );

    console.info(
      JSON.stringify({
        event,
        ...safeProperties,
      }),
    );
  }
}

export class RecordingTelemetry implements Telemetry {
  readonly events: Array<{
    event: TelemetryEventName;
    properties: Record<string, string | number | boolean | undefined>;
  }> = [];

  track(
    event: TelemetryEventName,
    properties: Record<string, string | number | boolean | undefined>,
  ): void {
    this.events.push({ event, properties: { ...properties } });
  }
}
