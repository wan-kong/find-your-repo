import { Clipboard, Icon, Image } from "@raycast/api";
import { execSync } from "node:child_process";

export interface OpenMethod {
  title: string;
  value: string;
  icon: Icon | Image;
  open: (path: string) => void;
}

export const openMethods: OpenMethod[] = [
  {
    title: "用Cursor打开",
    value: "cursor",
    icon: {
      source: "apps/cursor.svg",
    },
    open: (path: string) => {
      execSync(`cursor ${path}`);
    },
  },
  {
    title: "用PyCharm打开",
    value: "pycharm",
    icon: {
      source: "apps/pycharm.png",
    },
    open: (path: string) => {
      execSync(`open -a PyCharm ${path}`);
    },
  },
  {
    title: "在Terminal中打开",
    value: "terminal",
    icon: Icon.Terminal,
    open: (path: string) => {
      execSync(`open -a Terminal ${path}`);
    },
  },
  {
    title: "在Finder中打开",
    value: "finder",
    icon: Icon.Finder,
    open: (path: string) => {
      execSync(`open -a Finder ${path}`);
    },
  },
  {
    title: "复制路径",
    value: "copy",
    icon: Icon.CopyClipboard,
    open: (path: string) => {
      Clipboard.copy(path);
    },
  },
];
