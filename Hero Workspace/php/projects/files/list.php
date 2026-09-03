<?php

declare(strict_types=1);

session_start();

header("Content-Type: application/json");

require_once __DIR__ . "/../../config/database.php";


if (!isset($_SESSION["user_id"])) {

    http_response_code(401);

    echo json_encode([
        "success" => false,
        "message" => "You must be logged in."
    ]);

    exit;
}


$userId = (int) $_SESSION["user_id"];

$projectId = isset($_GET["project_id"])
    ? (int) $_GET["project_id"]
    : 0;


if ($projectId <= 0) {

    http_response_code(422);

    echo json_encode([
        "success" => false,
        "message" => "Invalid project ID."
    ]);

    exit;
}


try {

    /*
    |--------------------------------------------------------------------------
    | Verify Project Ownership / Collaboration
    |--------------------------------------------------------------------------
    */

    $stmt = $pdo->prepare("
        SELECT p.id
        FROM projects p
        LEFT JOIN collaborators c
            ON c.project_id = p.id
            AND c.user_id = ?
        WHERE p.id = ?
        AND (
            p.user_id = ?
            OR c.user_id = ?
        )
        LIMIT 1
    ");

    $stmt->execute([
        $userId,
        $projectId,
        $userId,
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


    /*
    |--------------------------------------------------------------------------
    | Get Files
    |--------------------------------------------------------------------------
    */

    $stmt = $pdo->prepare("
        SELECT
            id,
            project_id,
            filename,
            language,
            content,
            created_at,
            updated_at
        FROM project_files
        WHERE project_id = ?
        ORDER BY id ASC
    ");

    $stmt->execute([
        $projectId
    ]);


    $files = $stmt->fetchAll();


    echo json_encode([
        "success" => true,
        "data" => $files
    ]);

} catch (PDOException $e) {

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Unable to load project files."
    ]);
}