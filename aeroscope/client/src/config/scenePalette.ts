import { Color } from "cesium";

export const SCENE_PALETTE = {
  sky: Color.fromCssColorString("#c8ccd4"),
  land: Color.fromCssColorString("#9aa0a8"),
  water: Color.fromCssColorString("#5a6575"),
  buildingsDefault: Color.fromCssColorString("#d8dce4"),
  buildingsActive: Color.fromCssColorString("#f0f2f8"),
  buildingsOther: Color.fromCssColorString("#a8b0bc"),
} as const;

export const BUILDING_STYLE_COLORS = {
  active: "#f0f2f8",
  other: "#a8b0bc",
  default: "#d8dce4",
} as const;
