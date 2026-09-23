import { useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

export type DrawerAxis = "x" | "y";

export interface UseDrawerOptions {
  axis: DrawerAxis;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  // Called once per gesture (on pointer down) so window size / measured
  // elements stay accurate without re-measuring on every move.
  getOpenValue: () => number;
  getClosedValue: () => number;
  // Denominator for "how far, as a fraction, was this dragged" — defaults to
  // the full open/closed travel distance. Override when that reference
  // should be something else (e.g. panel width rather than total travel).
  getDistanceReference?: () => number;
  distanceRatio?: number; // fraction of the reference distance that forces a commit
  flingVelocity?: number; // px/ms magnitude that forces a commit regardless of distance
  minFlingSpeed?: number; // px/ms floor used to time the commit animation
  snapBackMs?: number; // duration when a drag doesn't cross the threshold
  dragThreshold?: number; // px of movement required before a click/tap becomes a drag
  // Flip which raw pointer direction increases `value`. Needed when the
  // closed edge is anchored to the far side (e.g. bottom/right) instead of
  // the near side (top/left), so "drag toward the open edge" still opens.
  invert?: boolean;
}

export interface UseDrawerResult {
  value: number | null; // live px position along the axis; null when idle (let CSS own it)
  transform: string | undefined; // translateX/Y(value), for transform-based consumers
  transitionMs: number | null; // null while actively dragging (follow the finger with no lag)
  onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerUp: (event: ReactPointerEvent<HTMLElement>) => void;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

interface DragState {
  value: number;
  transitionMs?: number;
}

export function useDrawer({
  axis,
  isOpen,
  onOpenChange,
  getOpenValue,
  getClosedValue,
  getDistanceReference,
  distanceRatio = 0.35,
  flingVelocity = 0.5,
  minFlingSpeed = 0.6,
  snapBackMs = 250,
  invert = false,
  dragThreshold = 8,
}: UseDrawerOptions): UseDrawerResult {
  const [drag, setDrag] = useState<DragState | null>(null);

  const pointerIdRef = useRef<number | null>(null);
  const startCoordRef = useRef(0);
  const startValueRef = useRef(0);
  const openValueRef = useRef(0);
  const closedValueRef = useRef(0);
  const referenceDistanceRef = useRef(0);
  const lastCoordRef = useRef(0);
  const lastTimeRef = useRef(0);
  const velocityRef = useRef(0);
  // True once the current gesture has moved past dragThreshold. Below that,
  // we stay completely uninvolved (no capture, no state) so a click/tap on
  // content inside the drawer resolves natively instead of being hijacked.
  const isDraggingRef = useRef(false);

  function coordOf(event: ReactPointerEvent<HTMLElement>) {
    const raw = axis === "x" ? event.clientX : event.clientY;
    return invert ? -raw : raw;
  }

  function onPointerDown(event: ReactPointerEvent<HTMLElement>) {
    const coord = coordOf(event);

    openValueRef.current = getOpenValue();
    closedValueRef.current = getClosedValue();
    referenceDistanceRef.current = getDistanceReference
      ? getDistanceReference()
      : Math.abs(openValueRef.current - closedValueRef.current);

    pointerIdRef.current = event.pointerId;
    startCoordRef.current = coord;
    startValueRef.current = isOpen ? openValueRef.current : closedValueRef.current;
    lastCoordRef.current = coord;
    lastTimeRef.current = event.timeStamp;
    velocityRef.current = 0;
    isDraggingRef.current = false;

    // Deliberately no setPointerCapture / setDrag here — see onPointerMove.
    // Engaging immediately would hijack clicks/taps on interactive content
    // inside the drawer before the browser can resolve them natively.
  }

  function onPointerMove(event: ReactPointerEvent<HTMLElement>) {
    if (pointerIdRef.current !== event.pointerId) {
      return;
    }

    const coord = coordOf(event);
    const dt = Math.max(event.timeStamp - lastTimeRef.current, 1);
    velocityRef.current = (coord - lastCoordRef.current) / dt; // px/ms
    lastCoordRef.current = coord;
    lastTimeRef.current = event.timeStamp;

    if (!isDraggingRef.current) {
      if (Math.abs(coord - startCoordRef.current) < dragThreshold) {
        return; // still within click/tap slop — stay uninvolved
      }
      isDraggingRef.current = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      setDrag({ value: startValueRef.current });
    }

    const lo = Math.min(openValueRef.current, closedValueRef.current);
    const hi = Math.max(openValueRef.current, closedValueRef.current);

    // Clamping to [lo, hi] means dragging the "wrong" way for the current
    // state (toward closed while already closed, or vice versa) has no effect.
    const totalDelta = coord - startCoordRef.current;
    const value = clamp(startValueRef.current + totalDelta, lo, hi);
    setDrag({ value });
  }

  function onPointerUp(event: ReactPointerEvent<HTMLElement>) {
    if (pointerIdRef.current !== event.pointerId) {
      return;
    }
    pointerIdRef.current = null;

    if (!isDraggingRef.current) {
      return; // never crossed the threshold — this was a click/tap, not a drag
    }

    const openValue = openValueRef.current;
    const closedValue = closedValueRef.current;
    const current = drag?.value ?? startValueRef.current;

    const draggedRatio =
      referenceDistanceRef.current > 0
        ? Math.abs(current - startValueRef.current) / referenceDistanceRef.current
        : 0;
    const velocity = velocityRef.current;

    const flingingOpen = !isOpen && velocity > flingVelocity;
    const flingingClosed = isOpen && velocity < -flingVelocity;
    const shouldCommit = draggedRatio > distanceRatio || flingingOpen || flingingClosed;

    const nextOpen = shouldCommit ? !isOpen : isOpen;
    const target = nextOpen ? openValue : closedValue;

    const remaining = Math.abs(target - current);
    const speed = Math.max(Math.abs(velocity), minFlingSpeed);
    const durationMs = shouldCommit ? clamp(remaining / speed, 120, 400) : snapBackMs;

    setDrag({ value: target, transitionMs: durationMs });

    window.setTimeout(() => {
      setDrag(null);
      if (shouldCommit) {
        onOpenChange(nextOpen);
      }
    }, durationMs);
  }

  return {
    value: drag?.value ?? null,
    transform: drag ? `translate${axis === "x" ? "X" : "Y"}(${drag.value}px)` : undefined,
    transitionMs: drag?.transitionMs ?? null,
    onPointerDown,
    onPointerMove,
    onPointerUp,
  };
}
