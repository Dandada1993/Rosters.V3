<?php
    require('stdheaders.php');
    require('db.php');

    $database = new database($serverName, $dbname, $userid, $password);
    $database->execProcedure('tareports.roster.get_locations');
    $results = $database->execute(); //returns and array each element being a returned dataset
    $database->release();
    echo json_encode($results[0]);