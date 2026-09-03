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
    (int) (
        $_GET["project_id"] ?? 0
    );


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
    | Owner + Collaborators
    |--------------------------------------------------------------------------
    */

    $stmt =
        $pdo->prepare(
            "SELECT
                u.id,
                u.name,
                'owner' AS role
             FROM projects p
             INNER JOIN users u
                ON u.id = p.user_id
             WHERE p.id = ?

             UNION

             SELECT
                u.id,
                u.name,
                c.role
             FROM collaborators c
             INNER JOIN users u
                ON u.id = c.user_id
             WHERE c.project_id = ?

             ORDER BY name ASC"
        );


    $stmt->execute([
        $projectId,
        $projectId
    ]);


    $users =
        $stmt->fetchAll();


    foreach ($users as &$user) {

        $parts =
            preg_split(
                '/\s+/',
                trim(
                    $user["name"]
                )
            );


        $user["first_name"] =
            $parts[0] ?? "User";


        $user["online"] =
            false;

    }


    echo json_encode([

        "success" => true,

        "data" =>
            $users

    ]);

}

catch (PDOException $e) {

    http_response_code(500);

    echo json_encode([

        "success" => false,

        "message" =>
            "Unable to load collaborators."

    ]);

}