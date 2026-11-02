import { useEffect, useState } from "react";

const QUERY = "(max-width: 767.98px)";

/** True below the md breakpoint; null until known after mount, so server and first client render match. */
export function useIsPhone(): boolean | null {
  const [phone, setPhone] = useState<boolean | null>(null);
  useEffect(() => {
    const mq = window.matchMedia(QUERY);
    const update = () => setPhone(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return phone;
}
