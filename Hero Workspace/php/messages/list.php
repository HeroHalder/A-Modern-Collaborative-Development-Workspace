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


$projectId =
    (int) ($_GET["project_id"] ?? 0);


if ($projectId <= 0) {

    http_response_code(422);

    echo json_encode([
        "success" => false,
        "message" => "Project ID is required."
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


    if (!$stmt->fetch()) {

        /*
        | Check collaborator access
        */

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


        if (!$stmt->fetch()) {

            http_response_code(403);

            echo json_encode([
                "success" => false,
                "message" => "You do not have access to this project."
            ]);

            exit;

        }

    }


    /*
    |--------------------------------------------------------------------------
    | Messages
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
             WHERE m.project_id = ?
             ORDER BY m.id ASC
             LIMIT 100"
        );


    $stmt->execute([
        $projectId
    ]);


    $messages =
        $stmt->fetchAll();


    foreach ($messages as &$message) {

        $parts =
            preg_split(
                '/\s+/',
                trim(
                    $message["name"]
                )
            );


        $message["first_name"] =
            $parts[0] ?? "User";

    }


    echo json_encode([

        "success" => true,

        "data" =>
            $messages

    ]);

}

catch (PDOException $e) {

    http_response_code(500);

    echo json_encode([

        "success" => false,

        "message" =>
            "Unable to load messages."

    ]);

}