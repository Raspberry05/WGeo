import { useEffect, useLayoutEffect, useRef } from "react";
import { MdAirplanemodeActive, MdLocalAirport, MdMenu } from "react-icons/md";
import { getAirport } from "../../data/airports";
import {
  enrichSelectedAircraft,
  loadTrackForSelected,
} from "../../services/aircraftEnrichment";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { useAircraftStore } from "../../store/useAircraftStore";
import { useHudStore } from "../../store/useHudStore";
import { HudIcon } from "./HudIcon";
import { StatusBarSelectedSummary } from "./StatusBarSelectedSummary";
import styles from "./statusBar.module.css";
import { UtcClock } from "./UtcClock";
import {
  hudAccent,
  HUD_FONT_LG,
  HUD_FONT_MD,
  HUD_FONT_SM,
  HUD_STATUS_BAR_COMPACT_MEDIA,
  HUD_TOUCH_MIN,
  statusBarHorizontalPadding,
} from "./hudTheme";

export interface StatusBarProps {
  isMobile: boolean;
}

function StatusStats({
  filtered,
  total,
  hasFilters,
  connectionColor,
  status,
  showAircraftLabel,
}: {
  filtered: number;
  total: number;
  hasFilters: boolean;
  connectionColor: string;
  status: string;
  showAircraftLabel: boolean;
}) {
  return (
    <div className={styles.statsCluster}>
      <span className={styles.aircraftCount}>
        <HudIcon icon={MdAirplanemodeActive} size={15} muted />
        {hasFilters ? `${filtered}/${total}` : total}
        {showAircraftLabel && " AIRCRAFT"}
      </span>
      <div className={styles.liveStatus}>
        <div
          className={styles.liveDot}
          style={{
            background: connectionColor,
            boxShadow: `0 0 8px ${connectionColor}`,
          }}
        />
        <span style={{ color: connectionColor, fontSize: HUD_FONT_MD }}>
          {status}
        </span>
      </div>
    </div>
  );
}

export function StatusBar({ isMobile }: StatusBarProps) {
  const barRef = useRef<HTMLDivElement | null>(null);
  const isCompact = useMediaQuery(HUD_STATUS_BAR_COMPACT_MEDIA);
  const useCompactGrid = isMobile || isCompact;

  const status = useAircraftStore((s) => s.connectionStatus);
  const aircraft = useAircraftStore((s) => s.aircraft);
  const classFilter = useAircraftStore((s) => s.classFilter);
  const wakeFilter = useAircraftStore((s) => s.wakeFilter);
  const activeAirportId = useAircraftStore((s) => s.activeAirportId);
  const selectedId = useAircraftStore((s) => s.selectedId);
  const activeAirportPickEnabled = useAircraftStore(
    (s) => s.activeAirportPickEnabled,
  );
  const catalogReady = useAircraftStore((s) => s.airportCatalogReady);
  const toggleDrawer = useHudStore((s) => s.toggleMobileDrawer);
  const setStatusBarHeight = useHudStore((s) => s.setStatusBarHeight);

  const airport = catalogReady ? getAirport(activeAirportId) : null;
  const selected = selectedId ? aircraft[selectedId] : null;

  const total = Object.keys(aircraft).length;
  const filtered = Object.values(aircraft).filter((ac) => {
    const classOk =
      !classFilter?.length ||
      (ac.aircraftClass !== null && classFilter.includes(ac.aircraftClass));
    const wakeOk =
      !wakeFilter?.length ||
      (ac.wakeCategory !== null && wakeFilter.includes(ac.wakeCategory));
    return classOk && wakeOk;
  }).length;

  useEffect(() => {
    if (!selectedId) return;
    void enrichSelectedAircraft(selectedId);
    void loadTrackForSelected(selectedId);
  }, [selectedId]);

  useLayoutEffect(() => {
    const el = barRef.current;
    if (!el) return;

    const apply = () => {
      setStatusBarHeight(Math.ceil(el.getBoundingClientRect().height));
    };

    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(el);
    return () => observer.disconnect();
  }, [
    setStatusBarHeight,
    isMobile,
    isCompact,
    selectedId,
    airport?.id,
    status,
  ]);

  const connectionColor =
    status === "LIVE"
      ? hudAccent
      : status === "SIMULATED"
        ? "#888a94"
        : "#404248";

  const barClass = [
    styles.bar,
    "hud-status-bar",
    useCompactGrid ? styles.compact : styles.wide,
  ].join(" ");

  return (
    <div
      ref={barRef}
      className={barClass}
      style={{
        fontSize: HUD_FONT_SM,
        ...statusBarHorizontalPadding(isMobile),
      }}
    >
      <div className={styles.leadColumn}>
        {isMobile && (
          <button
            type="button"
            aria-label="Open menu"
            onClick={toggleDrawer}
            className={styles.menuButton}
            style={{
              minWidth: HUD_TOUCH_MIN,
              minHeight: HUD_TOUCH_MIN,
            }}
          >
            <HudIcon icon={MdMenu} size={22} />
          </button>
        )}
        <span
          className={styles.brand}
          style={{ fontSize: isMobile ? HUD_FONT_MD : HUD_FONT_LG }}
        >
          AEROSCOPE
        </span>
      </div>

      <div className={styles.mainColumn}>
        {(airport || !isMobile) && (
          <div className={styles.metaRow}>
            {airport && (
              <span className={styles.airportChip}>
                <HudIcon icon={MdLocalAirport} size={16} />
                <span className={styles.airportChipText}>
                  {isMobile
                    ? airport.id
                    : `${airport.id} · ${airport.name.toUpperCase()}`}
                </span>
                {!activeAirportPickEnabled && !isMobile && (
                  <span className={styles.pickModeHint}>
                    (aircraft pick mode)
                  </span>
                )}
              </span>
            )}
            {!isMobile && (
              <>
                {airport && <div className={styles.divider} />}
                <UtcClock />
              </>
            )}
          </div>
        )}
        {selected && <StatusBarSelectedSummary selected={selected} />}
      </div>

      <div className={styles.statsColumn}>
        <StatusStats
          filtered={filtered}
          total={total}
          hasFilters={Boolean(classFilter?.length || wakeFilter?.length)}
          connectionColor={connectionColor}
          status={status}
          showAircraftLabel={!isMobile}
        />
      </div>
    </div>
  );
}
