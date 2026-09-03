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


if ($_SERVER["REQUEST_METHOD"] !== "POST") {

    http_response_code(405);

    echo json_encode([
        "success" => false,
        "message" => "Method not allowed."
    ]);

    exit;
}


$input = json_decode(
    file_get_contents("php://input"),
    true
);


$projectId =
    (int) ($input["project_id"] ?? 0);

$filename =
    trim((string)($input["filename"] ?? ""));

$language =
    trim((string)($input["language"] ?? "text"));

$content =
    (string)($input["content"] ?? "");


if ($projectId <= 0 || $filename === "") {

    http_response_code(422);

    echo json_encode([
        "success" => false,
        "message" =>
            "Project ID and filename are required."
    ]);

    exit;
}


try {

    /*
    |--------------------------------------------------------------------------
    | Project Permission
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
            OR (
                c.user_id = ?
                AND c.role = 'editor'
            )
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
            "message" =>
                "You do not have permission."
        ]);

        exit;
    }


    /*
    |--------------------------------------------------------------------------
    | Create File
    |--------------------------------------------------------------------------
    */

    $stmt = $pdo->prepare("
        INSERT INTO project_files
        (
            project_id,
            filename,
            language,
            content
        )
        VALUES (?, ?, ?, ?)
    ");


    $stmt->execute([
        $projectId,
        $filename,
        $language,
        $content
    ]);


    $fileId =
        (int)$pdo->lastInsertId();


    echo json_encode([

        "success" => true,

        "message" =>
            "File created successfully.",

        "data" => [

            "id" => $fileId,

            "project_id" =>
                $projectId,

            "filename" =>
                $filename,

            "language" =>
                $language,

            "content" =>
                $content

        ]

    ]);

} catch (PDOException $e) {

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" =>
            "Unable to create file."
    ]);
}