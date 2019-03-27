<?php
    require('stdheaders.php');
    require('acceptparameters.php');
    require('db.php');

    $locID = $parameters['locID'];
    $database = new database($serverName, $dbname, $userid, $password);
    $database->execProcedure('tareports.roster.cp_getapprovedrosters');
    $database->addParameter('locID', $locID, PDO::PARAM_STR);
    $results = $database->execute(); 
    $database->release();
    echo json_encode($results[0]);