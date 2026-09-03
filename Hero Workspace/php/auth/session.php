<?php

declare(strict_types=1);

session_start();

header(
    "Content-Type: application/json"
);


/*
|--------------------------------------------------------------------------
| Check Login Session
|--------------------------------------------------------------------------
*/

if (
    !isset($_SESSION["user_id"])
) {

    http_response_code(401);

    echo json_encode([
        "success" => false,
        "message" => "You must be logged in."
    ]);

    exit;
}


/*
|--------------------------------------------------------------------------
| Database
|--------------------------------------------------------------------------
*/

require_once __DIR__ .
    "/../config/database.php";


/*
|--------------------------------------------------------------------------
| Get Current User
|--------------------------------------------------------------------------
*/

try {

    $stmt = $pdo->prepare(
        "SELECT id, name, email
         FROM users
         WHERE id = ?
         LIMIT 1"
    );


    $stmt->execute([
        $_SESSION["user_id"]
    ]);


    $user =
        $stmt->fetch();


    if (!$user) {

        session_destroy();

        http_response_code(401);

        echo json_encode([
            "success" => false,
            "message" => "User account not found."
        ]);

        exit;
    }


    /*
    |--------------------------------------------------------------------------
    | Success
    |--------------------------------------------------------------------------
    */

    echo json_encode([
        "success" => true,
        "data" => $user
    ]);

} catch (PDOException $e) {

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Unable to load user session."
    ]);

}