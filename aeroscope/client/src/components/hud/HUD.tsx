import { StatusBar } from "./StatusBar";
import { AircraftList } from "./AircraftList";
import { AircraftInspector } from "./AircraftInspector";
import { AirportPicker } from "./AirportPicker";
import { CategoryFilter } from "./CategoryFilter";

export function HUD() {
  return (
    <>
      <StatusBar />
      <AirportPicker />
      <CategoryFilter />
      <AircraftList />
      <AircraftInspector />
    </>
  );
}
