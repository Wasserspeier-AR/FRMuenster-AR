import { parse } from "smol-toml";
import confRaw from "./config.toml?raw";
import listRaw from "./targetlist.toml?raw";

const config = parse(confRaw);
const list = parse(listRaw);
const resolve = (dir, file) => `${import.meta.env.BASE_URL}${dir}/${file}`;

export const map = config.map;
export const targets = {
  ...config.targets,
  file: resolve("targets", config.targets.file)
};
export const targetList = list.target.map((t, id) => ({
  ...t,
  id,
  model: resolve("models", t.model)
}));

// Needed to guarantee at build
export const contentImg = (t) =>
  t?.content_image
    ? new URL(`../assets/content/${t.content_image}`, import.meta.url).href
    : null;
