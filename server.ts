import express from 'express';
import { readFileSync, writeFile} from "fs"

import { build } from 'vite'

import { fileURLToPath } from 'url';
import path from 'path'
import { dirname, join } from 'path';
import { parseTimber } from './timberjs/compiler/compiler';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

const options = {
    root: join(__dirname)
}
const loadPage = async (_req, res, page) => {
    // const {loader} = await import(`./ts-built/pages/${page}.js`)
    // const loaderRes = {
    //     render: async (vDomNode) => {
    //         // console.log({render: vDomNode})
    //         const domString = renderToHydrationString(vDomNode)
    //         writeFile(path.join(".","built",`index.html`), domString, () => {})
    //         const buildOutput = await build({
    //             root: path.resolve(__dirname, `./built/`),
    //             base: `./`,
    //             build: {
    //             rollupOptions: {
    //                 // ...
    //                 }
    //             }
    //         })
    //         const [first, second] = buildOutput.output

    //         const htmlString = first.hasOwnProperty("source") ? first.source : second.source

    //         // console.log({page, htmlString})
    //         res.send(htmlString);
    //     }
    // }
    // loader(req, loaderRes)

    const domString = parseTimber(readFileSync(`./pages/${page}.html`).toString(), {
        componentResolution: "component-folder",
        definedWebComponents: new Set(),
        loadedComponents: new Set()
    })

    writeFile(path.join(".","built",`index.html`), domString, () => {})
    const buildOutput = await build({
        root: path.resolve(__dirname, `./built/`),
        base: `./`,
        build: {
        rollupOptions: {

            }
        }
    })

    const [first, second] = buildOutput['output']

    const htmlString = first.hasOwnProperty("source") ? first.source : second.source

    // console.log({page, htmlString})
    res.send(htmlString);
}

app.get("/", (req, res) => {
    loadPage(req, res, "_index")
});

app.get("/favicon.ico.html", (_req, res) => {
    // const assetUrl = req.params.assetUrl
    console
    res.send('boo!')
    // res.sendFile(`./built/dist/assets/${assetUrl}`, options)
});

app.get("/:page", (req, res) => {
    const { page } = req.params
    if (page === 'favicon.ico.html') {
        res.send('boo!')
    } else {
        loadPage(req, res, page)
    }
});

app.get("/assets/:assetUrl", (req, res) => {
    const assetUrl = req.params.assetUrl
    res.sendFile(`./built/dist/assets/${assetUrl}`, options)
});

app.listen(8080);