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
const loadPage = async (req, res, page) => {
    const { default: loader } = await import(`./pages/${page}/loader.js`)
    const loaderRes = {
        render: async (pageProps) => {
            // console.log({render: vDomNode})
            const domString = parseTimber(readFileSync(`./pages/${page}/page.html`).toString(), {
                componentResolution: "component-folder",
                definedWebComponents: new Set(),
                loadedComponents: new Set()
            }, pageProps)
        
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
    }
    loader(req, loaderRes)

}

app.get("/", (req, res) => {
    loadPage(req, res, "_index")
});

app.get("/favicon.ico", (_req, res) => {
    // const assetUrl = req.params.assetUrl
    console
    res.send('boo!')
    // res.sendFile(`./built/dist/assets/${assetUrl}`, options)
});

app.get("/:page", (req, res) => {
    const { page } = req.params
    try {
        loadPage(req, res, page)
    } catch (e) {
        res.send(e)
    }
});

app.get("/assets/:assetUrl", (req, res) => {
    const assetUrl = req.params.assetUrl
    res.sendFile(`./built/dist/assets/${assetUrl}`, options)
});

const port = 8080
app.listen(port);
console.log(`Dev server listening at localhost:${port}`)