import { parse } from "smol-toml";
import confRaw from "./config.toml?raw";
import listRaw from "./targetlist.toml?raw";

export const { targets, map } = parse(confRaw);
export const targetList = parse(listRaw)
  .target.map((t, id) => ({ ...t, id }))
  .filter((t) => t.enabled);

const targetsById = new Map(targetList.map((t) => [t.id, t]));
export const getTarget = (id) => targetsById.get(id) ?? null;
targets.src = import.meta.env.BASE_URL + targets.src;

const contentImages = import.meta.glob("../assets/content/*", {
  eager: true,
  query: "?url",
  import: "default"
});

export const contentImageUrl = (entry) =>
  entry?.content_image
    ? contentImages[`../assets/content/${entry.content_image}`] ?? null
    : null;

export const devEnv = import.meta.env.DEV;
