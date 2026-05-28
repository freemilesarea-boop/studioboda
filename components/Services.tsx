import { listActiveServices } from "@/lib/queries/services";
import { ServicesClient } from "./ServicesClient";

export async function Services() {
  const services = await listActiveServices();
  return <ServicesClient services={services} />;
}
