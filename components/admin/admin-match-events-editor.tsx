"use client";

import { Pencil, RefreshCw, Save, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { MatchTimelineList } from "@/components/matches/match-timeline-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import type { MatchEventItem, Player } from "@/lib/types";

const eventTypeOptions = ["GOAL", "RED_CARD", "YELLOW_CARD", "ASSIST", "SUBSTITUTION", "UNKNOWN"] as const;

function getStoredAdminToken() {
  if (typeof window === "undefined") {
    return "";
  }

  return window.sessionStorage.getItem("admin-sync-token") ?? "";
}

export function AdminMatchEventsEditor({
  matchId,
  initialEvents,
  players,
}: {
  matchId: string;
  initialEvents: MatchEventItem[];
  players: Player[];
}) {
  const [events, setEvents] = useState(initialEvents);
  const [message, setMessage] = useState("Listo para editar eventos y recalcular fantasy.");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [draft, setDraft] = useState({
    minute: "",
    eventType: "GOAL",
    playerId: "",
    playerName: "",
    teamName: "",
  });
  const playersById = useMemo(() => new Map(players.map((player) => [player.id, player])), [players]);

  async function refreshEvents() {
    const token = getStoredAdminToken();
    const response = await fetch(`/api/admin/matches/${matchId}/events`, {
      headers: { authorization: `Bearer ${token}` },
    });
    const data = (await response.json()) as { events?: MatchEventItem[] };
    if (response.ok && data.events) {
      setEvents(data.events);
    }
  }

  async function createEvent() {
    const token = getStoredAdminToken();
    setStatus("loading");

    const player = draft.playerId ? playersById.get(draft.playerId) : undefined;
    const manualPlayerName = draft.playerName.trim() || undefined;
    const manualTeamName = draft.teamName.trim() || undefined;
    const response = await fetch(`/api/admin/matches/${matchId}/events`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        minute: draft.minute ? Number(draft.minute) : undefined,
        eventType: draft.eventType,
        playerId: draft.playerId || undefined,
        playerName: player?.name ?? manualPlayerName,
        teamId: player?.teamId ?? undefined,
        teamName: player?.country ?? manualTeamName,
      }),
    });
    const data = (await response.json()) as { message?: string };

    setStatus(response.ok ? "success" : "error");
    setMessage(data.message ?? "Sin respuesta.");
    if (response.ok) {
      setDraft({ minute: "", eventType: "GOAL", playerId: "", playerName: "", teamName: "" });
      await refreshEvents();
    }
  }

  async function updateEvent(event: MatchEventItem) {
    const token = getStoredAdminToken();
    const response = await fetch(`/api/admin/matches/${matchId}/events/${event.id}`, {
      method: "PATCH",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        minute: event.minute ?? null,
        eventType: event.eventType,
        playerId: event.playerId ?? null,
        playerName: event.playerName ?? null,
        teamId: event.teamId ?? null,
        teamName: event.teamName ?? null,
      }),
    });
    const data = (await response.json()) as { message?: string };
    setStatus(response.ok ? "success" : "error");
    setMessage(data.message ?? "Sin respuesta.");
    if (response.ok) {
      await refreshEvents();
    }
  }

  async function deleteEvent(eventId: string) {
    const token = getStoredAdminToken();
    const response = await fetch(`/api/admin/matches/${matchId}/events/${eventId}`, {
      method: "DELETE",
      headers: { authorization: `Bearer ${token}` },
    });
    const data = (await response.json()) as { message?: string };
    setStatus(response.ok ? "success" : "error");
    setMessage(data.message ?? "Sin respuesta.");
    if (response.ok) {
      await refreshEvents();
    }
  }

  async function recalculateFantasy() {
    const token = getStoredAdminToken();
    const response = await fetch(`/api/admin/matches/${matchId}/events/recalculate`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}` },
    });
    const data = (await response.json()) as { message?: string };
    setStatus(response.ok ? "success" : "error");
    setMessage(data.message ?? "Sin respuesta.");
  }

  return (
    <div className="space-y-6">
      <GlassCard>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black">Crear evento manual</h2>
            <p className="mt-2 text-sm text-white/60">{message}</p>
          </div>
          <Badge tone={status === "success" ? "green" : status === "error" ? "red" : "gold"}>{status}</Badge>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-5">
          <Input
            placeholder="Minuto"
            value={draft.minute}
            onChange={(event) => setDraft((current) => ({ ...current, minute: event.target.value }))}
          />
          <Select
            value={draft.eventType}
            onChange={(event) => setDraft((current) => ({ ...current, eventType: event.target.value }))}
          >
            {eventTypeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
          <Select
            value={draft.playerId}
            onChange={(event) =>
              setDraft((current) => {
                const player = playersById.get(event.target.value);

                return {
                  ...current,
                  playerId: event.target.value,
                  playerName: player?.name ?? current.playerName,
                  teamName: player?.country ?? current.teamName,
                };
              })
            }
          >
            <option value="">Jugador no vinculado</option>
            {players.map((player) => (
              <option key={player.id} value={player.id}>
                {player.name}
              </option>
            ))}
          </Select>
          <Input
            placeholder="Jugador"
            value={draft.playerName}
            onChange={(event) => setDraft((current) => ({ ...current, playerName: event.target.value, playerId: "" }))}
          />
          <Input
            placeholder="Equipo"
            value={draft.teamName}
            onChange={(event) => setDraft((current) => ({ ...current, teamName: event.target.value }))}
          />
          <Button onClick={createEvent}>
            <Save className="mr-2 size-4" />
            Guardar evento
          </Button>
        </div>
      </GlassCard>

      <GlassCard>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-black">Eventos sincronizados</h2>
          <Button variant="secondary" onClick={recalculateFantasy}>
            <RefreshCw className="mr-2 size-4" />
            Recalcular fantasy
          </Button>
        </div>
        <div className="mt-4 space-y-3">
          {events.map((event) => (
            <div key={event.id} className="rounded-[12px] border border-white/10 bg-white/[0.04] p-3">
              <div className="grid gap-3 md:grid-cols-[100px_180px_minmax(0,1fr)_minmax(0,1fr)_auto] md:items-center">
                <Input
                  value={event.minute ?? ""}
                  onChange={(inputEvent) =>
                    setEvents((current) =>
                      current.map((item) =>
                        item.id === event.id ? { ...item, minute: inputEvent.target.value ? Number(inputEvent.target.value) : undefined } : item,
                      ),
                    )
                  }
                />
                <Select
                  value={event.eventType}
                  onChange={(selectEvent) =>
                    setEvents((current) =>
                      current.map((item) =>
                        item.id === event.id ? { ...item, eventType: selectEvent.target.value as MatchEventItem["eventType"] } : item,
                      ),
                    )
                  }
                >
                  {eventTypeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </Select>
                <Select
                  value={event.playerId ?? ""}
                  onChange={(selectEvent) =>
                    setEvents((current) =>
                      current.map((item) => {
                        if (item.id !== event.id) {
                          return item;
                        }

                        const player = playersById.get(selectEvent.target.value);

                        return {
                          ...item,
                          playerId: player?.id,
                          playerName: player?.name ?? item.playerName,
                          teamId: player?.teamId ?? item.teamId,
                          teamName: player?.country ?? item.teamName,
                        };
                      }),
                    )
                  }
                >
                  <option value="">Sin vincular</option>
                  {players.map((player) => (
                    <option key={player.id} value={player.id}>
                      {player.name}
                    </option>
                  ))}
                </Select>
                <div className="grid gap-3 md:grid-cols-2">
                  <Input
                    value={event.playerName ?? ""}
                    onChange={(inputEvent) =>
                      setEvents((current) =>
                        current.map((item) =>
                          item.id === event.id ? { ...item, playerName: inputEvent.target.value || undefined } : item,
                        ),
                      )
                    }
                    placeholder="Jugador"
                  />
                  <Input
                    value={event.teamName ?? ""}
                    onChange={(inputEvent) =>
                      setEvents((current) =>
                        current.map((item) =>
                          item.id === event.id ? { ...item, teamName: inputEvent.target.value || undefined } : item,
                        ),
                      )
                    }
                    placeholder="Equipo"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="secondary" onClick={() => updateEvent(event)}>
                    <Pencil className="mr-2 size-4" />
                    Guardar
                  </Button>
                  <Button variant="danger" onClick={() => deleteEvent(event.id)}>
                    <Trash2 className="mr-2 size-4" />
                    Eliminar
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard>
        <h2 className="text-2xl font-black">Vista timeline</h2>
        <div className="mt-4">
          <MatchTimelineList events={events} />
        </div>
      </GlassCard>
    </div>
  );
}
