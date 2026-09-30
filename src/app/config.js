import { parse } from "smol-toml";
import confRaw from "./config.toml?raw";
import listRaw from "./targetlist.toml?raw";

export const { targets, map } = parse(confRaw);
export const targetList = parse(listRaw)
  .target.map((t, id) => ({ ...t, id }))
  .filter((t) => t.enabled);

for (const k of ["src", "model_path"]) {
  targets[k] = import.meta.env.BASE_URL + targets[k];
}
