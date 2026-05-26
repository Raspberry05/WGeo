import type { IconType } from "react-icons";
import type { AircraftStatus } from "@/store/useAircraftStore";
import { FaPlane, FaPlaneArrival } from "react-icons/fa6";
import { MdFlightLand, MdLocalParking, MdLocalTaxi } from "react-icons/md";
import { HudIcon } from "./HudIcon";

const STATUS_ICON: Record<AircraftStatus, IconType> = {
  airborne: FaPlane,
  landing: MdFlightLand,
  taxiing: MdLocalTaxi,
  parked: MdLocalParking,
};

export interface AircraftStatusIconProps {
  status: AircraftStatus;
  size?: number;
  color: string;
}

export function AircraftStatusIcon({
  status,
  size = 16,
  color,
}: AircraftStatusIconProps) {
  const Icon = STATUS_ICON[status] ?? FaPlaneArrival;
  return <HudIcon icon={Icon} size={size} color={color} />;
}
