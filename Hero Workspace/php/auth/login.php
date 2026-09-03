<?php

declare(strict_types=1);

session_start();

header("Content-Type: application/json");

require_once __DIR__ . "/../config/database.php";


/*
|--------------------------------------------------------------------------
| POST only
|--------------------------------------------------------------------------
*/

if ($_SERVER["REQUEST_METHOD"] !== "POST") {

    http_response_code(405);

    echo json_encode([
        "success" => false,
        "message" => "Method not allowed."
    ]);

    exit;
}


/*
|--------------------------------------------------------------------------
| Read Request
|--------------------------------------------------------------------------
*/

$input = json_decode(
    file_get_contents("php://input"),
    true
);


if (!is_array($input)) {

    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "Invalid request data."
    ]);

    exit;
}


$email = trim(
    strtolower(
        (string)($input["email"] ?? "")
    )
);

$password =
    (string)($input["password"] ?? "");


/*
|--------------------------------------------------------------------------
| Validation
|--------------------------------------------------------------------------
*/

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {

    http_response_code(422);

    echo json_encode([
        "success" => false,
        "message" => "Invalid email address."
    ]);

    exit;
}


if ($password === "") {

    http_response_code(422);

    echo json_encode([
        "success" => false,
        "message" => "Password is required."
    ]);

    exit;
}


/*
|--------------------------------------------------------------------------
| Find User
|--------------------------------------------------------------------------
*/

try {

    $stmt = $pdo->prepare(
        "SELECT id, name, email, password
         FROM users
         WHERE email = ?
         LIMIT 1"
    );


    $stmt->execute([
        $email
    ]);


    $user =
        $stmt->fetch();


    /*
    |--------------------------------------------------------------------------
    | Verify Password
    |--------------------------------------------------------------------------
    */

    if (
        !$user ||
        !password_verify(
            $password,
            $user["password"]
        )
    ) {

        http_response_code(401);

        echo json_encode([
            "success" => false,
            "message" =>
                "Incorrect email or password."
        ]);

        exit;
    }


    /*
    |--------------------------------------------------------------------------
    | Login
    |--------------------------------------------------------------------------
    */

    session_regenerate_id(true);

    $_SESSION["user_id"] =
        (int)$user["id"];


    echo json_encode([

        "success" => true,

        "message" =>
            "Login successful.",

        "data" => [

            "id" =>
                (int)$user["id"],

            "name" =>
                $user["name"],

            "email" =>
                $user["email"]

        ]

    ]);

} catch (PDOException $e) {

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" =>
            "Unable to login."
    ]);

}