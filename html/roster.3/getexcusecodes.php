<?php
    require('stdheaders.php');
    // require('acceptparameters.php');
    require('db.php');

    $database = new database($serverName, $dbname, $userid, $password);
    $database->execProcedure('tareports.roster.cp_getExcuseCode_v3 ');
    $results = $database->execute(); //returns and array each element being a returned dataset
    $database->release();
    echo json_encode($results[0]);