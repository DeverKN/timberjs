import express from 'express';
import { readFileSync, statSync } from "fs"
import { readFile, writeFile, stat } from "fs/promises"

import { build } from 'vite'

import { fileURLToPath } from 'url';
import path from 'path'
import { dirname, join } from 'path';
import { serialize } from '../timberjs/compiler/serialize';

import { folderComponentResolver } from './resolver';
import { compileToInjectable } from './compiler';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

const options = {
    root: join(__dirname, "..")
}

const isCached = async (page) => {
    const lastPageUpdatetime = statSync(`./pages/${page}/page.html`).mtime
    try {
        const [beforeStats, afterStats] = await Promise.all([stat(`./cache/${page}/before.txt`), stat(`./cache/${page}/after.txt`)])
        if (!(beforeStats && afterStats)) return false
        if (beforeStats.mtime < lastPageUpdatetime || afterStats.mtime < lastPageUpdatetime) return false
    } catch (e) {
        return false
    }
    return true
}

const loadPage = async (req, res, page) => {
    const startTime = Date.now()
    const { default: loader } = await import(`../pages/${page}/loader.js`)
    const loaderRes = {
        render: async (pageProps) => {
            // console.log({render: vDomNode})
            let before = ""
            let after = ""
            let fsStart = Date.now()
            // let loaded = false
            // if (await isCached(page)) {
            //     try {
            //         console.log("cache hit")
            //         const [beforeBlob, afterBlob] = await Promise.all([readFile(`./cache/${page}/before.txt`), readFileSync(`./cache/${page}/after.txt`)])
            //         before = beforeBlob.toString()
            //         after = afterBlob.toString()
            //         loaded = true
            //     } catch (e) {

            //     }
            // }

            // if (!loaded) {
            //     console.log("cache miss");
                const source = await readFile(`./pages/${page}/page.html`);
                [before, after] = await compileToInjectable(source.toString(), {
                    componentResolver: folderComponentResolver,
                    definedWebComponents: new Set(),
                    loadedComponents: new Set()
                })
                // writeFile(`./cache/${page}/before.txt`, before)
                // writeFile(`./cache/${page}/after.txt`, after)
            // }
            // let fsEnd = Date.now()
            // console.log(`fstime = ${fsEnd - fsStart}ms`)

            const domString = `
            ${before}
            const __defaultScope__ = makeScopeProxy(${serialize(pageProps)});
            ${after}
            `
        
            writeFile(path.join(".","built",`index.html`), domString)
            let buildStart = Date.now()
            const buildOutput = await build({
                root: path.resolve(__dirname, `../built/`),
                base: `../`,
                build: {
                rollupOptions: {
                        output: {
                            sourcemap: true
                        }
                    }
                }
            })
            let buildEnd = Date.now()
            console.log(`build time = ${buildEnd - buildStart}ms`)
        
            const [first, second] = buildOutput['output']
        
            const htmlString = first.hasOwnProperty("source") ? first.source : second.source
        
            // console.log({page, htmlString})
            res.send(htmlString);
            const endTime = Date.now()
            console.log(`Rendered ${page} in ${endTime - startTime}ms`)
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