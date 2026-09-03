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
| POST Only
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
| Read JSON Request
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


/*
|--------------------------------------------------------------------------
| Get Input
|--------------------------------------------------------------------------
*/

$name = trim(
    (string)($input["name"] ?? "")
);


$description = trim(
    (string)($input["description"] ?? "")
);


$language = strtolower(
    trim(
        (string)(
            $input["language"]
            ?? "javascript"
        )
    )
);


/*
|--------------------------------------------------------------------------
| Validate Project Name
|--------------------------------------------------------------------------
*/

if ($name === "") {

    http_response_code(422);

    echo json_encode([
        "success" => false,
        "message" =>
            "Project name is required."
    ]);

    exit;
}


if (strlen($name) > 150) {

    http_response_code(422);

    echo json_encode([
        "success" => false,
        "message" =>
            "Project name must be 150 characters or less."
    ]);

    exit;
}


/*
|--------------------------------------------------------------------------
| Allowed Languages
|--------------------------------------------------------------------------
*/

$allowedLanguages = [

    "javascript",

    "python",

    "cpp",

    "php"

];


if (
    !in_array(
        $language,
        $allowedLanguages,
        true
    )
) {

    $language = "javascript";
}


/*
|--------------------------------------------------------------------------
| Default File Configuration
|--------------------------------------------------------------------------
*/

$defaultFiles = [

    "javascript" => [

        "filename" => "index.js",

        "content" =>
'// Welcome to Hero Workspace

function helloHero() {
    console.log("Hello, Hero Workspace!");
}

helloHero();
'

    ],


    "python" => [

        "filename" => "main.py",

        "content" =>
'# Welcome to Hero Workspace

def hello_hero():
    print("Hello, Hero Workspace!")


hello_hero()
'

    ],


    "cpp" => [

        "filename" => "main.cpp",

        "content" =>
'#include <iostream>

using namespace std;

int main() {

    cout << "Hello, Hero Workspace!" << endl;

    return 0;
}
'

    ],


    "php" => [

        "filename" => "index.php",

        "content" =>
'<?php

// Welcome to Hero Workspace

echo "Hello, Hero Workspace!";

?>
'

    ]

];


$defaultFile =
    $defaultFiles[$language];


/*
|--------------------------------------------------------------------------
| Create Project + Default File
|--------------------------------------------------------------------------
*/

try {

    /*
    |--------------------------------------------------------------------------
    | Start Transaction
    |--------------------------------------------------------------------------
    */

    $pdo->beginTransaction();


    /*
    |--------------------------------------------------------------------------
    | Insert Project
    |--------------------------------------------------------------------------
    */

    $stmt = $pdo->prepare(
        "INSERT INTO projects
        (
            user_id,
            name,
            description,
            language
        )
        VALUES (?, ?, ?, ?)"
    );


    $stmt->execute([

        $userId,

        $name,

        $description,

        $language

    ]);


    /*
    |--------------------------------------------------------------------------
    | Project ID
    |--------------------------------------------------------------------------
    */

    $projectId =
        (int)$pdo->lastInsertId();


    /*
    |--------------------------------------------------------------------------
    | Add Project Owner as Collaborator
    |--------------------------------------------------------------------------
    |
    | This allows the collaboration system to know
    | that the project creator is the owner.
    |
    */

    $collaboratorStmt =
        $pdo->prepare(
            "INSERT INTO collaborators
            (
                project_id,
                user_id,
                role
            )
            VALUES (?, ?, 'owner')"
        );


    $collaboratorStmt->execute([

        $projectId,

        $userId

    ]);


    /*
    |--------------------------------------------------------------------------
    | Create Default Editable File
    |--------------------------------------------------------------------------
    */

    $fileStmt = $pdo->prepare(
        "INSERT INTO project_files
        (
            project_id,
            filename,
            language,
            content
        )
        VALUES (?, ?, ?, ?)"
    );


    $fileStmt->execute([

        $projectId,

        $defaultFile["filename"],

        $language,

        $defaultFile["content"]

    ]);


    /*
    |--------------------------------------------------------------------------
    | File ID
    |--------------------------------------------------------------------------
    */

    $fileId =
        (int)$pdo->lastInsertId();


    /*
    |--------------------------------------------------------------------------
    | Commit Transaction
    |--------------------------------------------------------------------------
    */

    $pdo->commit();


    /*
    |--------------------------------------------------------------------------
    | Get Created Project
    |--------------------------------------------------------------------------
    */

    $projectStmt = $pdo->prepare(
        "SELECT
            id,
            user_id,
            name,
            description,
            language,
            created_at,
            updated_at
         FROM projects
         WHERE id = ?
         AND user_id = ?
         LIMIT 1"
    );


    $projectStmt->execute([

        $projectId,

        $userId

    ]);


    $project =
        $projectStmt->fetch();


    /*
    |--------------------------------------------------------------------------
    | Success Response
    |--------------------------------------------------------------------------
    */

    echo json_encode([

        "success" => true,

        "message" =>
            "Project created successfully.",

        "data" => [

            "project" => $project,

            "default_file" => [

                "id" => $fileId,

                "project_id" =>
                    $projectId,

                "filename" =>
                    $defaultFile["filename"],

                "language" =>
                    $language,

                "content" =>
                    $defaultFile["content"]

            ]

        ]

    ]);

} catch (PDOException $e) {

    /*
    |--------------------------------------------------------------------------
    | Rollback if Something Fails
    |--------------------------------------------------------------------------
    */

    if ($pdo->inTransaction()) {

        $pdo->rollBack();

    }


    http_response_code(500);

    echo json_encode([

        "success" => false,

        "message" =>
            "Unable to create project.",

        "error" =>
            $e->getMessage()

    ]);

}