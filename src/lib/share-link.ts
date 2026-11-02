import { trackEvent } from "./analytics";

export const WORKSTATION_URL = "https://stockifylearn.lovable.app/simulator";

/** Share the computer link (native share sheet), falling back to copying it. Returns what happened. */
export async function sendWorkstationLink(): Promise<"shared" | "copied" | "cancelled" | "failed"> {
  trackEvent("send_workstation_link");
  const data = { title: "Stockify Learn", text: "Open this on my computer to practise investing with fake money", url: WORKSTATION_URL };
  try {
    if (navigator.share) { await navigator.share(data); return "shared"; }
  } catch { return "cancelled"; }
  try { await navigator.clipboard.writeText(WORKSTATION_URL); return "copied"; }
  catch { return "failed"; }
}
