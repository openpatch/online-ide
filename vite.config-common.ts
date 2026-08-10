
import { resolve } from 'path'
import { defineConfig } from 'vite'

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';

const file = fileURLToPath(new URL('package.json', import.meta.url));
const json = readFileSync(file, 'utf8');
const pkg = JSON.parse(json);

const d = new Date();
const curr_date = d.getDate();
const curr_month = d.getMonth() + 1; //Months are zero based
const curr_year = d.getFullYear();
let hour = "" + d.getHours();
while (hour.length < 2) hour = "0" + hour;

let minute = "" + d.getMinutes();
while (minute.length < 2) minute = "0" + minute;

const buildDate = curr_date + "." + curr_month + "." + curr_year + ", " + hour + ":" + minute + " Uhr";


import type { UserConfig } from 'vite'

export default {
    appType: 'mpa', // to serve 404 on "not found" (instead of erroneously serving index.html)
    esbuild: {
        logOverride: {
            'unsupported-css-nesting': 'silent',
            'unsupported-@namespace': 'silent',
        },
        dropLabels: ['DEBUG']
    },
    build: {
        sourcemap: true,
        emptyOutDir: true,
        chunkSizeWarningLimit: 4912,
        /**
         * Assets below 10 kB are inlined as data URLs — except audio: the Scratch
         * library imports 266 OGG files, two thirds of them under that limit, and
         * inlining them would add 1.3 MB of base64 to the bundle that every user
         * downloads whether or not a program plays a sound. They stay separate
         * files, fetched when a sound is first played, like the costume atlases.
         */
        assetsInlineLimit: (filePath: string, content: Buffer) =>
            /\.(ogg|mp3|wav)$/i.test(filePath) ? false : content.length < 10 * 1024
    },
    define: {
        'APP_VERSION': JSON.stringify(pkg.version),
        'BUILD_DATE': JSON.stringify(buildDate)
    }
} satisfies UserConfig
