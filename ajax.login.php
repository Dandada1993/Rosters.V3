<?php
    ini_set('display_errors',1); 
    error_reporting(E_ALL);

    header("Access-Control-Allow-Origin: *");
    header("Content-type: application/json");

    $parameters = &$_POST;
    if ($_SERVER['REQUEST_METHOD'] === 'GET')
    {
        $parameters = &$_GET;
    }

    //$username = (isset($paramters["username"]) ? $parameters["username"] : "");
    $username = null;
    if (isset($parameters["username"]))
    {
        $username = $parameters["username"];
    }
    $password = null;
    if (isset($parameters["password"]))
    {
        $password = $parameters["password"];
    }

    if (!is_null($username) && !is_null($password))
    {
        $url = "http://insight.chefette.com/names.nsf";
        $req="username=$username&password=$password";
        $opts = array(
        "http"=>array(
        "method"=>"POST",
        "content" => $req,
        "header"=>"Accept-language: en\r\n" . 
            "Content-Type: application/x-www.form-urlencoded\r\n" .
            "User-Agent: Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1)\r\n" . 
            "Accept: image/gif, image/x-xbitmap, image/jpeg, image/pjpeg, application/x-shockwave-flash, application/vnd.ms-excel, application/msword, */*\r\n" 
            )
        );
        $context = stream_context_create($opts);
        if (!($fp = fopen("$url?Login", "r", false, $context))) {
            die("Could not open login URL");
        }
        $meta = stream_get_meta_data($fp);
        fclose($fp);
        var_dump($meta);
    }
    else {
        var_dump("Username or password missing");
    }
    

?>