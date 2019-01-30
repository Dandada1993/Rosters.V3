<?php 
    $parameters = &$_GET;
    if ($_SERVER['REQUEST_METHOD'] === 'POST'){
        $parameters = &$_POST;
    }
