"use strict";

const http = require("http");
const WebSocket = require("ws");

const PORT = 3002;

const server = http.createServer((req, res) => {

    res.writeHead(200, {
        "Content-Type": "application/json"
    });

    res.end(
        JSON.stringify({
            success: true,
            service: "Hero Workspace Collaboration",
            status: "online",
            port: PORT
        })
    );

});


const wss = new WebSocket.Server({
    server
});


/*
|--------------------------------------------------------------------------
| Connected Users
|--------------------------------------------------------------------------
|
| projectId => Map of connected users
|
*/

const rooms = new Map();


/*
|--------------------------------------------------------------------------
| Utility
|--------------------------------------------------------------------------
*/

function send(ws, data) {

    if (
        ws.readyState === WebSocket.OPEN
    ) {

        ws.send(
            JSON.stringify(data)
        );

    }

}


function broadcast(
    projectId,
    data,
    exclude = null
) {

    const room =
        rooms.get(
            String(projectId)
        );


    if (!room) {

        return;

    }


    room.forEach(client => {

        if (
            client !== exclude
        ) {

            send(
                client,
                data
            );

        }

    });

}


function getCollaborators(
    projectId
) {

    const room =
        rooms.get(
            String(projectId)
        );


    if (!room) {

        return [];

    }


    return Array.from(
        room
    ).map(client => {

        return {

            id:
                client.userId,

            name:
                client.userName,

            first_name:
                getFirstName(
                    client.userName
                ),

            online:
                true

        };

    });

}


function getFirstName(
    name
) {

    if (!name) {

        return "User";

    }


    return String(name)
        .trim()
        .split(/\s+/)[0];

}


/*
|--------------------------------------------------------------------------
| Connection
|--------------------------------------------------------------------------
*/

wss.on(
    "connection",
    (ws) => {


        ws.projectId =
            null;


        ws.userId =
            null;


        ws.userName =
            "User";


        /*
        |--------------------------------------------------------------------------
        | Message
        |--------------------------------------------------------------------------
        */

        ws.on(
            "message",
            raw => {

                let data;


                try {

                    data =
                        JSON.parse(
                            raw.toString()
                        );

                }

                catch {

                    send(
                        ws,
                        {
                            type: "error",
                            message:
                                "Invalid JSON."
                        }
                    );

                    return;

                }


                /*
                |--------------------------------------------------------------------------
                | JOIN PROJECT
                |--------------------------------------------------------------------------
                */

                if (
                    data.type ===
                    "join"
                ) {

                    handleJoin(
                        ws,
                        data
                    );

                    return;

                }


                /*
                |--------------------------------------------------------------------------
                | CHAT MESSAGE
                |--------------------------------------------------------------------------
                */

                if (
                    data.type ===
                    "chat"
                ) {

                    handleChat(
                        ws,
                        data
                    );

                    return;

                }


                /*
                |--------------------------------------------------------------------------
                | TYPING
                |--------------------------------------------------------------------------
                */

                if (
                    data.type ===
                    "typing"
                ) {

                    if (
                        ws.projectId
                    ) {

                        broadcast(
                            ws.projectId,

                            {

                                type:
                                    "typing",

                                userId:
                                    ws.userId,

                                name:
                                    getFirstName(
                                        ws.userName
                                    ),

                                typing:
                                    Boolean(
                                        data.typing
                                    )

                            },

                            ws
                        );

                    }

                    return;

                }


                /*
                |--------------------------------------------------------------------------
                | CODE UPDATE
                |--------------------------------------------------------------------------
                |
                | Phase 2 will use this for live editor sync.
                |
                */

                if (
                    data.type ===
                    "code_update"
                ) {

                    handleCodeUpdate(
                        ws,
                        data
                    );

                    return;

                }

            }
        );


        /*
        |--------------------------------------------------------------------------
        | Disconnect
        |--------------------------------------------------------------------------
        */

        ws.on(
            "close",
            () => {

                handleDisconnect(
                    ws
                );

            }
        );


        ws.on(
            "error",
            error => {

                console.error(
                    "WebSocket error:",
                    error.message
                );

            }
        );

    }
);


/*
|--------------------------------------------------------------------------
| JOIN
|--------------------------------------------------------------------------
*/

function handleJoin(
    ws,
    data
) {

    const projectId =
        Number(
            data.projectId
        );


    const userId =
        data.userId
            ? Number(data.userId)
            : null;


    const userName =
        String(
            data.userName ||
            "User"
        ).trim();


    if (!projectId) {

        send(
            ws,
            {
                type: "error",
                message:
                    "Project ID is required."
            }
        );

        return;

    }


    ws.projectId =
        projectId;


    ws.userId =
        userId;


    ws.userName =
        userName;


    const roomKey =
        String(
            projectId
        );


    if (
        !rooms.has(
            roomKey
        )
    ) {

        rooms.set(
            roomKey,
            new Set()
        );

    }


    const room =
        rooms.get(
            roomKey
        );


    room.add(
        ws
    );


    /*
    |--------------------------------------------------------------------------
    | Send current collaborators
    |--------------------------------------------------------------------------
    */

    send(
        ws,
        {

            type:
                "collaborators",

            users:
                getCollaborators(
                    projectId
                )

        }
    );


    /*
    |--------------------------------------------------------------------------
    | Notify others
    |--------------------------------------------------------------------------
    */

    broadcast(

        projectId,

        {

            type:
                "user_joined",

            user: {

                id:
                    userId,

                name:
                    userName,

                first_name:
                    getFirstName(
                        userName
                    ),

                online:
                    true

            }

        },

        ws

    );


    console.log(
        `[JOIN] ${userName} (#${userId || "N/A"}) → Project ${projectId}`
    );

}


/*
|--------------------------------------------------------------------------
| CHAT
|--------------------------------------------------------------------------
*/

function handleChat(
    ws,
    data
) {

    if (!ws.projectId) {

        return;

    }


    const message =
        String(
            data.message ||
            ""
        ).trim();


    if (!message) {

        return;

    }


    if (
        message.length >
        2000
    ) {

        send(
            ws,
            {
                type: "error",
                message:
                    "Message is too long."
            }
        );

        return;

    }


    const payload = {

        type:
            "chat",

        message:
            message,

        user: {

            id:
                ws.userId,

            name:
                ws.userName,

            first_name:
                getFirstName(
                    ws.userName
                )

        },

        timestamp:
            new Date().toISOString()

    };


    /*
    |--------------------------------------------------------------------------
    | Send to everyone
    |--------------------------------------------------------------------------
    */

    broadcast(
        ws.projectId,
        payload
    );


    /*
    |--------------------------------------------------------------------------
    | Also send back to sender
    |--------------------------------------------------------------------------
    */

    send(
        ws,
        payload
    );


    console.log(
        `[CHAT] ${ws.userName}: ${message}`
    );

}


/*
|--------------------------------------------------------------------------
| CODE UPDATE
|--------------------------------------------------------------------------
*/

function handleCodeUpdate(
    ws,
    data
) {

    if (!ws.projectId) {

        return;

    }


    broadcast(

        ws.projectId,

        {

            type:
                "code_update",

            userId:
                ws.userId,

            fileId:
                data.fileId || null,

            filename:
                data.filename || "",

            content:
                data.content || "",

            timestamp:
                new Date().toISOString()

        },

        ws

    );

}


/*
|--------------------------------------------------------------------------
| DISCONNECT
|--------------------------------------------------------------------------
*/

function handleDisconnect(
    ws
) {

    if (!ws.projectId) {

        return;

    }


    const roomKey =
        String(
            ws.projectId
        );


    const room =
        rooms.get(
            roomKey
        );


    if (!room) {

        return;

    }


    room.delete(
        ws
    );


    broadcast(

        ws.projectId,

        {

            type:
                "user_left",

            user: {

                id:
                    ws.userId,

                name:
                    ws.userName,

                first_name:
                    getFirstName(
                        ws.userName
                    ),

                online:
                    false

            }

        }

    );


    if (
        room.size === 0
    ) {

        rooms.delete(
            roomKey
        );

    }


    console.log(
        `[LEFT] ${ws.userName} → Project ${ws.projectId}`
    );

}


/*
|--------------------------------------------------------------------------
| SERVER
|--------------------------------------------------------------------------
*/

server.listen(
    PORT,
    () => {

        console.log(
            "========================================"
        );

        console.log(
            " Hero Workspace Collaboration Server"
        );

        console.log(
            "========================================"
        );

        console.log(
            `Server: http://localhost:${PORT}`
        );

        console.log(
            "WebSocket: ws://localhost:3002"
        );

        console.log(
            "Status: ONLINE"
        );

        console.log(
            "========================================"
        );

    }
);