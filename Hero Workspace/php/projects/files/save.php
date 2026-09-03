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


if (!is_array($input)) {

    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "Invalid request."
    ]);

    exit;
}


$fileId = (int) ($input["file_id"] ?? 0);

$content = (string) (
    $input["content"] ?? ""
);


if ($fileId <= 0) {

    http_response_code(422);

    echo json_encode([
        "success" => false,
        "message" => "Invalid file ID."
    ]);

    exit;
}


try {

    /*
    |--------------------------------------------------------------------------
    | Check Permission
    |--------------------------------------------------------------------------
    */

    $stmt = $pdo->prepare("
        SELECT
            f.id,
            p.user_id AS owner_id,
            c.role
        FROM project_files f

        INNER JOIN projects p
            ON p.id = f.project_id

        LEFT JOIN collaborators c
            ON c.project_id = p.id
            AND c.user_id = ?

        WHERE f.id = ?

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
        $fileId,
        $userId,
        $userId
    ]);


    $permission =
        $stmt->fetch();


    if (!$permission) {

        http_response_code(403);

        echo json_encode([
            "success" => false,
            "message" =>
                "You do not have permission to edit this file."
        ]);

        exit;
    }


    /*
    |--------------------------------------------------------------------------
    | Save Code
    |--------------------------------------------------------------------------
    */

    $stmt = $pdo->prepare("
        UPDATE project_files
        SET content = ?
        WHERE id = ?
    ");


    $stmt->execute([
        $content,
        $fileId
    ]);


    echo json_encode([

        "success" => true,

        "message" =>
            "File saved successfully."

    ]);

} catch (PDOException $e) {

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" =>
            "Unable to save file."
    ]);
}