import {
  listActiveServices,
  listGlobalOptions,
} from "@/lib/queries/services";
import { QuoteCalculatorClient } from "./QuoteCalculatorClient";

export async function QuoteCalculator() {
  const [services, options] = await Promise.all([
    listActiveServices(),
    listGlobalOptions(),
  ]);
  return <QuoteCalculatorClient services={services} options={options} />;
}
