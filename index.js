const nodeHtmlToImage = require("node-html-to-image");
const puppeteerCore = require("puppeteer-core");
const fs = require("fs");
const YAML = require('yaml');

//express
const express = require("express");
const app = express();
const port = 3000;


function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

function updateAll() {
    // read text file
    let rules = fs.readFileSync("server_data/plugins/Essentials/rules.txt", "utf8");

    // remove "- " at the start of each line
    rules = rules
        .split("\n")
        .map((line) => line.replace(/^\- /, ""))
        .join("\n");

    // map each line to an <li> element
    const listItems = rules
        .split("\n")
        .map((line) => `<li class="list-group-item" style="background-color: none; font-size: 24px;">${line}</li>`)
        .join("\n");

    players = [];
    listOfPlayers = [];

    let warps = [];

    // loop through all yml files in userdata
    fs.readdir("server_data/plugins/Essentials/userdata", (err, files) => {
        if (err) {
            console.error(err);
            return;
        }
        for (const file of files) {
            if (file.endsWith(".yml")) {
                const filePath = `server_data/plugins/Essentials/userdata/${file}`;
                let yml = fs.readFileSync(filePath, 'utf8');
                yml = YAML.parse(yml);

                if (yml["last-account-name"] != "LiquidFusion42") {

                    let tempPlayer = {
                        name: yml["last-account-name"],
                        nickname: "",
                        login: Number(yml["timestamps"]["login"]),
                        logout: Number(yml["timestamps"]["logout"]),
                        online: false
                    };
                    if (yml["nickname"] != null) {
                        tempPlayer.nickname = yml["nickname"];
                    }
                    if (tempPlayer.login > tempPlayer.logout) {
                        console.log(`${tempPlayer.name} is online`);
                        tempPlayer.online = true;
                    }

                    if (listOfPlayers.includes(tempPlayer.name)) {
                        players = players.map(p => {
                            if (p.name == tempPlayer.name) {
                                if (tempPlayer.login > p.login) {
                                    console.log(`Replacing ${p.name}`);
                                    return tempPlayer;
                                }
                            }

                            return p;
                        })
                    } else {
                        listOfPlayers.push(yml["last-account-name"]);
                        players.push(tempPlayer);
                    }
                    // console.log(players);
                }
            }
        }

        players = players.sort((a, b) => a.name.localeCompare(b.name));

        const playerListItems = players
            .map((line) => `<li class="list-group-item ${line.online ? "text-online" : "text-offline"}" style="background-color: none; font-size: 20px;">${line.online ? '<span class="position-absolute top-50 start-90 translate-middle p-2 bg-success border border-light rounded-circle"></span>' : '<span class="position-absolute top-50 start-90 translate-middle p-2 bg-danger border border-light rounded-circle"></span>'} <span>&nbsp;&nbsp;</span> ${line.name} ${line.nickname != "" ? `(${line.nickname})` : ""}</li>`)
            .join("\n");

            fs.readdir("server_data/plugins/Essentials/warps", (err, files) => {
                if (err) {
                    console.error(err);
                    return;
                }
                for (const file of files) {
                    if (file.endsWith(".yml")) {
                        const filePath = `server_data/plugins/Essentials/warps/${file}`;
                        let yml = fs.readFileSync(filePath, 'utf8');
                        yml = YAML.parse(yml);
                        
                        warps.push(yml["name"]);
                    }
                }

                warps = warps.sort((a, b) => a.localeCompare(b));

                const warpListItems = warps
                .map((line) => `<li class="list-group-item" style="background-color: none; font-size: 20px;">${line}</li>`)
                .join("\n");

                nodeHtmlToImage({
                    output: `public/welcome-image.png`,
                    html: `<html>
                            <head>
                                <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css"
                        integrity="sha384-T3c6CoIi6uLrA9TneNEoa7RxnatzjcDSCmG1MXxSR1GAsXEV/Dwwykc2MPK8M2HN" crossorigin="anonymous">
        
                                <style>
                                    .list-group-item {
                                        background-color: none !important;
                                        font-size: 22px !important;
                                        border-width: 5px !important;
                                    }
                                    h1 {
                                        font-size: 72px !important;
                                    }
                                    h2 {
                                        font-size: 36px !important;
                                    }
                                    .text-online: {
                                        color: green !important;
                                        font-weight: bold !important;
                                    }
                                    .text-offline: {
                                        color: gray !important;
                                    }
                                </style>
                            </head>
                            <body class="container-fluid" style="width: 1536px; height: 1024px; color: white; background-image: url(https://wallpapers.com/images/hd/minecraft-grass-o6viivotszxg7bv8.jpg); background-size: cover; background-position:center center;">
                                <div class="row">
                                    <div class="col-8">
                                        <h1 class="text-center mt-3 mb-3">Welcome to our Community</h1>
                                        <h5>&nbsp;</h5>
                                        <h2>Rules:</h2>
                                        <ul class="list-group" style="background-color: rgba(255,255,255,0.5);">
                                            ${listItems}
                                        </ul>
                                    </div>
                                    <div class="col-4">
                                        <h5>&nbsp;</h5>
                                        <h2>Players</h2>
                                        <ul class="list-group" style="background-color: rgba(255,255,255,0.5);">
                                            ${playerListItems}
                                        </ul>
                                        <h5>&nbsp;</h5>
                                        <h2>Warps</h2>
                                        <h4>Usage: <b><code>/warp &lt;name&gt;</code></b></h4>
                                        <ul class="list-group" style="background-color: rgba(255,255,255,0.5);">
                                            ${warpListItems}
                                        </ul>
                                    </div>
                                </div>
                            </body>
                            </html>`,
                    selector: "body",
                    // encoding: "base64",
                    transparent: true,
                    puppeteer: puppeteerCore,
                    puppeteerArgs: {
                        args: ["--no-sandbox", "--disable-setuid-sandbox"],
                        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || "/usr/bin/chromium",
                    },
                }).then((image) => {
                    // save image to file
                    //fs.writeFileSync(`public/welcome-image.png`, image);
                    console.log('Image generated:', image); // Log the image data
                });
            });
    });
}

updateAll();

app.get("/update", (req, res) => {
    updateAll();

    res.json({status: "success"});
})

app.get("/welcome-image", (req, res) => {
    res.sendFile(__dirname + "/public/welcome-image.png");
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});
