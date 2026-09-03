<?php

declare(strict_types=1);

session_start();

header("Content-Type: application/json");

require_once __DIR__ . "/../config/database.php";


/*
|--------------------------------------------------------------------------
| Authentication
|--------------------------------------------------------------------------
*/

if (!isset($_SESSION["user_id"])) {

    http_response_code(401);

    echo json_encode([
        "success" => false,
        "message" => "You must be logged in."
    ]);

    exit;
}


$userId = (int) $_SESSION["user_id"];


/*
|--------------------------------------------------------------------------
| Get Projects
|--------------------------------------------------------------------------
*/

try {

    $stmt = $pdo->prepare(
        "SELECT
            id,
            name,
            description,
            language,
            created_at,
            updated_at
         FROM projects
         WHERE user_id = ?
         ORDER BY updated_at DESC"
    );


    $stmt->execute([
        $userId
    ]);


    $projects =
        $stmt->fetchAll(PDO::FETCH_ASSOC);


    echo json_encode([

        "success" => true,

        "message" =>
            "Projects loaded successfully.",

        "data" =>
            $projects

    ]);

} catch (PDOException $e) {

    http_response_code(500);

    echo json_encode([

        "success" => false,

        "message" =>
            "Unable to load projects."

    ]);

}