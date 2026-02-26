/**
 * Microsoft Graph API integration for Teams meetings and Outlook calendar.
 *
 * Requires env vars:
 *   MICROSOFT_GRAPH_CLIENT_ID
 *   MICROSOFT_GRAPH_CLIENT_SECRET
 *   MICROSOFT_GRAPH_TENANT_ID
 *   MICROSOFT_GRAPH_REFRESH_TOKEN
 *
 * Uses OAuth2 client_credentials or refresh_token flow to obtain access tokens.
 * All functions are server-side only.
 */

const GRAPH_BASE = "https://graph.microsoft.com/v1.0";
const TOKEN_URL = "https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token";

interface GraphConfig {
  clientId: string;
  clientSecret: string;
  tenantId: string;
  refreshToken: string;
}

function getConfig(): GraphConfig {
  const clientId = process.env.MICROSOFT_GRAPH_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_GRAPH_CLIENT_SECRET;
  const tenantId = process.env.MICROSOFT_GRAPH_TENANT_ID;
  const refreshToken = process.env.MICROSOFT_GRAPH_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !tenantId || !refreshToken) {
    throw new Error(
      "Microsoft Graph integration requires MICROSOFT_GRAPH_CLIENT_ID, MICROSOFT_GRAPH_CLIENT_SECRET, MICROSOFT_GRAPH_TENANT_ID, and MICROSOFT_GRAPH_REFRESH_TOKEN environment variables."
    );
  }

  return { clientId, clientSecret, tenantId, refreshToken };
}

// ---------- Token Management ----------

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  // Return cached token if still valid (with 5 min buffer)
  if (cachedToken && cachedToken.expiresAt > Date.now() + 300_000) {
    return cachedToken.token;
  }

  const config = getConfig();
  const tokenUrl = TOKEN_URL.replace("{tenant}", config.tenantId);

  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    refresh_token: config.refreshToken,
    grant_type: "refresh_token",
    scope: "https://graph.microsoft.com/.default offline_access",
  });

  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to obtain Microsoft Graph token: ${res.status} ${text}`);
  }

  const data = await res.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
  };

  return cachedToken.token;
}

async function graphFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = await getAccessToken();
  return fetch(`${GRAPH_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
}

// ---------- Teams Meetings ----------

export interface TeamsMeeting {
  id: string;
  joinUrl: string;
  subject: string;
  startDateTime: string;
  endDateTime: string;
}

/**
 * Create an online Teams meeting.
 */
export async function createTeamsMeeting(params: {
  subject: string;
  startDateTime: string; // ISO 8601
  endDateTime: string; // ISO 8601
  attendeeEmail?: string;
}): Promise<TeamsMeeting> {
  const res = await graphFetch("/me/onlineMeetings", {
    method: "POST",
    body: JSON.stringify({
      subject: params.subject,
      startDateTime: params.startDateTime,
      endDateTime: params.endDateTime,
      lobbyBypassSettings: {
        scope: "everyone",
        isDialInBypassEnabled: true,
      },
      participants: params.attendeeEmail
        ? {
            attendees: [
              {
                upn: params.attendeeEmail,
                role: "attendee",
              },
            ],
          }
        : undefined,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to create Teams meeting: ${res.status} ${text}`);
  }

  const data = await res.json();
  return {
    id: data.id,
    joinUrl: data.joinUrl || data.joinWebUrl,
    subject: data.subject,
    startDateTime: data.startDateTime,
    endDateTime: data.endDateTime,
  };
}

// ---------- Calendar Events ----------

export interface CalendarEvent {
  id: string;
  subject: string;
  start: string;
  end: string;
  meetingUrl?: string;
  attendees: string[];
}

/**
 * Create a calendar event (optionally with a Teams meeting link).
 */
export async function createCalendarEvent(params: {
  subject: string;
  body?: string;
  startDateTime: string; // ISO 8601
  endDateTime: string; // ISO 8601
  timeZone?: string;
  attendeeEmail?: string;
  isOnlineMeeting?: boolean;
}): Promise<CalendarEvent> {
  const tz = params.timeZone ?? "Africa/Johannesburg";

  const res = await graphFetch("/me/events", {
    method: "POST",
    body: JSON.stringify({
      subject: params.subject,
      body: params.body
        ? { contentType: "text", content: params.body }
        : undefined,
      start: { dateTime: params.startDateTime, timeZone: tz },
      end: { dateTime: params.endDateTime, timeZone: tz },
      isOnlineMeeting: params.isOnlineMeeting ?? false,
      onlineMeetingProvider: params.isOnlineMeeting ? "teamsForBusiness" : undefined,
      attendees: params.attendeeEmail
        ? [
            {
              emailAddress: { address: params.attendeeEmail },
              type: "required",
            },
          ]
        : [],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to create calendar event: ${res.status} ${text}`);
  }

  const data = await res.json();
  return {
    id: data.id,
    subject: data.subject,
    start: data.start?.dateTime,
    end: data.end?.dateTime,
    meetingUrl: data.onlineMeeting?.joinUrl,
    attendees: (data.attendees ?? []).map(
      (a: { emailAddress: { address: string } }) => a.emailAddress.address
    ),
  };
}

/**
 * Update an existing calendar event.
 */
export async function updateCalendarEvent(
  eventId: string,
  params: {
    subject?: string;
    startDateTime?: string;
    endDateTime?: string;
    timeZone?: string;
    body?: string;
  }
): Promise<void> {
  const tz = params.timeZone ?? "Africa/Johannesburg";
  const payload: Record<string, unknown> = {};

  if (params.subject) payload.subject = params.subject;
  if (params.body) payload.body = { contentType: "text", content: params.body };
  if (params.startDateTime) payload.start = { dateTime: params.startDateTime, timeZone: tz };
  if (params.endDateTime) payload.end = { dateTime: params.endDateTime, timeZone: tz };

  const res = await graphFetch(`/me/events/${eventId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to update calendar event: ${res.status} ${text}`);
  }
}

/**
 * Delete a calendar event.
 */
export async function deleteCalendarEvent(eventId: string): Promise<void> {
  const res = await graphFetch(`/me/events/${eventId}`, {
    method: "DELETE",
  });

  if (!res.ok && res.status !== 404) {
    const text = await res.text();
    throw new Error(`Failed to delete calendar event: ${res.status} ${text}`);
  }
}

/**
 * Check if Microsoft Graph integration is properly configured.
 */
export function isGraphConfigured(): boolean {
  return !!(
    process.env.MICROSOFT_GRAPH_CLIENT_ID &&
    process.env.MICROSOFT_GRAPH_CLIENT_SECRET &&
    process.env.MICROSOFT_GRAPH_TENANT_ID &&
    process.env.MICROSOFT_GRAPH_REFRESH_TOKEN
  );
}
