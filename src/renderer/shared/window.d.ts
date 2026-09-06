import type { BatuffolinaApi } from "../../preload/preload";

declare global {
  interface Window {
    batuffolina: BatuffolinaApi;
  }
}

export {};
