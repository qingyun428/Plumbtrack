import type { Metadata } from "next";
import WaterPumpApp from "./WaterPumpApp";

export const metadata: Metadata = {
  title: "Pump Tracker - Q",
  description:
    "Standalone Water Tank and Pump management workspace for projects, suppliers, quotations and PUB status.",
};

export default function WaterPumpRoute() {
  return <WaterPumpApp />;
}
