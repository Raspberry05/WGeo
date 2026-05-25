import { useEffect, useRef } from "react";
import { ScreenSpaceEventHandler, ScreenSpaceEventType } from "cesium";
import { useCesium } from "resium";
import { useAircraftStore } from "../../store/useAircraftStore";

const MOVE_SPEED = 80;
const BOOST_MULTIPLIER = 3;
const LOOK_SENSITIVITY = 0.003;

export function SpaceFreeCamera() {
  const { viewer } = useCesium();
  const cameraMode = useAircraftStore((s) => s.cameraMode);
  const viewMode = useAircraftStore((s) => s.viewMode);
  const spaceHeld = useRef(false);
  const keys = useRef(new Set<string>());
  const lastMouse = useRef<{ x: number; y: number } | null>(null);

  const localOrbit =
    viewMode === "local" && cameraMode === "orbit";

  useEffect(() => {
    if (!viewer || !localOrbit) return;

    const controller = viewer.scene.screenSpaceCameraController;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        spaceHeld.current = true;
        controller.enableInputs = false;
        controller.enableRotate = false;
        controller.enableTranslate = false;
        controller.enableZoom = false;
        controller.enableTilt = false;
        controller.enableLook = false;
      }
      keys.current.add(e.code);
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        spaceHeld.current = false;
        lastMouse.current = null;
        controller.enableInputs = true;
        controller.enableRotate = true;
        controller.enableTranslate = true;
        controller.enableZoom = true;
        controller.enableTilt = true;
        controller.enableLook = true;
      }
      keys.current.delete(e.code);
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    const handler = new ScreenSpaceEventHandler(viewer.canvas);

    handler.setInputAction((movement: { endPosition: { x: number; y: number } }) => {
      if (!spaceHeld.current) return;
      const end = movement.endPosition;
      if (lastMouse.current) {
        const dx = end.x - lastMouse.current.x;
        const dy = end.y - lastMouse.current.y;
        viewer.camera.lookRight(dx * LOOK_SENSITIVITY);
        viewer.camera.lookUp(-dy * LOOK_SENSITIVITY);
      }
      lastMouse.current = { x: end.x, y: end.y };
    }, ScreenSpaceEventType.MOUSE_MOVE);

    let frameId = 0;
    const tick = () => {
      if (spaceHeld.current) {
        const boost =
          keys.current.has("ShiftLeft") || keys.current.has("ShiftRight")
            ? BOOST_MULTIPLIER
            : 1;
        const speed = MOVE_SPEED * boost;

        if (keys.current.has("KeyW")) viewer.camera.moveForward(speed);
        if (keys.current.has("KeyS")) viewer.camera.moveBackward(speed);
        if (keys.current.has("KeyA")) viewer.camera.moveLeft(speed);
        if (keys.current.has("KeyD")) viewer.camera.moveRight(speed);
        if (keys.current.has("KeyE")) viewer.camera.moveUp(speed);
        if (keys.current.has("KeyQ")) viewer.camera.moveDown(speed);
      }
      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      cancelAnimationFrame(frameId);
      handler.destroy();
      controller.enableInputs = true;
      controller.enableRotate = true;
      controller.enableTranslate = true;
      controller.enableZoom = true;
      controller.enableTilt = true;
      controller.enableLook = true;
    };
  }, [viewer, localOrbit]);

  return null;
}
