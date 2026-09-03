<?php

function successResponse($message, $data = [])
{
    echo json_encode([
        "success" => true,
        "message" => $message,
        "data" => $data
    ]);

    exit;
}

function errorResponse($message, $statusCode = 400)
{
    http_response_code($statusCode);

    echo json_encode([
        "success" => false,
        "message" => $message
    ]);

    exit;
}