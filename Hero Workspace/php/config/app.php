<?php

session_start();

header("Content-Type: application/json");

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    exit;
}

function getRequestData()
{
    $input = file_get_contents("php://input");

    if (!$input) {
        return [];
    }

    $data = json_decode($input, true);

    return is_array($data) ? $data : [];
}

function requireLogin()
{
    if (!isset($_SESSION["user_id"])) {

        http_response_code(401);

        echo json_encode([
            "success" => false,
            "message" => "You must be logged in."
        ]);

        exit;
    }

    return $_SESSION["user_id"];
}