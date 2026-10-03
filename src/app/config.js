import { parse } from "smol-toml";
import confRaw from "./config.toml?raw";
import listRaw from "./targetlist.toml?raw";

export const { targets, map } = parse(confRaw);
export const targetList = parse(listRaw)
  .target.map((t, id) => ({ ...t, id }))
  .filter((t) => t.enabled);

const targetsById = new Map(targetList.map((t) => [t.id, t]));
export const getTarget = (id) => targetsById.get(id) ?? null;

export const contentImageUrl = (entry) =>
  entry?.content_image
    ? targets.content_image_path + entry.content_image
    : null;

for (const k of ["src", "model_path", "content_image_path"]) {
  targets[k] = import.meta.env.BASE_URL + targets[k];
}
