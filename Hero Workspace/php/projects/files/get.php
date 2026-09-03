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

$fileId = isset($_GET["file_id"])
    ? (int) $_GET["file_id"]
    : 0;


if ($fileId <= 0) {

    http_response_code(422);

    echo json_encode([
        "success" => false,
        "message" => "Invalid file ID."
    ]);

    exit;
}


try {

    $stmt = $pdo->prepare("
        SELECT
            f.id,
            f.project_id,
            f.filename,
            f.language,
            f.content,
            f.created_at,
            f.updated_at
        FROM project_files f

        INNER JOIN projects p
            ON p.id = f.project_id

        LEFT JOIN collaborators c
            ON c.project_id = p.id
            AND c.user_id = ?

        WHERE f.id = ?

        AND (
            p.user_id = ?
            OR c.user_id = ?
        )

        LIMIT 1
    ");


    $stmt->execute([
        $userId,
        $fileId,
        $userId,
        $userId
    ]);


    $file = $stmt->fetch();


    if (!$file) {

        http_response_code(404);

        echo json_encode([
            "success" => false,
            "message" => "File not found."
        ]);

        exit;
    }


    echo json_encode([
        "success" => true,
        "data" => $file
    ]);

} catch (PDOException $e) {

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Unable to load file."
    ]);
}