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


$fileId =
    (int)($input["file_id"] ?? 0);


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
    | Only Project Owner Can Delete
    |--------------------------------------------------------------------------
    */

    $stmt = $pdo->prepare("
        SELECT f.id
        FROM project_files f

        INNER JOIN projects p
            ON p.id = f.project_id

        WHERE f.id = ?

        AND p.user_id = ?

        LIMIT 1
    ");


    $stmt->execute([
        $fileId,
        $userId
    ]);


    if (!$stmt->fetch()) {

        http_response_code(403);

        echo json_encode([
            "success" => false,
            "message" =>
                "Only the project owner can delete files."
        ]);

        exit;
    }


    $stmt = $pdo->prepare("
        DELETE FROM project_files
        WHERE id = ?
    ");


    $stmt->execute([
        $fileId
    ]);


    echo json_encode([

        "success" => true,

        "message" =>
            "File deleted successfully."

    ]);

} catch (PDOException $e) {

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" =>
            "Unable to delete file."
    ]);
}