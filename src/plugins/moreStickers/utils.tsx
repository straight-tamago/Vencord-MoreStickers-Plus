/*
 * Vencord, a modification for Discord's desktop app
 * Copyright (c) 2023 Vendicated and contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { classNameFactory } from "@api/Styles";
import * as DataStore from "@api/DataStore";

import { React } from "@webpack/common";
import { waitFor } from "@webpack";
import { FFmpegState } from './types';

import type { FFmpeg } from '@ffmpeg/ffmpeg';

export const cl = classNameFactory("vc-more-stickers-");
export const clPicker = (className: string, ...args: any[]) => cl("picker-" + className, ...args);

const CORS_PROXY = "https://corsproxy.io?";

export let cachedRegion: string = "en";
export async function initializeRegionCache() {
    cachedRegion = await DataStore.get('region') || 'en';
}
initializeRegionCache();
export function localization(text: string): string {
    const translations: { [key: string]: { [key: string]: string } } = {
        'ja': {
            'Search stickers': 'スタンプを検索',
            'Recently Used': '最近使ったスタンプ',
            'Add Sticker Pack from URL': 'URLからスタンプを追加',
            'Add from URL': 'URLから追加',
            'Add from HTML': 'HTMLから追加',
            'Add from File': 'ファイルから追加',
            'Currently LINE stickers supported only.': '現在はLINEスタンプのみ対応しております。',
            'Telegram stickers support is planned, but due to the lack of a public API, it is most likely to be provided by sticker pack files instead of adding by URL.': 'Telegramステッカーのサポートが計画されていますが、パブリックAPIがないため、URLで追加するのではなく、ファイルインポートによる追加になる可能性が高いです。',
            'Insert': '追加',
            'Sticker Pack URL': 'スタンプURL',
            'Add Sticker Pack from HTML': 'HTMLからスタンプを追加',
            'Add Sticker Pack from File': 'ファイルからスタンプを追加',
            'When encountering errors while adding a sticker pack, you can try to add it using the HTML source code of the sticker pack page.': 'スタンプの追加中にエラーが発生した場合は、スタンプページのHTMLソースコードを使用してスタンプの追加を試みることができます。',
            'This applies to stickers which are region locked / OS locked / etc.': 'これは、地域ロック/OSロックなどのスタンプに適用されます。',
            'The region LINE recognized may vary from the region you are in due to the CORS proxy we\'re using.': 'LINEが認識する地域は、使用しているCORSプロキシにより、お住まいの地域とは異なる場合があります。',
            'Stickers Management': 'スタンプ管理',
            'No Resize': 'リサイズなし',
            'Language': '言語',
            'Insert from HTML': 'HTMLから挿入',
            'Open Sticker Pack File': 'ファイルをインポート',
            'Paste HTML here': 'ここにHTMLを貼り付けてください',
            'Stickers+': 'スタンプ+',
            'Not set': "未設定",
            'from ': 'より',
        },
    };
    return translations[cachedRegion]?.[text] || text;
}


function corsUrl(url: string | URL) {
    return CORS_PROXY + encodeURIComponent(url.toString());
}

export function corsFetch(url: string | URL, init?: RequestInit | undefined) {
    return fetch(corsUrl(url), init);
}

export class Mutex {
    current = Promise.resolve();
    lock() {
        let _resolve: () => void;
        const p = new Promise(resolve => {
            _resolve = () => resolve();
        }) as Promise<void>;
        // Caller gets a promise that resolves when the current outstanding
        // lock resolves
        const rv = this.current.then(() => _resolve);
        // Don't allow the next request until the new promise is done
        this.current = p;
        // Return the new promise
        return rv;
    }
}

export let FFmpegStateContext: React.Context<FFmpegState | undefined> | undefined;
waitFor("createContext", () => {
    FFmpegStateContext = React.createContext<FFmpegState | undefined>(undefined);
});

export async function loadFFmpeg(ffmpeg: FFmpeg, setLoaded: () => void) {
    console.log("Loading FFmpeg...");
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';

    const classWorkerRaw = "/// <reference no-default-lib=\"true\" />\n/// <reference lib=\"esnext\" />\n/// <reference lib=\"webworker\" />\nconst MIME_TYPE_JAVASCRIPT = \"text/javascript\";\nconst MIME_TYPE_WASM = \"application/wasm\";\nconst CORE_VERSION = \"0.12.6\";\nconst CORE_URL = `https://unpkg.com/@ffmpeg/core@${CORE_VERSION}/dist/umd/ffmpeg-core.js`;\nvar FFMessageType;\n(function(FFMessageType) {\n  FFMessageType[\"LOAD\"] = \"LOAD\";\n  FFMessageType[\"EXEC\"] = \"EXEC\";\n  FFMessageType[\"WRITE_FILE\"] = \"WRITE_FILE\";\n  FFMessageType[\"READ_FILE\"] = \"READ_FILE\";\n  FFMessageType[\"DELETE_FILE\"] = \"DELETE_FILE\";\n  FFMessageType[\"RENAME\"] = \"RENAME\";\n  FFMessageType[\"CREATE_DIR\"] = \"CREATE_DIR\";\n  FFMessageType[\"LIST_DIR\"] = \"LIST_DIR\";\n  FFMessageType[\"DELETE_DIR\"] = \"DELETE_DIR\";\n  FFMessageType[\"ERROR\"] = \"ERROR\";\n  FFMessageType[\"DOWNLOAD\"] = \"DOWNLOAD\";\n  FFMessageType[\"PROGRESS\"] = \"PROGRESS\";\n  FFMessageType[\"LOG\"] = \"LOG\";\n  FFMessageType[\"MOUNT\"] = \"MOUNT\";\n  FFMessageType[\"UNMOUNT\"] = \"UNMOUNT\";\n})(FFMessageType || (FFMessageType = {}));\n\n\nconst ERROR_UNKNOWN_MESSAGE_TYPE = new Error(\"unknown message type\");\nconst ERROR_NOT_LOADED = new Error(\"ffmpeg is not loaded, call `await ffmpeg.load()` first\");\nconst ERROR_TERMINATED = new Error(\"called FFmpeg.terminate()\");\nconst ERROR_IMPORT_FAILURE = new Error(\"failed to import ffmpeg-core.js\");\n\nlet ffmpeg;\nconst load = async ({ coreURL: _coreURL, wasmURL: _wasmURL, workerURL: _workerURL, }) => {\n  const first = !ffmpeg;\n  try {\n    if (!_coreURL)\n      _coreURL = CORE_URL;\n    // when web worker type is `classic`.\n    importScripts(_coreURL);\n  }\n  catch {\n    if (!_coreURL)\n      _coreURL = CORE_URL.replace('/umd/', '/esm/');\n    // when web worker type is `module`.\n    self.createFFmpegCore = (await import(\n        /* webpackIgnore: true */ /* @vite-ignore */ _coreURL)).default;\n    if (!self.createFFmpegCore) {\n      throw ERROR_IMPORT_FAILURE;\n    }\n  }\n  const coreURL = _coreURL;\n  const wasmURL = _wasmURL ? _wasmURL : _coreURL.replace(/.js$/g, \".wasm\");\n  const workerURL = _workerURL\n    ? _workerURL\n    : _coreURL.replace(/.js$/g, \".worker.js\");\n  ffmpeg = await self.createFFmpegCore({\n    // Fix `Overload resolution failed.` when using multi-threaded ffmpeg-core.\n    // Encoded wasmURL and workerURL in the URL as a hack to fix locateFile issue.\n    mainScriptUrlOrBlob: `${coreURL}#${btoa(JSON.stringify({ wasmURL, workerURL }))}`,\n  });\n  ffmpeg.setLogger((data) => self.postMessage({ type: FFMessageType.LOG, data }));\n  ffmpeg.setProgress((data) => self.postMessage({\n    type: FFMessageType.PROGRESS,\n    data,\n  }));\n  return first;\n};\nconst exec = ({ args, timeout = -1 }) => {\n  ffmpeg.setTimeout(timeout);\n  ffmpeg.exec(...args);\n  const ret = ffmpeg.ret;\n  ffmpeg.reset();\n  return ret;\n};\nconst writeFile = ({ path, data }) => {\n  ffmpeg.FS.writeFile(path, data);\n  return true;\n};\nconst readFile = ({ path, encoding }) => ffmpeg.FS.readFile(path, { encoding });\n// TODO: check if deletion works.\nconst deleteFile = ({ path }) => {\n  ffmpeg.FS.unlink(path);\n  return true;\n};\nconst rename = ({ oldPath, newPath }) => {\n  ffmpeg.FS.rename(oldPath, newPath);\n  return true;\n};\n// TODO: check if creation works.\nconst createDir = ({ path }) => {\n  ffmpeg.FS.mkdir(path);\n  return true;\n};\nconst listDir = ({ path }) => {\n  const names = ffmpeg.FS.readdir(path);\n  const nodes = [];\n  for (const name of names) {\n    const stat = ffmpeg.FS.stat(`${path}/${name}`);\n    const isDir = ffmpeg.FS.isDir(stat.mode);\n    nodes.push({ name, isDir });\n  }\n  return nodes;\n};\n// TODO: check if deletion works.\nconst deleteDir = ({ path }) => {\n  ffmpeg.FS.rmdir(path);\n  return true;\n};\nconst mount = ({ fsType, options, mountPoint }) => {\n  const str = fsType;\n  const fs = ffmpeg.FS.filesystems[str];\n  if (!fs)\n    return false;\n  ffmpeg.FS.mount(fs, options, mountPoint);\n  return true;\n};\nconst unmount = ({ mountPoint }) => {\n  ffmpeg.FS.unmount(mountPoint);\n  return true;\n};\nself.onmessage = async ({ data: { id, type, data: _data }, }) => {\n  const trans = [];\n  let data;\n  try {\n    if (type !== FFMessageType.LOAD && !ffmpeg)\n      throw ERROR_NOT_LOADED; // eslint-disable-line\n    switch (type) {\n      case FFMessageType.LOAD:\n        data = await load(_data);\n        break;\n      case FFMessageType.EXEC:\n        data = exec(_data);\n        break;\n      case FFMessageType.WRITE_FILE:\n        data = writeFile(_data);\n        break;\n      case FFMessageType.READ_FILE:\n        data = readFile(_data);\n        break;\n      case FFMessageType.DELETE_FILE:\n        data = deleteFile(_data);\n        break;\n      case FFMessageType.RENAME:\n        data = rename(_data);\n        break;\n      case FFMessageType.CREATE_DIR:\n        data = createDir(_data);\n        break;\n      case FFMessageType.LIST_DIR:\n        data = listDir(_data);\n        break;\n      case FFMessageType.DELETE_DIR:\n        data = deleteDir(_data);\n        break;\n      case FFMessageType.MOUNT:\n        data = mount(_data);\n        break;\n      case FFMessageType.UNMOUNT:\n        data = unmount(_data);\n        break;\n      default:\n        throw ERROR_UNKNOWN_MESSAGE_TYPE;\n    }\n  }\n  catch (e) {\n    self.postMessage({\n      id,\n      type: FFMessageType.ERROR,\n      data: e.toString(),\n    });\n    return;\n  }\n  if (data instanceof Uint8Array) {\n    trans.push(data.buffer);\n  }\n  self.postMessage({ id, type, data }, trans);\n};\n\n";
    const classWorkerBlob = new Blob([(new TextEncoder()).encode(classWorkerRaw)], { type: 'text/javascript' });
    const classWorkerUrl = URL.createObjectURL(classWorkerBlob);

    await ffmpeg.load({
        coreURL: `${baseURL}/ffmpeg-core.js`,
        wasmURL: `${baseURL}/ffmpeg-core.wasm`,
        workerURL: `${baseURL}/ffmpeg-core.worker.js`,
        classWorkerURL: classWorkerUrl,
    });
    setLoaded();
    console.log("FFmpeg loaded!");
}