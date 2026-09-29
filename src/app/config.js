import { parse } from "smol-toml";
import confRaw from "./config.toml?raw";
import listRaw from "./targetlist.toml?raw";

const withBase = (p) => import.meta.env.BASE_URL + p.replace(/^\//, "");

export const { targets, map } = parse(confRaw);
for (const k of ["src", "model_path"]) {
  targets[k] = withBase(targets[k]);
}

export const targetList = parse(listRaw).target.filter((t) => t.enabled);
