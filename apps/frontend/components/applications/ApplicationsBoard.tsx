"use client";

/**
 * Application tracker: a board with one column per stage. Drag a card (or focus it, press
 * Space and use the arrow keys) to move it to another stage; click it to edit or delete it.
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type KeyboardCoordinateGetter,
} from "@dnd-kit/core";
import { CalendarDays, MapPin, Plus, SquareKanban } from "lucide-react";
import { toast } from "sonner";
import { AppPage, EmptyState, panel } from "@/components/app/AppPage";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import { useSignedIn } from "@/hooks/useSignedIn";
import { ApiError, signInHref } from "@/lib/api";
import { createApplication, deleteApplication, listApplications, STAGE_LABELS, STAGES, updateApplication, type Application, type ApplicationInput, type Stage } from "@/lib/career";
import { cn } from "@/lib/utils";
import { ApplicationDialog } from "./ApplicationDialog";

const HERE = "/dashboard/applications";

const STAGE_COLOR: Record<Stage, string> = {
  SAVED: "#a1a1aa",
  APPLIED: "#4d7cff",
  INTERVIEWING: "#fbbf24",
  OFFER: "#34d399",
  REJECTED: "#f87171",
};

/** Left and right arrows jump a picked-up card to the neighbouring column. */
const columnJump: KeyboardCoordinateGetter = (event, { currentCoordinates, context: { collisionRect, droppableRects } }) => {
  const step = event.code === "ArrowRight" ? 1 : event.code === "ArrowLeft" ? -1 : 0;
  if (!step || !collisionRect) return undefined;
  event.preventDefault();
  const centre = collisionRect.left + collisionRect.width / 2;
  const columns = STAGES.map((s) => droppableRects.get(s)).filter((r) => !!r);
  const current = columns.findIndex((r) => centre >= r.left && centre <= r.left + r.width);
  const target = columns[current + step];
  return target ? { x: target.left + (target.width - collisionRect.width) / 2, y: currentCoordinates.y } : currentCoordinates;
};

export function ApplicationsBoard() {
  const router = useRouter();
  const signedIn = useSignedIn();
  const [apps, setApps] = useState<Application[] | null>(null);
  const [dragging, setDragging] = useState<Application | null>(null);
  const [dialog, setDialog] = useState<{ open: boolean; app: Application | null; stage: Stage }>({ open: false, app: null, stage: "SAVED" });
  // Pointer drags start after 6px so a click still opens the card; on the keyboard Space
  // picks a card up and Enter is left to open it.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { keyboardCodes: { start: ["Space"], cancel: ["Escape"], end: ["Space", "Enter"] }, coordinateGetter: columnJump }),
  );

  const fail = useCallback(
    (err: unknown, fallback: string) => {
      if (err instanceof ApiError && err.kind === "auth") router.replace(signInHref(HERE));
      else toast.error(err instanceof ApiError ? err.message : fallback);
    },
    [router],
  );

  useEffect(() => {
    if (!signedIn) return;
    listApplications()
      .then(setApps)
      .catch((err: unknown) => fail(err, "Couldn't load your applications."));
  }, [signedIn, fail]);

  const moveTo = async (app: Application, stage: Stage) => {
    if (app.stage === stage) return;
    setApps((list) => list!.map((a) => (a.id === app.id ? { ...a, stage } : a)));
    try {
      const updated = await updateApplication(app.id, { stage });
      setApps((list) => list!.map((a) => (a.id === app.id ? updated : a)));
    } catch (err) {
      setApps((list) => list!.map((a) => (a.id === app.id ? app : a)));
      fail(err, "Couldn't move this application.");
    }
  };

  const onDragEnd = (e: DragEndEvent) => {
    setDragging(null);
    const app = apps?.find((a) => a.id === e.active.id);
    if (app && e.over) void moveTo(app, e.over.id as Stage);
  };

  const save = async (input: ApplicationInput) => {
    try {
      const app = dialog.app;
      const saved = app ? await updateApplication(app.id, input) : await createApplication(input);
      setApps((list) => (app ? list!.map((a) => (a.id === app.id ? saved : a)) : [saved, ...list!]));
      setDialog((d) => ({ ...d, open: false }));
    } catch (err) {
      fail(err, "Couldn't save this application.");
    }
  };

  const remove = async () => {
    const app = dialog.app;
    if (!app) return;
    try {
      await deleteApplication(app.id);
      setApps((list) => list!.filter((a) => a.id !== app.id));
      setDialog((d) => ({ ...d, open: false }));
    } catch (err) {
      fail(err, "Couldn't delete this application.");
    }
  };

  if (signedIn === false) {
    return (
      <AppPage>
        <EmptyState title="Sign in to track applications" body="Save jobs, move them through each stage and keep notes on every one.">
          <Button asChild>
            <Link href={signInHref(HERE)}>Sign in</Link>
          </Button>
        </EmptyState>
      </AppPage>
    );
  }

  const active = apps?.filter((a) => a.stage !== "REJECTED" && a.stage !== "SAVED").length ?? 0;

  return (
    <AppPage
      icon={SquareKanban}
      title="Applications"
      description={apps ? `${apps.length} tracked · ${active} in progress. Drag a card to change its stage.` : "Every job you're following, from saved to offer."}
      actions={
        <Button size="sm" className="h-8 font-semibold" onClick={() => setDialog({ open: true, app: null, stage: "SAVED" })}>
          <Plus /> Add application
        </Button>
      }
      className="max-w-[1480px]"
    >
      <Toaster position="bottom-center" />
      {!apps ? (
        <div className="grid gap-3 md:grid-cols-5">
          {STAGES.map((s) => (
            <Skeleton key={s} className="h-[320px] rounded-2xl bg-white/[0.04]" />
          ))}
        </div>
      ) : (
        <>
          {apps.length > 0 ? (
            <section aria-label="Pipeline" className={cn(panel, "mb-4 p-4")}>
              <div className="flex h-2 gap-1 overflow-hidden rounded-full">
                {STAGES.map((stage) => {
                  const n = apps.filter((a) => a.stage === stage).length;
                  return n ? <span key={stage} className="h-full rounded-full transition-[flex-grow] duration-500" style={{ flexGrow: n, background: STAGE_COLOR[stage] }} /> : null;
                })}
              </div>
              <dl className="m-0 mt-3 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-5">
                {STAGES.map((stage) => (
                  <div key={stage} className="flex items-center gap-2 text-[12.5px]">
                    <span className="size-2 rounded-full" style={{ background: STAGE_COLOR[stage] }} />
                    <dt className="text-white/50">{STAGE_LABELS[stage]}</dt>
                    <dd className="m-0 ml-auto font-semibold tabular-nums text-white sm:ml-0">{apps.filter((a) => a.stage === stage).length}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ) : null}
          {apps.length === 0 ? (
            <div className={cn(panel, "mb-4")}>
              <EmptyState title="Nothing tracked yet" body="Add a job you're applying to and move it through each stage.">
                <Button variant="outline" size="sm" onClick={() => setDialog({ open: true, app: null, stage: "SAVED" })}>
                  <Plus /> Add application
                </Button>
              </EmptyState>
            </div>
          ) : null}
          <DndContext sensors={sensors} onDragStart={(e) => setDragging(apps.find((a) => a.id === e.active.id) ?? null)} onDragCancel={() => setDragging(null)} onDragEnd={onDragEnd}>
            <div className="grid snap-x grid-flow-col auto-cols-[minmax(200px,1fr)] gap-3 overflow-x-auto pb-2">
              {STAGES.map((stage) => (
                <Column key={stage} stage={stage} apps={apps.filter((a) => a.stage === stage)} onOpen={(app) => setDialog({ open: true, app, stage: app.stage })} onAdd={() => setDialog({ open: true, app: null, stage })} />
              ))}
            </div>
            <DragOverlay>{dragging ? <CardBody app={dragging} className="rotate-[1.5deg] shadow-2xl" /> : null}</DragOverlay>
          </DndContext>
        </>
      )}
      <ApplicationDialog open={dialog.open} onOpenChange={(open) => setDialog((d) => ({ ...d, open }))} application={dialog.app} defaultStage={dialog.stage} onSave={save} onDelete={remove} />
    </AppPage>
  );
}

function Column({ stage, apps, onOpen, onAdd }: { stage: Stage; apps: Application[]; onOpen: (a: Application) => void; onAdd: () => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  return (
    <section
      ref={setNodeRef}
      aria-label={STAGE_LABELS[stage]}
      className={cn(
        "relative flex min-h-[420px] snap-start flex-col overflow-hidden rounded-2xl border bg-card transition-colors",
        isOver ? "border-white/25 bg-white/[0.03]" : "border-white/[0.07]",
      )}
    >
      <span aria-hidden className="absolute inset-x-0 top-0 h-0.5" style={{ background: STAGE_COLOR[stage] }} />
      <header className="flex items-center justify-between px-3.5 pb-2.5 pt-3.5">
        <h2 className="m-0 flex items-center gap-2 text-[13px] font-semibold tracking-[-0.01em]">
          <span className="size-2 rounded-full" style={{ background: STAGE_COLOR[stage] }} aria-hidden="true" />
          {STAGE_LABELS[stage]}
          <span className="rounded-md bg-white/[0.06] px-1.5 text-[11.5px] font-medium tabular-nums text-white/55">{apps.length}</span>
        </h2>
        <Button variant="ghost" size="icon-sm" onClick={onAdd} aria-label={`Add to ${STAGE_LABELS[stage]}`} className="size-7 text-muted-foreground">
          <Plus className="size-4" />
        </Button>
      </header>
      <ul className="m-0 grid flex-1 list-none content-start gap-2 px-2 pb-2">
        {apps.map((a) => (
          <DraggableCard key={a.id} app={a} onOpen={() => onOpen(a)} />
        ))}
        {apps.length === 0 ? (
          <li className="grid h-24 place-items-center rounded-xl border border-dashed border-white/[0.08] text-[12px] text-white/30">{isOver ? "Drop here" : "No jobs here"}</li>
        ) : null}
      </ul>
    </section>
  );
}

function DraggableCard({ app, onOpen }: { app: Application; onOpen: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: app.id });
  return (
    <li
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      aria-label={`${app.title} at ${app.company}. Enter to edit, Space to move.`}
      onClick={onOpen}
      onKeyDown={(e) => {
        listeners?.onKeyDown?.(e);
        if (e.key === "Enter" && !isDragging) onOpen();
      }}
      className={cn("cursor-grab rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing", isDragging && "opacity-30")}
    >
      <CardBody app={app} />
    </li>
  );
}

function CardBody({ app, className }: { app: Application; className?: string }) {
  const initial = app.company.trim().charAt(0).toUpperCase() || "·";
  return (
    <div className={cn("rounded-xl border border-white/[0.07] bg-[#141417] p-3 transition-colors hover:border-white/[0.15]", className)}>
      <div className="flex items-start gap-2.5">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-white/[0.07] bg-white/[0.05] text-[13px] font-semibold text-white/80">
          {initial}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[13.5px] font-semibold text-white">{app.title}</span>
          <span className="mt-0.5 block truncate text-[12.5px] text-white/50">{app.company}</span>
        </span>
      </div>
      {app.notes ? <span className="mt-2.5 line-clamp-2 block text-[12px] leading-[1.45] text-white/50">{app.notes}</span> : null}
      <span className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-white/40">
        {app.location ? (
          <span className="flex items-center gap-1">
            <MapPin className="size-3" /> {app.location}
          </span>
        ) : null}
        <span className="flex items-center gap-1">
          <CalendarDays className="size-3" /> {new Date(app.updatedAt).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
        </span>
      </span>
    </div>
  );
}
