<?php

declare(strict_types=1);

session_start();

header("Content-Type: application/json");

require_once __DIR__ . "/../config/database.php";


if (!isset($_SESSION["user_id"])) {

    http_response_code(401);

    echo json_encode([
        "success" => false,
        "message" => "You must be logged in."
    ]);

    exit;
}


$userId =
    (int) $_SESSION["user_id"];


if (
    $_SERVER["REQUEST_METHOD"] !==
    "POST"
) {

    http_response_code(405);

    echo json_encode([
        "success" => false,
        "message" => "Method not allowed."
    ]);

    exit;
}


$input =
    json_decode(
        file_get_contents(
            "php://input"
        ),
        true
    );


$projectId =
    (int) (
        $input["project_id"] ?? 0
    );


$message =
    trim(
        (string) (
            $input["message"] ?? ""
        )
    );


if ($projectId <= 0) {

    http_response_code(422);

    echo json_encode([
        "success" => false,
        "message" => "Project ID is required."
    ]);

    exit;
}


if ($message === "") {

    http_response_code(422);

    echo json_encode([
        "success" => false,
        "message" => "Message cannot be empty."
    ]);

    exit;
}


if (
    mb_strlen($message) >
    2000
) {

    http_response_code(422);

    echo json_encode([
        "success" => false,
        "message" => "Message is too long."
    ]);

    exit;
}


try {

    /*
    |--------------------------------------------------------------------------
    | Verify project access
    |--------------------------------------------------------------------------
    */

    $stmt =
        $pdo->prepare(
            "SELECT id
             FROM projects
             WHERE id = ?
             AND user_id = ?
             LIMIT 1"
        );


    $stmt->execute([
        $projectId,
        $userId
    ]);


    $hasAccess =
        (bool) $stmt->fetch();


    if (!$hasAccess) {

        $stmt =
            $pdo->prepare(
                "SELECT id
                 FROM collaborators
                 WHERE project_id = ?
                 AND user_id = ?
                 LIMIT 1"
            );


        $stmt->execute([
            $projectId,
            $userId
        ]);


        $hasAccess =
            (bool) $stmt->fetch();

    }


    if (!$hasAccess) {

        http_response_code(403);

        echo json_encode([
            "success" => false,
            "message" => "You do not have access to this project."
        ]);

        exit;

    }


    /*
    |--------------------------------------------------------------------------
    | Insert
    |--------------------------------------------------------------------------
    */

    $stmt =
        $pdo->prepare(
            "INSERT INTO messages
            (
                project_id,
                user_id,
                message
            )
            VALUES (?, ?, ?)"
        );


    $stmt->execute([
        $projectId,
        $userId,
        $message
    ]);


    $messageId =
        (int) $pdo->lastInsertId();


    /*
    |--------------------------------------------------------------------------
    | Return
    |--------------------------------------------------------------------------
    */

    $stmt =
        $pdo->prepare(
            "SELECT
                m.id,
                m.project_id,
                m.user_id,
                u.name,
                m.message,
                m.created_at
             FROM messages m
             INNER JOIN users u
                ON u.id = m.user_id
             WHERE m.id = ?
             LIMIT 1"
        );


    $stmt->execute([
        $messageId
    ]);


    $data =
        $stmt->fetch();


    $parts =
        preg_split(
            '/\s+/',
            trim(
                $data["name"]
            )
        );


    $data["first_name"] =
        $parts[0] ?? "User";


    echo json_encode([

        "success" => true,

        "data" =>
            $data

    ]);

}

catch (PDOException $e) {

    http_response_code(500);

    echo json_encode([

        "success" => false,

        "message" =>
            "Unable to send message."

    ]);

}