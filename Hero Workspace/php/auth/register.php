<?php

declare(strict_types=1);

session_start();

header("Content-Type: application/json");

require_once __DIR__ . "/../config/database.php";


/*
|--------------------------------------------------------------------------
| Only POST requests
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
| Read JSON
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


$name = trim(
    (string)($input["name"] ?? "")
);

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

if ($name === "") {

    http_response_code(422);

    echo json_encode([
        "success" => false,
        "message" => "Name is required."
    ]);

    exit;
}


if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {

    http_response_code(422);

    echo json_encode([
        "success" => false,
        "message" => "Please enter a valid email."
    ]);

    exit;
}


if (strlen($password) < 6) {

    http_response_code(422);

    echo json_encode([
        "success" => false,
        "message" =>
            "Password must be at least 6 characters."
    ]);

    exit;
}


/*
|--------------------------------------------------------------------------
| Check Existing User
|--------------------------------------------------------------------------
*/

try {

    $stmt = $pdo->prepare(
        "SELECT id
         FROM users
         WHERE email = ?
         LIMIT 1"
    );

    $stmt->execute([$email]);


    if ($stmt->fetch()) {

        http_response_code(409);

        echo json_encode([
            "success" => false,
            "message" =>
                "An account with this email already exists."
        ]);

        exit;
    }


    /*
    |--------------------------------------------------------------------------
    | Hash Password
    |--------------------------------------------------------------------------
    */

    $passwordHash =
        password_hash(
            $password,
            PASSWORD_DEFAULT
        );


    /*
    |--------------------------------------------------------------------------
    | Insert User
    |--------------------------------------------------------------------------
    */

    $stmt = $pdo->prepare(
        "INSERT INTO users
        (name, email, password)
        VALUES (?, ?, ?)"
    );


    $stmt->execute([
        $name,
        $email,
        $passwordHash
    ]);


    $userId =
        (int)$pdo->lastInsertId();


    /*
    |--------------------------------------------------------------------------
    | Create Session
    |--------------------------------------------------------------------------
    */

    session_regenerate_id(true);

    $_SESSION["user_id"] =
        $userId;


    echo json_encode([

        "success" => true,

        "message" =>
            "Account created successfully.",

        "data" => [

            "id" => $userId,

            "name" => $name,

            "email" => $email

        ]

    ]);

} catch (PDOException $e) {

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" =>
            "Unable to create account."
    ]);

}