import { StatusBar } from './StatusBar';
import { AircraftList } from './AircraftList';
import { AircraftInspector } from './AircraftInspector';
import { useAircraftStore } from '../../store/useAircraftStore';

export function HUD() {
  const setCameraMode = useAircraftStore((s) => s.setCameraMode);
  const cameraMode = useAircraftStore((s) => s.cameraMode);

  return (
    <>
      <StatusBar />
      <AircraftList />
      <AircraftInspector />

      {/* Camera controls */}
      <div style={{
        position: 'absolute',
        top: '44px',
        right: '8px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        fontFamily: 'monospace',
        fontSize: '10px',
        zIndex: 100,
      }}>
        {(['orbit', 'tower'] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => setCameraMode(mode)}
            style={{
              padding: '5px 10px',
              background: cameraMode === mode ? 'rgba(0,255,136,0.15)' : 'rgba(0,8,16,0.88)',
              border: `1px solid ${cameraMode === mode ? '#00ff88' : '#1a3a2a'}`,
              color: cameraMode === mode ? '#00ff88' : '#4a6a5a',
              cursor: 'pointer',
              borderRadius: '2px',
              letterSpacing: '1px',
            }}
          >
            {mode.toUpperCase()}
          </button>
        ))}
      </div>
    </>
  );
}