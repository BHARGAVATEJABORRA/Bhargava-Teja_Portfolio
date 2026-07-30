import { subscribeToScrollWrite } from "@/lib/scroll-runtime";

/** Subscribe a paint callback to the shared native-scroll scheduler. */
export function subscribeToScroll(callback: () => void): () => void {
  return subscribeToScrollWrite(callback);
}
